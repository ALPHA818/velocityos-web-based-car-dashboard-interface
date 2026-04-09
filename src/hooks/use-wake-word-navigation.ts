import { useCallback, useEffect, useRef, useState } from 'react';

interface VoiceResultAlternativeLike {
  transcript: string;
}

interface VoiceResultLike {
  isFinal?: boolean;
  length: number;
  [index: number]: VoiceResultAlternativeLike;
}

interface VoiceResultListLike {
  length: number;
  [index: number]: VoiceResultLike;
}

interface VoiceRecognitionEventLike {
  results: VoiceResultListLike;
}

interface VoiceRecognitionErrorEventLike {
  error?: string;
}

interface VoiceRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: VoiceRecognitionEventLike) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type VoiceRecognitionCtor = new () => VoiceRecognitionLike;

declare global {
  interface Window {
    webkitSpeechRecognition?: VoiceRecognitionCtor;
    SpeechRecognition?: VoiceRecognitionCtor;
  }
}

interface UseWakeWordNavigationOptions {
  enabled: boolean;
  wakeWord: string;
  isMapOpen: boolean;
  navigateTo: (path: string) => void;
  openMap: () => void;
  closeMap: () => void;
  onUnhandledCommand?: (command: string) => void;
}

export type VoiceStatus = 'off' | 'on' | 'listening';
export type VoiceMode = 'unsupported' | 'continuous' | 'push-to-talk';

interface WakeWordNavigationState {
  voiceStatus: VoiceStatus;
  voiceMode: VoiceMode;
  triggerPushToTalk: () => void;
  stopListening: () => void;
}

function extractCommand(transcript: string, wakeWord: string): string | null {
  const normalizedTranscript = transcript.toLowerCase().trim();
  const normalizedWakeWord = wakeWord.toLowerCase().trim();
  if (!normalizedWakeWord) return null;

  const aliases = [
    normalizedWakeWord,
    `hey ${normalizedWakeWord}`,
    `ok ${normalizedWakeWord}`,
  ];

  for (const alias of aliases) {
    const index = normalizedTranscript.indexOf(alias);
    if (index === -1) continue;

    const command = normalizedTranscript
      .slice(index + alias.length)
      .replace(/^[\s,.:;!?-]+/, '')
      .trim();

    return command;
  }

  return null;
}

function routeCommand(command: string): string | null {
  if (/\b(home|dashboard)\b/.test(command)) return '/';
  if (/\b(app|apps|launcher)\b/.test(command)) return '/apps';
  if (/\b(media|music|player)\b/.test(command)) return '/media';
  if (/\b(settings|setting)\b/.test(command)) return '/settings';
  if (/\b(navigation|navigate|maps?)\b/.test(command)) return '/navigation';
  if (/\b(themes?|store)\b/.test(command)) return '/theme-store';
  if (/\b(trips?)\b/.test(command)) return '/trips';
  return null;
}

export function useWakeWordNavigation(options: UseWakeWordNavigationOptions): WakeWordNavigationState {
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>(options.enabled ? 'on' : 'off');
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('unsupported');
  const recognitionRef = useRef<VoiceRecognitionLike | null>(null);
  const optionsRef = useRef(options);
  const enabledRef = useRef(options.enabled);
  const modeRef = useRef<VoiceMode>('unsupported');
  const isListeningRef = useRef(false);
  const quickEndCounterRef = useRef(0);
  const lastStartAtRef = useRef(0);
  const restartTimerRef = useRef<number | null>(null);
  const isVisibleRef = useRef(typeof document === 'undefined' ? true : document.visibilityState === 'visible');
  const pushToTalkStarterRef = useRef<() => void>(() => {
    // No-op until recognizer is initialized.
  });
  const stopListeningRef = useRef<() => void>(() => {
    // No-op until recognizer is initialized.
  });

  enabledRef.current = options.enabled;
  optionsRef.current = options;

  const triggerPushToTalk = useCallback(() => {
    pushToTalkStarterRef.current();
  }, []);

  const stopListening = useCallback(() => {
    stopListeningRef.current();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      modeRef.current = 'unsupported';
      setVoiceMode('unsupported');
      setVoiceStatus('off');
      pushToTalkStarterRef.current = () => {
        // Unsupported browser.
      };
      stopListeningRef.current = () => {
        // Unsupported browser.
      };
      return;
    }

    if (!options.enabled) {
      if (restartTimerRef.current !== null) {
        window.clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      modeRef.current = 'continuous';
      setVoiceMode('continuous');
      setVoiceStatus('off');
      pushToTalkStarterRef.current = () => {
        // Voice control is disabled in settings.
      };
      stopListeningRef.current = () => {
        // Voice control is disabled in settings.
      };
      return;
    }

    let disposed = false;
    const recognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    modeRef.current = 'continuous';
    setVoiceMode('continuous');
    setVoiceStatus('on');
    quickEndCounterRef.current = 0;

    const configureRecognition = (continuous: boolean) => {
      recognition.continuous = continuous;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
    };

    const clearRestartTimer = () => {
      if (restartTimerRef.current !== null) {
        window.clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
    };

    const stopRecognition = (nextStatus: VoiceStatus) => {
      clearRestartTimer();
      try {
        recognition.stop();
      } catch {
        // Ignore stop failures when already stopped.
      }
      isListeningRef.current = false;
      setVoiceStatus(nextStatus);
    };

    const applyPushToTalkMode = () => {
      if (disposed) return;
      modeRef.current = 'push-to-talk';
      setVoiceMode('push-to-talk');
      stopRecognition(isVisibleRef.current ? 'on' : 'off');
    };

    const startContinuousListening = () => {
      if (disposed || !enabledRef.current || !isVisibleRef.current || modeRef.current !== 'continuous') return;
      configureRecognition(true);
      lastStartAtRef.current = Date.now();
      try {
        recognition.start();
        isListeningRef.current = true;
        setVoiceStatus('listening');
      } catch {
        applyPushToTalkMode();
      }
    };

    const startPushToTalkListening = () => {
      if (disposed || !enabledRef.current || !isVisibleRef.current || modeRef.current !== 'push-to-talk') return;
      if (isListeningRef.current) return;

      configureRecognition(false);
      lastStartAtRef.current = Date.now();
      try {
        recognition.start();
        isListeningRef.current = true;
        setVoiceStatus('listening');
      } catch {
        setVoiceStatus('on');
      }
    };

    pushToTalkStarterRef.current = () => {
      startPushToTalkListening();
    };

    stopListeningRef.current = () => {
      stopRecognition(enabledRef.current && isVisibleRef.current ? 'on' : 'off');
    };

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      isVisibleRef.current = isVisible;

      if (!isVisible) {
        stopRecognition('off');
        return;
      }

      if (!enabledRef.current) {
        setVoiceStatus('off');
        return;
      }

      if (modeRef.current === 'continuous') {
        startContinuousListening();
        return;
      }

      setVoiceStatus('on');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    recognition.onresult = (event) => {
      if (disposed) return;
      const latestOptions = optionsRef.current;
      const lastResult = event.results[event.results.length - 1];
      if (!lastResult || !lastResult.length) return;

      const transcript = String(lastResult[0]?.transcript || '').trim();
      if (!transcript) return;

      const command = extractCommand(transcript, latestOptions.wakeWord);
      if (command === null) return;
      if (!command) return;

      if (/\b(close|hide)\b.*\bmap\b/.test(command)) {
        if (latestOptions.isMapOpen) {
          latestOptions.closeMap();
        }
        return;
      }

      if (/\b(open|show)\b.*\bmap\b/.test(command) || /^map$/.test(command)) {
        if (!latestOptions.isMapOpen) {
          latestOptions.openMap();
        }
        return;
      }

      const route = routeCommand(command);
      if (route) {
        latestOptions.navigateTo(route);
        return;
      }

      if (latestOptions.onUnhandledCommand) {
        latestOptions.onUnhandledCommand(command);
      }
    };

    recognition.onerror = (event) => {
      if (disposed) return;

      const code = (event as VoiceRecognitionErrorEventLike)?.error || '';
      if (
        modeRef.current === 'continuous' &&
        (code === 'not-allowed' ||
          code === 'service-not-allowed' ||
          code === 'audio-capture' ||
          code === 'aborted' ||
          code === 'network')
      ) {
        applyPushToTalkMode();
        return;
      }

      if (modeRef.current === 'push-to-talk') {
        isListeningRef.current = false;
        setVoiceStatus(enabledRef.current ? 'on' : 'off');
      }
    };

    recognition.onend = () => {
      if (disposed || !enabledRef.current) return;
      isListeningRef.current = false;

      if (!isVisibleRef.current) {
        setVoiceStatus('off');
        return;
      }

      if (modeRef.current === 'continuous') {
        const elapsed = Date.now() - lastStartAtRef.current;
        quickEndCounterRef.current = elapsed < 900 ? quickEndCounterRef.current + 1 : 0;
        setVoiceStatus('on');

        if (quickEndCounterRef.current >= 3) {
          applyPushToTalkMode();
          return;
        }

        clearRestartTimer();

        restartTimerRef.current = window.setTimeout(() => {
          restartTimerRef.current = null;
          if (disposed || !enabledRef.current || modeRef.current !== 'continuous') return;
          startContinuousListening();
        }, 400);
        return;
      }

      setVoiceStatus('on');
    };

    startContinuousListening();

    return () => {
      disposed = true;
      pushToTalkStarterRef.current = () => {
        // Hook disposed.
      };
      stopListeningRef.current = () => {
        // Hook disposed.
      };
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearRestartTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Safe no-op.
        }
      }
      recognitionRef.current = null;
      isListeningRef.current = false;
      setVoiceStatus('off');
    };
  }, [
    options.enabled,
    options.wakeWord,
  ]);

  return {
    voiceStatus,
    voiceMode,
    triggerPushToTalk,
    stopListening,
  };
}

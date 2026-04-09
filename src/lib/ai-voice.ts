import type { UserSettings } from '@shared/types';

export interface AiVoicePreferences {
  enabled: boolean;
  autoSpeak: boolean;
  voiceName: string;
  voiceLang: string;
  rate: number;
  pitch: number;
  volume: number; 
}

type AiVoiceSettingsSource = Pick<
  UserSettings,
  | 'aiVoiceEnabled'
  | 'aiVoiceAutoSpeak'
  | 'aiVoiceName'
  | 'aiVoiceLang'
  | 'aiVoiceRate'
  | 'aiVoicePitch'
  | 'aiVoiceVolume'
>;

function clamp(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

export function getAiVoicePreferences(settings: AiVoiceSettingsSource): AiVoicePreferences {
  return {
    enabled: Boolean(settings.aiVoiceEnabled),
    autoSpeak: Boolean(settings.aiVoiceAutoSpeak),
    voiceName: typeof settings.aiVoiceName === 'string' ? settings.aiVoiceName : '',
    voiceLang: typeof settings.aiVoiceLang === 'string' && settings.aiVoiceLang ? settings.aiVoiceLang : 'en-US',
    rate: clamp(Number(settings.aiVoiceRate), 0.5, 2, 1),
    pitch: clamp(Number(settings.aiVoicePitch), 0, 2, 1),
    volume: clamp(Number(settings.aiVoiceVolume), 0, 1, 1),
  };
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function getSpeechVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
}

function resolveVoice(preferences: AiVoicePreferences, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const byName = voices.find((voice) => voice.name === preferences.voiceName);
  if (byName) return byName;

  const byLang = voices.find((voice) => voice.lang.toLowerCase() === preferences.voiceLang.toLowerCase());
  if (byLang) return byLang;

  return voices[0] || null;
}

export function stopAiVoice(): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
}

export function speakWithAiVoice(text: string, preferences: AiVoicePreferences): boolean {
  const phrase = text.trim();
  if (!phrase || !preferences.enabled) return false;
  if (!isSpeechSynthesisSupported()) return false;

  const voices = getSpeechVoices();
  const utterance = new SpeechSynthesisUtterance(phrase);
  const selectedVoice = resolveVoice(preferences, voices);

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
  } else {
    utterance.lang = preferences.voiceLang;
  }

  utterance.rate = preferences.rate;
  utterance.pitch = preferences.pitch;
  utterance.volume = preferences.volume;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

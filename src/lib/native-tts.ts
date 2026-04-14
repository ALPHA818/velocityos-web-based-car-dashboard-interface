import { Capacitor, registerPlugin } from '@capacitor/core';

export interface NativeTtsVoice {
  name: string;
  lang: string;
  isDefault?: boolean;
}

interface NativeTtsSpeakOptions {
  text: string;
  voiceName?: string;
  voiceLang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface NativeTtsPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  getVoices(): Promise<{ voices: NativeTtsVoice[] }>;
  speak(options: NativeTtsSpeakOptions): Promise<{ accepted: boolean }>;
  stop(): Promise<void>;
}

const NativeTts = registerPlugin<NativeTtsPlugin>('NativeTts');

const IS_ANDROID_NATIVE = Capacitor.getPlatform() === 'android';

export function isNativeTtsPlatform(): boolean {
  return IS_ANDROID_NATIVE;
}

export async function isNativeTtsAvailable(): Promise<boolean> {
  if (!IS_ANDROID_NATIVE) {
    return false;
  }

  try {
    const { available } = await NativeTts.isAvailable();
    return Boolean(available);
  } catch {
    return false;
  }
}

export async function getNativeTtsVoices(): Promise<NativeTtsVoice[]> {
  if (!IS_ANDROID_NATIVE) {
    return [];
  }

  try {
    const { voices } = await NativeTts.getVoices();
    if (!Array.isArray(voices)) {
      return [];
    }

    return voices
      .filter((voice) => voice && typeof voice.name === 'string' && typeof voice.lang === 'string')
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name));
  } catch {
    return [];
  }
}

export async function speakWithNativeTts(options: NativeTtsSpeakOptions): Promise<boolean> {
  if (!IS_ANDROID_NATIVE) {
    return false;
  }

  try {
    const { accepted } = await NativeTts.speak(options);
    return accepted !== false;
  } catch {
    return false;
  }
}

export function stopNativeTts(): void {
  if (!IS_ANDROID_NATIVE) {
    return;
  }

  void NativeTts.stop().catch(() => {
    // Ignore stop errors so the UI can continue using web speech or remain silent.
  });
}
import { Capacitor } from '@capacitor/core';
import type { UserSettings } from '@shared/types';
import { getNativeTtsVoices, isNativeTtsAvailable, speakWithNativeTts, stopNativeTts } from '@/lib/native-tts';

export interface AiVoicePreferences {
  enabled: boolean;
  autoSpeak: boolean;
  voiceName: string;
  voiceLang: string;
  rate: number;
  pitch: number;
  volume: number; 
}

export interface AiVoiceProfile {
  id: string;
  name: string;
  lang: string;
  provider: 'browser' | 'android-native';
  isDefault: boolean;
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

export function primeSpeechVoices(): void {
  if (!isSpeechSynthesisSupported()) return;

  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.resume();
  } catch {
    // Some WebView implementations throw while the speech engine is still booting.
  }
}

export function getSpeechVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];

  primeSpeechVoices();

  return window.speechSynthesis
    .getVoices()
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name));
}

function resolveVoice(preferences: AiVoicePreferences, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const byName = voices.find((voice) => voice.name === preferences.voiceName);
  if (byName) return byName;

  const byLang = voices.find((voice) => voice.lang.toLowerCase() === preferences.voiceLang.toLowerCase());
  if (byLang) return byLang;

  return voices[0] || null;
}

function createVoiceProfileId(provider: AiVoiceProfile['provider'], name: string, lang: string, index: number): string {
  return `${provider}:${name}:${lang}:${index}`;
}

function sortProfiles(profiles: AiVoiceProfile[]): AiVoiceProfile[] {
  return profiles
    .slice()
    .sort((left, right) => {
      if (left.isDefault !== right.isDefault) {
        return left.isDefault ? -1 : 1;
      }

      if (left.provider !== right.provider) {
        if (Capacitor.getPlatform() === 'android') {
          return left.provider === 'android-native' ? -1 : 1;
        }

        return left.provider === 'browser' ? -1 : 1;
      }

      return left.name.localeCompare(right.name);
    });
}

async function getNativeVoiceProfiles(): Promise<AiVoiceProfile[]> {
  const nativeVoices = await getNativeTtsVoices();

  return nativeVoices.map((voice, index) => ({
    id: createVoiceProfileId('android-native', voice.name, voice.lang, index),
    name: voice.name,
    lang: voice.lang,
    provider: 'android-native',
    isDefault: Boolean(voice.isDefault),
  }));
}

function getBrowserVoiceProfiles(): AiVoiceProfile[] {
  return getSpeechVoices().map((voice, index) => ({
    id: createVoiceProfileId('browser', voice.name, voice.lang, index),
    name: voice.name,
    lang: voice.lang,
    provider: 'browser',
    isDefault: Boolean(voice.default),
  }));
}

export async function getAvailableAiVoiceProfiles(): Promise<AiVoiceProfile[]> {
  const profiles = [
    ...(await getNativeVoiceProfiles()),
    ...getBrowserVoiceProfiles(),
  ];

  return sortProfiles(
    profiles.filter((profile, index) => profiles.findIndex((candidate) => candidate.provider === profile.provider && candidate.name === profile.name && candidate.lang === profile.lang) === index)
  );
}

export async function isAiVoiceOutputSupported(): Promise<boolean> {
  if (isSpeechSynthesisSupported()) {
    return true;
  }

  return isNativeTtsAvailable();
}

function speakWithBrowserVoice(text: string, preferences: AiVoicePreferences): boolean {
  if (!isSpeechSynthesisSupported()) return false;

  const voices = getSpeechVoices();
  const utterance = new SpeechSynthesisUtterance(text);
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

  try {
    window.speechSynthesis.resume();
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function stopAiVoice(): void {
  stopNativeTts();

  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
}

export async function speakWithAiVoice(text: string, preferences: AiVoicePreferences): Promise<boolean> {
  const phrase = text.trim();
  if (!phrase || !preferences.enabled) return false;

  const spokeNatively = await speakWithNativeTts({
    text: phrase,
    voiceName: preferences.voiceName,
    voiceLang: preferences.voiceLang,
    rate: preferences.rate,
    pitch: preferences.pitch,
    volume: preferences.volume,
  });
  if (spokeNatively) {
    return true;
  }

  return speakWithBrowserVoice(phrase, preferences);
}

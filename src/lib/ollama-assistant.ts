import { Capacitor } from '@capacitor/core';

export type AssistantRole = 'user' | 'assistant';

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
  ts: number;
}

interface OllamaRequestMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AskOllamaOptions {
  baseUrl: string;
  model: string;
  prompt: string;
  history: AssistantMessage[];
  signal?: AbortSignal;
}

const LOCAL_AI_HISTORY_KEY = 'velocityos_local_ai_history';
const MAX_LOCAL_MESSAGES = 80;

const SYSTEM_PROMPT = [
  'You are the local in-car AI assistant for VelocityOS.',
  'Respond with concise, practical answers for driving and app usage context.',
  'Do not invent unavailable integrations; acknowledge limitations briefly when needed.',
].join(' ');

function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export function loadAssistantHistory(): AssistantMessage[] {
  const storage = safeStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(LOCAL_AI_HISTORY_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((entry) => {
        if (!entry || typeof entry !== 'object') return false;
        const message = entry as Partial<AssistantMessage>;
        return (
          typeof message.id === 'string' &&
          (message.role === 'user' || message.role === 'assistant') &&
          typeof message.content === 'string' &&
          typeof message.ts === 'number'
        );
      })
      .slice(-MAX_LOCAL_MESSAGES) as AssistantMessage[];
  } catch {
    return [];
  }
}

export function saveAssistantHistory(messages: AssistantMessage[]): void {
  const storage = safeStorage();
  if (!storage) return;

  storage.setItem(LOCAL_AI_HISTORY_KEY, JSON.stringify(messages.slice(-MAX_LOCAL_MESSAGES)));
}

export function clearAssistantHistory(): void {
  const storage = safeStorage();
  if (!storage) return;
  storage.removeItem(LOCAL_AI_HISTORY_KEY);
}

function buildOllamaMessages(history: AssistantMessage[], prompt: string): OllamaRequestMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((message) => ({ role: message.role, content: message.content })),
    { role: 'user', content: prompt },
  ];
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

export function isLoopbackOllamaBaseUrl(baseUrl: string): boolean {
  try {
    const url = new URL(normalizeBaseUrl(baseUrl));
    const hostname = url.hostname.toLowerCase();
    return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1';
  } catch {
    return false;
  }
}

function isPhoneLikeClient(): boolean {
  if (typeof window === 'undefined') return false;

  const coarsePointer = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  return Capacitor.isNativePlatform() || coarsePointer;
}

export function getOllamaConnectionHint(baseUrl: string): string {
  if (isLoopbackOllamaBaseUrl(baseUrl) && isPhoneLikeClient()) {
    return 'This phone cannot reach Ollama at 127.0.0.1 unless Ollama is running on the phone itself. Use the LAN IP of the computer running Ollama instead.';
  }

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  return `Ollama is unavailable at ${normalizedBaseUrl || 'the configured URL'}. Check the server, model, and network path in Settings.`;
}

export function buildOfflineAssistantReply(prompt: string, baseUrl: string): string {
  const normalizedPrompt = prompt.trim().toLowerCase();

  if (!normalizedPrompt) {
    return `Offline assistant mode is active. ${getOllamaConnectionHint(baseUrl)}`;
  }

  if (/\b(map|maps|navigation|route|destination|bookmark|saved place|recent)\b/.test(normalizedPrompt)) {
    return 'Offline assistant: open Navigation to manage saved places and recent destinations. Tapping a place opens the Map tab with that location preselected.';
  }

  if (/\b(media|music|player|spotify|youtube)\b/.test(normalizedPrompt)) {
    return 'Offline assistant: use the Media tab to switch sources and control playback. The Map tab is separate now, so media changes stay in Media unless you open Map yourself.';
  }

  if (/\b(settings|voice|microphone|ollama|ai|assistant)\b/.test(normalizedPrompt)) {
    return `Offline assistant: voice and AI settings live in System Settings. ${getOllamaConnectionHint(baseUrl)}`;
  }

  if (/\b(trip|trips|drive|live drive|tracking|share)\b/.test(normalizedPrompt)) {
    return 'Offline assistant: Trips shows recent drive history and progress, while the Map tab can show the active live-drive trail or shared tracking state.';
  }

  if (/\b(theme|store|skin|ambient|scene)\b/.test(normalizedPrompt)) {
    return 'Offline assistant: open the Store tab to change themes, map icons, trip cosmetics, scenes, ambient effects, and widget skins.';
  }

  return `Offline assistant mode is active. I can still help with Navigation, Map, Media, Trips, Settings, and Store. ${getOllamaConnectionHint(baseUrl)}`;
}

export async function askOllama(options: AskOllamaOptions): Promise<string> {
  const endpoint = `${normalizeBaseUrl(options.baseUrl)}/api/chat`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model,
      stream: false,
      messages: buildOllamaMessages(options.history, options.prompt),
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const details = await response.text().catch(() => 'Unknown error');
    throw new Error(`Ollama request failed (${response.status}): ${details}`);
  }

  const payload = await response.json();
  const content =
    typeof payload?.message?.content === 'string'
      ? payload.message.content
      : typeof payload?.response === 'string'
        ? payload.response
        : '';

  if (!content.trim()) {
    throw new Error('Ollama returned an empty response');
  }

  return content.trim();
}

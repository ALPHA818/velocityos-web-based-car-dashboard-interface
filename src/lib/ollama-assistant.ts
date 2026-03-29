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

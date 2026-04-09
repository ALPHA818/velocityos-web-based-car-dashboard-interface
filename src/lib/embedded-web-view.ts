import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface EmbeddedWebViewOpenOptions {
  url: string;
  title?: string;
  startFullscreen?: boolean;
}

export interface EmbeddedWebViewInlineOptions {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EmbeddedWebViewPlugin {
  open(options: EmbeddedWebViewOpenOptions): Promise<void>;
  openInline(options: EmbeddedWebViewInlineOptions): Promise<void>;
  close(): Promise<void>;
  addListener(eventName: 'closed', listenerFunc: () => void): Promise<PluginListenerHandle>;
}

const EmbeddedWebView = registerPlugin<EmbeddedWebViewPlugin>('EmbeddedWebView');

const IS_ANDROID_NATIVE = Capacitor.getPlatform() === 'android';

export function isEmbeddedWebViewAvailable(): boolean {
  return IS_ANDROID_NATIVE;
}

export async function openEmbeddedWebView(options: EmbeddedWebViewOpenOptions): Promise<boolean> {
  if (!IS_ANDROID_NATIVE) {
    return false;
  }

  try {
    await EmbeddedWebView.open(options);
    return true;
  } catch {
    return false;
  }
}

export async function openInlineEmbeddedWebView(options: EmbeddedWebViewInlineOptions): Promise<boolean> {
  if (!IS_ANDROID_NATIVE) {
    return false;
  }

  try {
    await EmbeddedWebView.openInline(options);
    return true;
  } catch {
    return false;
  }
}

export async function closeEmbeddedWebView(): Promise<void> {
  if (!IS_ANDROID_NATIVE) {
    return;
  }

  try {
    await EmbeddedWebView.close();
  } catch {
    // Ignore close errors so the UI can fallback gracefully.
  }
}

export async function addEmbeddedWebViewCloseListener(listener: () => void): Promise<PluginListenerHandle | null> {
  if (!IS_ANDROID_NATIVE) {
    return null;
  }

  try {
    return await EmbeddedWebView.addListener('closed', listener);
  } catch {
    return null;
  }
}

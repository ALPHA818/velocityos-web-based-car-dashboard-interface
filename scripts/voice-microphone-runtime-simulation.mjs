#!/usr/bin/env node

/**
 * Deterministic microphone/runtime behavior simulation for the voice navigation runtime.
 * This script validates permission and speech-runtime fallback behavior contract.
 */

class FakeClock {
  constructor() {
    this.now = 0;
    this.queue = [];
  }

  setTimeout(fn, delayMs) {
    const dueAt = this.now + delayMs;
    this.queue.push({ dueAt, fn });
    this.queue.sort((a, b) => a.dueAt - b.dueAt);
  }

  advance(ms) {
    const target = this.now + ms;
    while (this.queue.length > 0 && this.queue[0].dueAt <= target) {
      const item = this.queue.shift();
      this.now = item.dueAt;
      item.fn();
    }
    this.now = target;
  }

  currentTime() {
    return this.now;
  }
}

class MockRecognition {
  constructor(options = {}) {
    this.continuous = false;
    this.interimResults = false;
    this.lang = 'en-US';
    this.onresult = null;
    this.onerror = null;
    this.onend = null;

    this.startCalls = 0;
    this.stopCalls = 0;
    this.started = false;
    this.startThrows = Array.isArray(options.startThrows) ? [...options.startThrows] : [];
  }

  start() {
    this.startCalls += 1;
    const shouldThrow = this.startThrows.length ? this.startThrows.shift() : false;
    if (shouldThrow) {
      throw new Error('start blocked');
    }
    this.started = true;
  }

  stop() {
    this.stopCalls += 1;
    this.started = false;
  }

  emitResult(transcript) {
    if (!this.onresult) return;
    this.onresult({
      results: {
        length: 1,
        0: {
          length: 1,
          0: { transcript },
        },
      },
    });
  }

  emitError(errorCode) {
    if (!this.onerror) return;
    this.onerror({ error: errorCode });
  }

  emitEnd() {
    this.started = false;
    if (!this.onend) return;
    this.onend();
  }
}

function extractCommand(transcript, wakeWord) {
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

    return normalizedTranscript
      .slice(index + alias.length)
      .replace(/^[\s,.:;!?-]+/, '')
      .trim();
  }

  return null;
}

function routeCommand(command) {
  if (/\b(home|dashboard)\b/.test(command)) return '/';
  if (/\b(app|apps|launcher)\b/.test(command)) return '/apps';
  if (/\b(media|music|player)\b/.test(command)) return '/media';
  if (/\b(settings|setting)\b/.test(command)) return '/settings';
  if (/\b(navigation|navigate|maps?)\b/.test(command)) return '/navigation';
  if (/\b(themes?|store)\b/.test(command)) return '/theme-store';
  if (/\b(trips?)\b/.test(command)) return '/trips';
  return null;
}

class VoiceRuntimeHarness {
  constructor(options) {
    this.options = {
      enabled: options.enabled,
      wakeWord: options.wakeWord,
      isMapOpen: options.isMapOpen,
      navigateTo: options.navigateTo,
      openMap: options.openMap,
      closeMap: options.closeMap,
      onUnhandledCommand: options.onUnhandledCommand,
    };
    this.clock = options.clock;
    this.recognition = options.createRecognition ? options.createRecognition() : null;

    this.voiceStatus = options.enabled ? 'on' : 'off';
    this.voiceMode = 'unsupported';
    this.enabled = options.enabled;

    this.isListening = false;
    this.quickEndCounter = 0;
    this.lastStartAt = 0;

    this._bind();
  }

  _bind() {
    if (!this.recognition) {
      this.voiceMode = 'unsupported';
      this.voiceStatus = 'off';
      return;
    }

    if (!this.enabled) {
      this.voiceMode = 'continuous';
      this.voiceStatus = 'off';
      return;
    }

    this.voiceMode = 'continuous';
    this.voiceStatus = 'on';
    this.quickEndCounter = 0;

    this.recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      if (!lastResult || !lastResult.length) return;

      const transcript = String(lastResult[0]?.transcript || '').trim();
      if (!transcript) return;

      const command = extractCommand(transcript, this.options.wakeWord);
      if (command === null || !command) return;

      if (/\b(close|hide)\b.*\bmap\b/.test(command)) {
        if (this.options.isMapOpen()) {
          this.options.closeMap();
        }
        return;
      }

      if (/\b(open|show)\b.*\bmap\b/.test(command) || /^map$/.test(command)) {
        if (!this.options.isMapOpen()) {
          this.options.openMap();
        }
        return;
      }

      const route = routeCommand(command);
      if (route) {
        this.options.navigateTo(route);
        return;
      }

      if (this.options.onUnhandledCommand) {
        this.options.onUnhandledCommand(command);
      }
    };

    this.recognition.onerror = (event) => {
      const code = event?.error || '';
      if (
        this.voiceMode === 'continuous' &&
        (code === 'not-allowed' ||
          code === 'service-not-allowed' ||
          code === 'audio-capture' ||
          code === 'aborted' ||
          code === 'network')
      ) {
        this._applyPushToTalkMode();
        return;
      }

      if (this.voiceMode === 'push-to-talk') {
        this.isListening = false;
        this.voiceStatus = this.enabled ? 'on' : 'off';
      }
    };

    this.recognition.onend = () => {
      if (!this.enabled) return;
      this.isListening = false;

      if (this.voiceMode === 'continuous') {
        const elapsed = this.clock.currentTime() - this.lastStartAt;
        this.quickEndCounter = elapsed < 900 ? this.quickEndCounter + 1 : 0;
        this.voiceStatus = 'on';

        if (this.quickEndCounter >= 3) {
          this._applyPushToTalkMode();
          return;
        }

        this.clock.setTimeout(() => {
          if (!this.enabled || this.voiceMode !== 'continuous') return;
          this._startContinuousListening();
        }, 400);
        return;
      }

      this.voiceStatus = 'on';
    };

    this._startContinuousListening();
  }

  _configureRecognition(continuous) {
    this.recognition.continuous = continuous;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
  }

  _applyPushToTalkMode() {
    this.voiceMode = 'push-to-talk';
    this.voiceStatus = 'on';
    this.isListening = false;
    try {
      this.recognition.stop();
    } catch {
      // no-op
    }
  }

  _startContinuousListening() {
    if (!this.enabled || this.voiceMode !== 'continuous') return;
    this._configureRecognition(true);
    this.lastStartAt = this.clock.currentTime();
    try {
      this.recognition.start();
      this.isListening = true;
      this.voiceStatus = 'listening';
    } catch {
      this._applyPushToTalkMode();
    }
  }

  triggerPushToTalk() {
    if (!this.enabled || this.voiceMode !== 'push-to-talk') return;
    if (this.isListening) return;

    this._configureRecognition(false);
    this.lastStartAt = this.clock.currentTime();
    try {
      this.recognition.start();
      this.isListening = true;
      this.voiceStatus = 'listening';
    } catch {
      this.voiceStatus = 'on';
    }
  }

  stopListening() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch {
      // no-op
    }
    this.isListening = false;
    this.voiceStatus = this.enabled ? 'on' : 'off';
  }

  getState() {
    return {
      voiceStatus: this.voiceStatus,
      voiceMode: this.voiceMode,
      isListening: this.isListening,
      startCalls: this.recognition ? this.recognition.startCalls : 0,
      stopCalls: this.recognition ? this.recognition.stopCalls : 0,
    };
  }
}

function assertEqual(report, name, actual, expected) {
  const pass = actual === expected;
  report.push({ name, pass, actual, expected });
}

function runSimulation() {
  const report = [];

  // Scenario 1: unsupported browser
  {
    const clock = new FakeClock();
    const runtime = new VoiceRuntimeHarness({
      enabled: true,
      wakeWord: 'nova',
      isMapOpen: () => false,
      navigateTo: () => {},
      openMap: () => {},
      closeMap: () => {},
      onUnhandledCommand: () => {},
      createRecognition: null,
      clock,
    });
    const state = runtime.getState();
    assertEqual(report, 'unsupported.mode', state.voiceMode, 'unsupported');
    assertEqual(report, 'unsupported.status', state.voiceStatus, 'off');
  }

  // Scenario 2: voice disabled
  {
    const clock = new FakeClock();
    const rec = new MockRecognition();
    const runtime = new VoiceRuntimeHarness({
      enabled: false,
      wakeWord: 'nova',
      isMapOpen: () => false,
      navigateTo: () => {},
      openMap: () => {},
      closeMap: () => {},
      onUnhandledCommand: () => {},
      createRecognition: () => rec,
      clock,
    });
    const state = runtime.getState();
    assertEqual(report, 'disabled.status', state.voiceStatus, 'off');
    assertEqual(report, 'disabled.startCalls', state.startCalls, 0);
  }

  // Scenario 3: permission denied on startup => push-to-talk fallback
  {
    const clock = new FakeClock();
    const rec = new MockRecognition({ startThrows: [true] });
    const runtime = new VoiceRuntimeHarness({
      enabled: true,
      wakeWord: 'nova',
      isMapOpen: () => false,
      navigateTo: () => {},
      openMap: () => {},
      closeMap: () => {},
      onUnhandledCommand: () => {},
      createRecognition: () => rec,
      clock,
    });
    const state = runtime.getState();
    assertEqual(report, 'startup-denied.mode', state.voiceMode, 'push-to-talk');
    assertEqual(report, 'startup-denied.status', state.voiceStatus, 'on');
  }

  // Scenario 4: repeated quick onend loops => push-to-talk fallback
  {
    const clock = new FakeClock();
    const rec = new MockRecognition();
    const runtime = new VoiceRuntimeHarness({
      enabled: true,
      wakeWord: 'nova',
      isMapOpen: () => false,
      navigateTo: () => {},
      openMap: () => {},
      closeMap: () => {},
      onUnhandledCommand: () => {},
      createRecognition: () => rec,
      clock,
    });

    for (let i = 0; i < 3; i += 1) {
      clock.advance(200);
      rec.emitEnd();
      clock.advance(450);
    }

    const state = runtime.getState();
    assertEqual(report, 'quick-end-fallback.mode', state.voiceMode, 'push-to-talk');
    assertEqual(report, 'quick-end-fallback.status', state.voiceStatus, 'on');
  }

  // Scenario 5: runtime restriction error => push-to-talk fallback
  {
    const clock = new FakeClock();
    const rec = new MockRecognition();
    const runtime = new VoiceRuntimeHarness({
      enabled: true,
      wakeWord: 'nova',
      isMapOpen: () => false,
      navigateTo: () => {},
      openMap: () => {},
      closeMap: () => {},
      onUnhandledCommand: () => {},
      createRecognition: () => rec,
      clock,
    });
    rec.emitError('service-not-allowed');
    const state = runtime.getState();
    assertEqual(report, 'restricted-error.mode', state.voiceMode, 'push-to-talk');
    assertEqual(report, 'restricted-error.status', state.voiceStatus, 'on');
  }

  // Scenario 6: push-to-talk cycle + command routing + map command handling
  {
    const clock = new FakeClock();
    const rec = new MockRecognition({ startThrows: [true] });
    let mapOpen = false;
    const actions = [];

    const runtime = new VoiceRuntimeHarness({
      enabled: true,
      wakeWord: 'nova',
      isMapOpen: () => mapOpen,
      navigateTo: (path) => actions.push(`route:${path}`),
      openMap: () => {
        mapOpen = true;
        actions.push('map:open');
      },
      closeMap: () => {
        mapOpen = false;
        actions.push('map:close');
      },
      onUnhandledCommand: (command) => actions.push(`unhandled:${command}`),
      createRecognition: () => rec,
      clock,
    });

    runtime.triggerPushToTalk();
    assertEqual(report, 'ptt.start.listening', runtime.getState().voiceStatus, 'listening');

    rec.emitResult('hey nova open apps');
    rec.emitEnd();
    assertEqual(report, 'ptt.route.apps', actions[0], 'route:/apps');
    assertEqual(report, 'ptt.end.status', runtime.getState().voiceStatus, 'on');

    runtime.triggerPushToTalk();
    rec.emitResult('nova open map');
    rec.emitEnd();
    assertEqual(report, 'ptt.open-map', actions[1], 'map:open');

    runtime.triggerPushToTalk();
    rec.emitResult('nova close map');
    rec.emitEnd();
    assertEqual(report, 'ptt.close-map', actions[2], 'map:close');

    runtime.triggerPushToTalk();
    rec.emitResult('nova tell me a joke');
    rec.emitEnd();
    assertEqual(report, 'ptt.unhandled', actions[3], 'unhandled:tell me a joke');
  }

  // Scenario 7: push-to-talk runtime error returns to ON
  {
    const clock = new FakeClock();
    const rec = new MockRecognition({ startThrows: [true] });
    const runtime = new VoiceRuntimeHarness({
      enabled: true,
      wakeWord: 'nova',
      isMapOpen: () => false,
      navigateTo: () => {},
      openMap: () => {},
      closeMap: () => {},
      onUnhandledCommand: () => {},
      createRecognition: () => rec,
      clock,
    });

    runtime.triggerPushToTalk();
    rec.emitError('network');
    assertEqual(report, 'ptt.error.status', runtime.getState().voiceStatus, 'on');
  }

  return report;
}

const report = runSimulation();
const failed = report.filter((item) => !item.pass);
const passed = report.length - failed.length;

console.log('[voice-microphone-simulation]');
for (const item of report) {
  const status = item.pass ? 'PASS' : 'FAIL';
  console.log(`${status} ${item.name} expected=${JSON.stringify(item.expected)} actual=${JSON.stringify(item.actual)}`);
}
console.log(`[summary] passed=${passed} failed=${failed.length} total=${report.length}`);

if (failed.length > 0) {
  process.exitCode = 1;
}

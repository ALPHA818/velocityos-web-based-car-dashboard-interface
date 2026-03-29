#!/usr/bin/env node

const LOCATION_MIN_TIME_MS = 300;

function readArg(name, fallback) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  if (!hit) return fallback;
  const value = Number(hit.slice(prefix.length));
  return Number.isFinite(value) ? value : fallback;
}

const thresholdKph = readArg('threshold', 40);
const cooldownSeconds = readArg('cooldown', 15);
const cooldownMs = Math.round(cooldownSeconds * 1000);

// Focused scenario around threshold crossing and cooldown edges.
const updates = [
  { tMs: 0, speedKph: 0, appForeground: false },
  { tMs: 3000, speedKph: 24.7, appForeground: false },
  { tMs: 5000, speedKph: 39.9, appForeground: false },
  { tMs: 5100, speedKph: 40.2, appForeground: false },
  { tMs: 10000, speedKph: 61.3, appForeground: false },
  { tMs: 20099, speedKph: 41.0, appForeground: false },
  { tMs: 20100, speedKph: 41.0, appForeground: false },
  { tMs: 26000, speedKph: 15.0, appForeground: false },
  { tMs: 35100, speedKph: 55.2, appForeground: false },
  { tMs: 40000, speedKph: 52.0, appForeground: true },
];

let lastAlertElapsedMs = -Infinity;
const rows = [];
const triggers = [];

for (const sample of updates) {
  if (sample.speedKph < thresholdKph) {
    rows.push({ ...sample, decision: 'skip:below-threshold' });
    continue;
  }

  if (sample.appForeground) {
    rows.push({ ...sample, decision: 'skip:app-foreground' });
    continue;
  }

  const elapsedSinceAlert = sample.tMs - lastAlertElapsedMs;
  if (elapsedSinceAlert < cooldownMs) {
    rows.push({
      ...sample,
      decision: `skip:cooldown(${cooldownMs - elapsedSinceAlert}ms-remaining)`,
    });
    continue;
  }

  lastAlertElapsedMs = sample.tMs;
  triggers.push(sample.tMs);
  rows.push({ ...sample, decision: 'TRIGGER' });
}

function fmtSeconds(ms) {
  return (ms / 1000).toFixed(3);
}

console.log(`[config] threshold=${thresholdKph.toFixed(1)}kph cooldown=${cooldownSeconds}s sampleInterval=${LOCATION_MIN_TIME_MS}ms`);
console.log('[decisions]');
for (const row of rows) {
  console.log(
    `t=${row.tMs}ms (${fmtSeconds(row.tMs)}s) speed=${row.speedKph.toFixed(1)}kph foreground=${row.appForeground ? 'yes' : 'no'} -> ${row.decision}`
  );
}

const intervals = triggers.slice(1).map((tMs, index) => tMs - triggers[index]);
console.log('[summary]');
console.log(`triggerCount=${triggers.length}`);
console.log(`triggerTimesMs=${triggers.join(',')}`);
console.log(`triggerTimesSec=${triggers.map(fmtSeconds).join(',')}`);
console.log(`triggerIntervalsMs=${intervals.join(',') || 'n/a'}`);
console.log(`triggerIntervalsSec=${intervals.map(fmtSeconds).join(',') || 'n/a'}`);

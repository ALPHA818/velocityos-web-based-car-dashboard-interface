# VelocityOS Web-Based Car Dashboard

VelocityOS is a React + Capacitor dashboard interface for an in-car display. It combines a dashboard UI, map/navigation overlay, media playback, theme marketplace, live vehicle tracking, local Ollama assistant support, and an Android-native speed monitor that can reopen the dashboard while driving.

## What is in this repo

- `src/`: React application for the dashboard UI
- `worker/`: Cloudflare Worker API and durable storage routes
- `shared/`: shared TypeScript types and seed data
- `android/`: Capacitor Android shell plus native speed monitor plugin/service
- `scripts/`: runtime simulations for the wake-word flow and monitor cooldown logic

## Main app areas

- Home dashboard with speed, weather, media, and trip summary
- Navigation hub with saved destinations, global search, recent history, and map overlay
- Media page backed by a shared player store
- Apps page with embedded utilities and integration launchers
- Settings page for UI preferences, voice controls, Ollama config, and native monitor settings
- Theme store with unlockable themes and driving-earned currency
- Live tracking page for shared vehicle location sessions

## External services used

- OpenStreetMap / Nominatim for place search and reverse geocoding
- OSRM for route generation
- Ollama for local AI assistant responses
- Capacitor Android APIs for native service integration

## Development

Install dependencies:

```bash
bun install
```

Start local development:

```bash
bun dev
```

Build the web app and worker:

```bash
bun build
```

Preview the production build:

```bash
bun preview
```

Lint the repo:

```bash
bun lint
```

Generate Cloudflare Worker types:

```bash
bun cf-typegen
```

## Runtime simulations

Validate Android speed monitor threshold/cooldown behavior:

```bash
bun run monitor:test-threshold-cooldown
```

Validate wake-word and push-to-talk voice behavior:

```bash
bun run voice:test-microphone-runtime
```

## Android notes

The Android shell lives under `android/` and includes:

- `NativeMonitorPlugin.java`: Capacitor bridge for native monitor settings/actions
- `SpeedMonitorService.java`: foreground service that watches speed and can relaunch the dashboard
- `MonitorPreferences.java`: persisted native monitor configuration and privilege checks
- `MainActivity.java`: startup/runtime permission handling plus service bootstrapping

## Deployment

Web assets are built into `dist/client`, and the Cloudflare Worker bundle is built into `dist/velocity_os_ajk22f0pbdwn_plihcfqc`.

Deploy with:

```bash
bun deploy
```

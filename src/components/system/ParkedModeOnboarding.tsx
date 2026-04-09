import React from 'react';
import { Compass, Mic, Music2, Paintbrush2, Route, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ParkedModeOnboardingProps {
  open: boolean;
  onDismiss: () => void;
  onComplete: () => void;
  onNavigate: (path: string) => void;
}

const STEPS = [
  {
    id: 'navigation',
    eyebrow: 'Step 01',
    title: 'Navigation should take seconds, not setup time.',
    body: 'Save your current spot, bookmark search hits instantly, and promote any recent stop into Home or Work before you start moving.',
    bullets: ['One tap saves current GPS position.', 'Recent destinations can become Home or Work immediately.', 'Map pins and search hits both support direct bookmark actions.'],
    icon: Route,
    accent: 'rgba(59,130,246,0.28)',
    ctaLabel: 'Open navigation',
    ctaPath: '/navigation',
  },
  {
    id: 'voice',
    eyebrow: 'Step 02',
    title: 'Voice control is the safest path once driving starts.',
    body: 'Wake-word commands let you jump between navigation, apps, settings, and media without reaching across the dashboard.',
    bullets: ['Check mic readiness in the status strip.', 'Replay voice setup from Settings at any time.', 'Keep wake-word control on for hands-free navigation.'],
    icon: Mic,
    accent: 'rgba(16,185,129,0.28)',
    ctaLabel: 'Open settings',
    ctaPath: '/settings?focus=mic-toggle',
  },
  {
    id: 'themes',
    eyebrow: 'Step 03',
    title: 'Themes and cockpit packs change the whole shell.',
    body: 'Store items do more than recolor cards. Scenes, ambient layers, widget skins, and status chrome all travel together.',
    bullets: ['The shell status strip follows your active cockpit profile.', 'Settings shows the same health hub language as the dashboard.', 'You can preview store changes while parked without cluttering drive mode.'],
    icon: Paintbrush2,
    accent: 'rgba(244,63,94,0.28)',
    ctaLabel: 'Open store',
    ctaPath: '/theme-store',
  },
  {
    id: 'media',
    eyebrow: 'Step 04',
    title: 'Media sources stay predictable once connected.',
    body: 'Preview supported services inside VelocityOS, launch native apps when needed, and use diagnostics to see what is actually ready.',
    bullets: ['The media page now uses the same loading and setup language as the rest of the OS.', 'Integration readiness appears in the shared health hub.', 'Diagnostics track slow screens and integration failures automatically.'],
    icon: Music2,
    accent: 'rgba(245,158,11,0.28)',
    ctaLabel: 'Open media',
    ctaPath: '/media',
  },
] as const;

export function ParkedModeOnboarding({ open, onDismiss, onComplete, onNavigate }: ParkedModeOnboardingProps) {
  const [stepIndex, setStepIndex] = React.useState(0);

  React.useEffect(() => {
    if (open) {
      setStepIndex(0);
    }
  }, [open]);

  if (!open) return null;

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-2xl">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[2.8rem] border border-white/10 bg-zinc-950/95 p-6 shadow-[0_40px_120px_-55px_rgba(0,0,0,0.9)] md:p-10">
        <div className="absolute inset-x-0 top-0 h-40 opacity-90 blur-3xl" style={{ background: `radial-gradient(circle at 18% 18%, ${step.accent} 0, transparent 48%)` }} />
        <div className="relative z-10 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">Parked learning mode</div>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">Learn the cockpit before the car moves.</h2>
              <p className="mt-3 max-w-2xl text-sm text-zinc-300 md:text-base">
                VelocityOS now has enough depth that the safest introduction is a parked walkthrough. This flow only appears while the car is stationary.
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-white"
            >
              Skip demo
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {STEPS.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  'h-2 flex-1 rounded-full transition-all',
                  index <= stepIndex ? 'bg-primary' : 'bg-white/10'
                )}
              />
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 md:p-7">
              <div className="flex items-center gap-3 text-primary">
                <step.icon className="h-7 w-7 md:h-9 md:w-9" />
                <span className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">{step.eyebrow}</span>
              </div>
              <h3 className="mt-5 text-2xl font-black tracking-tight md:text-4xl">{step.title}</h3>
              <p className="mt-4 text-sm text-zinc-300 md:text-base">{step.body}</p>
              <div className="mt-5 space-y-3">
                {step.bullets.map((bullet) => (
                  <div key={bullet} className="flex items-start gap-3 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5 md:p-7">
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">Demo controls</div>
              <div className="mt-4 space-y-3">
                <Button
                  type="button"
                  onClick={() => onNavigate(step.ctaPath)}
                  className="h-12 w-full rounded-2xl font-black"
                >
                  {step.ctaLabel}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                  disabled={stepIndex === 0}
                  className="h-12 w-full rounded-2xl border-white/15 bg-white/5 font-black"
                >
                  Previous step
                </Button>
                <Button
                  type="button"
                  variant={isLastStep ? 'default' : 'secondary'}
                  onClick={() => {
                    if (isLastStep) {
                      onComplete();
                      return;
                    }
                    setStepIndex((current) => Math.min(STEPS.length - 1, current + 1));
                  }}
                  className="h-12 w-full rounded-2xl font-black"
                >
                  {isLastStep ? 'Finish demo' : 'Next step'}
                </Button>
              </div>
              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                <div className="flex items-center gap-2 font-black uppercase tracking-[0.18em] text-zinc-400">
                  <Compass className="h-4 w-4 text-primary" />
                  Safe-mode note
                </div>
                <p className="mt-2">
                  Keep this walkthrough for parked time. Once you begin moving, the live dashboard stays focused on driving instead of training overlays.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
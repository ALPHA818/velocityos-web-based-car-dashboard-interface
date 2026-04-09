import React from 'react';
import { AlertTriangle, Compass, Loader2, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SystemStateKind = 'loading' | 'empty' | 'error' | 'info';

interface SystemStateAction {
  label: string;
  onClick: () => void;
}

export interface SystemStatePanelProps {
  kind: SystemStateKind;
  eyebrow?: string;
  title: string;
  message: string;
  icon?: LucideIcon;
  className?: string;
  compact?: boolean;
  primaryAction?: SystemStateAction;
  secondaryAction?: SystemStateAction;
}

const KIND_STYLES: Record<SystemStateKind, string> = {
  loading: 'border-white/10 bg-white/5 text-foreground',
  empty: 'border-white/10 bg-white/5 text-foreground',
  error: 'border-destructive/35 bg-destructive/10 text-foreground',
  info: 'border-primary/25 bg-primary/10 text-foreground',
};

function getDefaultIcon(kind: SystemStateKind) {
  if (kind === 'loading') return Loader2;
  if (kind === 'error') return AlertTriangle;
  return Compass;
}

export function SystemStatePanel({
  kind,
  eyebrow,
  title,
  message,
  icon,
  className,
  compact = false,
  primaryAction,
  secondaryAction,
}: SystemStatePanelProps) {
  const Icon = icon ?? getDefaultIcon(kind);

  return (
    <section
      className={cn(
        'dashboard-card border text-center backdrop-blur-xl',
        KIND_STYLES[kind],
        compact ? 'space-y-3 rounded-[1.6rem] p-4' : 'space-y-5 rounded-[2.5rem] p-8',
        className,
      )}
    >
      <div className="mx-auto flex w-fit items-center justify-center rounded-full border border-white/10 bg-black/20 p-4">
        <Icon className={cn('text-primary', kind === 'loading' && 'animate-spin', compact ? 'h-6 w-6' : 'h-10 w-10')} />
      </div>
      <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
        {eyebrow && (
          <div className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <h2 className={cn('font-black tracking-tight', compact ? 'text-lg' : 'text-3xl')}>{title}</h2>
        <p className={cn('mx-auto max-w-2xl text-muted-foreground', compact ? 'text-sm' : 'text-base')}>{message}</p>
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {primaryAction && (
            <Button onClick={primaryAction.onClick} className={cn('font-black', compact ? 'h-10 rounded-xl text-sm' : 'h-12 rounded-2xl text-base')}>
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              className={cn('border-white/15 bg-white/5 font-black', compact ? 'h-10 rounded-xl text-sm' : 'h-12 rounded-2xl text-base')}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
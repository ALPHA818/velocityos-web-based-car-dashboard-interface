import React from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
import { useOSStore } from '@/store/use-os-store';
import { Ruler, Map, LogOut, Info, Download, CheckCircle, XCircle, Sun, Moon, Sparkles, Navigation, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
export function SettingsPage() {
  const units = useOSStore((s) => s.settings.units);
  const mapProvider = useOSStore((s) => s.settings.mapProvider);
  const mapTheme = useOSStore((s) => s.settings.mapTheme);
  const autoTheme = useOSStore((s) => s.settings.autoTheme);
  const gpsStatus = useOSStore((s) => s.gpsStatus);
  const updateSettings = useOSStore((s) => s.updateSettings);
  const resetSystem = useOSStore((s) => s.resetSystem);
  const isLoading = useOSStore((s) => s.isLoading);
  const { isInstallable, install } = usePWAInstall();
  const handleReset = async () => {
    try {
      await resetSystem();
      toast.success('System reset complete');
    } catch (err) {
      toast.error('Failed to reset system');
    }
  };
  return (
    <CarLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 space-y-12">
        <header>
          <h1 className="text-6xl font-black tracking-tighter">System Settings</h1>
          <p className="text-2xl text-muted-foreground mt-2 font-medium">Configure your VelocityOS experience</p>
        </header>
        <div className="space-y-8">
          <section className="dashboard-card space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Zap className="w-12 h-12 text-primary" />
                <div>
                  <h2 className="text-3xl font-bold">Auto Adaptive UI</h2>
                  <p className="text-lg text-muted-foreground">Switch day/night theme automatically based on time</p>
                </div>
              </div>
              <Switch 
                checked={autoTheme} 
                onCheckedChange={(val) => updateSettings({ autoTheme: val })}
                className="scale-150 mr-4"
              />
            </div>
          </section>
          <section className="dashboard-card space-y-8">
            <div className="flex items-center gap-6">
              <Sparkles className="w-12 h-12 text-primary" />
              <h2 className="text-3xl font-bold">Map Visibility</h2>
            </div>
            <RadioGroup
              value={mapTheme}
              onValueChange={(val) => updateSettings({ mapTheme: val as any })}
              className="grid grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[
                { id: 'light', label: 'Day', icon: Sun },
                { id: 'dark', label: 'Night', icon: Moon },
                { id: 'vibrant', label: 'Vibrant', icon: Sparkles },
                { id: 'highway', label: 'Highway', icon: Navigation },
              ].map((t) => (
                <Label
                  key={t.id}
                  htmlFor={t.id}
                  className={cn(
                    "flex flex-col items-center justify-center h-40 rounded-[2.5rem] border-4 transition-all cursor-pointer gap-4",
                    mapTheme === t.id ? 'border-primary bg-primary/10 shadow-glow' : 'border-white/5 bg-white/5'
                  )}
                >
                  <RadioGroupItem value={t.id} id={t.id} className="sr-only" />
                  <t.icon className={cn("w-12 h-12", mapTheme === t.id ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-xl font-black uppercase tracking-widest">{t.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </section>
          <section className="dashboard-card space-y-8">
            <div className="flex items-center gap-6">
              <Ruler className="w-12 h-12 text-primary" />
              <h2 className="text-3xl font-bold">Units & Standards</h2>
            </div>
            <RadioGroup
              value={units}
              onValueChange={(val) => updateSettings({ units: val as 'mph' | 'kph' })}
              className="grid grid-cols-2 gap-6"
            >
              <Label
                htmlFor="mph"
                className={cn(
                  "flex flex-col items-center justify-center h-28 rounded-3xl border-4 transition-all cursor-pointer",
                  units === 'mph' ? 'border-primary bg-primary/5 shadow-glow' : 'border-white/5 bg-white/5'
                )}
              >
                <RadioGroupItem value="mph" id="mph" className="sr-only" />
                <span className="text-2xl font-black uppercase tracking-widest">Imperial (MPH)</span>
              </Label>
              <Label
                htmlFor="kph"
                className={cn(
                  "flex flex-col items-center justify-center h-28 rounded-3xl border-4 transition-all cursor-pointer",
                  units === 'kph' ? 'border-primary bg-primary/5 shadow-glow' : 'border-white/5 bg-white/5'
                )}
              >
                <RadioGroupItem value="kph" id="kph" className="sr-only" />
                <span className="text-2xl font-black uppercase tracking-widest">Metric (KPH)</span>
              </Label>
            </RadioGroup>
          </section>
          <section className="dashboard-card space-y-8">
            <div className="flex items-center gap-6">
              <Info className="w-12 h-12 text-primary" />
              <h2 className="text-3xl font-bold">Hardware & Status</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/10">
                <span className="text-xl font-bold">GPS Telemetry</span>
                {gpsStatus === 'granted' ? (
                  <div className="flex items-center gap-3 text-green-500 font-black uppercase"><CheckCircle className="w-6 h-6" /> Online</div>
                ) : (
                  <div className="flex items-center gap-3 text-destructive font-black uppercase"><XCircle className="w-6 h-6" /> {gpsStatus === 'denied' ? 'Offline' : 'Searching'}</div>
                )}
              </div>
              <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/10">
                <span className="text-xl font-bold">Stay Awake API</span>
                {'wakeLock' in navigator ? (
                  <div className="flex items-center gap-3 text-green-500 font-black uppercase"><CheckCircle className="w-6 h-6" /> Ready</div>
                ) : (
                  <div className="flex items-center gap-3 text-muted-foreground font-black uppercase"><XCircle className="w-6 h-6" /> Blocked</div>
                )}
              </div>
            </div>
            {isInstallable && (
              <Button onClick={install} className="w-full h-24 rounded-[2rem] text-3xl font-black gap-4 bg-primary shadow-glow-lg">
                <Download className="w-8 h-8" />
                Install VelocityOS Native
              </Button>
            )}
          </section>
          <section className="dashboard-card flex items-center justify-between border-destructive/40 bg-destructive/10 p-10">
            <div className="flex items-center gap-8">
              <div className="p-6 bg-destructive/20 rounded-[2rem]">
                <LogOut className="w-12 h-12 text-destructive" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-destructive">Factory Reset</h2>
                <p className="text-xl text-muted-foreground font-medium">Clear all saved locations, history, and system settings</p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="lg" className="rounded-3xl h-20 px-12 text-2xl font-black" disabled={isLoading}>
                  {isLoading ? "Purging..." : "Reset System"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-zinc-950 border-white/20 text-white rounded-[3rem] p-12 max-w-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-4xl font-black mb-4">Confirm System Reset?</AlertDialogTitle>
                  <AlertDialogDescription className="text-xl text-muted-foreground leading-relaxed">
                    This will permanently erase your preferences, saved destinations, and navigation history. This operation is irreversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-8 gap-4">
                  <AlertDialogCancel className="bg-zinc-900 border-white/10 rounded-2xl h-16 text-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="bg-destructive text-white hover:bg-destructive/90 rounded-2xl h-16 text-xl font-black">
                    Erase All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
        </div>
        <footer className="text-center text-muted-foreground flex flex-col items-center justify-center gap-4 opacity-40 pb-12">
          <div className="flex items-center gap-3">
             <Info className="w-6 h-6" />
             <span className="text-lg uppercase font-black tracking-[0.4em]">VelocityOS Engine v1.1.2 Production</span>
          </div>
          <p className="text-sm font-medium">© 2025 Booster Systems Inc. | Safety First Protocol Active</p>
        </footer>
      </div>
    </CarLayout>
  );
}
import React from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
import { useOSStore } from '@/store/use-os-store';
import { Ruler, Map, LogOut, Info, Download, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { usePWAInstall } from '@/hooks/use-pwa-install';
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
      <div className="max-w-4xl mx-auto space-y-12">
        <header>
          <h1 className="text-4xl font-black tracking-tight">System Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your driving experience</p>
        </header>
        <div className="space-y-6">
          <section className="dashboard-card space-y-6">
            <div className="flex items-center gap-4">
              <Ruler className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">Distance Units</h2>
            </div>
            <RadioGroup
              value={units}
              onValueChange={(val) => updateSettings({ units: val as 'mph' | 'kph' })}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="mph"
                className={`flex flex-col items-center justify-center h-24 rounded-2xl border-2 transition-all cursor-pointer ${units === 'mph' ? 'border-primary bg-primary/5' : 'border-white/5 bg-white/5'}`}
              >
                <RadioGroupItem value="mph" id="mph" className="sr-only" />
                <span className="text-xl font-bold uppercase tracking-widest">Imperial (MPH)</span>
              </Label>
              <Label
                htmlFor="kph"
                className={`flex flex-col items-center justify-center h-24 rounded-2xl border-2 transition-all cursor-pointer ${units === 'kph' ? 'border-primary bg-primary/5' : 'border-white/5 bg-white/5'}`}
              >
                <RadioGroupItem value="kph" id="kph" className="sr-only" />
                <span className="text-xl font-bold uppercase tracking-widest">Metric (KPH)</span>
              </Label>
            </RadioGroup>
          </section>
          <section className="dashboard-card space-y-6">
            <div className="flex items-center gap-4">
              <Map className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">Default Map Provider</h2>
            </div>
            <RadioGroup
              value={mapProvider}
              onValueChange={(val) => updateSettings({ mapProvider: val as 'google' | 'waze' })}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="google"
                className={`flex flex-col items-center justify-center h-24 rounded-2xl border-2 transition-all cursor-pointer ${mapProvider === 'google' ? 'border-primary bg-primary/5' : 'border-white/5 bg-white/5'}`}
              >
                <RadioGroupItem value="google" id="google" className="sr-only" />
                <span className="text-xl font-bold uppercase tracking-widest">Google Maps</span>
              </Label>
              <Label
                htmlFor="waze"
                className={`flex flex-col items-center justify-center h-24 rounded-2xl border-2 transition-all cursor-pointer ${mapProvider === 'waze' ? 'border-primary bg-primary/5' : 'border-white/5 bg-white/5'}`}
              >
                <RadioGroupItem value="waze" id="waze" className="sr-only" />
                <span className="text-xl font-bold uppercase tracking-widest">Waze</span>
              </Label>
            </RadioGroup>
          </section>
          <section className="dashboard-card space-y-6">
            <div className="flex items-center gap-4">
              <Info className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">System Status</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <span className="font-medium">GPS Access</span>
                {gpsStatus === 'granted' ? (
                  <div className="flex items-center gap-2 text-green-500"><CheckCircle className="w-5 h-5" /> Enabled</div>
                ) : (
                  <div className="flex items-center gap-2 text-destructive"><XCircle className="w-5 h-5" /> {gpsStatus === 'denied' ? 'Denied' : 'Checking'}</div>
                )}
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <span className="font-medium">Screen Wake Lock</span>
                {'wakeLock' in navigator ? (
                  <div className="flex items-center gap-2 text-green-500"><CheckCircle className="w-5 h-5" /> Supported</div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground"><XCircle className="w-5 h-5" /> Unavailable</div>
                )}
              </div>
            </div>
            {isInstallable && (
              <Button onClick={install} className="w-full h-16 rounded-2xl text-xl font-bold gap-3 bg-primary shadow-glow">
                <Download className="w-6 h-6" />
                Install Booster App
              </Button>
            )}
          </section>
          <section className="dashboard-card flex items-center justify-between border-destructive/20 bg-destructive/5">
            <div className="flex items-center gap-4">
              <LogOut className="w-8 h-8 text-destructive" />
              <div>
                <h2 className="text-xl font-bold">Reset System</h2>
                <p className="text-sm text-muted-foreground">Erase all saved locations and settings</p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="lg" className="rounded-xl h-14" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Perform Reset"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-zinc-900 border-white/10 text-white rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This action cannot be undone. This will permanently delete your saved locations and reset your preferences to factory defaults.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-zinc-800 border-white/5 rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
                    Reset Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
        </div>
        <footer className="text-center text-muted-foreground flex items-center justify-center gap-2 opacity-50 pb-8">
          <Info className="w-4 h-4" />
          <span className="text-xs uppercase tracking-widest">VelocityOS v1.0.0 Stable</span>
        </footer>
      </div>
    </CarLayout>
  );
}
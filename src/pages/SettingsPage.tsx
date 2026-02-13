import React from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
import { useOSStore } from '@/store/use-os-store';
import { Settings, Ruler, Map, LogOut, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
export function SettingsPage() {
  const settings = useOSStore((s) => s.settings);
  const updateSettings = useOSStore((s) => s.updateSettings);
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
              value={settings.units} 
              onValueChange={(val) => updateSettings({ units: val as 'mph' | 'kph' })}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="mph"
                className={`flex flex-col items-center justify-center h-24 rounded-2xl border-2 transition-all cursor-pointer ${settings.units === 'mph' ? 'border-primary bg-primary/5' : 'border-white/5 bg-white/5'}`}
              >
                <RadioGroupItem value="mph" id="mph" className="sr-only" />
                <span className="text-xl font-bold uppercase tracking-widest">Imperial (MPH)</span>
              </Label>
              <Label
                htmlFor="kph"
                className={`flex flex-col items-center justify-center h-24 rounded-2xl border-2 transition-all cursor-pointer ${settings.units === 'kph' ? 'border-primary bg-primary/5' : 'border-white/5 bg-white/5'}`}
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
              value={settings.mapProvider} 
              onValueChange={(val) => updateSettings({ mapProvider: val as 'google' | 'waze' })}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="google"
                className={`flex flex-col items-center justify-center h-24 rounded-2xl border-2 transition-all cursor-pointer ${settings.mapProvider === 'google' ? 'border-primary bg-primary/5' : 'border-white/5 bg-white/5'}`}
              >
                <RadioGroupItem value="google" id="google" className="sr-only" />
                <span className="text-xl font-bold uppercase tracking-widest">Google Maps</span>
              </Label>
              <Label
                htmlFor="waze"
                className={`flex flex-col items-center justify-center h-24 rounded-2xl border-2 transition-all cursor-pointer ${settings.mapProvider === 'waze' ? 'border-primary bg-primary/5' : 'border-white/5 bg-white/5'}`}
              >
                <RadioGroupItem value="waze" id="waze" className="sr-only" />
                <span className="text-xl font-bold uppercase tracking-widest">Waze</span>
              </Label>
            </RadioGroup>
          </section>
          <section className="dashboard-card flex items-center justify-between border-destructive/20 bg-destructive/5">
            <div className="flex items-center gap-4">
              <LogOut className="w-8 h-8 text-destructive" />
              <div>
                <h2 className="text-xl font-bold">Reset System</h2>
                <p className="text-sm text-muted-foreground">Erase all saved locations and settings</p>
              </div>
            </div>
            <Button variant="destructive" size="lg" className="rounded-xl h-14">Perform Reset</Button>
          </section>
        </div>
        <footer className="text-center text-muted-foreground flex items-center justify-center gap-2 opacity-50">
          <Info className="w-4 h-4" />
          <span className="text-xs uppercase tracking-widest">VelocityOS v1.0.0 Stable</span>
        </footer>
      </div>
    </CarLayout>
  );
}
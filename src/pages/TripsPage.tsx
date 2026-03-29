import React from 'react';
import { CarLayout } from '@/components/layout/CarLayout';
import { useOSStore } from '@/store/use-os-store';
import { cn } from '@/lib/utils';
import { useIsLandscapeMobile } from '@/hooks/use-landscape-mobile';

export default function TripsPage() {
  const trips = useOSStore((s) => s.trips || []);
  const isLandscapeMobile = useIsLandscapeMobile();

  return (
    <CarLayout>
      <div className={cn('max-w-7xl mx-auto', isLandscapeMobile ? 'px-2 py-2 space-y-3' : 'px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6')}>
        <header className="space-y-1">
          <h1 className={cn('font-black tracking-tighter', isLandscapeMobile ? 'text-2xl' : 'text-5xl')}>Trips</h1>
          <p className={cn('text-muted-foreground', isLandscapeMobile ? 'text-xs' : 'text-lg')}>A new trip is created each time driving starts</p>
        </header>

        {trips.length === 0 ? (
          <div className="dashboard-card text-muted-foreground">No trips recorded yet.</div>
        ) : (
          <ul className={cn('grid', isLandscapeMobile ? 'grid-cols-1 gap-2' : 'grid-cols-1 md:grid-cols-2 gap-4')}>
            {trips
              .slice()
              .reverse()
              .map((trip, i) => {
                const durationMs = trip.endTime ? trip.endTime - trip.startTime : Date.now() - trip.startTime;
                const durationMin = Math.max(0, Math.round(durationMs / 60000));

                return (
                  <li key={`${trip.startTime}-${i}`} className="dashboard-card border border-white/10">
                    <div className="font-bold">Trip {trips.length - i}</div>
                    <div className="mt-2 text-xs text-muted-foreground">Start: {new Date(trip.startTime).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">End: {trip.endTime ? new Date(trip.endTime).toLocaleString() : 'Ongoing'}</div>
                    <div className="mt-2 text-sm font-semibold tabular-nums">Distance: {(trip.distanceKm || 0).toFixed(2)} km</div>
                    <div className="text-xs text-muted-foreground">Duration: {durationMin} min</div>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </CarLayout>
  );
}

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
export function DigitalClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-7xl md:text-8xl font-bold tracking-tighter tabular-nums text-foreground">
        {format(time, 'HH:mm')}
      </div>
      <div className="text-xl md:text-2xl text-muted-foreground font-medium mt-2">
        {format(time, 'EEEE, MMMM do')}
      </div>
    </div>
  );
}
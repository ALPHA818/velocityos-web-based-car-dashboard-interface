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
      <div className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter tabular-nums text-foreground leading-none">
        {format(time, 'HH:mm')}
      </div>
      <div className="text-sm sm:text-lg md:text-xl lg:text-2xl text-muted-foreground font-medium mt-1.5 md:mt-2 text-center px-2">
        {format(time, 'EEEE, MMMM do')}
      </div>
    </div>
  );
}
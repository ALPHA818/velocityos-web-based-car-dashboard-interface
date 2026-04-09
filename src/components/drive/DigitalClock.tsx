import React, { useState, useEffect } from 'react';

interface ClockLabels {
  time: string;
  date: string;
}

const TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

function getClockLabels(date = new Date()): ClockLabels {
  return {
    time: TIME_FORMATTER.format(date),
    date: DATE_FORMATTER.format(date),
  };
}

function getMillisecondsUntilNextMinute() {
  const now = new Date();
  const millisecondsUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
  return millisecondsUntilNextMinute > 0 ? millisecondsUntilNextMinute : 60000;
}

export function DigitalClock() {
  const [labels, setLabels] = useState<ClockLabels>(() => getClockLabels());

  useEffect(() => {
    let intervalId: number | undefined;
    const updateClock = () => setLabels(getClockLabels());

    updateClock();

    const timeoutId = window.setTimeout(() => {
      updateClock();
      intervalId = window.setInterval(updateClock, 60000);
    }, getMillisecondsUntilNextMinute());

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter tabular-nums text-foreground leading-none">
        {labels.time}
      </div>
      <div className="text-sm sm:text-lg md:text-xl lg:text-2xl text-muted-foreground font-medium mt-1.5 md:mt-2 text-center px-2">
        {labels.date}
      </div>
    </div>
  );
}
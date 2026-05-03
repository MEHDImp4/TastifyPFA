import React, { useState, useEffect } from 'react';

interface KdsTimerProps {
  startTime: string;
}

export const KdsTimer: React.FC<KdsTimerProps> = ({ startTime }) => {
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    const calculate = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      setDiff(Math.floor((now - start) / 1000));
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const isFuture = diff < 0;
  const absDiff = Math.abs(diff);
  const minutes = Math.floor(absDiff / 60);
  const seconds = absDiff % 60;

  let colorClass = 'text-teal';
  let pulseClass = '';

  if (isFuture) {
    colorClass = 'text-slate-500';
  } else {
    if (minutes >= 20) {
      colorClass = 'text-error';
      pulseClass = 'animate-pulse';
    } else if (minutes >= 10) {
      colorClass = 'text-amber';
    }
  }

  return (
    <div
      data-testid="kds-timer"
      className={`font-mono text-xl font-bold tabular-nums tracking-tighter ${colorClass} ${pulseClass}`}
    >
      {isFuture && <span className="mr-1 text-[10px] opacity-50 uppercase font-sans tracking-normal">In </span>}
      {minutes}<span className="opacity-70">:</span>{seconds.toString().padStart(2, '0')}
    </div>
  );
};

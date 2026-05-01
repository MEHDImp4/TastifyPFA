import React, { useState, useEffect } from 'react';

interface KdsTimerProps {
  startTime: string;
}

export const KdsTimer: React.FC<KdsTimerProps> = ({ startTime }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const calculate = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      setElapsed(Math.max(0, Math.floor((now - start) / 1000)));
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  let colorClass = 'text-teal';
  let pulseClass = '';

  if (minutes >= 20) {
    colorClass = 'text-red';
    pulseClass = 'animate-pulse';
  } else if (minutes >= 10) {
    colorClass = 'text-amber';
  }

  return (
    <div 
      data-testid="kds-timer"
      className={`font-mono text-xl font-black tabular-nums ${colorClass} ${pulseClass}`}
    >
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};

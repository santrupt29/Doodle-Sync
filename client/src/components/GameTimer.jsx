import { useState, useEffect, useRef } from 'react';

export default function GameTimer({ drawTimeSeconds, drawStartedAt }) {
  const [remaining, setRemaining] = useState(drawTimeSeconds || 0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!drawTimeSeconds || !drawStartedAt) {
      setRemaining(drawTimeSeconds || 0);
      return;
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - drawStartedAt) / 1000);
      const left = Math.max(0, drawTimeSeconds - elapsed);
      setRemaining(left);
      if (left <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [drawTimeSeconds, drawStartedAt]);

  const isUrgent = remaining > 0 && remaining <= 10;

  return (
    <div
      className={`
        inline-flex items-center justify-center
        w-12 h-12 rounded-full border-3
        font-extrabold text-sm
        ${isUrgent
          ? 'border-red-500 text-red-600 bg-red-50 animate-pulse'
          : 'border-black text-black bg-white'}
      `}
      style={{ borderWidth: '3px' }}
    >
      {remaining}s
    </div>
  );
}

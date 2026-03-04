// /home/user/matthorg/src/components/dashboard/LiveClock.tsx
'use client';

import { useState, useEffect, memo } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

interface LiveClockProps {
  showIcon?: boolean;
  showSeconds?: boolean;
  showDate?: boolean;
  format?: '12h' | '24h';
  className?: string;
}

function LiveClock({ 
  showIcon = true, 
  showSeconds = true, 
  showDate = false,
  format = '12h',
  className = ''
}: LiveClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    let options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };
    
    if (showSeconds) {
      options.second = '2-digit';
    }
    
    if (format === '12h') {
      options.hour12 = true;
    } else {
      options.hour12 = false;
    }
    
    return time.toLocaleTimeString(undefined, options);
  };

  const formatDate = () => {
    return time.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`flex items-center ${className}`}>
      {showIcon && <ClockIcon className="w-4 h-4 mr-1 text-gray-500" />}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
        <span className="text-sm font-medium text-gray-700 tabular-nums">
          {formatTime()}
        </span>
        {showDate && (
          <>
            <span className="hidden sm:inline text-gray-300">•</span>
            <span className="text-xs text-gray-500">
              {formatDate()}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// Simple version (no changes needed)
export const SimpleClock = memo(LiveClock);

// Enhanced version with date
export const FullClock = memo((props: Partial<LiveClockProps>) => (
  <LiveClock showDate={true} showSeconds={true} {...props} />
));

// Minimal version (just time)
export const MinimalClock = memo((props: Partial<LiveClockProps>) => (
  <LiveClock showIcon={false} showSeconds={false} {...props} />
));

export default memo(LiveClock);
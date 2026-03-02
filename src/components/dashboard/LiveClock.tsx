// /home/user/matthorg/src/components/dashboard/LiveClock.tsx
'use client';

import { useState, useEffect, memo } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="text-sm text-gray-600 flex items-center">
      <ClockIcon className="w-4 h-4 mr-1" />
      {time.toLocaleTimeString()}
    </span>
  );
}

export default memo(LiveClock);
// /home/user/matthorg/src/hooks/useRealtime.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeConfig = {
  table: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  filter?: string;
};

type RealtimePayload<T = any> = {
  new: T;
  old: T;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
};

export function useRealtime<T>(
  config: RealtimeConfig,
  initialData: T[] = [],
  callback?: (payload: RealtimePayload<T>) => void
) {
  const [data, setData] = useState<T[]>(initialData);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel;

    const setupRealtime = () => {
      channel = supabase
        .channel(`${config.table}-changes`)
        .on(
          'postgres_changes',
          {
            event: config.event || '*',
            schema: 'public',
            table: config.table,
            filter: config.filter,
          },
          (payload: any) => {
            console.log(`🔴 Live update from ${config.table}:`, payload);
            setLastUpdate(new Date());
            
            setData((currentData) => {
              switch (payload.eventType) {
                case 'INSERT':
                  return [payload.new, ...currentData];
                case 'UPDATE':
                  return currentData.map((item: any) =>
                    item.id === payload.new.id ? { ...item, ...payload.new } : item
                  );
                case 'DELETE':
                  return currentData.filter((item: any) => item.id !== payload.old.id);
                default:
                  return currentData;
              }
            });
            
            if (callback) callback(payload);
          }
        )
        .subscribe((status) => {
          setIsLive(status === 'SUBSCRIBED');
        });
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [config.table, config.event, config.filter]);

  return { data, setData, isLive, lastUpdate };
}
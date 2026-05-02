import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type DailyReadiness from '@/db/models/DailyReadiness';

export function useDailyReadiness(): DailyReadiness[] {
  const [entries, setEntries] = useState<DailyReadiness[]>([]);

  useEffect(() => {
    const sub = database
      .get<DailyReadiness>('daily_readiness')
      .query(Q.sortBy('recorded_at', Q.desc))
      .observe()
      .subscribe(setEntries);
    return () => sub.unsubscribe();
  }, []);

  return entries;
}

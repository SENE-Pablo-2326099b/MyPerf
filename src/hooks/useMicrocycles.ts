import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import Microcycle from '@/db/models/Microcycle';

export function useMicrocycles(mesocycleId: string | undefined): Microcycle[] {
  const [microcycles, setMicrocycles] = useState<Microcycle[]>([]);

  useEffect(() => {
    if (!mesocycleId) {
      setMicrocycles([]);
      return;
    }
    const sub = database
      .get<Microcycle>('microcycles')
      .query(Q.where('mesocycle_id', mesocycleId), Q.sortBy('week_number', Q.asc))
      .observe()
      .subscribe(setMicrocycles);
    return () => sub.unsubscribe();
  }, [mesocycleId]);

  return microcycles;
}

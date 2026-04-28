import { useEffect, useState } from 'react';
import { database } from '@/db/database';
import { Q } from '@nozbe/watermelondb';
import Mesocycle, { getMesocycleStatus } from '@/db/models/Mesocycle';

export function useMesocycles(): Mesocycle[] {
  const [mesocycles, setMesocycles] = useState<Mesocycle[]>([]);

  useEffect(() => {
    const sub = database
      .get<Mesocycle>('mesocycles')
      .query(Q.sortBy('start_date', Q.asc))
      .observe()
      .subscribe(setMesocycles);
    return () => sub.unsubscribe();
  }, []);

  return mesocycles;
}

export function useActiveMesocycle(): Mesocycle | null {
  const all = useMesocycles();
  return all.find(m => getMesocycleStatus(m) === 'active') ?? null;
}

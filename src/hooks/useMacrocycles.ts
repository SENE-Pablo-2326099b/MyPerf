import { useEffect, useState } from 'react';
import { database } from '@/db/database';
import { Q } from '@nozbe/watermelondb';
import Macrocycle from '@/db/models/Macrocycle';

export function useMacrocycles(): Macrocycle[] {
  const [macrocycles, setMacrocycles] = useState<Macrocycle[]>([]);

  useEffect(() => {
    const sub = database
      .get<Macrocycle>('macrocycles')
      .query(Q.sortBy('start_date', Q.desc))
      .observe()
      .subscribe(setMacrocycles);
    return () => sub.unsubscribe();
  }, []);

  return macrocycles;
}

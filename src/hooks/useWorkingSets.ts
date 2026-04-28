import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type WorkingSet from '@/db/models/WorkingSet';

export function useWorkingSets(instanceId: string | null): WorkingSet[] {
  const [sets, setSets] = useState<WorkingSet[]>([]);

  useEffect(() => {
    if (!instanceId) {
      setSets([]);
      return;
    }
    const sub = database
      .get<WorkingSet>('working_sets')
      .query(
        Q.where('exercise_instance_id', instanceId),
        Q.sortBy('set_number', Q.asc),
      )
      .observe()
      .subscribe(setSets);
    return () => sub.unsubscribe();
  }, [instanceId]);

  return sets;
}

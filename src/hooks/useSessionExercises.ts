import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type ExerciseInstance from '@/db/models/ExerciseInstance';

export function useSessionExercises(sessionId: string | null): ExerciseInstance[] {
  const [instances, setInstances] = useState<ExerciseInstance[]>([]);

  useEffect(() => {
    if (!sessionId) {
      setInstances([]);
      return;
    }
    const sub = database
      .get<ExerciseInstance>('exercise_instances')
      .query(Q.where('session_id', sessionId), Q.sortBy('order', Q.asc))
      .observe()
      .subscribe(setInstances);
    return () => sub.unsubscribe();
  }, [sessionId]);

  return instances;
}

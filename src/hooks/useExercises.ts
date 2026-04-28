import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type Exercise from '@/db/models/Exercise';

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    const sub = database
      .get<Exercise>('exercises')
      .query(Q.sortBy('name', Q.asc))
      .observe()
      .subscribe(setExercises);
    return () => sub.unsubscribe();
  }, []);

  return exercises;
}

import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type WorkoutTemplate from '@/db/models/WorkoutTemplate';

export function useWorkoutTemplates(): WorkoutTemplate[] {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

  useEffect(() => {
    const sub = database
      .get<WorkoutTemplate>('workout_templates')
      .query(Q.sortBy('name', Q.asc))
      .observe()
      .subscribe(setTemplates);
    return () => sub.unsubscribe();
  }, []);

  return templates;
}

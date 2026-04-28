import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type Session from '@/db/models/Session';
import type ExerciseInstance from '@/db/models/ExerciseInstance';
import type Exercise from '@/db/models/Exercise';

// Returns completed working sets count per primaryMuscleGroup over the last 7 days.
export function useWeeklyVolume(): Record<string, number> {
  const [volume, setVolume] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;

    (async () => {
      const sessions = await database
        .get<Session>('sessions')
        .query(
          Q.where('ended_at', Q.notEq(null)),
          Q.where('started_at', Q.gte(sevenDaysAgo)),
        )
        .fetch();

      const vol: Record<string, number> = {};

      for (const session of sessions) {
        const instances = await database
          .get<ExerciseInstance>('exercise_instances')
          .query(Q.where('session_id', session.id))
          .fetch();

        for (const inst of instances) {
          const ex = await inst.exercise.fetch() as Exercise | null;
          if (!ex) continue;

          const setCount = await database
            .get('working_sets')
            .query(
              Q.where('exercise_instance_id', inst.id),
              Q.where('completed', true),
              Q.where('set_type', Q.notEq('warmup')),
            )
            .fetchCount();

          const g = ex.primaryMuscleGroup;
          vol[g] = (vol[g] ?? 0) + setCount;
        }
      }

      if (alive) setVolume(vol);
    })();

    return () => { alive = false; };
  }, []);

  return volume;
}

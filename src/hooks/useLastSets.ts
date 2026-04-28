import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type ExerciseInstance from '@/db/models/ExerciseInstance';
import type WorkingSet from '@/db/models/WorkingSet';
import type Session from '@/db/models/Session';

export interface GhostSet {
  weight: number;
  reps: number | null;
}

// Returns the working sets from the last completed session where this exercise appeared.
export function useLastSets(
  exerciseId: string | undefined,
  currentSessionId: string,
): GhostSet[] {
  const [sets, setSets] = useState<GhostSet[]>([]);

  useEffect(() => {
    if (!exerciseId) return;
    let alive = true;

    (async () => {
      const instances = await database
        .get<ExerciseInstance>('exercise_instances')
        .query(
          Q.where('exercise_id', exerciseId),
          Q.where('session_id', Q.notEq(currentSessionId)),
          Q.on('sessions', 'ended_at', Q.notEq(null)),
        )
        .fetch();

      if (instances.length === 0) {
        if (alive) setSets([]);
        return;
      }

      // Identify the most recent of those sessions
      const withTime = await Promise.all(
        instances.map(async inst => {
          const s = await inst.session.fetch() as Session | null;
          return { inst, time: s?.startedAt.getTime() ?? 0 };
        }),
      );
      withTime.sort((a, b) => b.time - a.time);
      const latest = withTime[0].inst;

      const workingSets = await database
        .get<WorkingSet>('working_sets')
        .query(
          Q.where('exercise_instance_id', latest.id),
          Q.sortBy('set_number', Q.asc),
        )
        .fetch();

      if (alive) {
        setSets(workingSets.map(s => ({ weight: s.weight, reps: s.reps })));
      }
    })();

    return () => { alive = false; };
  }, [exerciseId, currentSessionId]);

  return sets;
}

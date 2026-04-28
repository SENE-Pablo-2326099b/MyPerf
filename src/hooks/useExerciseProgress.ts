import { useEffect, useState } from 'react';
import { database } from '@/db/database';
import { Q } from '@nozbe/watermelondb';
import type ExerciseInstance from '@/db/models/ExerciseInstance';
import type Session from '@/db/models/Session';
import type WorkingSet from '@/db/models/WorkingSet';

export interface ProgressPoint {
  date: Date;
  maxWeight: number;
  maxE1RM: number;
  totalVolume: number;
}

export function useExerciseProgress(exerciseId: string | undefined): {
  points: ProgressPoint[];
  loading: boolean;
} {
  const [points, setPoints] = useState<ProgressPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!exerciseId) { setLoading(false); return; }
    let alive = true;

    (async () => {
      const instances = await database
        .get<ExerciseInstance>('exercise_instances')
        .query(Q.where('exercise_id', exerciseId))
        .fetch();

      const result: ProgressPoint[] = [];

      for (const inst of instances) {
        const session = await inst.session.fetch() as Session | null;
        if (!session?.endedAt) continue;

        const sets = await database
          .get<WorkingSet>('working_sets')
          .query(
            Q.where('exercise_instance_id', inst.id),
            Q.where('set_type', Q.notEq('warmup')),
            Q.where('completed', true),
          )
          .fetch();

        if (sets.length === 0) continue;

        const maxWeight = Math.max(...sets.map(s => s.weight));
        const maxE1RM = sets.reduce((max, s) => {
          if (!s.reps || s.reps < 1 || s.reps > 36) return max;
          return Math.max(max, s.weight * (1 + s.reps / 30));
        }, 0);
        const totalVolume = sets.reduce((sum, s) => sum + s.weight * (s.reps ?? 0), 0);

        result.push({ date: session.startedAt, maxWeight, maxE1RM, totalVolume });
      }

      result.sort((a, b) => a.date.getTime() - b.date.getTime());

      if (alive) { setPoints(result); setLoading(false); }
    })();

    return () => { alive = false; };
  }, [exerciseId]);

  return { points, loading };
}

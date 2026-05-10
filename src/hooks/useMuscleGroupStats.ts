import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type Session from '@/db/models/Session';
import type ExerciseInstance from '@/db/models/ExerciseInstance';
import type Exercise from '@/db/models/Exercise';
import type WorkingSet from '@/db/models/WorkingSet';

export interface MuscleGroupStats {
  sets: number;
  tonnage: number;
  avgWeight: number;
  avgReps: number;
  maxWeight: number;
  exerciseCount: number;
  sessionCount: number;
  topExercise: string | null;
}

export function useMuscleGroupStats(): Record<string, MuscleGroupStats> {
  const [stats, setStats] = useState<Record<string, MuscleGroupStats>>({});

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

      const acc: Record<string, {
        sets: number; tonnage: number; weights: number[]; repsList: number[];
        exercises: Map<string, number>; sessionIds: Set<string>;
      }> = {};

      for (const session of sessions) {
        const instances = await database
          .get<ExerciseInstance>('exercise_instances')
          .query(Q.where('session_id', session.id))
          .fetch();

        for (const inst of instances) {
          const ex = await inst.exercise.fetch() as Exercise | null;
          if (!ex) continue;
          const group = ex.primaryMuscleGroup;

          const sets = await database
            .get<WorkingSet>('working_sets')
            .query(
              Q.where('exercise_instance_id', inst.id),
              Q.where('completed', true),
              Q.where('set_type', Q.notEq('warmup')),
            )
            .fetch();

          if (sets.length === 0) continue;

          if (!acc[group]) {
            acc[group] = {
              sets: 0, tonnage: 0, weights: [], repsList: [],
              exercises: new Map(), sessionIds: new Set(),
            };
          }

          const g = acc[group];
          g.sessionIds.add(session.id);
          g.exercises.set(ex.name, (g.exercises.get(ex.name) ?? 0) + sets.length);

          for (const s of sets) {
            g.sets += 1;
            const w = s.weight ?? 0;
            const r = s.reps ?? 0;
            g.tonnage += w * r;
            if (w > 0) g.weights.push(w);
            if (r > 0) g.repsList.push(r);
          }
        }
      }

      const result: Record<string, MuscleGroupStats> = {};
      for (const [group, g] of Object.entries(acc)) {
        const avgWeight = g.weights.length
          ? g.weights.reduce((a, b) => a + b, 0) / g.weights.length
          : 0;
        const avgReps = g.repsList.length
          ? g.repsList.reduce((a, b) => a + b, 0) / g.repsList.length
          : 0;
        const maxWeight = g.weights.length ? Math.max(...g.weights) : 0;
        const topExercise = g.exercises.size
          ? [...g.exercises.entries()].sort((a, b) => b[1] - a[1])[0][0]
          : null;

        result[group] = {
          sets: g.sets,
          tonnage: Math.round(g.tonnage),
          avgWeight: Math.round(avgWeight * 10) / 10,
          avgReps: Math.round(avgReps * 10) / 10,
          maxWeight,
          exerciseCount: g.exercises.size,
          sessionCount: g.sessionIds.size,
          topExercise,
        };
      }

      if (alive) setStats(result);
    })();

    return () => { alive = false; };
  }, []);

  return stats;
}

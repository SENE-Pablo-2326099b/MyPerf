import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type Session from '@/db/models/Session';
import type ExerciseInstance from '@/db/models/ExerciseInstance';
import type Exercise from '@/db/models/Exercise';

export const FREQ_GROUPS = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core'] as const;
export type FreqGroup = (typeof FREQ_GROUPS)[number];

// 4-week rolling window, index 0 = oldest (3 weeks ago), index 3 = current week
export type FrequencyData = Record<FreqGroup, [number, number, number, number]>;

export function useMonthlyFrequency(): FrequencyData {
  const [data, setData] = useState<FrequencyData>(() =>
    Object.fromEntries(FREQ_GROUPS.map(g => [g, [0, 0, 0, 0]])) as FrequencyData,
  );

  useEffect(() => {
    let alive = true;
    const now = Date.now();
    const windowStart = now - 28 * 24 * 3600 * 1000;

    const weekBoundary = (weeksAgo: number) => now - weeksAgo * 7 * 24 * 3600 * 1000;

    // week index 0 = oldest (started_at in [now-28d, now-21d])
    function weekIndex(ts: number): number {
      if (ts >= weekBoundary(1)) return 3;
      if (ts >= weekBoundary(2)) return 2;
      if (ts >= weekBoundary(3)) return 1;
      return 0;
    }

    (async () => {
      const sessions = await database
        .get<Session>('sessions')
        .query(
          Q.where('ended_at', Q.notEq(null)),
          Q.where('started_at', Q.gte(windowStart)),
        )
        .fetch();

      // group -> week -> set of session ids (to count unique sessions, not sets)
      const counts: Record<string, Set<string>[]> = {};
      for (const g of FREQ_GROUPS) counts[g] = [new Set(), new Set(), new Set(), new Set()];

      for (const session of sessions) {
        const wi = weekIndex(session.startedAt.getTime());

        const instances = await database
          .get<ExerciseInstance>('exercise_instances')
          .query(Q.where('session_id', session.id))
          .fetch();

        for (const inst of instances) {
          const ex = await inst.exercise.fetch() as Exercise | null;
          if (!ex) continue;
          const g = ex.primaryMuscleGroup as FreqGroup;
          if (counts[g]) counts[g][wi].add(session.id);
        }
      }

      if (!alive) return;
      setData(
        Object.fromEntries(
          FREQ_GROUPS.map(g => [g, counts[g].map(s => s.size) as [number, number, number, number]]),
        ) as FrequencyData,
      );
    })();

    return () => { alive = false; };
  }, []);

  return data;
}

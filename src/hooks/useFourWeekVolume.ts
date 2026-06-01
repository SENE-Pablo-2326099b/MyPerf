import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import { FREQ_GROUPS, type FreqGroup } from './useMonthlyFrequency';
import type Session from '@/db/models/Session';
import type ExerciseInstance from '@/db/models/ExerciseInstance';
import type Exercise from '@/db/models/Exercise';

// Working sets per muscle group per week, 4-week rolling window (index 0 = oldest)
export type FourWeekVolume = Record<FreqGroup, [number, number, number, number]>;

export function useFourWeekVolume(): FourWeekVolume {
  const [data, setData] = useState<FourWeekVolume>(() =>
    Object.fromEntries(FREQ_GROUPS.map(g => [g, [0, 0, 0, 0]])) as FourWeekVolume,
  );
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const sub = database
      .get<Session>('sessions')
      .query(Q.where('ended_at', Q.notEq(null)))
      .observe()
      .subscribe(() => setTick(t => t + 1));
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    let alive = true;
    const now = Date.now();
    const windowStart = now - 28 * 24 * 3600 * 1000;
    const weekBoundary = (weeksAgo: number) => now - weeksAgo * 7 * 24 * 3600 * 1000;

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

      const counts: Record<string, [number, number, number, number]> = {};
      for (const g of FREQ_GROUPS) counts[g] = [0, 0, 0, 0];

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
          if (!counts[g]) continue;
          const setCount = await database
            .get('working_sets')
            .query(
              Q.where('exercise_instance_id', inst.id),
              Q.where('completed', true),
              Q.where('set_type', Q.notEq('warmup')),
            )
            .fetchCount();
          counts[g][wi] += setCount;
        }
      }

      if (!alive) return;
      setData(Object.fromEntries(
        FREQ_GROUPS.map(g => [g, counts[g]]),
      ) as FourWeekVolume);
    })();

    return () => { alive = false; };
  }, [tick]);

  return data;
}

import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type Session from '@/db/models/Session';
import type ExerciseInstance from '@/db/models/ExerciseInstance';

interface TrainingLoad {
  acuteLoad: number;
  chronicLoad: number;
  ratio: number | null;
}

async function countCompletedWorkingSets(sessionIds: string[]): Promise<number> {
  if (sessionIds.length === 0) return 0;
  let total = 0;
  for (const sid of sessionIds) {
    const instances = await database
      .get<ExerciseInstance>('exercise_instances')
      .query(Q.where('session_id', sid))
      .fetch();
    for (const inst of instances) {
      const count = await database
        .get('working_sets')
        .query(
          Q.where('exercise_instance_id', inst.id),
          Q.where('completed', true),
          Q.where('set_type', 'working'),
        )
        .fetchCount();
      total += count;
    }
  }
  return total;
}

export function useTrainingLoad(): TrainingLoad {
  const [load, setLoad] = useState<TrainingLoad>({ acuteLoad: 0, chronicLoad: 0, ratio: null });

  useEffect(() => {
    let alive = true;
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 3600 * 1000;
    const twentyEightDaysAgo = now - 28 * 24 * 3600 * 1000;

    (async () => {
      // Sessions des 28 derniers jours (terminées)
      const chronicSessions = await database
        .get<Session>('sessions')
        .query(
          Q.where('ended_at', Q.notEq(null)),
          Q.where('started_at', Q.gte(twentyEightDaysAgo)),
        )
        .fetch();

      const acuteSessions = chronicSessions.filter(
        s => s.startedAt.getTime() >= sevenDaysAgo,
      );

      const acuteSessionIds = acuteSessions.map(s => s.id);
      const chronicSessionIds = chronicSessions.map(s => s.id);

      const acuteLoad = await countCompletedWorkingSets(acuteSessionIds);
      const totalChronic = await countCompletedWorkingSets(chronicSessionIds);
      const chronicLoad = totalChronic / 4;
      const ratio = chronicLoad > 0 ? acuteLoad / chronicLoad : null;

      if (alive) setLoad({ acuteLoad, chronicLoad, ratio });
    })();

    return () => { alive = false; };
  }, []);

  return load;
}

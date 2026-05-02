import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type Session from '@/db/models/Session';
import type ExerciseInstance from '@/db/models/ExerciseInstance';
import type Exercise from '@/db/models/Exercise';
import type WorkingSet from '@/db/models/WorkingSet';

export interface PR {
  exerciseId: string;
  exerciseName: string;
  maxWeight: number;
  maxE1RM: number;
  lastDate: Date;
  sessionCount: number;
}

export function usePRs(): PR[] {
  const [prs, setPrs] = useState<PR[]>([]);
  const [tick, setTick] = useState(0);

  // Abonnement réactif : se déclenche quand une séance est ajoutée/terminée
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

    (async () => {
      const sessions = await database
        .get<Session>('sessions')
        .query(Q.where('ended_at', Q.notEq(null)))
        .fetch();

      const map = new Map<string, {
        name: string;
        maxWeight: number;
        maxE1RM: number;
        lastDate: Date;
        sessionIds: Set<string>;
      }>();

      for (const session of sessions) {
        const instances = await database
          .get<ExerciseInstance>('exercise_instances')
          .query(Q.where('session_id', session.id))
          .fetch();

        for (const inst of instances) {
          const ex = await inst.exercise.fetch() as Exercise | null;
          if (!ex) continue;

          const workingSets = await database
            .get<WorkingSet>('working_sets')
            .query(
              Q.where('exercise_instance_id', inst.id),
              Q.where('set_type', 'working'),
              Q.where('completed', true),
            )
            .fetch();

          if (workingSets.length === 0) continue;

          const entry = map.get(ex.id) ?? {
            name: ex.name,
            maxWeight: 0,
            maxE1RM: 0,
            lastDate: session.startedAt,
            sessionIds: new Set<string>(),
          };

          entry.sessionIds.add(inst.session.id);
          if (session.startedAt > entry.lastDate) entry.lastDate = session.startedAt;

          for (const ws of workingSets) {
            if (ws.weight > entry.maxWeight) entry.maxWeight = ws.weight;
            if (ws.reps != null && ws.reps >= 1 && ws.reps <= 36) {
              const e1rm = ws.weight * (1 + ws.reps / 30);
              if (e1rm > entry.maxE1RM) entry.maxE1RM = e1rm;
            }
          }

          map.set(ex.id, entry);
        }
      }

      if (!alive) return;

      const result: PR[] = Array.from(map.entries()).map(([exerciseId, entry]) => ({
        exerciseId,
        exerciseName: entry.name,
        maxWeight: entry.maxWeight,
        maxE1RM: entry.maxE1RM,
        lastDate: entry.lastDate,
        sessionCount: entry.sessionIds.size,
      }));

      result.sort((a, b) => b.maxE1RM - a.maxE1RM);
      setPrs(result);
    })();

    return () => { alive = false; };
  }, [tick]);

  return prs;
}

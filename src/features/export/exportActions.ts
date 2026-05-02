import { Share } from 'react-native';
import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type Session from '@/db/models/Session';
import type ExerciseInstance from '@/db/models/ExerciseInstance';
import type WorkingSet from '@/db/models/WorkingSet';
import type BodyMetric from '@/db/models/BodyMetric';
import type DailyReadiness from '@/db/models/DailyReadiness';

function fmtTempo(e: number, pb: number, c: number, pt: number): string | null {
  if (e === 0 && pb === 0 && c === 0 && pt === 0) return null;
  return `${e}-${pb}-${c === -1 ? 'X' : c}-${pt}`;
}

export async function exportAllData(): Promise<void> {
  const [sessions, bodyMetrics, readiness] = await Promise.all([
    database.get<Session>('sessions').query(Q.sortBy('started_at', Q.desc)).fetch(),
    database.get<BodyMetric>('body_metrics').query(Q.sortBy('recorded_at', Q.desc)).fetch(),
    database.get<DailyReadiness>('daily_readiness').query(Q.sortBy('recorded_at', Q.desc)).fetch(),
  ]);

  const sessionData = await Promise.all(
    sessions.map(async s => {
      const instances = await database
        .get<ExerciseInstance>('exercise_instances')
        .query(Q.where('session_id', s.id), Q.sortBy('order', Q.asc))
        .fetch();

      const exercises = await Promise.all(
        instances.map(async inst => {
          const ex = await inst.exercise.fetch();
          const sets = await database
            .get<WorkingSet>('working_sets')
            .query(Q.where('exercise_instance_id', inst.id), Q.sortBy('set_number', Q.asc))
            .fetch();

          return {
            exercise: ex?.name ?? '?',
            intention: inst.intention,
            notes: inst.notes ?? null,
            sets: sets.map(ws => ({
              type: ws.setType,
              weight: ws.weight,
              reps: ws.reps ?? null,
              rpe: ws.rpe ?? null,
              rir: ws.rir ?? null,
              tempo: fmtTempo(ws.tempoEccentric, ws.tempoPauseBottom, ws.tempoConcentric, ws.tempoPauseTop),
              completed: ws.completed,
            })),
          };
        }),
      );

      return {
        id: s.id,
        name: s.name ?? null,
        startedAt: s.startedAt.toISOString(),
        endedAt: s.endedAt?.toISOString() ?? null,
        notes: s.notes ?? null,
        exercises,
      };
    }),
  );

  const data = {
    exportedAt: new Date().toISOString(),
    app: 'MyPerf',
    schemaVersion: 1,
    sessions: sessionData,
    bodyMetrics: bodyMetrics.map(m => ({
      recordedAt: m.recordedAt.toISOString(),
      weightKg: m.weightKg,
      bodyFatPct: m.bodyFatPct ?? null,
      chestCm: m.chestCm ?? null,
      waistCm: m.waistCm ?? null,
      hipsCm: m.hipsCm ?? null,
      leftArmCm: m.leftArmCm ?? null,
      rightArmCm: m.rightArmCm ?? null,
      leftThighCm: m.leftThighCm ?? null,
      rightThighCm: m.rightThighCm ?? null,
      notes: m.notes ?? null,
    })),
    readiness: readiness.map(r => ({
      recordedAt: r.recordedAt.toISOString(),
      sleepQuality: r.sleepQuality,
      soreness: r.soreness,
      stressLevel: r.stressLevel,
      motivation: r.motivation,
      notes: r.notes ?? null,
    })),
  };

  const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
  await Share.share({
    title: `MyPerf — Export ${dateStr}`,
    message: JSON.stringify(data, null, 2),
  });
}

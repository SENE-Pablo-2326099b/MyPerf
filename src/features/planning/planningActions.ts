import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type ScheduledSession from '@/db/models/ScheduledSession';
import type WorkoutTemplate from '@/db/models/WorkoutTemplate';
import type TemplateExercise from '@/db/models/TemplateExercise';
import type Session from '@/db/models/Session';
import type ExerciseInstance from '@/db/models/ExerciseInstance';
import type WorkingSet from '@/db/models/WorkingSet';
import type Exercise from '@/db/models/Exercise';
import type { BlockType } from './blockUtils';

export async function scheduleSession(
  date: Date,
  templateId: string | null,
  blockType: BlockType | null,
  title?: string,
): Promise<ScheduledSession> {
  const planned = new Date(date);
  planned.setHours(12, 0, 0, 0);
  return database.write(() =>
    database.get<ScheduledSession>('scheduled_sessions').create(s => {
      s.templateId = templateId;
      s.sessionId = null;
      s.plannedDate = planned;
      s.title = title?.trim() || null;
      s.blockType = blockType;
    }),
  );
}

export async function deleteScheduledSession(s: ScheduledSession): Promise<void> {
  await database.write(() => s.destroyPermanently());
}

async function getLastWeightForExercise(exerciseId: string): Promise<number> {
  const instances = await database
    .get<ExerciseInstance>('exercise_instances')
    .query(Q.where('exercise_id', exerciseId), Q.sortBy('created_at', Q.desc))
    .fetch();

  for (const inst of instances) {
    const sets = await database
      .get<WorkingSet>('working_sets')
      .query(
        Q.where('exercise_instance_id', inst.id),
        Q.where('set_type', 'working'),
        Q.where('completed', true),
      )
      .fetch();
    if (sets.length > 0) {
      return Math.max(...sets.map(s => s.weight));
    }
  }
  return 0;
}

export async function startFromTemplate(
  template: WorkoutTemplate,
  scheduledSession: ScheduledSession | null,
): Promise<Session> {
  const templateExercises = await database
    .get<TemplateExercise>('template_exercises')
    .query(Q.where('template_id', template.id), Q.sortBy('order', Q.asc))
    .fetch();

  const exercises = await Promise.all(
    templateExercises.map(te =>
      database.get<Exercise>('exercises').find(te.exerciseId),
    ),
  );

  const lastWeights = await Promise.all(
    templateExercises.map(te => getLastWeightForExercise(te.exerciseId)),
  );

  return database.write(async () => {
    const session = await database.get<Session>('sessions').create(s => {
      s.startedAt = new Date();
      s.name = template.name;
    });

    if (scheduledSession) {
      await scheduledSession.update(s => {
        s.sessionId = session.id;
      });
    }

    for (let i = 0; i < templateExercises.length; i++) {
      const te = templateExercises[i];
      const exercise = exercises[i];
      const lastWeight = lastWeights[i];

      const instance = await database
        .get<ExerciseInstance>('exercise_instances')
        .create(inst => {
          inst.session.set(session);
          inst.exercise.set(exercise);
          inst.order = te.order;
          inst.intention = te.intention;
          inst.targetSets = te.targetSets;
          inst.repRangeMin = te.repRangeMin;
          inst.repRangeMax = te.repRangeMax;
          inst.rpeTarget = te.rpeTarget;
          inst.restSeconds = te.restSeconds;
        });

      const targetSets = te.targetSets ?? 3;
      for (let setNum = 1; setNum <= targetSets; setNum++) {
        await database.get<WorkingSet>('working_sets').create(ws => {
          ws.exerciseInstance.set(instance);
          ws.setNumber = setNum;
          ws.setType = 'working';
          ws.weight = lastWeight;
          ws.reps = null;
          ws.rpe = te.rpeTarget;
          ws.rir = null;
          ws.tempoEccentric = 0;
          ws.tempoPauseBottom = 0;
          ws.tempoConcentric = 0;
          ws.tempoPauseTop = 0;
          ws.isIsometric = false;
          ws.completed = false;
        });
      }
    }

    return session;
  });
}

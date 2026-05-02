import { database } from '@/db/database';
import type Session from '@/db/models/Session';
import type ExerciseInstance from '@/db/models/ExerciseInstance';
import type Exercise from '@/db/models/Exercise';
import type WorkingSet from '@/db/models/WorkingSet';
import type WorkoutTemplate from '@/db/models/WorkoutTemplate';
import type TemplateExercise from '@/db/models/TemplateExercise';
import type { Intention } from '@/db/models/ExerciseInstance';
import type { SetType } from '@/db/models/WorkingSet';

export async function startSession(): Promise<Session> {
  return database.write(() =>
    database.get<Session>('sessions').create(s => {
      s.startedAt = new Date();
    }),
  );
}

export async function endSession(session: Session, notes?: string): Promise<void> {
  await database.write(() =>
    session.update(s => {
      s.endedAt = new Date();
      if (notes?.trim()) s.notes = notes.trim();
    }),
  );
}

export async function addExerciseToSession(
  session: Session,
  exercise: Exercise,
  order: number,
): Promise<ExerciseInstance> {
  return database.write(() =>
    database.get<ExerciseInstance>('exercise_instances').create(i => {
      i.session.set(session);
      i.exercise.set(exercise);
      i.order = order;
      i.intention = 'hypertrophy';
    }),
  );
}

export async function updateIntention(
  instance: ExerciseInstance,
  intention: Intention,
): Promise<void> {
  await database.write(() => instance.update(i => { i.intention = intention; }));
}

export async function addSet(
  instance: ExerciseInstance,
  setNumber: number,
  prev: WorkingSet | null,
): Promise<WorkingSet> {
  return database.write(() =>
    database.get<WorkingSet>('working_sets').create(s => {
      s.exerciseInstance.set(instance);
      s.setNumber = setNumber;
      s.setType = prev?.setType ?? 'working';
      s.weight = prev?.weight ?? 0;
      s.reps = prev?.reps ?? null;
      s.rpe = null;
      s.rir = null;
      s.tempoEccentric = 0;
      s.tempoPauseBottom = 0;
      s.tempoConcentric = 0;
      s.tempoPauseTop = 0;
      s.isIsometric = false;
      s.completed = false;
    }),
  );
}

export async function updateSet(
  set: WorkingSet,
  patch: Partial<{
    weight: number;
    reps: number | null;
    rpe: number | null;
    rir: number | null;
    setType: SetType;
    completed: boolean;
    tempoEccentric: number;
    tempoPauseBottom: number;
    tempoConcentric: number;
    tempoPauseTop: number;
  }>,
): Promise<void> {
  await database.write(() =>
    set.update(s => {
      if (patch.weight !== undefined) s.weight = patch.weight;
      if (patch.reps !== undefined) s.reps = patch.reps;
      if (patch.rpe !== undefined) s.rpe = patch.rpe;
      if (patch.rir !== undefined) s.rir = patch.rir;
      if (patch.setType !== undefined) s.setType = patch.setType;
      if (patch.tempoEccentric !== undefined) s.tempoEccentric = patch.tempoEccentric;
      if (patch.tempoPauseBottom !== undefined) s.tempoPauseBottom = patch.tempoPauseBottom;
      if (patch.tempoConcentric !== undefined) s.tempoConcentric = patch.tempoConcentric;
      if (patch.tempoPauseTop !== undefined) s.tempoPauseTop = patch.tempoPauseTop;
      if (patch.completed !== undefined) {
        s.completed = patch.completed;
        s.completedAt = patch.completed ? new Date() : null;
      }
    }),
  );
}

export async function deleteSet(set: WorkingSet): Promise<void> {
  await database.write(() => set.destroyPermanently());
}

export async function removeExercise(instance: ExerciseInstance): Promise<void> {
  await database.write(async () => {
    const sets = await instance.workingSets.fetch();
    await database.batch(
      ...sets.map(s => s.prepareDestroyPermanently()),
      instance.prepareDestroyPermanently(),
    );
  });
}

// Reorder exercise instances by updating their `order` field.
// instances is already in the desired order; assign order = index.
export async function reorderExercises(instances: ExerciseInstance[]): Promise<void> {
  await database.write(async () => {
    await database.batch(
      ...instances.map((inst, idx) =>
        inst.prepareUpdate(i => { i.order = idx; }),
      ),
    );
  });
}

// Save a session's exercises as a new WorkoutTemplate.
export async function saveSessionAsTemplate(
  name: string,
  instances: ExerciseInstance[],
): Promise<WorkoutTemplate> {
  const sorted = [...instances].sort((a, b) => a.order - b.order);

  const template = await database.write(() =>
    database.get<WorkoutTemplate>('workout_templates').create(t => {
      t.name = name;
    }),
  );

  await database.write(async () => {
    await database.batch(
      ...sorted.map((inst, idx) =>
        database.get<TemplateExercise>('template_exercises').prepareCreate(te => {
          te.templateId = template.id;
          te.exerciseId = inst.exercise.id;
          te.order = idx;
          te.intention = inst.intention;
          te.targetSets = inst.targetSets;
          te.repRangeMin = inst.repRangeMin;
          te.repRangeMax = inst.repRangeMax;
          te.rpeTarget = inst.rpeTarget;
          te.restSeconds = inst.restSeconds;
        }),
      ),
    );
  });

  return template;
}

// Update notes on an ExerciseInstance.
export async function updateInstanceNotes(
  instance: ExerciseInstance,
  notes: string | null,
): Promise<void> {
  await database.write(() => instance.update(i => { i.notes = notes; }));
}

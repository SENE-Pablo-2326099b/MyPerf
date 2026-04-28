import { Q } from '@nozbe/watermelondb';
import { database } from '@/db/database';
import type WorkoutTemplate from '@/db/models/WorkoutTemplate';
import type TemplateExercise from '@/db/models/TemplateExercise';
import type Exercise from '@/db/models/Exercise';
import type { Intention } from '@/db/models/ExerciseInstance';

export async function createTemplate(name: string): Promise<WorkoutTemplate> {
  return database.write(() =>
    database.get<WorkoutTemplate>('workout_templates').create(t => {
      t.name = name.trim();
    }),
  );
}

export async function updateTemplate(
  template: WorkoutTemplate,
  name: string,
  notes?: string,
): Promise<void> {
  await database.write(() =>
    template.update(t => {
      t.name = name.trim();
      t.notes = notes?.trim() || null;
    }),
  );
}

export async function deleteTemplate(template: WorkoutTemplate): Promise<void> {
  await database.write(async () => {
    const exercises = await template.templateExercises.fetch();
    await database.batch(
      ...exercises.map(e => e.prepareDestroyPermanently()),
      template.prepareDestroyPermanently(),
    );
  });
}

export async function addExerciseToTemplate(
  template: WorkoutTemplate,
  exercise: Exercise,
  order: number,
): Promise<TemplateExercise> {
  return database.write(() =>
    database.get<TemplateExercise>('template_exercises').create(te => {
      te.templateId = template.id;
      te.exerciseId = exercise.id;
      te.order = order;
      te.intention = 'hypertrophy';
      te.targetSets = 3;
      te.repRangeMin = 8;
      te.repRangeMax = 12;
      te.rpeTarget = 8;
      te.restSeconds = 120;
    }),
  );
}

export async function updateTemplateExercise(
  te: TemplateExercise,
  patch: Partial<{
    intention: Intention;
    targetSets: number | null;
    repRangeMin: number | null;
    repRangeMax: number | null;
    rpeTarget: number | null;
    restSeconds: number | null;
    order: number;
  }>,
): Promise<void> {
  await database.write(() =>
    te.update(t => {
      if (patch.intention !== undefined) t.intention = patch.intention;
      if (patch.targetSets !== undefined) t.targetSets = patch.targetSets;
      if (patch.repRangeMin !== undefined) t.repRangeMin = patch.repRangeMin;
      if (patch.repRangeMax !== undefined) t.repRangeMax = patch.repRangeMax;
      if (patch.rpeTarget !== undefined) t.rpeTarget = patch.rpeTarget;
      if (patch.restSeconds !== undefined) t.restSeconds = patch.restSeconds;
      if (patch.order !== undefined) t.order = patch.order;
    }),
  );
}

export async function removeExerciseFromTemplate(te: TemplateExercise): Promise<void> {
  await database.write(() => te.destroyPermanently());
}

export async function reorderTemplateExercises(
  exercises: TemplateExercise[],
): Promise<void> {
  await database.write(() =>
    database.batch(
      ...exercises.map((te, idx) => te.prepareUpdate(t => { t.order = idx; })),
    ),
  );
}

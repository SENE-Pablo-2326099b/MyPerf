import { Model, type Relation } from '@nozbe/watermelondb';
import { date, field, readonly, relation } from '@nozbe/watermelondb/decorators';
import type WorkoutTemplate from './WorkoutTemplate';
import type Exercise from './Exercise';
import type { Intention } from './ExerciseInstance';

export default class TemplateExercise extends Model {
  static table = 'template_exercises' as const;
  static associations = {
    workout_templates: { type: 'belongs_to' as const, key: 'template_id' },
    exercises: { type: 'belongs_to' as const, key: 'exercise_id' },
  };

  @field('template_id') templateId!: string;
  @relation('workout_templates', 'template_id') template!: Relation<WorkoutTemplate>;

  @field('exercise_id') exerciseId!: string;
  @relation('exercises', 'exercise_id') exercise!: Relation<Exercise>;

  @field('order') order!: number;
  @field('intention') intention!: Intention;
  @field('target_sets') targetSets!: number | null;
  @field('rep_range_min') repRangeMin!: number | null;
  @field('rep_range_max') repRangeMax!: number | null;
  @field('rpe_target') rpeTarget!: number | null;
  @field('rest_seconds') restSeconds!: number | null;
  @field('notes') notes!: string | null;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}

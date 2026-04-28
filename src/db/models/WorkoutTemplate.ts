import { Model, type Query } from '@nozbe/watermelondb';
import { children, date, field, readonly } from '@nozbe/watermelondb/decorators';
import type TemplateExercise from './TemplateExercise';

export default class WorkoutTemplate extends Model {
  static table = 'workout_templates' as const;
  static associations = {
    template_exercises: { type: 'has_many' as const, foreignKey: 'template_id' },
  };

  @field('name') name!: string;
  @field('notes') notes!: string | null;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @children('template_exercises') templateExercises!: Query<TemplateExercise>;
}

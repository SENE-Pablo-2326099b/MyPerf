import { Model, type Query } from '@nozbe/watermelondb';
import { children, date, field, readonly } from '@nozbe/watermelondb/decorators';
import type ExerciseInstance from './ExerciseInstance';

export default class Session extends Model {
  static table = 'sessions' as const;
  static associations = {
    exercise_instances: { type: 'has_many' as const, foreignKey: 'session_id' },
  };

  @field('name') name!: string | null;
  @date('started_at') startedAt!: Date;
  @date('ended_at') endedAt!: Date | null;
  @field('notes') notes!: string | null;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @children('exercise_instances') exerciseInstances!: Query<ExerciseInstance>;
}

import { Model, type Query, type Relation } from '@nozbe/watermelondb';
import { children, date, field, readonly, relation } from '@nozbe/watermelondb/decorators';
import type Exercise from './Exercise';
import type Session from './Session';
import type WorkingSet from './WorkingSet';

export type Intention = 'power' | 'strength' | 'hypertrophy' | 'endurance' | 'metabolic';

export default class ExerciseInstance extends Model {
  static table = 'exercise_instances' as const;
  static associations = {
    sessions: { type: 'belongs_to' as const, key: 'session_id' },
    exercises: { type: 'belongs_to' as const, key: 'exercise_id' },
    working_sets: { type: 'has_many' as const, foreignKey: 'exercise_instance_id' },
  };

  @relation('sessions', 'session_id') session!: Relation<Session>;
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

  @children('working_sets') workingSets!: Query<WorkingSet>;
}

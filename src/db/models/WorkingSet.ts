import { Model, type Relation } from '@nozbe/watermelondb';
import { date, field, readonly, relation } from '@nozbe/watermelondb/decorators';
import type ExerciseInstance from './ExerciseInstance';

export type SetType = 'warmup' | 'working' | 'drop' | 'rest_pause' | 'myoreps';

export default class WorkingSet extends Model {
  static table = 'working_sets' as const;
  static associations = {
    exercise_instances: { type: 'belongs_to' as const, key: 'exercise_instance_id' },
  };

  @relation('exercise_instances', 'exercise_instance_id')
  exerciseInstance!: Relation<ExerciseInstance>;

  @field('set_number') setNumber!: number;
  @field('set_type') setType!: SetType;
  @field('reps') reps!: number | null;
  @field('weight') weight!: number;
  @field('rpe') rpe!: number | null;
  @field('rir') rir!: number | null;

  // Tempo : ecc-pauseBas-conc-pauseHaut. -1 sur concentric = "X" (explosif).
  @field('tempo_eccentric') tempoEccentric!: number;
  @field('tempo_pause_bottom') tempoPauseBottom!: number;
  @field('tempo_concentric') tempoConcentric!: number;
  @field('tempo_pause_top') tempoPauseTop!: number;

  @field('is_isometric') isIsometric!: boolean;
  @field('isometric_duration_seconds') isometricDurationSeconds!: number | null;
  @field('rest_after_seconds') restAfterSeconds!: number | null;
  @field('completed') completed!: boolean;
  @date('completed_at') completedAt!: Date | null;
  @field('notes') notes!: string | null;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}

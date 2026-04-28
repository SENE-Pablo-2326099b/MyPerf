import { Model } from '@nozbe/watermelondb';
import { date, field, json, readonly } from '@nozbe/watermelondb/decorators';

export type Equipment =
  | 'barbell'
  | 'ez_bar'
  | 'smith_machine'
  | 'dumbbell'
  | 'kettlebell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'weighted_bodyweight';

export type ExerciseType = 'compound' | 'isolation';

export type Grip = 'pronation' | 'supination' | 'neutral' | 'mixed';

export type WorkingAngle =
  | 'flat'
  | 'incline'
  | 'decline'
  | 'overhead'
  | 'low_pulley'
  | 'high_pulley';

// Toutes les valeurs possibles pour specific_muscles
export type SpecificMuscle =
  // Chest
  | 'pec_upper' | 'pec_mid' | 'pec_lower' | 'serratus'
  // Back
  | 'lats' | 'upper_traps' | 'mid_traps' | 'lower_traps' | 'rhomboids' | 'lower_back' | 'teres_major'
  // Legs
  | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'hip_flexors' | 'adductors'
  // Shoulders
  | 'front_delt' | 'mid_delt' | 'rear_delt' | 'rotator_cuff'
  // Arms
  | 'bicep_long' | 'bicep_short' | 'brachialis' | 'tricep_long' | 'tricep_lateral' | 'tricep_medial' | 'forearms'
  // Core
  | 'rectus' | 'obliques' | 'transverse' | 'lower_abs';

function sanitizeStringArray(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];
}

export default class Exercise extends Model {
  static table = 'exercises' as const;

  @field('name') name!: string;
  @field('primary_muscle_group') primaryMuscleGroup!: string;
  @json('secondary_muscle_groups', sanitizeStringArray) secondaryMuscleGroups!: string[];
  @json('specific_muscles', sanitizeStringArray) specificMuscles!: SpecificMuscle[];
  @field('equipment') equipment!: Equipment;
  @field('exercise_type') exerciseType!: ExerciseType;
  @field('is_unilateral') isUnilateral!: boolean;
  @field('grip') grip!: Grip | null;
  @field('working_angle') workingAngle!: WorkingAngle | null;
  @field('notes') notes!: string | null;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}

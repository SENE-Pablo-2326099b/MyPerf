import { Model } from '@nozbe/watermelondb';
import { date, field, readonly } from '@nozbe/watermelondb/decorators';

export default class BodyMetric extends Model {
  static table = 'body_metrics' as const;

  @date('recorded_at') recordedAt!: Date;
  @field('weight_kg') weightKg!: number;
  @field('body_fat_pct') bodyFatPct!: number | null;
  @field('chest_cm') chestCm!: number | null;
  @field('waist_cm') waistCm!: number | null;
  @field('hips_cm') hipsCm!: number | null;
  @field('left_arm_cm') leftArmCm!: number | null;
  @field('right_arm_cm') rightArmCm!: number | null;
  @field('left_thigh_cm') leftThighCm!: number | null;
  @field('right_thigh_cm') rightThighCm!: number | null;
  @field('notes') notes!: string | null;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}

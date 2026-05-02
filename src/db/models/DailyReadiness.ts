import { Model } from '@nozbe/watermelondb';
import { date, field, readonly } from '@nozbe/watermelondb/decorators';

export default class DailyReadiness extends Model {
  static table = 'daily_readiness' as const;

  @date('recorded_at') recordedAt!: Date;
  @field('sleep_quality') sleepQuality!: number;
  @field('soreness') soreness!: number;
  @field('stress_level') stressLevel!: number;
  @field('motivation') motivation!: number;
  @field('notes') notes!: string | null;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}

import { Model } from '@nozbe/watermelondb';
import { date, field, readonly } from '@nozbe/watermelondb/decorators';
import type { MicroLabel } from '@/features/planning/microcycleUtils';

export default class Microcycle extends Model {
  static table = 'microcycles' as const;

  @field('mesocycle_id') mesocycleId!: string;
  @field('week_number') weekNumber!: number;
  @field('label') label!: MicroLabel;
  @field('volume_pct') volumePct!: number;
  @field('notes') notes!: string | null;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}

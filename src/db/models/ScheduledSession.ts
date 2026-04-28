import { Model } from '@nozbe/watermelondb';
import { date, field, readonly } from '@nozbe/watermelondb/decorators';
import type { BlockType } from '@/features/planning/blockUtils';

export default class ScheduledSession extends Model {
  static table = 'scheduled_sessions' as const;

  @field('template_id') templateId!: string | null;
  @field('session_id') sessionId!: string | null;
  @field('mesocycle_id') mesocycleId!: string | null;
  @date('planned_date') plannedDate!: Date;
  @field('title') title!: string | null;
  @field('block_type') blockType!: BlockType | null;
  @field('notes') notes!: string | null;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}

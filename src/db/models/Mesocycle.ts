import { Model } from '@nozbe/watermelondb';
import { date, field, json, readonly } from '@nozbe/watermelondb/decorators';
import type { BlockType } from '@/features/planning/blockUtils';

// isoDay : 1=Lundi … 7=Dimanche
export interface WeekPatternEntry {
  isoDay: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  templateId: string;
}
export type WeekPattern = WeekPatternEntry[];

function sanitizeWeekPattern(raw: unknown): WeekPattern {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    e =>
      typeof e?.isoDay === 'number' &&
      e.isoDay >= 1 &&
      e.isoDay <= 7 &&
      typeof e?.templateId === 'string',
  );
}

/** Status calculé dynamiquement — jamais stocké en DB. */
export type MesocycleStatus = 'upcoming' | 'active' | 'completed';

export function getMesocycleStatus(m: Mesocycle): MesocycleStatus {
  const now = Date.now();
  if (now < m.startDate.getTime()) return 'upcoming';
  if (now > m.endDate.getTime()) return 'completed';
  return 'active';
}

/** Semaine courante (1-based) et total de semaines. */
export function getMesocycleWeek(m: Mesocycle): { current: number; total: number } {
  const MS_WEEK = 7 * 24 * 3600 * 1000;
  const totalMs = m.endDate.getTime() - m.startDate.getTime();
  const total = Math.max(1, Math.round(totalMs / MS_WEEK));
  const elapsed = Date.now() - m.startDate.getTime();
  const current = Math.min(total, Math.max(1, Math.ceil(elapsed / MS_WEEK)));
  return { current, total };
}

export default class Mesocycle extends Model {
  static table = 'mesocycles' as const;

  @field('macrocycle_id') macrocycleId!: string | null;
  @field('name') name!: string;
  @field('block_type') blockType!: BlockType;
  @date('start_date') startDate!: Date;
  @date('end_date') endDate!: Date;
  @json('week_pattern', sanitizeWeekPattern) weekPattern!: WeekPattern;
  @field('notes') notes!: string | null;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}

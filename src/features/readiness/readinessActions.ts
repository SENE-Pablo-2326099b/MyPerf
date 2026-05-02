import { database } from '@/db/database';
import type DailyReadiness from '@/db/models/DailyReadiness';

export async function addReadiness(data: {
  recordedAt: Date;
  sleepQuality: number;
  soreness: number;
  stressLevel: number;
  motivation: number;
  notes?: string | null;
}): Promise<DailyReadiness> {
  return database.write(async () => {
    return database.get<DailyReadiness>('daily_readiness').create((r: any) => {
      r.recordedAt = data.recordedAt;
      r.sleepQuality = data.sleepQuality;
      r.soreness = data.soreness;
      r.stressLevel = data.stressLevel;
      r.motivation = data.motivation;
      r.notes = data.notes ?? null;
      r.updatedAt = new Date();
    });
  });
}

export async function deleteReadiness(entry: DailyReadiness): Promise<void> {
  await database.write(async () => {
    await entry.destroyPermanently();
  });
}

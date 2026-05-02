import { database } from '@/db/database';
import type BodyMetric from '@/db/models/BodyMetric';

export async function addBodyMetric(data: {
  recordedAt: Date;
  weightKg: number;
  bodyFatPct?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipsCm?: number | null;
  leftArmCm?: number | null;
  rightArmCm?: number | null;
  leftThighCm?: number | null;
  rightThighCm?: number | null;
  notes?: string | null;
}): Promise<BodyMetric> {
  return database.write(async () => {
    return database.get<BodyMetric>('body_metrics').create((m: any) => {
      m.recordedAt = data.recordedAt;
      m.weightKg = data.weightKg;
      m.bodyFatPct = data.bodyFatPct ?? null;
      m.chestCm = data.chestCm ?? null;
      m.waistCm = data.waistCm ?? null;
      m.hipsCm = data.hipsCm ?? null;
      m.leftArmCm = data.leftArmCm ?? null;
      m.rightArmCm = data.rightArmCm ?? null;
      m.leftThighCm = data.leftThighCm ?? null;
      m.rightThighCm = data.rightThighCm ?? null;
      m.notes = data.notes ?? null;
      m.updatedAt = new Date();
    });
  });
}

export async function deleteBodyMetric(metric: BodyMetric): Promise<void> {
  await database.write(async () => {
    await metric.destroyPermanently();
  });
}

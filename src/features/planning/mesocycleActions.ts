import { database } from '@/db/database';
import { Q } from '@nozbe/watermelondb';
import Mesocycle, { type WeekPattern } from '@/db/models/Mesocycle';
import Macrocycle from '@/db/models/Macrocycle';
import Microcycle from '@/db/models/Microcycle';
import type WorkoutTemplate from '@/db/models/WorkoutTemplate';
import type ScheduledSession from '@/db/models/ScheduledSession';
import type { BlockType } from './blockUtils';
import type { MicroLabel } from './microcycleUtils';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** JS getDay() → ISO 1=Lun…7=Dim */
function toIsoDay(date: Date): number {
  const d = date.getDay();
  return d === 0 ? 7 : d;
}

function midnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Macrocycle ────────────────────────────────────────────────────────────────

export async function createMacrocycle(
  name: string,
  goalDescription: string | null,
  startDate: Date,
  endDate: Date | null,
): Promise<Macrocycle> {
  const now = new Date();
  return database.write(async () =>
    database.get<Macrocycle>('macrocycles').create(m => {
      m.name = name.trim();
      m.goalDescription = goalDescription?.trim() || null;
      m.startDate = midnight(startDate);
      m.endDate = endDate ? midnight(endDate) : null;
      m.updatedAt = now;
    }),
  );
}

export async function deleteMacrocycle(macrocycle: Macrocycle): Promise<void> {
  await database.write(async () => {
    const linked = await database
      .get<Mesocycle>('mesocycles')
      .query(Q.where('macrocycle_id', macrocycle.id))
      .fetch();
    for (const m of linked) {
      await m.update(me => {
        me.macrocycleId = null;
        me.updatedAt = new Date();
      });
    }
    await macrocycle.destroyPermanently();
  });
}

// ── Mésocycle ─────────────────────────────────────────────────────────────────

export async function createMesocycle(
  name: string,
  blockType: BlockType,
  startDate: Date,
  endDate: Date,
  weekPattern: WeekPattern,
  macrocycleId: string | null,
  notes: string | null,
): Promise<Mesocycle> {
  const now = new Date();
  return database.write(async () =>
    database.get<Mesocycle>('mesocycles').create(m => {
      m.name = name.trim();
      m.blockType = blockType;
      m.startDate = midnight(startDate);
      m.endDate = midnight(endDate);
      m.weekPattern = weekPattern;
      m.macrocycleId = macrocycleId;
      m.notes = notes?.trim() || null;
      m.updatedAt = now;
    }),
  );
}

export async function updateMesocycle(
  mesocycle: Mesocycle,
  patch: Partial<{
    name: string;
    blockType: BlockType;
    notes: string | null;
  }>,
): Promise<void> {
  await database.write(async () =>
    mesocycle.update(m => {
      if (patch.name !== undefined) m.name = patch.name!.trim();
      if (patch.blockType !== undefined) m.blockType = patch.blockType!;
      if (patch.notes !== undefined) m.notes = patch.notes;
      m.updatedAt = new Date();
    }),
  );
}

const MS_WEEK = 7 * 24 * 3600 * 1000;

/**
 * Génère toutes les ScheduledSessions entre startDate et endDate
 * selon le week_pattern du mésocycle.
 * Si des microcycles sont définis, applique leur volume_pct à chaque séance.
 * Retourne le nombre de séances créées.
 */
export async function generateMesocycleSessions(
  mesocycle: Mesocycle,
  templates: WorkoutTemplate[],
): Promise<number> {
  const templateMap = Object.fromEntries(templates.map(t => [t.id, t]));

  // Charge les microcycles pour ce mésocycle
  const micros = await database
    .get<Microcycle>('microcycles')
    .query(Q.where('mesocycle_id', mesocycle.id))
    .fetch();
  const microByWeek: Record<number, number> = {};
  for (const m of micros) microByWeek[m.weekNumber] = m.volumePct;

  const mesoStart = midnight(mesocycle.startDate).getTime();
  const now = new Date();
  let count = 0;

  await database.write(async () => {
    const cursor = midnight(mesocycle.startDate);
    const end = midnight(mesocycle.endDate);

    while (cursor <= end) {
      const isoDay = toIsoDay(cursor) as 1|2|3|4|5|6|7;
      const entry = mesocycle.weekPattern.find(p => p.isoDay === isoDay);

      if (entry && templateMap[entry.templateId]) {
        const template = templateMap[entry.templateId];
        const weekNumber = Math.floor((cursor.getTime() - mesoStart) / MS_WEEK) + 1;
        const volumePct = microByWeek[weekNumber] ?? null;
        const date = new Date(cursor);

        await database.get<ScheduledSession>('scheduled_sessions').create(ss => {
          ss.templateId = entry.templateId;
          ss.mesocycleId = mesocycle.id;
          ss.plannedDate = date;
          ss.blockType = mesocycle.blockType;
          ss.title = template.name;
          ss.volumePct = volumePct;
          ss.updatedAt = now;
        });
        count++;
      }

      cursor.setDate(cursor.getDate() + 1);
    }
  });

  return count;
}

/**
 * Supprime un mésocycle.
 * Si deleteScheduled=true, supprime aussi toutes les séances planifiées liées.
 * Supprime toujours les microcycles associés.
 */
export async function deleteMesocycle(
  mesocycle: Mesocycle,
  deleteScheduled: boolean,
): Promise<void> {
  await database.write(async () => {
    const micros = await database
      .get<Microcycle>('microcycles')
      .query(Q.where('mesocycle_id', mesocycle.id))
      .fetch();
    for (const m of micros) await m.destroyPermanently();

    if (deleteScheduled) {
      const linked = await database
        .get<ScheduledSession>('scheduled_sessions')
        .query(Q.where('mesocycle_id', mesocycle.id))
        .fetch();
      for (const ss of linked) {
        await ss.destroyPermanently();
      }
    }
    await mesocycle.destroyPermanently();
  });
}

// ── Microcycles ───────────────────────────────────────────────────────────────

export interface MicroWeek {
  weekNumber: number;
  label: MicroLabel;
  volumePct: number;
  notes: string | null;
}

/** Remplace entièrement les microcycles d'un mésocycle. */
export async function saveMicrocycles(
  mesocycleId: string,
  weeks: MicroWeek[],
): Promise<void> {
  const now = new Date();
  await database.write(async () => {
    const existing = await database
      .get<Microcycle>('microcycles')
      .query(Q.where('mesocycle_id', mesocycleId))
      .fetch();
    for (const m of existing) await m.destroyPermanently();
    for (const w of weeks) {
      await database.get<Microcycle>('microcycles').create(m => {
        m.mesocycleId = mesocycleId;
        m.weekNumber = w.weekNumber;
        m.label = w.label;
        m.volumePct = w.volumePct;
        m.notes = w.notes;
        m.updatedAt = now;
      });
    }
  });
}

/** Compte le nombre de séances planifiées liées à un mésocycle. */
export async function countMesocycleSessions(mesocycleId: string): Promise<number> {
  return database
    .get<ScheduledSession>('scheduled_sessions')
    .query(Q.where('mesocycle_id', mesocycleId))
    .fetchCount();
}

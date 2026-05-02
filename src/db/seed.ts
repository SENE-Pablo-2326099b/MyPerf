import { database } from './database';
import type Exercise from './models/Exercise';
import type Session from './models/Session';
import type ExerciseInstance from './models/ExerciseInstance';
import type WorkoutTemplate from './models/WorkoutTemplate';
import type Macrocycle from './models/Macrocycle';
import type Mesocycle from './models/Mesocycle';

// ── Date helpers ──────────────────────────────────────────────────────────────

function daysAgo(n: number, hour = 10): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(9, 0, 0, 0);
  return d;
}

function weeksAgo(n: number): Date {
  return daysAgo(n * 7, 0);
}

// ── Clear database ────────────────────────────────────────────────────────────

// Delete order matters: children before parents (FK constraints).
const TABLES_ORDERED = [
  'working_sets',
  'exercise_instances',
  'sessions',
  'template_exercises',
  'scheduled_sessions',
  'workout_templates',
  'microcycles',
  'mesocycles',
  'macrocycles',
  'exercises',
  'body_metrics',
  'daily_readiness',
];

export async function clearDatabase(): Promise<void> {
  await database.write(async () => {
    for (const table of TABLES_ORDERED) {
      const records = await database.get(table).query().fetch();
      if (records.length > 0) {
        await database.batch(...records.map((r: any) => r.prepareDestroyPermanently()));
      }
    }
  });
}

// ── Exercise definitions ───────────────────────────────────────────────────────

const EXERCISE_DEFS = [
  // CHEST
  {
    name: 'Développé couché barre',
    primaryMuscleGroup: 'chest',
    secondaryMuscleGroups: ['shoulders', 'arms'],
    specificMuscles: ['pec_mid', 'pec_lower', 'front_delt', 'tricep_long'],
    equipment: 'barbell' as const,
    exerciseType: 'compound' as const,
    isUnilateral: false,
    grip: 'pronation' as const,
    workingAngle: 'flat' as const,
  },
  {
    name: 'Développé incliné haltères',
    primaryMuscleGroup: 'chest',
    secondaryMuscleGroups: ['shoulders'],
    specificMuscles: ['pec_upper', 'front_delt'],
    equipment: 'dumbbell' as const,
    exerciseType: 'compound' as const,
    isUnilateral: false,
    grip: 'neutral' as const,
    workingAngle: 'incline' as const,
  },
  {
    name: 'Écarté poulie basse',
    primaryMuscleGroup: 'chest',
    secondaryMuscleGroups: [],
    specificMuscles: ['pec_mid', 'pec_upper', 'serratus'],
    equipment: 'cable' as const,
    exerciseType: 'isolation' as const,
    isUnilateral: false,
    grip: 'neutral' as const,
    workingAngle: 'low_pulley' as const,
  },
  // BACK
  {
    name: 'Traction',
    primaryMuscleGroup: 'back',
    secondaryMuscleGroups: ['arms'],
    specificMuscles: ['lats', 'teres_major', 'bicep_long'],
    equipment: 'bodyweight' as const,
    exerciseType: 'compound' as const,
    isUnilateral: false,
    grip: 'pronation' as const,
    workingAngle: null,
  },
  {
    name: 'Rowing barre',
    primaryMuscleGroup: 'back',
    secondaryMuscleGroups: ['arms'],
    specificMuscles: ['lats', 'mid_traps', 'rhomboids', 'bicep_long'],
    equipment: 'barbell' as const,
    exerciseType: 'compound' as const,
    isUnilateral: false,
    grip: 'pronation' as const,
    workingAngle: null,
  },
  {
    name: 'Tirage vertical poulie',
    primaryMuscleGroup: 'back',
    secondaryMuscleGroups: ['arms'],
    specificMuscles: ['lats', 'teres_major', 'brachialis'],
    equipment: 'machine' as const,
    exerciseType: 'isolation' as const,
    isUnilateral: false,
    grip: 'pronation' as const,
    workingAngle: 'high_pulley' as const,
  },
  {
    name: 'Rowing poulie basse',
    primaryMuscleGroup: 'back',
    secondaryMuscleGroups: ['arms'],
    specificMuscles: ['mid_traps', 'rhomboids', 'lats'],
    equipment: 'cable' as const,
    exerciseType: 'isolation' as const,
    isUnilateral: false,
    grip: 'neutral' as const,
    workingAngle: 'low_pulley' as const,
  },
  {
    name: 'Face pull',
    primaryMuscleGroup: 'shoulders',
    secondaryMuscleGroups: ['back'],
    specificMuscles: ['rear_delt', 'mid_traps', 'rotator_cuff'],
    equipment: 'cable' as const,
    exerciseType: 'isolation' as const,
    isUnilateral: false,
    grip: 'neutral' as const,
    workingAngle: 'high_pulley' as const,
  },
  // SHOULDERS
  {
    name: 'Développé militaire barre',
    primaryMuscleGroup: 'shoulders',
    secondaryMuscleGroups: ['arms'],
    specificMuscles: ['front_delt', 'mid_delt', 'tricep_long'],
    equipment: 'barbell' as const,
    exerciseType: 'compound' as const,
    isUnilateral: false,
    grip: 'pronation' as const,
    workingAngle: 'overhead' as const,
  },
  {
    name: 'Élévations latérales',
    primaryMuscleGroup: 'shoulders',
    secondaryMuscleGroups: [],
    specificMuscles: ['mid_delt'],
    equipment: 'dumbbell' as const,
    exerciseType: 'isolation' as const,
    isUnilateral: false,
    grip: 'neutral' as const,
    workingAngle: null,
  },
  // LEGS
  {
    name: 'Squat barre arrière',
    primaryMuscleGroup: 'legs',
    secondaryMuscleGroups: ['core'],
    specificMuscles: ['quads', 'glutes', 'hamstrings'],
    equipment: 'barbell' as const,
    exerciseType: 'compound' as const,
    isUnilateral: false,
    grip: null,
    workingAngle: null,
  },
  {
    name: 'Romanian Deadlift',
    primaryMuscleGroup: 'legs',
    secondaryMuscleGroups: ['back'],
    specificMuscles: ['hamstrings', 'glutes', 'lower_back'],
    equipment: 'barbell' as const,
    exerciseType: 'compound' as const,
    isUnilateral: false,
    grip: 'pronation' as const,
    workingAngle: null,
  },
  {
    name: 'Presse à cuisses',
    primaryMuscleGroup: 'legs',
    secondaryMuscleGroups: [],
    specificMuscles: ['quads', 'glutes'],
    equipment: 'machine' as const,
    exerciseType: 'compound' as const,
    isUnilateral: false,
    grip: null,
    workingAngle: null,
  },
  {
    name: 'Leg curl assis',
    primaryMuscleGroup: 'legs',
    secondaryMuscleGroups: [],
    specificMuscles: ['hamstrings'],
    equipment: 'machine' as const,
    exerciseType: 'isolation' as const,
    isUnilateral: false,
    grip: null,
    workingAngle: null,
  },
  // ARMS
  {
    name: 'Curl EZ barre',
    primaryMuscleGroup: 'arms',
    secondaryMuscleGroups: [],
    specificMuscles: ['bicep_long', 'bicep_short', 'brachialis'],
    equipment: 'ez_bar' as const,
    exerciseType: 'isolation' as const,
    isUnilateral: false,
    grip: 'supination' as const,
    workingAngle: null,
  },
  {
    name: 'Pushdown triceps poulie haute',
    primaryMuscleGroup: 'arms',
    secondaryMuscleGroups: [],
    specificMuscles: ['tricep_lateral', 'tricep_medial', 'tricep_long'],
    equipment: 'cable' as const,
    exerciseType: 'isolation' as const,
    isUnilateral: false,
    grip: 'pronation' as const,
    workingAngle: 'high_pulley' as const,
  },
  {
    name: 'Curl haltères incliné',
    primaryMuscleGroup: 'arms',
    secondaryMuscleGroups: [],
    specificMuscles: ['bicep_long', 'brachialis'],
    equipment: 'dumbbell' as const,
    exerciseType: 'isolation' as const,
    isUnilateral: true,
    grip: 'supination' as const,
    workingAngle: 'incline' as const,
  },
  // CORE
  {
    name: 'Crunch poulie haute',
    primaryMuscleGroup: 'core',
    secondaryMuscleGroups: [],
    specificMuscles: ['rectus', 'lower_abs'],
    equipment: 'cable' as const,
    exerciseType: 'isolation' as const,
    isUnilateral: false,
    grip: 'neutral' as const,
    workingAngle: 'high_pulley' as const,
  },
];

// ── Seed helpers ───────────────────────────────────────────────────────────────

type SetType = 'warmup' | 'working' | 'drop' | 'rest_pause' | 'myoreps';

async function addSet(
  instance: ExerciseInstance,
  setNumber: number,
  setType: SetType,
  weight: number,
  reps: number,
  rpe: number | null,
  rir: number | null,
  completedAt: Date,
  opts?: { tempoE?: number; tempoC?: number; restAfter?: number },
) {
  await database.get<any>('working_sets').create((ws: any) => {
    ws.exerciseInstance.set(instance);
    ws.setNumber = setNumber;
    ws.setType = setType;
    ws.weight = weight;
    ws.reps = reps;
    ws.rpe = rpe;
    ws.rir = rir;
    ws.tempoEccentric = opts?.tempoE ?? (setType === 'warmup' ? 2 : 3);
    ws.tempoPauseBottom = 0;
    ws.tempoConcentric = opts?.tempoC ?? (setType === 'warmup' ? 1 : -1);
    ws.tempoPauseTop = 0;
    ws.isIsometric = false;
    ws.restAfterSeconds = opts?.restAfter ?? (setType === 'warmup' ? 60 : setType === 'working' ? 120 : 45);
    ws.completed = true;
    ws.completedAt = completedAt;
    ws.updatedAt = completedAt;
  });
}

async function addExerciseWithSets(
  session: Session,
  exercise: Exercise,
  order: number,
  intention: 'hypertrophy' | 'strength' | 'power' | 'endurance' | 'metabolic',
  warmupWeight: number,
  workingWeight: number,
  reps: number,
  sets: number,
  sessionStart: Date,
  notes?: string,
) {
  const instance = await database.get<ExerciseInstance>('exercise_instances').create((ei: any) => {
    ei.session.set(session);
    ei.exercise.set(exercise);
    ei.order = order;
    ei.intention = intention;
    ei.targetSets = sets;
    ei.repRangeMin = Math.max(reps - 2, 1);
    ei.repRangeMax = reps + 2;
    ei.rpeTarget = 8;
    ei.restSeconds = intention === 'strength' || intention === 'power' ? 180 : 90;
    ei.notes = notes ?? null;
    ei.updatedAt = sessionStart;
  });

  const baseTime = sessionStart.getTime() + order * 12 * 60 * 1000;
  const wu = warmupWeight > 0;

  if (wu) {
    await addSet(instance, 1, 'warmup', warmupWeight, reps + 4, null, null, new Date(baseTime + 60_000));
  }
  for (let i = 0; i < sets; i++) {
    const isLast = i === sets - 1;
    await addSet(
      instance, (wu ? 2 : 1) + i, 'working',
      workingWeight, isLast ? reps : reps + 1,
      7 + (isLast ? 1 : 0), 3 - (isLast ? 1 : 0),
      new Date(baseTime + (i + 2) * 180_000),
    );
  }

  return instance;
}

// Exercise with drop set + rest-pause to showcase advanced set types
async function addAdvancedExercise(
  session: Session,
  exercise: Exercise,
  order: number,
  workingWeight: number,
  reps: number,
  sessionStart: Date,
) {
  const instance = await database.get<ExerciseInstance>('exercise_instances').create((ei: any) => {
    ei.session.set(session);
    ei.exercise.set(exercise);
    ei.order = order;
    ei.intention = 'hypertrophy';
    ei.targetSets = 3;
    ei.repRangeMin = reps - 2;
    ei.repRangeMax = reps + 2;
    ei.rpeTarget = 9;
    ei.restSeconds = 90;
    ei.notes = 'Dernière série en drop set puis myoreps';
    ei.updatedAt = sessionStart;
  });

  const base = sessionStart.getTime() + order * 12 * 60 * 1000;

  // 2 working sets
  await addSet(instance, 1, 'working', workingWeight, reps, 8, 2, new Date(base + 120_000));
  await addSet(instance, 2, 'working', workingWeight, reps - 1, 9, 1, new Date(base + 300_000));
  // drop set
  await addSet(instance, 3, 'drop', workingWeight * 0.75, reps + 4, 9, 0, new Date(base + 360_000), { restAfter: 15 });
  // myoreps cluster
  await addSet(instance, 4, 'myoreps', workingWeight * 0.75, 5, 10, 0, new Date(base + 380_000), { restAfter: 20 });
  await addSet(instance, 5, 'myoreps', workingWeight * 0.75, 4, 10, 0, new Date(base + 405_000), { restAfter: 20 });

  return instance;
}

// ── Main seed function ─────────────────────────────────────────────────────────

export async function seedDatabase(): Promise<void> {
  const now = new Date();

  // ── 1. Exercises ─────────────────────────────────────────────────────────────
  const exercises: Exercise[] = [];

  await database.write(async () => {
    for (const def of EXERCISE_DEFS) {
      const ex = await database.get<Exercise>('exercises').create((e: any) => {
        e.name = def.name;
        e.primaryMuscleGroup = def.primaryMuscleGroup;
        e.secondaryMuscleGroups = def.secondaryMuscleGroups;
        e.specificMuscles = def.specificMuscles;
        e.equipment = def.equipment;
        e.exerciseType = def.exerciseType;
        e.isUnilateral = def.isUnilateral;
        e.grip = def.grip ?? null;
        e.workingAngle = def.workingAngle ?? null;
        e.updatedAt = now;
      });
      exercises.push(ex);
    }
  });

  const [
    benchPress, inclineDB, cableFly,
    pullUp, bbRow, latPulldown, cableRow, facePull,
    ohPress, lateralRaise,
    squat, rdl, legPress, legCurl,
    ezCurl, pushdown, inclineCurl,
    cableCrunch,
  ] = exercises;

  // ── 2. Templates PPL ─────────────────────────────────────────────────────────

  let pushTemplate: WorkoutTemplate;
  let pullTemplate: WorkoutTemplate;
  let legsTemplate: WorkoutTemplate;

  await database.write(async () => {
    pushTemplate = await database.get<WorkoutTemplate>('workout_templates').create((t: any) => {
      t.name = 'Push A';
      t.notes = 'Poitrine · Épaules · Triceps — hypertrophie';
      t.updatedAt = now;
    });
    pullTemplate = await database.get<WorkoutTemplate>('workout_templates').create((t: any) => {
      t.name = 'Pull A';
      t.notes = 'Dos · Biceps · Deltoïdes arrière — hypertrophie';
      t.updatedAt = now;
    });
    legsTemplate = await database.get<WorkoutTemplate>('workout_templates').create((t: any) => {
      t.name = 'Legs A';
      t.notes = 'Quadriceps · Ischio · Fessiers — hypertrophie';
      t.updatedAt = now;
    });

    const pushExs = [benchPress, ohPress, lateralRaise, pushdown, cableFly];
    for (let i = 0; i < pushExs.length; i++) {
      await database.get('template_exercises').create((te: any) => {
        te.template.set(pushTemplate!);
        te.exercise.set(pushExs[i]);
        te.order = i;
        te.intention = i < 2 ? 'strength' : 'hypertrophy';
        te.targetSets = i < 2 ? 4 : 3;
        te.repRangeMin = i < 2 ? 4 : 10;
        te.repRangeMax = i < 2 ? 6 : 15;
        te.rpeTarget = 8;
        te.restSeconds = i < 2 ? 180 : 90;
        te.updatedAt = now;
      });
    }

    const pullExs = [pullUp, bbRow, latPulldown, cableRow, ezCurl, facePull];
    for (let i = 0; i < pullExs.length; i++) {
      await database.get('template_exercises').create((te: any) => {
        te.template.set(pullTemplate!);
        te.exercise.set(pullExs[i]);
        te.order = i;
        te.intention = i < 2 ? 'strength' : 'hypertrophy';
        te.targetSets = i < 2 ? 4 : 3;
        te.repRangeMin = i < 2 ? 4 : 8;
        te.repRangeMax = i < 2 ? 6 : 12;
        te.rpeTarget = 8;
        te.restSeconds = i < 2 ? 180 : 90;
        te.updatedAt = now;
      });
    }

    const legsExs = [squat, rdl, legPress, legCurl, cableCrunch];
    for (let i = 0; i < legsExs.length; i++) {
      await database.get('template_exercises').create((te: any) => {
        te.template.set(legsTemplate!);
        te.exercise.set(legsExs[i]);
        te.order = i;
        te.intention = i < 2 ? 'strength' : 'hypertrophy';
        te.targetSets = i < 2 ? 4 : 3;
        te.repRangeMin = i < 2 ? 5 : 10;
        te.repRangeMax = i < 2 ? 8 : 15;
        te.rpeTarget = 8;
        te.restSeconds = i < 2 ? 210 : 90;
        te.updatedAt = now;
      });
    }
  });

  // ── 3. Macrocycle + Mésocycles + Microcycles ─────────────────────────────────
  // Macrocycle "Hypertrophie 2026" : -12 sem. → now+8 sem.
  // Méso 1 : Accumulation (-12 → -8 sem.), terminé
  // Méso 2 : Hypertrophie (-4 sem. → +4 sem.), en cours

  let macro: Macrocycle;
  let mesoAccum: Mesocycle;
  let mesoHyp: Mesocycle;

  await database.write(async () => {
    macro = await database.get<Macrocycle>('macrocycles').create((m: any) => {
      m.name = 'Hypertrophie 2026';
      m.goalDescription = 'Bloc PPL structuré · objectif +3 kg muscle maigre sur 6 mois';
      m.startDate = weeksAgo(12);
      m.endDate = daysFromNow(8 * 7);
      m.updatedAt = now;
    });

    mesoAccum = await database.get<Mesocycle>('mesocycles').create((m: any) => {
      m.macrocycleId = macro.id;
      m.name = 'Accumulation';
      m.blockType = 'accumulation';
      m.startDate = weeksAgo(12);
      m.endDate = weeksAgo(8);
      m.weekPattern = [
        { isoDay: 1, templateId: pushTemplate!.id },
        { isoDay: 3, templateId: pullTemplate!.id },
        { isoDay: 5, templateId: legsTemplate!.id },
      ];
      m.notes = 'Priorité volume, charges modérées, RPE 7-8 max';
      m.updatedAt = now;
    });

    mesoHyp = await database.get<Mesocycle>('mesocycles').create((m: any) => {
      m.macrocycleId = macro.id;
      m.name = 'Hypertrophie';
      m.blockType = 'hypertrophy';
      m.startDate = weeksAgo(4);
      m.endDate = daysFromNow(4 * 7);
      m.weekPattern = [
        { isoDay: 1, templateId: pushTemplate!.id },
        { isoDay: 3, templateId: pullTemplate!.id },
        { isoDay: 5, templateId: legsTemplate!.id },
      ];
      m.notes = 'Progresser sur les composés chaque semaine · finisher en drop sets semaine 3';
      m.updatedAt = now;
    });
  });

  // Microcycles — 4 semaines par mésocycle
  await database.write(async () => {
    // Méso Accumulation (terminé)
    const accumMicros: Array<{ label: string; vol: number }> = [
      { label: 'accumulation', vol: 80 },
      { label: 'accumulation', vol: 90 },
      { label: 'accumulation', vol: 100 },
      { label: 'deload', vol: 60 },
    ];
    for (let i = 0; i < accumMicros.length; i++) {
      await database.get('microcycles').create((mc: any) => {
        mc.mesocycleId = mesoAccum!.id;
        mc.weekNumber = i + 1;
        mc.label = accumMicros[i].label;
        mc.volumePct = accumMicros[i].vol;
        mc.notes = null;
        mc.updatedAt = now;
      });
    }

    // Méso Hypertrophie (en cours — S2 active)
    const hypMicros: Array<{ label: string; vol: number; notes: string | null }> = [
      { label: 'accumulation', vol: 80, notes: null },
      { label: 'intensification', vol: 90, notes: 'Semaine en cours — pousser les charges' },
      { label: 'intensification', vol: 100, notes: 'Drop sets sur isolation' },
      { label: 'deload', vol: 60, notes: null },
    ];
    for (let i = 0; i < hypMicros.length; i++) {
      await database.get('microcycles').create((mc: any) => {
        mc.mesocycleId = mesoHyp!.id;
        mc.weekNumber = i + 1;
        mc.label = hypMicros[i].label;
        mc.volumePct = hypMicros[i].vol;
        mc.notes = hypMicros[i].notes;
        mc.updatedAt = now;
      });
    }
  });

  // ── 4. Sessions historiques (4 semaines, Push/Pull/Legs) ─────────────────────
  // Distribution variée pour tester la heatmap fréquence :
  //   S-4 : Push + Pull + Legs (3 séances, tous groupes)
  //   S-3 : Push + Pull + Legs (3 séances, tous groupes)
  //   S-2 : Push + Pull + Legs (3 séances, tous groupes)
  //   S-1 : Push + Pull (2 séances, pas de Legs → heatmap montre le gap)
  // + 1 séance "spéciale" avec types avancés (drop/myoreps)

  type SessionPlan = {
    day: number;
    type: 'push' | 'pull' | 'legs' | 'upper';
    dur: number;
    notes?: string;
    exs: Array<{
      ex: Exercise;
      wu: number;
      w: number;
      reps: number;
      sets: number;
      intent: 'hypertrophy' | 'strength' | 'power' | 'endurance' | 'metabolic';
      exNotes?: string;
    }>;
  };

  const sessionPlan: SessionPlan[] = [
    // ── Week -4 ───────────────────────────────────────────────────────────────
    {
      day: 26, type: 'push', dur: 65,
      exs: [
        { ex: benchPress, wu: 50, w: 82.5, reps: 5, sets: 4, intent: 'strength' },
        { ex: ohPress,    wu: 30, w: 55,   reps: 5, sets: 4, intent: 'strength' },
        { ex: lateralRaise, wu: 6, w: 12,  reps: 15, sets: 3, intent: 'hypertrophy' },
        { ex: pushdown,   wu: 15, w: 30,   reps: 12, sets: 3, intent: 'hypertrophy' },
        { ex: cableFly,   wu: 10, w: 20,   reps: 15, sets: 3, intent: 'hypertrophy' },
      ],
    },
    {
      day: 24, type: 'pull', dur: 70,
      exs: [
        { ex: pullUp,     wu: 0,  w: 10,   reps: 5,  sets: 4, intent: 'strength' },
        { ex: bbRow,      wu: 40, w: 80,   reps: 5,  sets: 4, intent: 'strength' },
        { ex: latPulldown,wu: 35, w: 65,   reps: 10, sets: 3, intent: 'hypertrophy' },
        { ex: ezCurl,     wu: 20, w: 37.5, reps: 10, sets: 3, intent: 'hypertrophy' },
        { ex: facePull,   wu: 15, w: 25,   reps: 15, sets: 3, intent: 'hypertrophy' },
      ],
    },
    {
      day: 22, type: 'legs', dur: 75,
      notes: 'Bonne séance, squat fluide. RDL à monter la semaine prochaine.',
      exs: [
        { ex: squat,    wu: 60, w: 110,  reps: 6,  sets: 4, intent: 'strength' },
        { ex: rdl,      wu: 50, w: 90,   reps: 8,  sets: 4, intent: 'hypertrophy' },
        { ex: legPress, wu: 80, w: 160,  reps: 12, sets: 3, intent: 'hypertrophy' },
        { ex: legCurl,  wu: 25, w: 50,   reps: 12, sets: 3, intent: 'hypertrophy' },
      ],
    },
    // ── Week -3 ───────────────────────────────────────────────────────────────
    {
      day: 19, type: 'push', dur: 68,
      exs: [
        { ex: benchPress, wu: 50, w: 85,   reps: 5,  sets: 4, intent: 'strength' },
        { ex: ohPress,    wu: 30, w: 57.5, reps: 5,  sets: 4, intent: 'strength' },
        { ex: lateralRaise,wu:6,  w: 13,   reps: 15, sets: 3, intent: 'hypertrophy' },
        { ex: pushdown,   wu: 15, w: 32.5, reps: 12, sets: 3, intent: 'hypertrophy' },
        { ex: inclineDB,  wu: 16, w: 30,   reps: 10, sets: 3, intent: 'hypertrophy' },
      ],
    },
    {
      day: 17, type: 'pull', dur: 72,
      exs: [
        { ex: pullUp,     wu: 0,  w: 12.5, reps: 5,  sets: 4, intent: 'strength' },
        { ex: bbRow,      wu: 40, w: 82.5, reps: 5,  sets: 4, intent: 'strength' },
        { ex: latPulldown,wu: 35, w: 67.5, reps: 10, sets: 3, intent: 'hypertrophy' },
        { ex: ezCurl,     wu: 20, w: 40,   reps: 10, sets: 3, intent: 'hypertrophy' },
        { ex: cableRow,   wu: 25, w: 50,   reps: 12, sets: 3, intent: 'hypertrophy' },
      ],
    },
    {
      day: 15, type: 'legs', dur: 80,
      notes: 'Fatigue en fin de séance. Presse OK mais squat chargé.',
      exs: [
        { ex: squat,       wu: 60, w: 112.5, reps: 6,  sets: 4, intent: 'strength' },
        { ex: rdl,         wu: 50, w: 92.5,  reps: 8,  sets: 4, intent: 'hypertrophy' },
        { ex: legPress,    wu: 80, w: 165,   reps: 12, sets: 3, intent: 'hypertrophy' },
        { ex: legCurl,     wu: 25, w: 52.5,  reps: 12, sets: 3, intent: 'hypertrophy' },
        { ex: cableCrunch, wu: 20, w: 35,    reps: 15, sets: 3, intent: 'hypertrophy' },
      ],
    },
    // ── Week -2 ───────────────────────────────────────────────────────────────
    {
      day: 12, type: 'push', dur: 65,
      exs: [
        { ex: benchPress, wu: 55, w: 87.5, reps: 5,  sets: 4, intent: 'strength' },
        { ex: ohPress,    wu: 30, w: 60,   reps: 5,  sets: 4, intent: 'strength' },
        { ex: lateralRaise,wu: 8, w: 14,   reps: 15, sets: 3, intent: 'hypertrophy' },
        { ex: pushdown,   wu: 15, w: 35,   reps: 12, sets: 3, intent: 'hypertrophy' },
        { ex: cableFly,   wu: 10, w: 22.5, reps: 15, sets: 3, intent: 'hypertrophy' },
      ],
    },
    {
      day: 10, type: 'pull', dur: 68,
      exs: [
        { ex: pullUp,      wu: 0,  w: 15,  reps: 5,  sets: 4, intent: 'strength' },
        { ex: bbRow,       wu: 40, w: 85,  reps: 5,  sets: 4, intent: 'strength' },
        { ex: latPulldown, wu: 35, w: 70,  reps: 10, sets: 3, intent: 'hypertrophy' },
        { ex: ezCurl,      wu: 20, w: 40,  reps: 10, sets: 3, intent: 'hypertrophy' },
        { ex: inclineCurl, wu: 8,  w: 14,  reps: 12, sets: 3, intent: 'hypertrophy' },
      ],
    },
    {
      day: 8, type: 'legs', dur: 82,
      exs: [
        { ex: squat,    wu: 60, w: 115,  reps: 6,  sets: 4, intent: 'strength' },
        { ex: rdl,      wu: 50, w: 95,   reps: 8,  sets: 4, intent: 'hypertrophy' },
        { ex: legPress, wu: 80, w: 170,  reps: 12, sets: 3, intent: 'hypertrophy' },
        { ex: legCurl,  wu: 25, w: 55,   reps: 12, sets: 3, intent: 'hypertrophy' },
      ],
    },
    // ── Week -1 (Legs volontairement absent → heatmap gap) ───────────────────
    {
      day: 5, type: 'push', dur: 70,
      notes: 'PR incliné haltères à 34 kg ! Volume total élevé.',
      exs: [
        { ex: benchPress, wu: 55, w: 90,   reps: 5,  sets: 4, intent: 'strength',
          exNotes: 'Bonne touche, coudes légèrement rentrés' },
        { ex: ohPress,    wu: 30, w: 62.5, reps: 5,  sets: 4, intent: 'strength' },
        { ex: lateralRaise,wu: 8, w: 15,   reps: 15, sets: 4, intent: 'hypertrophy' },
        { ex: pushdown,   wu: 20, w: 37.5, reps: 12, sets: 3, intent: 'hypertrophy' },
        { ex: inclineDB,  wu: 18, w: 34,   reps: 10, sets: 3, intent: 'hypertrophy',
          exNotes: 'PR !' },
      ],
    },
    {
      day: 3, type: 'pull', dur: 75,
      notes: 'Tractions à +20 kg, meilleure série depuis longtemps.',
      exs: [
        { ex: pullUp,     wu: 0,  w: 17.5, reps: 5,  sets: 4, intent: 'strength',
          exNotes: 'Meilleure technique que la semaine dernière, plus d\'amplitude' },
        { ex: bbRow,      wu: 40, w: 87.5, reps: 5,  sets: 4, intent: 'strength' },
        { ex: latPulldown,wu: 35, w: 72.5, reps: 10, sets: 3, intent: 'hypertrophy' },
        { ex: facePull,   wu: 15, w: 27.5, reps: 15, sets: 3, intent: 'hypertrophy' },
        { ex: ezCurl,     wu: 20, w: 42.5, reps: 10, sets: 3, intent: 'hypertrophy' },
      ],
    },
    // ── Séance spéciale : drop sets + myoreps (hier) ─────────────────────────
    // Incluse séparément via addAdvancedExercise
  ];

  for (const plan of sessionPlan) {
    const started = daysAgo(plan.day);
    const ended = new Date(started.getTime() + plan.dur * 60 * 1000);
    const name = plan.type === 'push' ? 'Push A' : plan.type === 'pull' ? 'Pull A' : plan.type === 'legs' ? 'Legs A' : 'Upper';

    await database.write(async () => {
      const session = await database.get<Session>('sessions').create((s: any) => {
        s.name = name;
        s.startedAt = started;
        s.endedAt = ended;
        s.notes = plan.notes ?? null;
        s.updatedAt = ended;
      });

      for (let i = 0; i < plan.exs.length; i++) {
        const e = plan.exs[i];
        await addExerciseWithSets(session, e.ex, i, e.intent, e.wu, e.w, e.reps, e.sets, started, e.exNotes);
      }
    });
  }

  // ── Séance avancée (hier) — drop sets + myoreps ───────────────────────────
  await database.write(async () => {
    const advStart = daysAgo(1, 17);
    const advEnd = new Date(advStart.getTime() + 55 * 60 * 1000);

    const session = await database.get<Session>('sessions').create((s: any) => {
      s.name = 'Upper — Techniques avancées';
      s.startedAt = advStart;
      s.endedAt = advEnd;
      s.notes = 'Protocole drop sets sur isolation · myoreps sur curl · bonne pompe globale';
      s.updatedAt = advEnd;
    });

    await addExerciseWithSets(session, benchPress, 0, 'strength', 60, 92.5, 5, 4, advStart);
    await addExerciseWithSets(session, pullUp, 1, 'strength', 0, 20, 5, 4, advStart);
    await addAdvancedExercise(session, cableFly, 2, 25, 15, advStart);
    await addAdvancedExercise(session, ezCurl, 3, 42.5, 10, advStart);
    await addExerciseWithSets(session, lateralRaise, 4, 'hypertrophy', 0, 15, 15, 4, advStart,
      'Tempo 3-0-X-1 — brûlure intense');
  });

  // ── 5. Séances planifiées ─────────────────────────────────────────────────────

  await database.write(async () => {
    const sched = [
      { daysFromN: 1,  tmpl: pushTemplate!, title: 'Push A' },
      { daysFromN: 3,  tmpl: pullTemplate!, title: 'Pull A' },
      { daysFromN: 5,  tmpl: legsTemplate!, title: 'Legs A' },
      { daysFromN: 8,  tmpl: pushTemplate!, title: 'Push A' },
      { daysFromN: 10, tmpl: pullTemplate!, title: 'Pull A' },
      { daysFromN: 12, tmpl: legsTemplate!, title: 'Legs A' },
    ];

    for (const s of sched) {
      await database.get('scheduled_sessions').create((ss: any) => {
        ss.templateId = s.tmpl.id;
        ss.plannedDate = daysFromNow(s.daysFromN);
        ss.title = s.title;
        ss.blockType = 'hypertrophy';
        ss.updatedAt = now;
      });
    }
  });
}

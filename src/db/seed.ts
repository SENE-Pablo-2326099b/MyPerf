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

// ── Scénario ──────────────────────────────────────────────────────────────────
//
// Pablo, 25 ans, intermédiaire. Objectif : hypertrophie — prise de masse.
// Programme PPL 3j/semaine.
//
// PLANNING
//   Macrocycle "PPL Hypertrophie — Printemps 2026" (janv → juil)
//   Méso 1 "Accumulation" : terminé (sem. -12 → sem. -8)
//   Méso 2 "Hypertrophie"  : en cours, sem. 3/4 (sem. -4 → sem. +4)
//
// HISTORIQUE (9 séances sur 3 semaines)
//   Sem. -3 (accumulation légère) : Push j-20, Pull j-18, Legs j-16
//   Sem. -2 (build-up)            : Push j-13, Pull j-11, Legs j-9
//   Sem. -1 (intensification)     : Push j-6, Pull j-4, Legs j-3
//                                   ← CETTE SEMAINE, dans les 7 jours
//   Hier                          : Push j-1  ← PR ! 2e push cette semaine
//
// FEATURES TESTÉES
//   ✅ Bibliothèque exercices (17 exos, tous groupes)
//   ✅ Historique + détail séance
//   ✅ Progression des charges (+2.5 kg/séance sur composés)
//   ✅ Ghost sets (valeurs séance précédente dans SetRow)
//   ✅ Bandeau objectifs template (targetSets, repRange, RPE, repos)
//   ✅ Timer de repos personnalisé (restSeconds par exercice)
//   ✅ Types de séries avancés : drop set + myoreps dans séance hier
//   ✅ Carte musculaire : chest=above_mav (jaune), back=mav (vert),
//                         legs=0 (gris), shoulders/arms=mav (vert)
//   ✅ Heatmap fréquence 4 semaines
//   ✅ Volume bars MEV/MAV/MRV avec couleurs variées
//   ✅ PR (records progressifs sur tous composés)
//   ✅ Graphique de progression par exercice
//   ✅ Métriques corps : 8 semaines, progression poids +3 kg, bras +1.5 cm
//   ✅ Readiness/fatigue : 6 jours variés (vert/orange/rouge)
//                          aujourd'hui ABSENT → teste "Évaluer ta forme"
//   ✅ Ratio A:C ≈ 1.55 → alerte "Ratio > 1.3"
//   ✅ Planning : macrocycle + 2 mésocycles + microcycles + séances prévues

// ── Exercises ─────────────────────────────────────────────────────────────────

const EXERCISE_DEFS = [
  // POITRINE
  { name: 'Développé couché barre', primaryMuscleGroup: 'chest', secondaryMuscleGroups: ['shoulders', 'arms'], specificMuscles: ['pec_mid', 'pec_lower', 'front_delt', 'tricep_long'], equipment: 'barbell' as const, exerciseType: 'compound' as const, isUnilateral: false, grip: 'pronation' as const, workingAngle: 'flat' as const },
  { name: 'Développé incliné haltères', primaryMuscleGroup: 'chest', secondaryMuscleGroups: ['shoulders'], specificMuscles: ['pec_upper', 'front_delt'], equipment: 'dumbbell' as const, exerciseType: 'compound' as const, isUnilateral: false, grip: 'neutral' as const, workingAngle: 'incline' as const },
  { name: 'Écarté poulie basse', primaryMuscleGroup: 'chest', secondaryMuscleGroups: [], specificMuscles: ['pec_mid', 'pec_upper', 'serratus'], equipment: 'cable' as const, exerciseType: 'isolation' as const, isUnilateral: false, grip: 'neutral' as const, workingAngle: 'low_pulley' as const },
  // DOS
  { name: 'Traction', primaryMuscleGroup: 'back', secondaryMuscleGroups: ['arms'], specificMuscles: ['lats', 'teres_major', 'bicep_long'], equipment: 'bodyweight' as const, exerciseType: 'compound' as const, isUnilateral: false, grip: 'pronation' as const, workingAngle: null },
  { name: 'Rowing barre', primaryMuscleGroup: 'back', secondaryMuscleGroups: ['arms'], specificMuscles: ['lats', 'mid_traps', 'rhomboids', 'bicep_long'], equipment: 'barbell' as const, exerciseType: 'compound' as const, isUnilateral: false, grip: 'pronation' as const, workingAngle: null },
  { name: 'Tirage vertical poulie', primaryMuscleGroup: 'back', secondaryMuscleGroups: ['arms'], specificMuscles: ['lats', 'teres_major', 'brachialis'], equipment: 'machine' as const, exerciseType: 'isolation' as const, isUnilateral: false, grip: 'pronation' as const, workingAngle: 'high_pulley' as const },
  { name: 'Rowing poulie basse', primaryMuscleGroup: 'back', secondaryMuscleGroups: ['arms'], specificMuscles: ['mid_traps', 'rhomboids', 'lats'], equipment: 'cable' as const, exerciseType: 'isolation' as const, isUnilateral: false, grip: 'neutral' as const, workingAngle: 'low_pulley' as const },
  // ÉPAULES
  { name: 'Développé militaire barre', primaryMuscleGroup: 'shoulders', secondaryMuscleGroups: ['arms'], specificMuscles: ['front_delt', 'mid_delt', 'tricep_long'], equipment: 'barbell' as const, exerciseType: 'compound' as const, isUnilateral: false, grip: 'pronation' as const, workingAngle: 'overhead' as const },
  { name: 'Élévations latérales', primaryMuscleGroup: 'shoulders', secondaryMuscleGroups: [], specificMuscles: ['mid_delt'], equipment: 'dumbbell' as const, exerciseType: 'isolation' as const, isUnilateral: false, grip: 'neutral' as const, workingAngle: null },
  { name: 'Face pull', primaryMuscleGroup: 'shoulders', secondaryMuscleGroups: ['back'], specificMuscles: ['rear_delt', 'mid_traps', 'rotator_cuff'], equipment: 'cable' as const, exerciseType: 'isolation' as const, isUnilateral: false, grip: 'neutral' as const, workingAngle: 'high_pulley' as const },
  // JAMBES
  { name: 'Squat barre arrière', primaryMuscleGroup: 'legs', secondaryMuscleGroups: ['core'], specificMuscles: ['quads', 'glutes', 'hamstrings'], equipment: 'barbell' as const, exerciseType: 'compound' as const, isUnilateral: false, grip: null, workingAngle: null },
  { name: 'Romanian Deadlift', primaryMuscleGroup: 'legs', secondaryMuscleGroups: ['back'], specificMuscles: ['hamstrings', 'glutes', 'lower_back'], equipment: 'barbell' as const, exerciseType: 'compound' as const, isUnilateral: false, grip: 'pronation' as const, workingAngle: null },
  { name: 'Presse à cuisses', primaryMuscleGroup: 'legs', secondaryMuscleGroups: [], specificMuscles: ['quads', 'glutes'], equipment: 'machine' as const, exerciseType: 'compound' as const, isUnilateral: false, grip: null, workingAngle: null },
  { name: 'Leg curl assis', primaryMuscleGroup: 'legs', secondaryMuscleGroups: [], specificMuscles: ['hamstrings'], equipment: 'machine' as const, exerciseType: 'isolation' as const, isUnilateral: false, grip: null, workingAngle: null },
  // BRAS
  { name: 'Curl EZ barre', primaryMuscleGroup: 'arms', secondaryMuscleGroups: [], specificMuscles: ['bicep_long', 'bicep_short', 'brachialis'], equipment: 'ez_bar' as const, exerciseType: 'isolation' as const, isUnilateral: false, grip: 'supination' as const, workingAngle: null },
  { name: 'Pushdown triceps poulie', primaryMuscleGroup: 'arms', secondaryMuscleGroups: [], specificMuscles: ['tricep_lateral', 'tricep_medial', 'tricep_long'], equipment: 'cable' as const, exerciseType: 'isolation' as const, isUnilateral: false, grip: 'pronation' as const, workingAngle: 'high_pulley' as const },
  // CORE
  { name: 'Crunch poulie haute', primaryMuscleGroup: 'core', secondaryMuscleGroups: [], specificMuscles: ['rectus', 'lower_abs'], equipment: 'cable' as const, exerciseType: 'isolation' as const, isUnilateral: false, grip: 'neutral' as const, workingAngle: 'high_pulley' as const },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  tempo?: { ecc?: number; conc?: number },
) {
  await database.get<any>('working_sets').create((ws: any) => {
    ws.exerciseInstance.set(instance);
    ws.setNumber = setNumber;
    ws.setType = setType;
    ws.weight = weight;
    ws.reps = reps;
    ws.rpe = rpe;
    ws.rir = rir;
    ws.tempoEccentric = tempo?.ecc ?? (setType === 'warmup' ? 2 : 3);
    ws.tempoPauseBottom = 0;
    ws.tempoConcentric = tempo?.conc ?? (setType === 'warmup' ? 1 : -1);
    ws.tempoPauseTop = 0;
    ws.isIsometric = false;
    ws.completed = true;
    ws.completedAt = completedAt;
    ws.updatedAt = completedAt;
  });
}

// Crée une instance + séries standards (1 chauffe + N travail)
async function addExercise(
  session: Session,
  exercise: Exercise,
  order: number,
  opts: {
    intention: 'hypertrophy' | 'strength' | 'power' | 'endurance' | 'metabolic';
    warmupWeight: number;   // 0 = pas de chauffe
    workWeight: number;
    reps: number;           // nombre de reps travail (dernière série -1)
    sets: number;           // séries de travail
    rpeStart: number;       // RPE première série
    targetSets: number;
    repMin: number;
    repMax: number;
    rpeTarget: number;
    restSec: number;
    sessionStart: Date;
    notes?: string;
    lastSetDrop?: boolean;  // dernière série en drop set (-25%)
  },
): Promise<ExerciseInstance> {
  const instance = await database.get<ExerciseInstance>('exercise_instances').create((ei: any) => {
    ei.session.set(session);
    ei.exercise.set(exercise);
    ei.order = order;
    ei.intention = opts.intention;
    ei.targetSets = opts.targetSets;
    ei.repRangeMin = opts.repMin;
    ei.repRangeMax = opts.repMax;
    ei.rpeTarget = opts.rpeTarget;
    ei.restSeconds = opts.restSec;
    ei.notes = opts.notes ?? null;
    ei.updatedAt = opts.sessionStart;
  });

  const base = opts.sessionStart.getTime() + order * 14 * 60 * 1000;
  let setNum = 1;

  // Chauffe
  if (opts.warmupWeight > 0) {
    await addSet(instance, setNum++, 'warmup', opts.warmupWeight, opts.reps + 4, null, null, new Date(base + 60_000));
  }

  // Séries de travail
  for (let i = 0; i < opts.sets; i++) {
    const isLast = i === opts.sets - 1;
    const rpe = opts.rpeStart + (isLast ? 1 : 0);
    const reps = isLast ? opts.reps : opts.reps + 1;
    const rir = rpe >= 10 ? 0 : 10 - rpe;
    await addSet(
      instance, setNum++, 'working',
      opts.workWeight, reps, rpe, rir,
      new Date(base + (i + 2) * (opts.restSec + 30) * 1000),
    );
  }

  // Drop set sur dernière série (showcase type avancé)
  if (opts.lastSetDrop) {
    const dropW = Math.round(opts.workWeight * 0.75 * 4) / 4;
    await addSet(instance, setNum++, 'drop', dropW, opts.reps + 4, 9, 0,
      new Date(base + (opts.sets + 2) * (opts.restSec + 30) * 1000 + 20_000));
    // Cluster myoreps
    await addSet(instance, setNum++, 'myoreps', dropW, 5, 10, 0,
      new Date(base + (opts.sets + 2) * (opts.restSec + 30) * 1000 + 50_000));
    await addSet(instance, setNum++, 'myoreps', dropW, 4, 10, 0,
      new Date(base + (opts.sets + 2) * (opts.restSec + 30) * 1000 + 80_000));
  }

  return instance;
}

// ── Seed principal ────────────────────────────────────────────────────────────

export async function seedDatabase(): Promise<void> {
  const now = new Date();

  // ── 1. Exercices ─────────────────────────────────────────────────────────────

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
    bench, inclineDB, cableFly,          // chest  (0-2)
    pullup, bbRow, latPulldown, cableRow, // back   (3-6)
    ohPress, lateralRaise, facePull,      // shoulders (7-9)
    squat, rdl, legPress, legCurl,        // legs   (10-13)
    ezCurl, pushdown,                     // arms   (14-15)
    crunch,                               // core   (16)
  ] = exercises;

  // ── 2. Templates PPL ─────────────────────────────────────────────────────────

  let tmplPush: WorkoutTemplate;
  let tmplPull: WorkoutTemplate;
  let tmplLegs: WorkoutTemplate;

  await database.write(async () => {
    tmplPush = await database.get<WorkoutTemplate>('workout_templates').create((t: any) => {
      t.name = 'Push A';
      t.notes = 'Poitrine · Épaules · Triceps';
      t.updatedAt = now;
    });
    tmplPull = await database.get<WorkoutTemplate>('workout_templates').create((t: any) => {
      t.name = 'Pull A';
      t.notes = 'Dos · Biceps · Deltoïdes arrière';
      t.updatedAt = now;
    });
    tmplLegs = await database.get<WorkoutTemplate>('workout_templates').create((t: any) => {
      t.name = 'Legs A';
      t.notes = 'Quadriceps · Ischios · Fessiers';
      t.updatedAt = now;
    });

    // Push A : bench (force) → incliné (hyp) → élévations → pushdown → écarté
    const pushExs = [
      { ex: bench,        intent: 'strength',    sets: 4, repMin: 4, repMax: 6, rpe: 8, rest: 180 },
      { ex: inclineDB,    intent: 'hypertrophy', sets: 3, repMin: 8, repMax: 12, rpe: 8, rest: 120 },
      { ex: lateralRaise, intent: 'hypertrophy', sets: 4, repMin: 12, repMax: 15, rpe: 8, rest: 60 },
      { ex: pushdown,     intent: 'hypertrophy', sets: 4, repMin: 10, repMax: 15, rpe: 8, rest: 60 },
      { ex: cableFly,     intent: 'hypertrophy', sets: 3, repMin: 12, repMax: 15, rpe: 9, rest: 60 },
    ] as const;
    for (let i = 0; i < pushExs.length; i++) {
      const p = pushExs[i];
      await database.get('template_exercises').create((te: any) => {
        te.templateId = tmplPush!.id;
        te.exerciseId = p.ex.id;
        te.order = i;
        te.intention = p.intent;
        te.targetSets = p.sets;
        te.repRangeMin = p.repMin;
        te.repRangeMax = p.repMax;
        te.rpeTarget = p.rpe;
        te.restSeconds = p.rest;
        te.updatedAt = now;
      });
    }

    // Pull A : traction (force) → rowing (force) → tirage → face pull → curl
    const pullExs = [
      { ex: pullup,      intent: 'strength',    sets: 4, repMin: 4, repMax: 6, rpe: 8, rest: 180 },
      { ex: bbRow,       intent: 'strength',    sets: 4, repMin: 4, repMax: 6, rpe: 8, rest: 180 },
      { ex: latPulldown, intent: 'hypertrophy', sets: 3, repMin: 8, repMax: 12, rpe: 8, rest: 90 },
      { ex: facePull,    intent: 'hypertrophy', sets: 3, repMin: 15, repMax: 20, rpe: 8, rest: 60 },
      { ex: ezCurl,      intent: 'hypertrophy', sets: 4, repMin: 8, repMax: 12, rpe: 8, rest: 60 },
    ] as const;
    for (let i = 0; i < pullExs.length; i++) {
      const p = pullExs[i];
      await database.get('template_exercises').create((te: any) => {
        te.templateId = tmplPull!.id;
        te.exerciseId = p.ex.id;
        te.order = i;
        te.intention = p.intent;
        te.targetSets = p.sets;
        te.repRangeMin = p.repMin;
        te.repRangeMax = p.repMax;
        te.rpeTarget = p.rpe;
        te.restSeconds = p.rest;
        te.updatedAt = now;
      });
    }

    // Legs A : squat (force) → RDL → presse → leg curl → crunch
    const legsExs = [
      { ex: squat,    intent: 'strength',    sets: 4, repMin: 5, repMax: 8, rpe: 8, rest: 210 },
      { ex: rdl,      intent: 'hypertrophy', sets: 4, repMin: 8, repMax: 10, rpe: 8, rest: 180 },
      { ex: legPress, intent: 'hypertrophy', sets: 3, repMin: 10, repMax: 15, rpe: 8, rest: 120 },
      { ex: legCurl,  intent: 'hypertrophy', sets: 3, repMin: 10, repMax: 15, rpe: 8, rest: 90 },
      { ex: crunch,   intent: 'hypertrophy', sets: 3, repMin: 15, repMax: 20, rpe: 8, rest: 60 },
    ] as const;
    for (let i = 0; i < legsExs.length; i++) {
      const p = legsExs[i];
      await database.get('template_exercises').create((te: any) => {
        te.templateId = tmplLegs!.id;
        te.exerciseId = p.ex.id;
        te.order = i;
        te.intention = p.intent;
        te.targetSets = p.sets;
        te.repRangeMin = p.repMin;
        te.repRangeMax = p.repMax;
        te.rpeTarget = p.rpe;
        te.restSeconds = p.rest;
        te.updatedAt = now;
      });
    }
  });

  // ── 3. Macrocycle + Mésocycles + Microcycles ─────────────────────────────────

  let macro: Macrocycle;
  let mesoAccum: Mesocycle;
  let mesoHyp: Mesocycle;

  await database.write(async () => {
    macro = await database.get<Macrocycle>('macrocycles').create((m: any) => {
      m.name = 'PPL Hypertrophie — Printemps 2026';
      m.goalDescription = '+3-4 kg de masse maigre · Bench 100 kg · Squat 120 kg · Traction +25 kg';
      m.startDate = weeksAgo(12);
      m.endDate = daysFromNow(8 * 7);
      m.updatedAt = now;
    });

    mesoAccum = await database.get<Mesocycle>('mesocycles').create((m: any) => {
      m.macrocycleId = macro!.id;
      m.name = 'Accumulation';
      m.blockType = 'accumulation';
      m.startDate = weeksAgo(12);
      m.endDate = weeksAgo(4);
      m.weekPattern = [
        { isoDay: 1, templateId: tmplPush!.id },
        { isoDay: 3, templateId: tmplPull!.id },
        { isoDay: 5, templateId: tmplLegs!.id },
      ];
      m.notes = 'Volume modéré, RPE 7-8. Installer les patterns moteurs avant de charger.';
      m.updatedAt = now;
    });

    mesoHyp = await database.get<Mesocycle>('mesocycles').create((m: any) => {
      m.macrocycleId = macro!.id;
      m.name = 'Hypertrophie';
      m.blockType = 'hypertrophy';
      m.startDate = weeksAgo(4);
      m.endDate = daysFromNow(4 * 7);
      m.weekPattern = [
        { isoDay: 1, templateId: tmplPush!.id },
        { isoDay: 3, templateId: tmplPull!.id },
        { isoDay: 5, templateId: tmplLegs!.id },
      ];
      m.notes = '+2.5 kg/sem sur composés. Sem. 3 : drop sets sur isolation pour intensifier.';
      m.updatedAt = now;
    });
  });

  await database.write(async () => {
    // Méso Accumulation (terminé, 4 semaines)
    const accumWeeks = [
      { label: 'accumulation', vol: 70 },
      { label: 'accumulation', vol: 80 },
      { label: 'intensification', vol: 90 },
      { label: 'deload', vol: 55 },
    ] as const;
    for (let i = 0; i < accumWeeks.length; i++) {
      await database.get('microcycles').create((mc: any) => {
        mc.mesocycleId = mesoAccum!.id;
        mc.weekNumber = i + 1;
        mc.label = accumWeeks[i].label;
        mc.volumePct = accumWeeks[i].vol;
        mc.notes = null;
        mc.updatedAt = now;
      });
    }

    // Méso Hypertrophie (en cours — sem. 3 active)
    const hypWeeks = [
      { label: 'accumulation',    vol: 80,  notes: null },
      { label: 'accumulation',    vol: 90,  notes: null },
      { label: 'intensification', vol: 100, notes: 'Sem. actuelle — drop sets sur isolation, PR visé sur composés' },
      { label: 'deload',          vol: 60,  notes: 'Décharge : -40% volume, mêmes charges' },
    ] as const;
    for (let i = 0; i < hypWeeks.length; i++) {
      await database.get('microcycles').create((mc: any) => {
        mc.mesocycleId = mesoHyp!.id;
        mc.weekNumber = i + 1;
        mc.label = hypWeeks[i].label;
        mc.volumePct = hypWeeks[i].vol;
        mc.notes = hypWeeks[i].notes;
        mc.updatedAt = now;
      });
    }
  });

  // ── 4. Séances historiques ────────────────────────────────────────────────────
  //
  // Progression sur les charges :
  //   Bench :  80 → 82.5 → 85 → 87.5 kg  (+2.5/sem)
  //   OHP   :  50 → 52.5 → 55 → 57.5 kg
  //   Traction: +5 → +7.5 → +10 → +12.5 kg (lestée)
  //   Rowing :  75 → 77.5 → 80 → 82.5 kg
  //   Squat : 100 → 105 → 110 kg
  //   RDL   :  80 → 85 → 90 kg

  type SessionDef = {
    day: number;
    name: string;
    dur: number;
    notes?: string;
    exs: Array<{
      ex: Exercise;
      wu: number;
      w: number;
      reps: number;
      sets: number;
      intent: 'hypertrophy' | 'strength' | 'power' | 'endurance' | 'metabolic';
      rpeStart: number;
      targetSets: number;
      repMin: number;
      repMax: number;
      rpeTarget: number;
      restSec: number;
      exNotes?: string;
      lastSetDrop?: boolean;
    }>;
  };

  const sessions: SessionDef[] = [
    // ── Semaine -3 · Accumulation (volume léger, 3 séries/exercice) ──────────
    {
      day: 20, name: 'Push A — S1', dur: 60,
      exs: [
        { ex: bench,        wu: 50, w: 80,   reps: 5, sets: 3, intent: 'strength',    rpeStart: 7, targetSets: 4, repMin: 4, repMax: 6,  rpeTarget: 8, restSec: 180 },
        { ex: ohPress,      wu: 30, w: 50,   reps: 5, sets: 3, intent: 'strength',    rpeStart: 7, targetSets: 4, repMin: 4, repMax: 6,  rpeTarget: 8, restSec: 180 },
        { ex: lateralRaise, wu: 6,  w: 12,   reps: 13, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 4, repMin: 12, repMax: 15, rpeTarget: 8, restSec: 60 },
        { ex: pushdown,     wu: 15, w: 30,   reps: 12, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 4, repMin: 10, repMax: 15, rpeTarget: 8, restSec: 60 },
      ],
    },
    {
      day: 18, name: 'Pull A — S1', dur: 65,
      exs: [
        { ex: pullup,       wu: 0,  w: 5,   reps: 5, sets: 3, intent: 'strength',    rpeStart: 7, targetSets: 4, repMin: 4, repMax: 6,  rpeTarget: 8, restSec: 180 },
        { ex: bbRow,        wu: 40, w: 75,  reps: 5, sets: 3, intent: 'strength',    rpeStart: 7, targetSets: 4, repMin: 4, repMax: 6,  rpeTarget: 8, restSec: 180 },
        { ex: latPulldown,  wu: 35, w: 65,  reps: 10, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 3, repMin: 8, repMax: 12, rpeTarget: 8, restSec: 90 },
        { ex: facePull,     wu: 15, w: 25,  reps: 15, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 3, repMin: 15, repMax: 20, rpeTarget: 8, restSec: 60 },
        { ex: ezCurl,       wu: 20, w: 35,  reps: 10, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 4, repMin: 8, repMax: 12, rpeTarget: 8, restSec: 60 },
      ],
    },
    {
      day: 16, name: 'Legs A — S1', dur: 70,
      notes: 'Première séance jambes du méso, charges prudentes.',
      exs: [
        { ex: squat,    wu: 60, w: 100, reps: 6, sets: 3, intent: 'strength',    rpeStart: 7, targetSets: 4, repMin: 5, repMax: 8,  rpeTarget: 8, restSec: 210 },
        { ex: rdl,      wu: 50, w: 80,  reps: 8, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 4, repMin: 8, repMax: 10, rpeTarget: 8, restSec: 180 },
        { ex: legPress, wu: 80, w: 150, reps: 12, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 3, repMin: 10, repMax: 15, rpeTarget: 8, restSec: 120 },
        { ex: legCurl,  wu: 25, w: 45,  reps: 12, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 3, repMin: 10, repMax: 15, rpeTarget: 8, restSec: 90 },
        { ex: crunch,   wu: 20, w: 30,  reps: 15, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 3, repMin: 15, repMax: 20, rpeTarget: 8, restSec: 60 },
      ],
    },
    // ── Semaine -2 · Build-up (volume +1 série, charges +2.5 kg) ─────────────
    {
      day: 13, name: 'Push A — S2', dur: 65,
      exs: [
        { ex: bench,        wu: 50, w: 82.5, reps: 5, sets: 4, intent: 'strength',    rpeStart: 7, targetSets: 4, repMin: 4, repMax: 6,  rpeTarget: 8, restSec: 180 },
        { ex: ohPress,      wu: 30, w: 52.5, reps: 5, sets: 4, intent: 'strength',    rpeStart: 7, targetSets: 4, repMin: 4, repMax: 6,  rpeTarget: 8, restSec: 180 },
        { ex: lateralRaise, wu: 6,  w: 13,   reps: 13, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 4, repMin: 12, repMax: 15, rpeTarget: 8, restSec: 60 },
        { ex: pushdown,     wu: 15, w: 32.5, reps: 12, sets: 4, intent: 'hypertrophy', rpeStart: 7, targetSets: 4, repMin: 10, repMax: 15, rpeTarget: 8, restSec: 60 },
        { ex: cableFly,     wu: 10, w: 18,   reps: 13, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 3, repMin: 12, repMax: 15, rpeTarget: 9, restSec: 60 },
      ],
    },
    {
      day: 11, name: 'Pull A — S2', dur: 68,
      exs: [
        { ex: pullup,       wu: 0,  w: 7.5, reps: 5, sets: 4, intent: 'strength',    rpeStart: 7, targetSets: 4, repMin: 4, repMax: 6,  rpeTarget: 8, restSec: 180 },
        { ex: bbRow,        wu: 40, w: 77.5,reps: 5, sets: 4, intent: 'strength',    rpeStart: 7, targetSets: 4, repMin: 4, repMax: 6,  rpeTarget: 8, restSec: 180 },
        { ex: latPulldown,  wu: 35, w: 67.5,reps: 10, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 3, repMin: 8, repMax: 12, rpeTarget: 8, restSec: 90 },
        { ex: facePull,     wu: 15, w: 27.5,reps: 15, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 3, repMin: 15, repMax: 20, rpeTarget: 8, restSec: 60 },
        { ex: ezCurl,       wu: 20, w: 37.5,reps: 10, sets: 4, intent: 'hypertrophy', rpeStart: 7, targetSets: 4, repMin: 8, repMax: 12, rpeTarget: 8, restSec: 60 },
      ],
    },
    {
      day: 9, name: 'Legs A — S2', dur: 72,
      notes: 'Squat fluide à 105. RDL : sensation dans les ischios parfaite.',
      exs: [
        { ex: squat,    wu: 60, w: 105, reps: 6, sets: 4, intent: 'strength',    rpeStart: 7, targetSets: 4, repMin: 5, repMax: 8,  rpeTarget: 8, restSec: 210 },
        { ex: rdl,      wu: 50, w: 85,  reps: 8, sets: 4, intent: 'hypertrophy', rpeStart: 7, targetSets: 4, repMin: 8, repMax: 10, rpeTarget: 8, restSec: 180 },
        { ex: legPress, wu: 80, w: 155, reps: 12, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 3, repMin: 10, repMax: 15, rpeTarget: 8, restSec: 120 },
        { ex: legCurl,  wu: 25, w: 47.5,reps: 12, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 3, repMin: 10, repMax: 15, rpeTarget: 8, restSec: 90 },
        { ex: crunch,   wu: 20, w: 32.5,reps: 15, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 3, repMin: 15, repMax: 20, rpeTarget: 8, restSec: 60 },
      ],
    },
    // ── Semaine courante · Intensification (dans les 7 jours → volume bars) ──
    {
      day: 6, name: 'Push A — S3', dur: 70,
      exs: [
        { ex: bench,        wu: 50, w: 85,   reps: 5, sets: 4, intent: 'strength',    rpeStart: 8, targetSets: 4, repMin: 4, repMax: 6,  rpeTarget: 8, restSec: 180 },
        { ex: ohPress,      wu: 30, w: 55,   reps: 5, sets: 4, intent: 'strength',    rpeStart: 8, targetSets: 4, repMin: 4, repMax: 6,  rpeTarget: 8, restSec: 180 },
        { ex: lateralRaise, wu: 6,  w: 14,   reps: 13, sets: 4, intent: 'hypertrophy', rpeStart: 7, targetSets: 4, repMin: 12, repMax: 15, rpeTarget: 8, restSec: 60 },
        { ex: pushdown,     wu: 15, w: 35,   reps: 12, sets: 4, intent: 'hypertrophy', rpeStart: 7, targetSets: 4, repMin: 10, repMax: 15, rpeTarget: 8, restSec: 60 },
        { ex: cableFly,     wu: 10, w: 20,   reps: 13, sets: 3, intent: 'hypertrophy', rpeStart: 8, targetSets: 3, repMin: 12, repMax: 15, rpeTarget: 9, restSec: 60 },
      ],
    },
    {
      day: 4, name: 'Pull A — S3', dur: 72,
      notes: 'Traction +10 kg × 5 — PR personnel ! Rowing solide aussi.',
      exs: [
        { ex: pullup,       wu: 0,  w: 10,  reps: 5, sets: 4, intent: 'strength',    rpeStart: 8, targetSets: 4, repMin: 4, repMax: 6,  rpeTarget: 8, restSec: 180,
          exNotes: 'PR +10 kg × 5. Meilleure amplitude depuis longtemps.' },
        { ex: bbRow,        wu: 40, w: 80,  reps: 5, sets: 4, intent: 'strength',    rpeStart: 8, targetSets: 4, repMin: 4, repMax: 6,  rpeTarget: 8, restSec: 180 },
        { ex: latPulldown,  wu: 35, w: 70,  reps: 10, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 3, repMin: 8, repMax: 12, rpeTarget: 8, restSec: 90 },
        { ex: facePull,     wu: 15, w: 30,  reps: 15, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 3, repMin: 15, repMax: 20, rpeTarget: 8, restSec: 60 },
        { ex: ezCurl,       wu: 20, w: 40,  reps: 10, sets: 4, intent: 'hypertrophy', rpeStart: 7, targetSets: 4, repMin: 8, repMax: 12, rpeTarget: 8, restSec: 60 },
      ],
    },
    // ── J-3 · Legs A — pour voir les jambes sur la carte musculaire ──────────
    {
      day: 3, name: 'Legs A — S3', dur: 78,
      notes: 'Squat 110 kg × 6 bien maîtrisé. RDL : sensation parfaite dans les ischios.',
      exs: [
        { ex: squat,    wu: 60, w: 110,  reps: 6,  sets: 4, intent: 'strength',    rpeStart: 8, targetSets: 4, repMin: 5,  repMax: 8,  rpeTarget: 8, restSec: 210 },
        { ex: rdl,      wu: 50, w: 90,   reps: 8,  sets: 4, intent: 'hypertrophy', rpeStart: 8, targetSets: 4, repMin: 8,  repMax: 10, rpeTarget: 8, restSec: 180 },
        { ex: legPress, wu: 80, w: 160,  reps: 12, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 3, repMin: 10, repMax: 15, rpeTarget: 8, restSec: 120 },
        { ex: legCurl,  wu: 25, w: 50,   reps: 12, sets: 3, intent: 'hypertrophy', rpeStart: 8, targetSets: 3, repMin: 10, repMax: 15, rpeTarget: 8, restSec: 90  },
        { ex: crunch,   wu: 20, w: 35,   reps: 15, sets: 3, intent: 'hypertrophy', rpeStart: 7, targetSets: 3, repMin: 15, repMax: 20, rpeTarget: 8, restSec: 60  },
      ],
    },
    // ── Hier · Push B — PR bench + drop sets sur écarté ──────────────────────
    {
      day: 1, name: 'Push A — PR', dur: 75,
      notes: 'PR bench 87.5 kg × 5 ! Drop sets sur écarté + myoreps → pompe incroyable.',
      exs: [
        { ex: bench,        wu: 55, w: 87.5, reps: 5, sets: 4, intent: 'strength',    rpeStart: 8, targetSets: 4, repMin: 4, repMax: 6,  rpeTarget: 8, restSec: 180,
          exNotes: 'PR ! Tempo 3-0-X-0 maintenu sur toutes les séries.' },
        { ex: ohPress,      wu: 30, w: 57.5, reps: 5, sets: 4, intent: 'strength',    rpeStart: 8, targetSets: 4, repMin: 4, repMax: 6,  rpeTarget: 8, restSec: 180 },
        { ex: lateralRaise, wu: 6,  w: 15,   reps: 13, sets: 4, intent: 'hypertrophy', rpeStart: 7, targetSets: 4, repMin: 12, repMax: 15, rpeTarget: 8, restSec: 60 },
        { ex: pushdown,     wu: 15, w: 37.5, reps: 12, sets: 4, intent: 'hypertrophy', rpeStart: 8, targetSets: 4, repMin: 10, repMax: 15, rpeTarget: 8, restSec: 60 },
        // Écarté avec drop set + myoreps pour tester les types avancés
        { ex: cableFly,     wu: 10, w: 22.5, reps: 12, sets: 3, intent: 'hypertrophy', rpeStart: 8, targetSets: 3, repMin: 12, repMax: 15, rpeTarget: 9, restSec: 60,
          lastSetDrop: true, exNotes: 'Dernière série : drop -25% + 2 clusters myoreps' },
      ],
    },
  ];

  for (const plan of sessions) {
    const started = daysAgo(plan.day);
    const ended = new Date(started.getTime() + plan.dur * 60 * 1000);

    await database.write(async () => {
      const session = await database.get<Session>('sessions').create((s: any) => {
        s.name = plan.name;
        s.startedAt = started;
        s.endedAt = ended;
        s.notes = plan.notes ?? null;
        s.updatedAt = ended;
      });

      for (let i = 0; i < plan.exs.length; i++) {
        const e = plan.exs[i];
        await addExercise(session, e.ex, i, {
          intention: e.intent,
          warmupWeight: e.wu,
          workWeight: e.w,
          reps: e.reps,
          sets: e.sets,
          rpeStart: e.rpeStart,
          targetSets: e.targetSets,
          repMin: e.repMin,
          repMax: e.repMax,
          rpeTarget: e.rpeTarget,
          restSec: e.restSec,
          sessionStart: started,
          notes: e.exNotes,
          lastSetDrop: e.lastSetDrop,
        });
      }
    });
  }

  // ── 5. Séances planifiées ─────────────────────────────────────────────────────
  // Pas de Legs planifié avant le déload (cohérent avec le skip de cette semaine)

  await database.write(async () => {
    const upcoming = [
      { daysFromN: 2,  tmpl: tmplLegs!, title: 'Legs A',   blockType: 'hypertrophy', vol: 100 },
      { daysFromN: 5,  tmpl: tmplPush!, title: 'Push A',   blockType: 'deload',      vol: 60  },
      { daysFromN: 7,  tmpl: tmplPull!, title: 'Pull A',   blockType: 'deload',      vol: 60  },
      { daysFromN: 9,  tmpl: tmplLegs!, title: 'Legs A',   blockType: 'deload',      vol: 60  },
    ] as const;

    for (const s of upcoming) {
      await database.get('scheduled_sessions').create((ss: any) => {
        ss.templateId = s.tmpl.id;
        ss.plannedDate = daysFromNow(s.daysFromN);
        ss.title = s.title;
        ss.blockType = s.blockType;
        ss.volumePct = s.vol;
        ss.updatedAt = now;
      });
    }
  });

  // ── 6. Métriques corporelles (8 semaines) ────────────────────────────────────
  // Progression : poids +3 kg, % graissse -1.4 pt, bras +1.5 cm (très réaliste)
  // Alternance : semaines paires → poids seul, impaires → bilan complet

  const bodyData = [
    { day: 49, kg: 78.5, fat: 16.0, chest: 100.5, waist: 84.0, hips: 97.0, armL: 37.5, armR: 37.7, thighL: 58.0, thighR: 58.5, notes: null },
    { day: 42, kg: 78.9, fat: null,  chest: null,   waist: 84.2, hips: null,  armL: 37.7, armR: 37.9, thighL: null,  thighR: null,  notes: 'Prise à jeun' },
    { day: 35, kg: 79.4, fat: 15.6,  chest: 101.0,  waist: 84.0, hips: 97.2,  armL: 38.0, armR: 38.2, thighL: 58.5,  thighR: 59.0, notes: null },
    { day: 28, kg: 79.9, fat: null,  chest: null,   waist: 83.8, hips: null,  armL: 38.2, armR: 38.4, thighL: null,  thighR: null,  notes: 'Prise après déload, légère rétention possible' },
    { day: 21, kg: 80.3, fat: 15.2,  chest: 101.5,  waist: 84.1, hips: 97.0,  armL: 38.5, armR: 38.7, thighL: 59.0,  thighR: 59.5, notes: null },
    { day: 14, kg: 80.8, fat: null,  chest: null,   waist: 83.9, hips: null,  armL: 38.7, armR: 38.9, thighL: null,  thighR: null,  notes: 'Bonne semaine, énergie haute' },
    { day: 7,  kg: 81.2, fat: 14.8,  chest: 102.0,  waist: 84.0, hips: 97.5,  armL: 38.9, armR: 39.1, thighL: 59.5,  thighR: 60.0, notes: null },
    { day: 0,  kg: 81.6, fat: null,  chest: null,   waist: 84.2, hips: null,  armL: 39.1, armR: 39.3, thighL: null,  thighR: null,  notes: 'Prise à jeun — bon matin !' },
  ];

  await database.write(async () => {
    for (const d of bodyData) {
      await database.get('body_metrics').create((bm: any) => {
        bm.recordedAt = daysAgo(d.day, 8);
        bm.weightKg = d.kg;
        bm.bodyFatPct = d.fat;
        bm.chestCm = d.chest;
        bm.waistCm = d.waist;
        bm.hipsCm = d.hips;
        bm.leftArmCm = d.armL;
        bm.rightArmCm = d.armR;
        bm.leftThighCm = d.thighL;
        bm.rightThighCm = d.thighR;
        bm.notes = d.notes;
        bm.updatedAt = daysAgo(d.day, 8);
      });
    }
  });

  // ── 7. Forme quotidienne (6 jours, aujourd'hui absent → teste le bouton) ─────
  //
  // score = (sleep + (6-soreness) + (6-stress) + motivation) / 4
  //   j-6 : 3.75 vert  — lendemain Push lourd
  //   j-5 : 4.75 vert  — jour de repos récupération
  //   j-4 : 3.50 vert  — matin avant Pull
  //   j-3 : 2.75 orange — fatigue accumulée (legs auraient dû être j-3)
  //   j-2 : 4.50 vert  — super forme avant PR
  //   j-1 : 3.75 vert  — repos post-PR
  //   j-0 : ABSENT     → "Évaluer ta forme →" s'affiche sur l'écran accueil

  const readinessData = [
    { day: 6, sleep: 4, soreness: 3, stress: 2, moti: 4, notes: 'Bonne nuit. Pecs légèrement courbatus après Push lourd.' },
    { day: 5, sleep: 5, soreness: 2, stress: 1, moti: 5, notes: null },
    { day: 4, sleep: 3, soreness: 3, stress: 3, moti: 4, notes: 'Journée chargée au boulot. Pull prévu ce soir.' },
    { day: 3, sleep: 4, soreness: 4, stress: 3, moti: 3, notes: 'Dos & biceps cramés post-Pull. Fatigue mentale aussi.' },
    { day: 2, sleep: 5, soreness: 2, stress: 2, moti: 5, notes: 'Pleine forme. PR venu naturellement.' },
    { day: 1, sleep: 4, soreness: 3, stress: 2, moti: 4, notes: null },
  ];

  await database.write(async () => {
    for (const r of readinessData) {
      await database.get('daily_readiness').create((dr: any) => {
        dr.recordedAt = daysAgo(r.day, 7);
        dr.sleepQuality = r.sleep;
        dr.soreness = r.soreness;
        dr.stressLevel = r.stress;
        dr.motivation = r.moti;
        dr.notes = r.notes;
        dr.updatedAt = daysAgo(r.day, 7);
      });
    }
  });
}

import { database } from './database';
import type Exercise from './models/Exercise';
import type Session from './models/Session';
import type ExerciseInstance from './models/ExerciseInstance';
import type WorkoutTemplate from './models/WorkoutTemplate';

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
  d.setHours(0, 0, 0, 0);
  return d;
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

// ── Seed helper: working set ───────────────────────────────────────────────────

async function addSet(
  instance: ExerciseInstance,
  setNumber: number,
  setType: 'warmup' | 'working',
  weight: number,
  reps: number,
  rpe: number | null,
  rir: number | null,
  completedAt: Date,
) {
  await database.get<any>('working_sets').create((ws: any) => {
    ws.exerciseInstance.set(instance);
    ws.setNumber = setNumber;
    ws.setType = setType;
    ws.weight = weight;
    ws.reps = reps;
    ws.rpe = rpe;
    ws.rir = rir;
    ws.tempoEccentric = setType === 'warmup' ? 2 : 3;
    ws.tempoPauseBottom = 0;
    ws.tempoConcentric = setType === 'warmup' ? 1 : -1;
    ws.tempoPauseTop = 0;
    ws.isIsometric = false;
    ws.restAfterSeconds = setType === 'warmup' ? 60 : 120;
    ws.completed = true;
    ws.completedAt = completedAt;
    ws.updatedAt = completedAt;
  });
}

// ── Seed helper: exercise instance + sets ─────────────────────────────────────

async function addExerciseWithSets(
  session: Session,
  exercise: Exercise,
  order: number,
  intention: 'hypertrophy' | 'strength',
  warmupWeight: number,
  workingWeight: number,
  reps: number,
  sets: number,
  sessionStart: Date,
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
    ei.restSeconds = 120;
    ei.updatedAt = sessionStart;
  });

  const baseTime = sessionStart.getTime() + order * 10 * 60 * 1000;

  await addSet(instance, 1, 'warmup', warmupWeight, reps + 4, null, null, new Date(baseTime + 60000));
  for (let i = 0; i < sets; i++) {
    const rpeVal = 7 + (i === sets - 1 ? 1 : 0);
    const rirVal = 3 - (i === sets - 1 ? 1 : 0);
    const actualReps = i === sets - 1 ? reps : reps + 1;
    await addSet(instance, i + 2, 'working', workingWeight, actualReps, rpeVal, rirVal, new Date(baseTime + (i + 2) * 180000));
  }

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

  // Named refs for readability
  const [
    benchPress,     // 0
    inclineDB,      // 1
    cableFly,       // 2
    pullUp,         // 3
    bbRow,          // 4
    latPulldown,    // 5
    cableRow,       // 6
    facePull,       // 7
    ohPress,        // 8
    lateralRaise,   // 9
    squat,          // 10
    rdl,            // 11
    legPress,       // 12
    legCurl,        // 13
    ezCurl,         // 14
    pushdown,       // 15
    inclineCurl,    // 16
    cableCrunch,    // 17
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

    // Push A exercises
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

    // Pull A exercises
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

    // Legs A exercises
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

  // ── 3. Historical sessions (4 semaines, Lundi-Mercredi-Vendredi) ─────────────
  // Progression linéaire : +2.5 kg/semaine composés, +1 kg/semaine isolation

  const sessionPlan = [
    // [daysAgo, template, type, weights: [warmup, working], reps, sets]
    // Week -4
    {
      day: 25, type: 'push' as const, dur: 65,
      exs: [
        { ex: benchPress, wu: 50, w: 82.5, reps: 5, sets: 4, intent: 'strength' as const },
        { ex: ohPress, wu: 30, w: 55, reps: 5, sets: 4, intent: 'strength' as const },
        { ex: lateralRaise, wu: 6, w: 12, reps: 15, sets: 3, intent: 'hypertrophy' as const },
        { ex: pushdown, wu: 15, w: 30, reps: 12, sets: 3, intent: 'hypertrophy' as const },
        { ex: cableFly, wu: 10, w: 20, reps: 15, sets: 3, intent: 'hypertrophy' as const },
      ],
    },
    {
      day: 23, type: 'pull' as const, dur: 70,
      exs: [
        { ex: pullUp, wu: 0, w: 10, reps: 5, sets: 4, intent: 'strength' as const },
        { ex: bbRow, wu: 40, w: 80, reps: 5, sets: 4, intent: 'strength' as const },
        { ex: latPulldown, wu: 35, w: 65, reps: 10, sets: 3, intent: 'hypertrophy' as const },
        { ex: ezCurl, wu: 20, w: 37.5, reps: 10, sets: 3, intent: 'hypertrophy' as const },
        { ex: facePull, wu: 15, w: 25, reps: 15, sets: 3, intent: 'hypertrophy' as const },
      ],
    },
    {
      day: 21, type: 'legs' as const, dur: 75,
      exs: [
        { ex: squat, wu: 60, w: 110, reps: 6, sets: 4, intent: 'strength' as const },
        { ex: rdl, wu: 50, w: 90, reps: 8, sets: 4, intent: 'hypertrophy' as const },
        { ex: legPress, wu: 80, w: 160, reps: 12, sets: 3, intent: 'hypertrophy' as const },
        { ex: legCurl, wu: 25, w: 50, reps: 12, sets: 3, intent: 'hypertrophy' as const },
      ],
    },
    // Week -3
    {
      day: 18, type: 'push' as const, dur: 68,
      exs: [
        { ex: benchPress, wu: 50, w: 85, reps: 5, sets: 4, intent: 'strength' as const },
        { ex: ohPress, wu: 30, w: 57.5, reps: 5, sets: 4, intent: 'strength' as const },
        { ex: lateralRaise, wu: 6, w: 13, reps: 15, sets: 3, intent: 'hypertrophy' as const },
        { ex: pushdown, wu: 15, w: 32.5, reps: 12, sets: 3, intent: 'hypertrophy' as const },
        { ex: inclineDB, wu: 16, w: 30, reps: 10, sets: 3, intent: 'hypertrophy' as const },
      ],
    },
    {
      day: 16, type: 'pull' as const, dur: 72,
      exs: [
        { ex: pullUp, wu: 0, w: 12.5, reps: 5, sets: 4, intent: 'strength' as const },
        { ex: bbRow, wu: 40, w: 82.5, reps: 5, sets: 4, intent: 'strength' as const },
        { ex: latPulldown, wu: 35, w: 67.5, reps: 10, sets: 3, intent: 'hypertrophy' as const },
        { ex: ezCurl, wu: 20, w: 40, reps: 10, sets: 3, intent: 'hypertrophy' as const },
        { ex: cableRow, wu: 25, w: 50, reps: 12, sets: 3, intent: 'hypertrophy' as const },
      ],
    },
    {
      day: 14, type: 'legs' as const, dur: 80,
      exs: [
        { ex: squat, wu: 60, w: 112.5, reps: 6, sets: 4, intent: 'strength' as const },
        { ex: rdl, wu: 50, w: 92.5, reps: 8, sets: 4, intent: 'hypertrophy' as const },
        { ex: legPress, wu: 80, w: 165, reps: 12, sets: 3, intent: 'hypertrophy' as const },
        { ex: legCurl, wu: 25, w: 52.5, reps: 12, sets: 3, intent: 'hypertrophy' as const },
        { ex: cableCrunch, wu: 20, w: 35, reps: 15, sets: 3, intent: 'hypertrophy' as const },
      ],
    },
    // Week -2
    {
      day: 11, type: 'push' as const, dur: 65,
      exs: [
        { ex: benchPress, wu: 55, w: 87.5, reps: 5, sets: 4, intent: 'strength' as const },
        { ex: ohPress, wu: 30, w: 60, reps: 5, sets: 4, intent: 'strength' as const },
        { ex: lateralRaise, wu: 8, w: 14, reps: 15, sets: 3, intent: 'hypertrophy' as const },
        { ex: pushdown, wu: 15, w: 35, reps: 12, sets: 3, intent: 'hypertrophy' as const },
        { ex: cableFly, wu: 10, w: 22.5, reps: 15, sets: 3, intent: 'hypertrophy' as const },
      ],
    },
    {
      day: 9, type: 'pull' as const, dur: 68,
      exs: [
        { ex: pullUp, wu: 0, w: 15, reps: 5, sets: 4, intent: 'strength' as const },
        { ex: bbRow, wu: 40, w: 85, reps: 5, sets: 4, intent: 'strength' as const },
        { ex: latPulldown, wu: 35, w: 70, reps: 10, sets: 3, intent: 'hypertrophy' as const },
        { ex: ezCurl, wu: 20, w: 40, reps: 10, sets: 3, intent: 'hypertrophy' as const },
        { ex: inclineCurl, wu: 8, w: 14, reps: 12, sets: 3, intent: 'hypertrophy' as const },
      ],
    },
    {
      day: 7, type: 'legs' as const, dur: 82,
      exs: [
        { ex: squat, wu: 60, w: 115, reps: 6, sets: 4, intent: 'strength' as const },
        { ex: rdl, wu: 50, w: 95, reps: 8, sets: 4, intent: 'hypertrophy' as const },
        { ex: legPress, wu: 80, w: 170, reps: 12, sets: 3, intent: 'hypertrophy' as const },
        { ex: legCurl, wu: 25, w: 55, reps: 12, sets: 3, intent: 'hypertrophy' as const },
      ],
    },
    // Week -1
    {
      day: 4, type: 'push' as const, dur: 70,
      exs: [
        { ex: benchPress, wu: 55, w: 90, reps: 5, sets: 4, intent: 'strength' as const },
        { ex: ohPress, wu: 30, w: 62.5, reps: 5, sets: 4, intent: 'strength' as const },
        { ex: lateralRaise, wu: 8, w: 15, reps: 15, sets: 4, intent: 'hypertrophy' as const },
        { ex: pushdown, wu: 20, w: 37.5, reps: 12, sets: 3, intent: 'hypertrophy' as const },
        { ex: inclineDB, wu: 18, w: 32, reps: 10, sets: 3, intent: 'hypertrophy' as const },
      ],
    },
    {
      day: 2, type: 'pull' as const, dur: 75,
      exs: [
        { ex: pullUp, wu: 0, w: 17.5, reps: 5, sets: 4, intent: 'strength' as const },
        { ex: bbRow, wu: 40, w: 87.5, reps: 5, sets: 4, intent: 'strength' as const },
        { ex: latPulldown, wu: 35, w: 72.5, reps: 10, sets: 3, intent: 'hypertrophy' as const },
        { ex: facePull, wu: 15, w: 27.5, reps: 15, sets: 3, intent: 'hypertrophy' as const },
        { ex: ezCurl, wu: 20, w: 42.5, reps: 10, sets: 3, intent: 'hypertrophy' as const },
      ],
    },
  ];

  for (const plan of sessionPlan) {
    const started = daysAgo(plan.day);
    const ended = new Date(started.getTime() + plan.dur * 60 * 1000);

    await database.write(async () => {
      const session = await database.get<Session>('sessions').create((s: any) => {
        s.name = plan.type === 'push' ? 'Push A' : plan.type === 'pull' ? 'Pull A' : 'Legs A';
        s.startedAt = started;
        s.endedAt = ended;
        s.updatedAt = ended;
      });

      for (let i = 0; i < plan.exs.length; i++) {
        const e = plan.exs[i];
        await addExerciseWithSets(
          session, e.ex, i, e.intent,
          e.wu, e.w, e.reps, e.sets, started,
        );
      }
    });
  }

  // ── 4. Séances planifiées (cette semaine + semaine prochaine) ─────────────────

  await database.write(async () => {
    const sched = [
      { daysFromN: 1, tmpl: pushTemplate!, title: 'Push A', block: 'hypertrophy' },
      { daysFromN: 3, tmpl: pullTemplate!, title: 'Pull A', block: 'hypertrophy' },
      { daysFromN: 5, tmpl: legsTemplate!, title: 'Legs A', block: 'hypertrophy' },
      { daysFromN: 8, tmpl: pushTemplate!, title: 'Push A', block: 'hypertrophy' },
      { daysFromN: 10, tmpl: pullTemplate!, title: 'Pull A', block: 'hypertrophy' },
    ];

    for (const s of sched) {
      await database.get('scheduled_sessions').create((ss: any) => {
        ss.templateId = s.tmpl.id;
        ss.plannedDate = daysFromNow(s.daysFromN);
        ss.title = s.title;
        ss.blockType = s.block;
        ss.updatedAt = now;
      });
    }
  });
}

# MyPerf

Tracker d'entraînements d'hypertrophie — offline-first, niveau de détail maximal (tempo, RPE/RIR, intention par exercice, sets avancés). Thème néo-futuriste par défaut.

---

## Stack technique

| Couche | Choix | Raison |
|---|---|---|
| Framework | Expo 54 (managed + dev client) | Natif sans ejecter |
| Navigation | expo-router v6 (file-based) | Routes typées, deep links |
| Base de données | WatermelonDB 0.28 | Offline-first, Observable, SQLite async |
| Persistance UI | expo-file-system | Thème persisté sur disque (JSON) |
| Langage | TypeScript strict | — |
| Haptiques | expo-haptics | Feedback sur complétion de série |

---

## Architecture

```
src/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          — Écran "Aujourd'hui" (session active ou démarrage)
│   │   ├── planning.tsx       — Calendrier semaine + templates
│   │   ├── history.tsx        — Historique des séances + volume 7j
│   │   ├── exercises.tsx      — Catalogue d'exercices (CRUD)
│   │   └── settings.tsx       — Thème + outils dev
│   └── session/[id].tsx       — Détail d'une séance passée
│
├── db/
│   ├── database.ts            — Init WatermelonDB + patch New Architecture
│   ├── schema.ts              — Schéma v3 (7 tables)
│   ├── migrations.ts          — Migrations v1→v3
│   ├── seed.ts                — Données de test (18 exos, 3 templates, 11 séances)
│   └── models/
│       ├── Exercise.ts
│       ├── Session.ts
│       ├── ExerciseInstance.ts
│       ├── WorkingSet.ts
│       ├── WorkoutTemplate.ts
│       ├── TemplateExercise.ts
│       └── ScheduledSession.ts
│
├── features/
│   ├── session/
│   │   ├── ActiveSessionView.tsx   — Vue principale en-cours (chrono, exercices, fin)
│   │   ├── ExerciseInstanceCard.tsx — Carte exercice + sets + tonnage + e1RM
│   │   ├── SetRow.tsx              — Ligne série (poids, reps, RPE, RIR, tempo)
│   │   ├── RestTimer.tsx           — Timer de repos flottant (auto-déclenché)
│   │   ├── ExercisePicker.tsx      — Modal sélection exercice
│   │   └── sessionActions.ts       — Mutations DB séance
│   ├── planning/
│   │   ├── TemplateEditor.tsx
│   │   ├── ScheduleModal.tsx
│   │   ├── templateActions.ts
│   │   └── planningActions.ts
│   ├── exercises/
│   │   ├── ExerciseList.tsx
│   │   ├── ExerciseForm.tsx
│   │   └── exerciseData.ts         — Énumérations (équipements, muscles…)
│   ├── history/
│   │   └── SessionCard.tsx         — Carte résumé séance (tonnage, durée, notes)
│   └── stats/
│       └── BodyMap.tsx             — Placeholder carte musculaire (à venir)
│
├── hooks/                          — Observables WatermelonDB
│   ├── useActiveSession.ts
│   ├── useSessions.ts
│   ├── useSessionExercises.ts
│   ├── useWorkingSets.ts
│   ├── useLastSets.ts              — "Dernier passage" par exercice
│   ├── useWeeklyVolume.ts          — Séries par groupe musculaire (7j)
│   ├── useExercises.ts
│   ├── useWorkoutTemplates.ts
│   ├── useTemplateExercises.ts
│   └── useScheduledSessions.ts
│
├── theme/
│   ├── themes.ts                   — 4 thèmes : light / dark / oled / neo
│   └── ThemeProvider.tsx           — Contexte + persistance
│
└── utils/
    └── format.ts                   — Formatage durée, date, heure
```

---

## Modèle de données

### exercises
| Colonne | Type | Notes |
|---|---|---|
| name | string | — |
| primary_muscle_group | string | chest / back / shoulders / arms / legs / core |
| secondary_muscle_groups | string | JSON array |
| specific_muscles | string | JSON array — pec_upper, lats, quads… |
| equipment | string | barbell / dumbbell / cable / machine / bodyweight… |
| exercise_type | string | compound / isolation |
| is_unilateral | boolean | — |
| grip | string? | pronation / supination / neutral / mixed |
| working_angle | string? | flat / incline / overhead / low_pulley… |

### sessions
| Colonne | Type | Notes |
|---|---|---|
| name | string? | Nom ou null (séance libre) |
| started_at | number | Timestamp ms |
| ended_at | number? | null si en cours |
| notes | string? | Ajoutées à la fin de séance |

### exercise_instances
Lie une session à un exercice. Porte l'intention (power / strength / hypertrophy / endurance / metabolic), les plages de répétitions cibles, le RPE cible, le repos cible.

### working_sets
| Colonne | Type | Notes |
|---|---|---|
| set_type | string | warmup / working / drop / rest_pause / myoreps |
| weight | number | kg |
| reps | number? | null si isométrique |
| rpe / rir | number? | RPE 0-10, RIR 0-10 |
| tempo_* | number | ecc-pauseBas-conc-pauseHaut. -1 = "X" (explosif) |
| is_isometric | boolean | — |
| completed | boolean | — |

### workout_templates + template_exercises
Templates réutilisables avec exercices ordonnés et paramètres prédéfinis.

### scheduled_sessions
Lie un template à une date. Supporte les block types : accumulation / hypertrophy / transmutation / realization / deload / power.

---

## Fonctionnalités implémentées

### Séance active
- Chrono live depuis `started_at`
- Ajout d'exercices via picker (recherche intégrée)
- Par exercice : intention configurable, tonnage + e1RM estimé live
- Par série : type (warmup/working/drop/rest_pause/myoreps), poids, reps, RPE, RIR, tempo complet
- Données du **dernier passage** affichées en ghost sous chaque champ
- **Timer de repos automatique** déclenché à chaque complétion de série (durée selon l'intention)
- Fin de séance avec **notes libres** enregistrées sur la session

### Planning
- Calendrier semaine avec navigation ← →
- Dots indicateurs : bleu = planifié, vert = réalisé
- Templates PPL configurables (exercices, ordre, paramètres)
- Démarrage depuis template : pre-populate les séries avec le dernier poids utilisé

### Historique
- Liste de toutes les séances terminées
- Volume hebdomadaire par groupe musculaire (barres visuelles)
- Tonnage total et durée par séance
- Notes de séance affichées

### Exercices
- Catalogue avec filtre par muscle/équipement
- Création/édition complète (muscles secondaires, prise, angle)

### Thèmes
- **Néo-futuriste** (défaut) : bleu-noir + cyan électrique `#00C6FF`
- Sombre : gris classique
- OLED : noir absolu (économie batterie)
- Clair

---

## Configuration build (WSL + Android)

### Prérequis spécifiques WSL
Le SDK Android est monté depuis Windows (`/mnt/c/...`). Le NDK est **obligatoirement** la version Linux, pas la version Windows.

```
android/local.properties
─────────────────────────
sdk.dir=/mnt/c/Users/<user>/AppData/Local/Android/Sdk
ndk.dir=/home/<user>/android-ndk-r27b     ← NDK Linux r27b (27.1.12297006)
cmake.dir=/usr                             ← CMake système Linux (/usr/bin/cmake)
```

`android/gradle.properties`
```
newArchEnabled=true    ← obligatoire (react-native-reanimated v4 + worklets)
hermesEnabled=true
```

`app.json`
```json
{
  "newArchEnabled": true,
  "experiments": {
    "typedRoutes": true,
    "reactCompiler": false   ← incompatible avec Reanimated 4.x
  },
  "plugins": [
    ["@morrowdigital/watermelondb-expo-plugin", { "disableJsi": true }]
  ]
}
```

> `disableJsi: true` est requis — WatermelonDB 0.28 n'a pas de spec TurboModule, le bridge JSI crashe en New Architecture. Le fichier `database.ts` contient un patch `makeDispatcher` pour forcer le mode async.

### Commandes

```bash
# Premier build ou après modification de app.json / plugins
npx expo prebuild --clean
NODE_ENV=development npx expo run:android

# Build Gradle seul (itérations JS uniquement)
cd android
NODE_ENV=development ./gradlew app:assembleDebug \
  -x lint -x test --configure-on-demand \
  -PreactNativeDevServerPort=8081 \
  -PreactNativeArchitectures=arm64-v8a,armeabi-v7a

# Logs crash Android
adb logcat -c && adb logcat | grep -iE "(FATAL|WMDatabase|ReactNative|com.anonymous.MyPerf)"
```

### Note sur `local.properties`
Ce fichier est **supprimé** par `npx expo prebuild --clean`. Il faut le recréer manuellement après chaque prebuild.

---

## Données de test

Un seed complet est disponible pour tester toutes les fonctionnalités :

- **18 exercices** couvrant tous les groupes musculaires
- **3 templates PPL** (Push A / Pull A / Legs A)
- **11 séances historiques** sur 4 semaines avec progression linéaire
- **5 séances planifiées** pour la semaine en cours et la suivante

**Activation** : Réglages → "Insérer données de test" (visible uniquement en mode DEV).

---

## Prochains chantiers

- [ ] Graphiques de progression par exercice (weight × date)
- [ ] Swipe-to-delete sur les séries (react-native-gesture-handler Swipeable)
- [ ] Réordonnancement des exercices en séance active (drag & drop)
- [ ] Carte musculaire SVG (remplacer le placeholder BodyMap)
- [ ] Timer de repos configurable par exercice (override du défaut par intention)
- [ ] Export CSV / partage de séance

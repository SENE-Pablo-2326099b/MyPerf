# MyPerf

Tracker d'entraînement offline-first pour l'hypertrophie — niveau de détail maximal : tempo, RPE/RIR, intention par exercice, types de séries avancés, periodisation complète par blocs.

> **Guide utilisateur complet** → [`GUIDE.md`](./GUIDE.md)

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
│   │   ├── index.tsx          — TODAY : séance active ou démarrage + badge readiness
│   │   ├── planning.tsx       — Calendrier, templates, macrocycles, mésocycles
│   │   ├── history.tsx        — LOG : volume MEV/MAV/MRV, PRs, forme, séances
│   │   ├── exercises.tsx      — Catalogue d'exercices CRUD
│   │   └── settings.tsx       — Thèmes + export + outils dev
│   ├── body.tsx               — Page dédiée poids de corps & mensurations
│   └── session/[id].tsx       — Détail d'une séance passée
│
├── db/
│   ├── database.ts            — Init WatermelonDB + patch New Architecture
│   ├── schema.ts              — Schéma v7 (9 tables)
│   ├── migrations.ts          — Migrations v1→v7
│   ├── seed.ts                — Données de test complètes
│   └── models/
│       ├── Exercise.ts
│       ├── Session.ts
│       ├── ExerciseInstance.ts
│       ├── WorkingSet.ts
│       ├── WorkoutTemplate.ts
│       ├── TemplateExercise.ts
│       ├── ScheduledSession.ts
│       ├── Macrocycle.ts
│       ├── Mesocycle.ts
│       ├── Microcycle.ts
│       ├── BodyMetric.ts      — Poids, %, mensurations
│       └── DailyReadiness.ts  — Sommeil, courbatures, stress, motivation
│
├── features/
│   ├── session/
│   │   ├── ActiveSessionView.tsx   — Chrono, exercices, réorganisation, fin
│   │   ├── ExerciseInstanceCard.tsx — Carte exercice + sets + stats + notes
│   │   ├── SetRow.tsx              — Ligne série (22px, ghost, RPE, RIR, tempo, animation)
│   │   ├── RestTimer.tsx           — Timer repos flottant + WheelPicker durée custom
│   │   ├── ExercisePicker.tsx      — Modal exercice avec chips colorées par muscle
│   │   └── sessionActions.ts       — Mutations DB + reorderExercises + saveAsTemplate
│   ├── body/
│   │   ├── BodyMetricModal.tsx     — Formulaire saisie poids/mensurations
│   │   └── bodyActions.ts
│   ├── readiness/
│   │   ├── ReadinessCheckIn.tsx   — Formulaire 4 critères 1-5
│   │   ├── ReadinessCard.tsx      — Timeline + ratio A:C + suggestion déload
│   │   └── readinessActions.ts
│   ├── export/
│   │   └── exportActions.ts       — Export JSON complet via Share
│   ├── planning/  …
│   ├── exercises/ …
│   ├── history/
│   │   └── SessionCard.tsx        — Carte séance avec animation FadeInDown
│   └── stats/
│       ├── BodyMap.tsx
│       ├── ProgressChart.tsx      — Graphique progression par exercice + PR
│       ├── PRList.tsx             — Records personnels (réactif aux nouvelles séances)
│       ├── FrequencyHeatmap.tsx   — 4 semaines × 6 groupes musculaires
│       └── volumeLandmarks.ts     — Constantes MEV/MAV/MRV par groupe
│
├── hooks/
│   ├── useBodyMetrics.ts          — Observable body_metrics DESC
│   ├── useDailyReadiness.ts       — Observable daily_readiness DESC
│   ├── useTrainingLoad.ts         — Ratio Aiguë/Chronique (A:C)
│   ├── usePRs.ts                  — Records par exercice (réactif)
│   ├── useWeeklyVolume.ts
│   ├── useMonthlyFrequency.ts
│   └── … (autres hooks WatermelonDB)
│
├── components/
│   ├── CustomTabBar.tsx           — Tab bar animée (spring press + indicateur actif)
│   └── WheelPicker.tsx            — Roue de sélection numérique
│
├── theme/
│   ├── themes.ts                  — 4 thèmes premium : light/dark/oled/neo
│   └── ThemeProvider.tsx
│
└── utils/
    └── format.ts
```

---

## Modèle de données (schéma v7)

9 tables principales. Les 2 nouvelles tables de la v7 :

### body_metrics
Poids de corps et mensurations, saisie libre (aucune fréquence imposée).
`recorded_at · weight_kg · body_fat_pct? · chest_cm? · waist_cm? · hips_cm? · left_arm_cm? · right_arm_cm? · left_thigh_cm? · right_thigh_cm? · notes?`

### daily_readiness
Évaluation quotidienne de la forme, saisie à la demande.
`recorded_at · sleep_quality (1-5) · soreness (1-5) · stress_level (1-5) · motivation (1-5) · notes?`

Score calculé : `(sommeil + (6−courbatures) + (6−stress) + motivation) / 4` → 1-5.

### Autres tables
`exercises · sessions · exercise_instances · working_sets · workout_templates · template_exercises · scheduled_sessions · macrocycles · mesocycles · microcycles`

---

## Fonctionnalités implémentées

### Séance active
- Chrono 32px live + nom de séance
- Picker exercices filtrable (couleur par muscle) avec compteur résultats
- Par exercice : intention configurable, border colorée, pill progression, tonnage + e1RM live, **notes** par exercice, **réorganisation ↑↓** (mode "Ordre")
- Par série : grand format (22px), type cycable, ghost ↑ du dernier passage, RPE/RIR/tempo, complétion avec **animation de pop** + fond vert
- Swipe-to-delete sur chaque série
- Timer de repos auto (durée par intention, ±30s, **WheelPicker** pour durée custom)
- FAB pill "+ Exercice"
- Fin de séance : notes libres + **"Sauvegarder comme template"** switch

### Statistiques avancées (LOG)
- Volume 7j avec **landmarks MEV/MAV/MRV** codés couleur + repères visuels sur les barres
- Body map SVG + heatmap fréquence 4 semaines
- **Records personnels** par exercice (maxWeight + e1RM, réactifs aux nouvelles séances)
- **Recherche** dans l'historique par nom/notes
- Détail séance + **graphiques de progression** (poids/e1RM/volume) avec détection PR

### Corps & Mensurations (page dédiée `/body`)
- Saisie libre (aucune fréquence imposée) : poids + 7 mensurations + % MG + notes
- Navigation de date libre dans le formulaire
- Graphique de poids (16 entrées, pleine largeur)
- Grille de mensurations avec deltas (sens positif/négatif adapté par mesure)
- Historique complet avec swipe-to-delete

### Forme & Fatigue
- Check-in quotidien : sommeil / courbatures / stress / motivation (1-5, couleurs contextuelles)
- Score de forme automatique (1-5, vert/orange/rouge)
- Badge compact sur TODAY (score si fait, lien si non fait)
- Ratio Aiguë/Chronique (A:C) depuis les données d'entraînement réelles
- Suggestion de déload si A:C > 1.3 ET forme < 3/5

### Planning & Periodisation
- Calendrier semaine avec navigation, indicateurs planifié/réalisé
- Templates CRUD (création, édition, réutilisation)
- Macrocycles + mésocycles par blocs (6 types) avec génération automatique des séances
- Bannière TODAY avec semaine du mésocycle actif
- État vide contextuel avec bouton "Planifier" direct

### Export
- JSON complet (séances + mensurations + forme) via Share natif iOS/Android

### UI / Thèmes / Animations
- **Tab bar animée** : spring press (scale + séquence) + indicateur actif en haut
- **Thèmes premium retravaillés** : Light (bleu `#2563EB`), Dark (charcoal iOS + `#0A84FF`), OLED (noir pur), Neo (cyan `#00D4FF` + textMuted lisible)
- **SessionCard** : entering `FadeInDown.springify()`
- **SetRow** : pulse sur complétion `withSequence(spring 1.35 → spring 1.0)`
- **ExerciseInstanceCard** : `LayoutAnimation.easeInEaseOut` sur ajout de série

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
- **12 séances historiques** sur 4 semaines avec progression linéaire + séance avancée (drop sets, myoreps, tempo)
- **1 macrocycle** + **2 mésocycles** + **8 microcycles**
- **6 séances planifiées** pour les semaines à venir

**Activation** : Réglages → "Insérer données de test" (visible uniquement en mode DEV).  
**Remise à zéro** : Réglages → "Effacer toutes les données" (mode DEV, irréversible).

---

## Prochains chantiers

- [ ] Notifications de rappel de séance planifiée (expo-notifications)
- [ ] Comparaison de deux séances côte-à-côte
- [ ] Landmarks MEV/MAV/MRV personnalisables par utilisateur
- [ ] Onboarding premier lancement

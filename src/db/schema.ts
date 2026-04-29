import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 6,
  tables: [
    tableSchema({
      name: 'exercises',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'primary_muscle_group', type: 'string' },
        { name: 'secondary_muscle_groups', type: 'string' },
        { name: 'specific_muscles', type: 'string', isOptional: true },
        { name: 'equipment', type: 'string' },
        { name: 'exercise_type', type: 'string' },
        { name: 'is_unilateral', type: 'boolean' },
        { name: 'grip', type: 'string', isOptional: true },
        { name: 'working_angle', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'sessions',
      columns: [
        { name: 'name', type: 'string', isOptional: true },
        { name: 'started_at', type: 'number' },
        { name: 'ended_at', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'exercise_instances',
      columns: [
        { name: 'session_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'order', type: 'number' },
        { name: 'intention', type: 'string' },
        { name: 'target_sets', type: 'number', isOptional: true },
        { name: 'rep_range_min', type: 'number', isOptional: true },
        { name: 'rep_range_max', type: 'number', isOptional: true },
        { name: 'rpe_target', type: 'number', isOptional: true },
        { name: 'rest_seconds', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'working_sets',
      columns: [
        { name: 'exercise_instance_id', type: 'string', isIndexed: true },
        { name: 'set_number', type: 'number' },
        { name: 'set_type', type: 'string' },
        { name: 'reps', type: 'number', isOptional: true },
        { name: 'weight', type: 'number' },
        { name: 'rpe', type: 'number', isOptional: true },
        { name: 'rir', type: 'number', isOptional: true },
        { name: 'tempo_eccentric', type: 'number' },
        { name: 'tempo_pause_bottom', type: 'number' },
        { name: 'tempo_concentric', type: 'number' },
        { name: 'tempo_pause_top', type: 'number' },
        { name: 'is_isometric', type: 'boolean' },
        { name: 'isometric_duration_seconds', type: 'number', isOptional: true },
        { name: 'rest_after_seconds', type: 'number', isOptional: true },
        { name: 'completed', type: 'boolean' },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'workout_templates',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'template_exercises',
      columns: [
        { name: 'template_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'order', type: 'number' },
        { name: 'intention', type: 'string' },
        { name: 'target_sets', type: 'number', isOptional: true },
        { name: 'rep_range_min', type: 'number', isOptional: true },
        { name: 'rep_range_max', type: 'number', isOptional: true },
        { name: 'rpe_target', type: 'number', isOptional: true },
        { name: 'rest_seconds', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'scheduled_sessions',
      columns: [
        { name: 'template_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'session_id', type: 'string', isOptional: true },
        { name: 'mesocycle_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'planned_date', type: 'number', isIndexed: true },
        { name: 'title', type: 'string', isOptional: true },
        { name: 'block_type', type: 'string', isOptional: true },
        { name: 'volume_pct', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ── Macrocycles (conteneur optionnel sur plusieurs mésocycles) ────────────
    tableSchema({
      name: 'macrocycles',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'goal_description', type: 'string', isOptional: true },
        { name: 'start_date', type: 'number' },
        { name: 'end_date', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ── Mésocycles (blocs de périodisation avec semaine-type) ─────────────────
    tableSchema({
      name: 'mesocycles',
      columns: [
        { name: 'macrocycle_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'block_type', type: 'string' },
        { name: 'start_date', type: 'number', isIndexed: true },
        { name: 'end_date', type: 'number' },
        // JSON : [{isoDay: 1..7, templateId: string}]
        { name: 'week_pattern', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ── Microcycles (semaines dans un mésocycle) ──────────────────────────────
    tableSchema({
      name: 'microcycles',
      columns: [
        { name: 'mesocycle_id', type: 'string', isIndexed: true },
        { name: 'week_number', type: 'number' },
        { name: 'label', type: 'string' },
        { name: 'volume_pct', type: 'number' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

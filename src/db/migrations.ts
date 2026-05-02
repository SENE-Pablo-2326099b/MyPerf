import { addColumns, createTable, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'exercises',
          columns: [
            { name: 'specific_muscles', type: 'string', isOptional: true },
            { name: 'grip', type: 'string', isOptional: true },
            { name: 'working_angle', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        addColumns({
          table: 'exercise_instances',
          columns: [
            { name: 'rep_range_min', type: 'number', isOptional: true },
            { name: 'rep_range_max', type: 'number', isOptional: true },
            { name: 'rpe_target', type: 'number', isOptional: true },
            { name: 'rest_seconds', type: 'number', isOptional: true },
          ],
        }),
        createTable({
          name: 'workout_templates',
          columns: [
            { name: 'name', type: 'string' },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        createTable({
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
        createTable({
          name: 'scheduled_sessions',
          columns: [
            { name: 'template_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'session_id', type: 'string', isOptional: true },
            { name: 'planned_date', type: 'number', isIndexed: true },
            { name: 'title', type: 'string', isOptional: true },
            { name: 'block_type', type: 'string', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 4,
      steps: [
        // Lier les séances planifiées à un mésocycle
        addColumns({
          table: 'scheduled_sessions',
          columns: [
            { name: 'mesocycle_id', type: 'string', isOptional: true },
          ],
        }),
        createTable({
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
        createTable({
          name: 'mesocycles',
          columns: [
            { name: 'macrocycle_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'name', type: 'string' },
            { name: 'block_type', type: 'string' },
            { name: 'start_date', type: 'number', isIndexed: true },
            { name: 'end_date', type: 'number' },
            { name: 'week_pattern', type: 'string' },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 5,
      steps: [
        createTable({
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
    },
    {
      toVersion: 6,
      steps: [
        addColumns({
          table: 'scheduled_sessions',
          columns: [
            { name: 'volume_pct', type: 'number', isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 7,
      steps: [
        createTable({
          name: 'body_metrics',
          columns: [
            { name: 'recorded_at', type: 'number', isIndexed: true },
            { name: 'weight_kg', type: 'number' },
            { name: 'body_fat_pct', type: 'number', isOptional: true },
            { name: 'chest_cm', type: 'number', isOptional: true },
            { name: 'waist_cm', type: 'number', isOptional: true },
            { name: 'hips_cm', type: 'number', isOptional: true },
            { name: 'left_arm_cm', type: 'number', isOptional: true },
            { name: 'right_arm_cm', type: 'number', isOptional: true },
            { name: 'left_thigh_cm', type: 'number', isOptional: true },
            { name: 'right_thigh_cm', type: 'number', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        createTable({
          name: 'daily_readiness',
          columns: [
            { name: 'recorded_at', type: 'number', isIndexed: true },
            { name: 'sleep_quality', type: 'number' },
            { name: 'soreness', type: 'number' },
            { name: 'stress_level', type: 'number' },
            { name: 'motivation', type: 'number' },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
  ],
});

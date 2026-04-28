import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useWorkingSets } from '@/hooks/useWorkingSets';
import { useLastSets } from '@/hooks/useLastSets';
import { addSet, removeExercise, updateIntention } from './sessionActions';
import SetRow from './SetRow';
import type ExerciseInstance from '@/db/models/ExerciseInstance';
import type Exercise from '@/db/models/Exercise';
import type { Intention } from '@/db/models/ExerciseInstance';

const INTENTIONS: Array<{ value: Intention; label: string }> = [
  { value: 'power', label: 'Puissance' },
  { value: 'strength', label: 'Force' },
  { value: 'hypertrophy', label: 'Hypertrophie' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'metabolic', label: 'Métabolique' },
];

const INTENTION_COLORS: Record<Intention, string> = {
  power: '#F59E0B',
  strength: '#EF4444',
  hypertrophy: '#3B82F6',
  endurance: '#10B981',
  metabolic: '#8B5CF6',
};

interface Props {
  instance: ExerciseInstance;
  onSetComplete?: (intention: Intention) => void;
}

function ExerciseInstanceCard({ instance, onSetComplete }: Props) {
  const { theme: { colors } } = useTheme();
  const sets = useWorkingSets(instance.id);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [showIntentionPicker, setShowIntentionPicker] = useState(false);

  useEffect(() => {
    const sub = instance.exercise.observe().subscribe(ex => setExercise(ex as Exercise));
    return () => sub.unsubscribe();
  }, [instance.id]);

  // Ghost data — last session's sets for this exercise
  const exerciseId = instance.exercise.id;
  const sessionId = instance.session.id;
  const lastSets = useLastSets(exerciseId, sessionId);

  // Tonnage + estimated 1RM from completed working sets
  const stats = useMemo(() => {
    const working = sets.filter(s => s.completed && s.setType !== 'warmup');
    const tonnage = working.reduce((sum, s) => sum + s.weight * (s.reps ?? 0), 0);
    const e1RM = working.reduce((max, s) => {
      if (!s.reps || s.reps < 1 || s.reps > 36) return max;
      return Math.max(max, s.weight * (1 + s.reps / 30));
    }, 0);
    return { tonnage, e1RM };
  }, [sets]);

  const handleAddSet = useCallback(() => {
    const prev = sets.length > 0 ? sets[sets.length - 1] : null;
    addSet(instance, sets.length + 1, prev);
  }, [instance, sets]);

  const handleRemove = useCallback(() => {
    Alert.alert(
      'Retirer l\'exercice ?',
      `Retirer "${exercise?.name ?? ''}" et toutes ses séries ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Retirer', style: 'destructive', onPress: () => removeExercise(instance) },
      ],
    );
  }, [instance, exercise]);

  const intentionColor = INTENTION_COLORS[instance.intention] ?? colors.accent;
  const completedCount = sets.filter(s => s.completed).length;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
            {exercise?.name ?? '…'}
          </Text>
          <View style={styles.headerMeta}>
            {/* Intention chip */}
            <TouchableOpacity
              style={[styles.intentionBadge, { backgroundColor: intentionColor + '22', borderColor: intentionColor + '55' }]}
              onPress={() => setShowIntentionPicker(v => !v)}
              hitSlop={8}
            >
              <Text style={[styles.intentionText, { color: intentionColor }]}>
                {INTENTIONS.find(i => i.value === instance.intention)?.label ?? instance.intention}
              </Text>
              <Ionicons name="chevron-down" size={10} color={intentionColor} />
            </TouchableOpacity>

            {sets.length > 0 && (
              <Text style={[styles.setCount, { color: colors.textMuted }]}>
                {completedCount}/{sets.length} série{sets.length > 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {/* Tonnage + e1RM */}
          {(stats.tonnage > 0 || stats.e1RM > 0) && (
            <View style={styles.statsRow}>
              {stats.tonnage > 0 && (
                <View style={[styles.statChip, { backgroundColor: colors.accent + '14' }]}>
                  <Ionicons name="barbell-outline" size={10} color={colors.accent} />
                  <Text style={[styles.statText, { color: colors.accent }]}>
                    {stats.tonnage >= 1000
                      ? `${(stats.tonnage / 1000).toFixed(1)}t`
                      : `${stats.tonnage}kg`}
                  </Text>
                </View>
              )}
              {stats.e1RM > 0 && (
                <View style={[styles.statChip, { backgroundColor: colors.success + '14' }]}>
                  <Ionicons name="trending-up-outline" size={10} color={colors.success} />
                  <Text style={[styles.statText, { color: colors.success }]}>
                    e1RM {Math.round(stats.e1RM)}kg
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity onPress={handleRemove} hitSlop={12} style={styles.removeBtn}>
          <Ionicons name="close-circle" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Intention picker */}
      {showIntentionPicker && (
        <View style={[styles.intentionPicker, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <View style={styles.intentionRow}>
            {INTENTIONS.map(opt => {
              const active = instance.intention === opt.value;
              const c = INTENTION_COLORS[opt.value];
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.intentionOption,
                    { backgroundColor: active ? c : colors.surface, borderColor: active ? c : colors.border },
                  ]}
                  onPress={() => {
                    updateIntention(instance, opt.value);
                    setShowIntentionPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.intentionOptionText, { color: active ? '#fff' : colors.textMuted }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Column headers */}
      {sets.length > 0 && (
        <View style={[styles.colHeaders, { borderBottomColor: colors.border }]}>
          <Text style={[styles.colHeader, { color: colors.textMuted, width: 18 }]}>#</Text>
          <Text style={[styles.colHeader, { color: colors.textMuted, width: 64 }]}>Type</Text>
          <Text style={[styles.colHeader, { color: colors.textMuted, width: 72 }]}>Poids</Text>
          <Text style={[styles.colHeader, { color: colors.textMuted, width: 60 }]}>Reps</Text>
        </View>
      )}

      {/* Sets */}
      {sets.map((set, idx) => (
        <SetRow
          key={set.id}
          set={set}
          index={idx}
          ghost={lastSets[idx]}
          onCompleted={() => onSetComplete?.(instance.intention)}
        />
      ))}

      {/* Add set button */}
      <TouchableOpacity
        style={[styles.addSetBtn, { borderColor: colors.border }]}
        onPress={handleAddSet}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={16} color={colors.accent} />
        <Text style={[styles.addSetText, { color: colors.accent }]}>Ajouter une série</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  headerLeft: { flex: 1, gap: 6 },
  exerciseName: { fontSize: 16, fontWeight: '700' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  intentionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  intentionText: { fontSize: 11, fontWeight: '700' },
  setCount: { fontSize: 12 },
  statsRow: { flexDirection: 'row', gap: 6 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statText: { fontSize: 11, fontWeight: '600' },
  removeBtn: { marginTop: 2 },
  intentionPicker: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  intentionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  intentionOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  intentionOptionText: { fontSize: 12, fontWeight: '600' },
  colHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colHeader: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addSetText: { fontSize: 14, fontWeight: '600' },
});

export default React.memo(ExerciseInstanceCard);

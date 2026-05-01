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

const INTENTIONS: Array<{ value: Intention; label: string; icon: string }> = [
  { value: 'power',       label: 'Puissance',    icon: 'flash' },
  { value: 'strength',    label: 'Force',         icon: 'barbell' },
  { value: 'hypertrophy', label: 'Hypertrophie',  icon: 'body' },
  { value: 'endurance',   label: 'Endurance',     icon: 'pulse' },
  { value: 'metabolic',   label: 'Métabolique',   icon: 'flame' },
];

const INTENTION_COLORS: Record<Intention, string> = {
  power:       '#F59E0B',
  strength:    '#EF4444',
  hypertrophy: '#3B82F6',
  endurance:   '#10B981',
  metabolic:   '#8B5CF6',
};

interface Props {
  instance: ExerciseInstance;
  onSetComplete?: (intention: Intention) => void;
}

function ExerciseInstanceCard({ instance, onSetComplete }: Props) {
  const { theme: { colors, radius, mode } } = useTheme();
  const isNeo = mode === 'neo';
  const sets = useWorkingSets(instance.id);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [showIntentionPicker, setShowIntentionPicker] = useState(false);

  useEffect(() => {
    const sub = instance.exercise.observe().subscribe(ex => setExercise(ex as Exercise));
    return () => sub.unsubscribe();
  }, [instance.id]);

  const exerciseId = instance.exercise.id;
  const sessionId = instance.session.id;
  const lastSets = useLastSets(exerciseId, sessionId);

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
      `"${exercise?.name ?? ''}" et toutes ses séries seront retirés.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Retirer', style: 'destructive', onPress: () => removeExercise(instance) },
      ],
    );
  }, [instance, exercise]);

  const intentionColor = INTENTION_COLORS[instance.intention] ?? colors.accent;
  const completedCount = sets.filter(s => s.completed).length;
  const allDone = sets.length > 0 && completedCount === sets.length;
  const intentionLabel = INTENTIONS.find(i => i.value === instance.intention)?.label ?? instance.intention;

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderLeftColor: intentionColor,
      },
    ]}>
      {/* ── Card header ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          {/* Exercise name */}
          <Text style={[styles.exoName, { color: colors.text }]} numberOfLines={1}>
            {exercise?.name ?? '…'}
          </Text>

          {/* Intention badge + set count */}
          <View style={styles.headerMeta}>
            <TouchableOpacity
              style={[styles.intentionBadge, { backgroundColor: intentionColor + '20', borderColor: intentionColor + '60' }]}
              onPress={() => setShowIntentionPicker(v => !v)}
              hitSlop={8}
            >
              <Text style={[styles.intentionTxt, { color: intentionColor }]}>{intentionLabel}</Text>
              <Ionicons name={showIntentionPicker ? 'chevron-up' : 'chevron-down'} size={10} color={intentionColor} />
            </TouchableOpacity>
            {sets.length > 0 && (
              <Text style={[styles.setCount, { color: colors.textMuted }]}>
                {completedCount}/{sets.length} série{sets.length > 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {/* Stats chips */}
          {(stats.tonnage > 0 || stats.e1RM > 0) && (
            <View style={styles.statsRow}>
              {stats.tonnage > 0 && (
                <View style={[styles.statChip, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}>
                  <Ionicons name="barbell-outline" size={10} color={colors.accent} />
                  <Text style={[styles.statTxt, { color: colors.accent }]}>
                    {stats.tonnage >= 1000
                      ? `${(stats.tonnage / 1000).toFixed(1)} t`
                      : `${Math.round(stats.tonnage)} kg`}
                  </Text>
                </View>
              )}
              {stats.e1RM > 0 && (
                <View style={[styles.statChip, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
                  <Ionicons name="trending-up-outline" size={10} color={colors.success} />
                  <Text style={[styles.statTxt, { color: colors.success }]}>
                    e1RM {Math.round(stats.e1RM)} kg
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Right: completion pill + remove */}
        <View style={styles.headerRight}>
          {sets.length > 0 && (
            <View style={[
              styles.progressPill,
              {
                backgroundColor: allDone ? colors.success + '20' : colors.background,
                borderColor: allDone ? colors.success : colors.border,
              },
            ]}>
              <Text style={[styles.progressTxt, { color: allDone ? colors.success : colors.textMuted }]}>
                {completedCount}/{sets.length}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={handleRemove} hitSlop={12}>
            <Ionicons name="close-circle" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Intention picker ── */}
      {showIntentionPicker && (
        <View style={[styles.intentionPicker, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={styles.intentionRow}>
            {INTENTIONS.map(opt => {
              const active = instance.intention === opt.value;
              const c = INTENTION_COLORS[opt.value];
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.intentionOption,
                    {
                      backgroundColor: active ? c : colors.surface,
                      borderColor: active ? c : colors.border,
                    },
                  ]}
                  onPress={() => { updateIntention(instance, opt.value); setShowIntentionPicker(false); }}
                  activeOpacity={0.75}
                >
                  <Ionicons name={opt.icon as any} size={12} color={active ? '#fff' : c} />
                  <Text style={[styles.intentionOptTxt, { color: active ? '#fff' : colors.textMuted }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* ── Column headers ── */}
      {sets.length > 0 && (
        <View style={[styles.colHeaders, { borderBottomColor: colors.border }]}>
          <Text style={[styles.colHdr, { color: colors.textMuted, width: 18 }]}>#</Text>
          <Text style={[styles.colHdr, { color: colors.textMuted, width: 80 }]}>TYPE</Text>
          <Text style={[styles.colHdr, { color: colors.textMuted, flex: 1, textAlign: 'center' }]}>POIDS</Text>
          <Text style={[styles.colHdr, { color: colors.textMuted, flex: 1, textAlign: 'center' }]}>REPS</Text>
          <View style={{ width: 42 }} />
        </View>
      )}

      {/* ── Set rows ── */}
      {sets.map((s, idx) => (
        <SetRow
          key={s.id}
          set={s}
          index={idx}
          ghost={lastSets[idx]}
          onCompleted={() => onSetComplete?.(instance.intention)}
        />
      ))}

      {/* ── Add set ── */}
      <TouchableOpacity
        style={[styles.addBtn, { borderTopColor: colors.border }]}
        onPress={handleAddSet}
        activeOpacity={0.7}
      >
        <View style={[styles.addIconWrap, { backgroundColor: colors.accent + '18', borderColor: colors.accent + '40' }]}>
          <Ionicons name="add" size={14} color={colors.accent} />
        </View>
        <Text style={[styles.addTxt, { color: colors.accent }]}>Ajouter une série</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  headerLeft: { flex: 1, gap: 7 },
  exoName: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  intentionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  intentionTxt: { fontSize: 11, fontWeight: '800' },
  setCount: { fontSize: 12, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 6 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statTxt: { fontSize: 11, fontWeight: '700' },
  headerRight: { alignItems: 'flex-end', gap: 8, paddingTop: 2 },
  progressPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  progressTxt: { fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },

  intentionPicker: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  intentionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  intentionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  intentionOptTxt: { fontSize: 12, fontWeight: '700' },

  colHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colHdr: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTxt: { fontSize: 14, fontWeight: '700' },
});

export default React.memo(ExerciseInstanceCard);

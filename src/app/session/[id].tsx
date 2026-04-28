import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Q } from '@nozbe/watermelondb';
import { Ionicons } from '@expo/vector-icons';
import { database } from '@/db/database';
import { useTheme } from '@/theme/ThemeProvider';
import { formatDate, formatDuration, formatTime } from '@/utils/format';
import type Session from '@/db/models/Session';
import type ExerciseInstance from '@/db/models/ExerciseInstance';
import type Exercise from '@/db/models/Exercise';
import type WorkingSet from '@/db/models/WorkingSet';
import type { SetType } from '@/db/models/WorkingSet';
import type { Intention } from '@/db/models/ExerciseInstance';

interface SetRow {
  id: string;
  setNumber: number;
  setType: SetType;
  weight: number;
  reps: number | null;
  rpe: number | null;
  rir: number | null;
  tempoEccentric: number;
  tempoPauseBottom: number;
  tempoConcentric: number;
  tempoPauseTop: number;
  completed: boolean;
}

interface InstanceRow {
  id: string;
  exerciseName: string;
  intention: Intention;
  sets: SetRow[];
}

interface Detail {
  session: Session;
  instances: InstanceRow[];
  totalSets: number;
  completedSets: number;
  totalVolumeTons: number;
}

const TYPE_LABELS: Record<SetType, string> = {
  warmup: 'Chauffe',
  working: 'Travail',
  drop: 'Drop',
  rest_pause: 'R+P',
  myoreps: 'Myoreps',
};

const TYPE_COLORS: Record<SetType, string> = {
  working: '#3B82F6',
  warmup: '#F59E0B',
  drop: '#EF4444',
  rest_pause: '#8B5CF6',
  myoreps: '#10B981',
};

const INTENTION_LABELS: Record<Intention, string> = {
  power: 'Puissance',
  strength: 'Force',
  hypertrophy: 'Hypertrophie',
  endurance: 'Endurance',
  metabolic: 'Métabolique',
};

function formatTempo(e: number, pb: number, c: number, pt: number): string | null {
  if (e === 0 && pb === 0 && c === 0 && pt === 0) return null;
  return `${e}-${pb}-${c === -1 ? 'X' : c}-${pt}`;
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme: { colors } } = useTheme();
  const [detail, setDetail] = useState<Detail | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;

    (async () => {
      const session = await database.get<Session>('sessions').find(id);

      const instances = await database
        .get<ExerciseInstance>('exercise_instances')
        .query(Q.where('session_id', id), Q.sortBy('order', Q.asc))
        .fetch();

      const instanceRows: InstanceRow[] = await Promise.all(
        instances.map(async inst => {
          const ex = await inst.exercise.fetch() as Exercise | null;
          const sets = await database
            .get<WorkingSet>('working_sets')
            .query(Q.where('exercise_instance_id', inst.id), Q.sortBy('set_number', Q.asc))
            .fetch();

          return {
            id: inst.id,
            exerciseName: ex?.name ?? '?',
            intention: inst.intention,
            sets: sets.map(s => ({
              id: s.id,
              setNumber: s.setNumber,
              setType: s.setType,
              weight: s.weight,
              reps: s.reps,
              rpe: s.rpe,
              rir: s.rir,
              tempoEccentric: s.tempoEccentric,
              tempoPauseBottom: s.tempoPauseBottom,
              tempoConcentric: s.tempoConcentric,
              tempoPauseTop: s.tempoPauseTop,
              completed: s.completed,
            })),
          };
        }),
      );

      const allSets = instanceRows.flatMap(i => i.sets);
      const totalSets = allSets.length;
      const completedSets = allSets.filter(s => s.completed).length;
      const totalVolumeTons = allSets
        .filter(s => s.completed && s.reps != null)
        .reduce((acc, s) => acc + s.weight * (s.reps ?? 0), 0) / 1000;

      if (alive) setDetail({ session, instances: instanceRows, totalSets, completedSets, totalVolumeTons });
    })();

    return () => { alive = false; };
  }, [id]);

  if (!detail) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const { session, instances, totalSets, completedSets, totalVolumeTons } = detail;
  const duration = session.endedAt
    ? formatDuration(session.endedAt.getTime() - session.startedAt.getTime())
    : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerDate, { color: colors.text }]} numberOfLines={1}>
            {formatDate(session.startedAt)}
          </Text>
          <Text style={[styles.headerTime, { color: colors.textMuted }]}>
            {formatTime(session.startedAt)}{duration ? ` · ${duration}` : ''}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatChip
            icon="layers-outline"
            value={`${completedSets}/${totalSets}`}
            label="séries"
            color={colors.accent}
            surface={colors.surface}
            textColor={colors.text}
            mutedColor={colors.textMuted}
          />
          <StatChip
            icon="barbell-outline"
            value={`${instances.length}`}
            label="exercices"
            color={colors.accent}
            surface={colors.surface}
            textColor={colors.text}
            mutedColor={colors.textMuted}
          />
          {totalVolumeTons > 0 && (
            <StatChip
              icon="analytics-outline"
              value={`${totalVolumeTons.toFixed(1)}t`}
              label="volume"
              color={colors.accent}
              surface={colors.surface}
              textColor={colors.text}
              mutedColor={colors.textMuted}
            />
          )}
        </View>

        {/* Exercise instances */}
        {instances.map(inst => (
          <View key={inst.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.exerciseName, { color: colors.text }]}>{inst.exerciseName}</Text>
              <View style={[styles.intentionBadge, { backgroundColor: colors.accent + '18' }]}>
                <Text style={[styles.intentionText, { color: colors.accent }]}>
                  {INTENTION_LABELS[inst.intention] ?? inst.intention}
                </Text>
              </View>
            </View>

            {inst.sets.length > 0 && (
              <View style={[styles.colHeaders, { borderBottomColor: colors.border }]}>
                <Text style={[styles.colText, styles.colNum, { color: colors.textMuted }]}>#</Text>
                <Text style={[styles.colText, styles.colType, { color: colors.textMuted }]}>Type</Text>
                <Text style={[styles.colText, styles.colWeight, { color: colors.textMuted }]}>Poids</Text>
                <Text style={[styles.colText, styles.colReps, { color: colors.textMuted }]}>Reps</Text>
                <Text style={[styles.colText, styles.colRpe, { color: colors.textMuted }]}>RPE</Text>
                <Text style={[styles.colText, styles.colRir, { color: colors.textMuted }]}>RIR</Text>
              </View>
            )}

            {inst.sets.map((s, idx) => {
              const tc = TYPE_COLORS[s.setType] ?? colors.accent;
              const tempo = formatTempo(s.tempoEccentric, s.tempoPauseBottom, s.tempoConcentric, s.tempoPauseTop);
              return (
                <View key={s.id} style={[styles.setRow, { borderBottomColor: colors.border, opacity: s.completed ? 1 : 0.45 }]}>
                  <Text style={[styles.colText, styles.colNum, { color: colors.textMuted }]}>{idx + 1}</Text>
                  <View style={styles.colType}>
                    <View style={[styles.typePill, { backgroundColor: tc + '22', borderColor: tc + '55' }]}>
                      <Text style={[styles.typePillText, { color: tc }]}>{TYPE_LABELS[s.setType]}</Text>
                    </View>
                  </View>
                  <Text style={[styles.colText, styles.colWeight, { color: colors.text }]}>
                    {s.weight > 0 ? `${s.weight} kg` : '—'}
                  </Text>
                  <Text style={[styles.colText, styles.colReps, { color: colors.text }]}>
                    {s.reps != null ? `${s.reps}×` : '—'}
                  </Text>
                  <Text style={[styles.colText, styles.colRpe, { color: colors.textMuted }]}>
                    {s.rpe != null ? String(s.rpe) : '—'}
                  </Text>
                  <Text style={[styles.colText, styles.colRir, { color: colors.textMuted }]}>
                    {s.rir != null ? String(s.rir) : '—'}
                  </Text>
                  {tempo && (
                    <View style={[styles.tempoRow, { borderTopColor: colors.border }]}>
                      <Ionicons name="timer-outline" size={11} color={colors.textMuted} />
                      <Text style={[styles.tempoText, { color: colors.textMuted }]}>{tempo}</Text>
                    </View>
                  )}
                </View>
              );
            })}

            {inst.sets.length === 0 && (
              <Text style={[styles.emptySets, { color: colors.textMuted }]}>Aucune série enregistrée</Text>
            )}
          </View>
        ))}

        {instances.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={48} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Aucun exercice dans cette séance.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatChip({
  icon, value, label, color, surface, textColor, mutedColor,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  label: string;
  color: string;
  surface: string;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <View style={[statStyles.chip, { backgroundColor: surface }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[statStyles.value, { color: textColor }]}>{value}</Text>
      <Text style={[statStyles.label, { color: mutedColor }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 2,
  },
  value: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 12 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerDate: { fontSize: 17, fontWeight: '700', textTransform: 'capitalize' },
  headerTime: { fontSize: 13, marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 48, gap: 12 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  exerciseName: { fontSize: 16, fontWeight: '700', flex: 1 },
  intentionBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  intentionText: { fontSize: 11, fontWeight: '700' },
  colHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexWrap: 'wrap',
  },
  colText: { fontSize: 13 },
  colNum: { width: 22, color: '#9CA3AF', fontWeight: '600' },
  colType: { width: 68 },
  colWeight: { width: 72, fontWeight: '600' },
  colReps: { width: 42, fontWeight: '600' },
  colRpe: { width: 36, color: '#9CA3AF' },
  colRir: { flex: 1, color: '#9CA3AF' },
  typePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  typePillText: { fontSize: 10, fontWeight: '700' },
  tempoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  tempoText: { fontSize: 11, fontVariant: ['tabular-nums'] },
  emptySets: { padding: 14, fontSize: 14, textAlign: 'center' },
  emptyState: { alignItems: 'center', gap: 12, paddingTop: 40 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});

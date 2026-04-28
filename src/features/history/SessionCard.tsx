import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { database } from '@/db/database';
import { Q } from '@nozbe/watermelondb';
import { formatDate, formatDuration, formatTime } from '@/utils/format';
import type Session from '@/db/models/Session';
import type ExerciseInstance from '@/db/models/ExerciseInstance';
import type Exercise from '@/db/models/Exercise';

interface Summary {
  exercises: string[];
  completedSets: number;
  totalSets: number;
  tonnage: number;
}

function SessionCard({ session }: { session: Session }) {
  const { theme: { colors, radius, mode } } = useTheme();
  const isNeo = mode === 'neo';
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const instances = await database
        .get<ExerciseInstance>('exercise_instances')
        .query(Q.where('session_id', session.id), Q.sortBy('order', Q.asc))
        .fetch();

      const names = await Promise.all(
        instances.map(i => i.exercise.fetch().then((e: Exercise | null) => e?.name ?? '?')),
      );

      const allSets = await Promise.all(
        instances.map(i =>
          database.get<any>('working_sets')
            .query(Q.where('exercise_instance_id', i.id))
            .fetch(),
        ),
      );

      const completedSets = allSets.flat().filter((s: any) => s.completed).length;
      const totalSets = allSets.flat().length;
      const tonnage = allSets.flat()
        .filter((s: any) => s.completed && s.setType !== 'warmup')
        .reduce((sum: number, s: any) => sum + s.weight * (s.reps ?? 0), 0);

      if (alive) setSummary({ exercises: names, completedSets, totalSets, tonnage });
    })();
    return () => { alive = false; };
  }, [session.id]);

  const duration = session.endedAt
    ? formatDuration(session.endedAt.getTime() - session.startedAt.getTime())
    : null;

  return (
    <TouchableOpacity
      style={[styles.card, {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: radius.md,
        borderLeftWidth: isNeo ? 2 : 0,
        borderLeftColor: colors.accent,
      }]}
      activeOpacity={0.75}
      onPress={() => router.push(`/session/${session.id}`)}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={[styles.sessionName, { color: colors.text }]} numberOfLines={1}>
            {session.name ?? 'Séance libre'}
          </Text>
          <Text style={[styles.dateLine, { color: colors.textMuted }]}>
            {formatDate(session.startedAt)} · {formatTime(session.startedAt)}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {duration && (
            <Text style={[styles.duration, { color: colors.textMuted, letterSpacing: isNeo ? 0.5 : 0 }]}>
              {duration}
            </Text>
          )}
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </View>
      </View>

      {/* Stats chips */}
      {summary && (
        <View style={styles.statsRow}>
          <View style={[styles.chip, { backgroundColor: colors.accentDim, borderRadius: radius.sm }]}>
            <Ionicons name="layers-outline" size={10} color={colors.accent} />
            <Text style={[styles.chipText, { color: colors.accent }]}>
              {summary.completedSets} séries
            </Text>
          </View>
          {summary.tonnage > 0 && (
            <View style={[styles.chip, { backgroundColor: colors.accentDim, borderRadius: radius.sm }]}>
              <Ionicons name="barbell-outline" size={10} color={colors.accent} />
              <Text style={[styles.chipText, { color: colors.accent }]}>
                {summary.tonnage >= 1000
                  ? `${(summary.tonnage / 1000).toFixed(1)}t`
                  : `${summary.tonnage}kg`}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Exercise list */}
      {summary && summary.exercises.length > 0 && (
        <View style={[styles.exoList, { borderTopColor: colors.border }]}>
          {summary.exercises.slice(0, 4).map((name, idx) => (
            <Text key={idx} style={[styles.exoName, { color: colors.textMuted }]} numberOfLines={1}>
              {name}
            </Text>
          ))}
          {summary.exercises.length > 4 && (
            <Text style={[styles.exoMore, { color: colors.textMuted }]}>
              +{summary.exercises.length - 4} exercice{summary.exercises.length - 4 > 1 ? 's' : ''}
            </Text>
          )}
        </View>
      )}

      {session.notes ? (
        <Text style={[styles.sessionNote, { color: colors.textMuted, borderTopColor: colors.border }]} numberOfLines={2}>
          {session.notes}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 14,
    paddingBottom: 8,
    gap: 8,
  },
  headerLeft: { flex: 1, gap: 3 },
  sessionName: { fontSize: 15, fontWeight: '800' },
  dateLine: { fontSize: 11 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 2 },
  duration: { fontSize: 12, fontVariant: ['tabular-nums'] },
  statsRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingBottom: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontSize: 11, fontWeight: '700' },
  exoList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 3,
  },
  exoName: { fontSize: 12 },
  exoMore: { fontSize: 11, fontStyle: 'italic' },
  sessionNote: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

export default React.memo(SessionCard);

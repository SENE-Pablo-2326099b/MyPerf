import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProgressChart from '@/features/stats/ProgressChart';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { database } from '@/db/database';
import type Exercise from '@/db/models/Exercise';
import { EQUIPMENT_LABELS, MUSCLE_GROUP_SHORT } from './exerciseData';

interface Props {
  exercise: Exercise;
  onPress: (exercise: Exercise) => void;
}

const DELETE_THRESHOLD = -72;
const DELETE_WIDTH = 80;

const GRIP_SHORT: Record<string, string> = {
  pronation: 'Pronation',
  supination: 'Supination',
  neutral: 'Neutre',
  mixed: 'Mixte',
};

const ANGLE_SHORT: Record<string, string> = {
  flat: 'Plat',
  incline: 'Incliné',
  decline: 'Décliné',
  overhead: 'Vertical',
  low_pulley: 'Poulie basse',
  high_pulley: 'Poulie haute',
};

function ExerciseCard({ exercise, onPress }: Props) {
  const { theme: { colors } } = useTheme();
  const translateX = useSharedValue(0);
  const [showChart, setShowChart] = useState(false);

  const handleDelete = useCallback(async () => {
    await database.write(async () => {
      await exercise.markAsDeleted();
    });
  }, [exercise]);

  const confirmDelete = useCallback(() => {
    Alert.alert('Supprimer', `Supprimer "${exercise.name}" ?`, [
      {
        text: 'Annuler',
        style: 'cancel',
        onPress: () => {
          translateX.value = withSpring(0);
        },
      },
      { text: 'Supprimer', style: 'destructive', onPress: handleDelete },
    ]);
  }, [exercise.name, handleDelete, translateX]);

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .onUpdate(e => {
      translateX.value = Math.max(-DELETE_WIDTH * 1.5, Math.min(0, e.translationX));
    })
    .onEnd(() => {
      if (translateX.value < DELETE_THRESHOLD) {
        translateX.value = withTiming(-DELETE_WIDTH);
        runOnJS(confirmDelete)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const muscleLabel = MUSCLE_GROUP_SHORT[exercise.primaryMuscleGroup] ?? exercise.primaryMuscleGroup;
  const equipLabel = EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment;
  const hasTechDetails = exercise.grip || exercise.workingAngle;

  return (
    <View style={styles.wrapper}>
      {/* Zone delete derrière la carte */}
      <View style={[styles.deleteZone, { backgroundColor: colors.danger }]}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.deleteLabel}>Suppr.</Text>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, cardStyle]}
        >
          <TouchableOpacity
            style={[styles.chartBtn, { borderColor: colors.border }]}
            onPress={() => setShowChart(true)}
            hitSlop={6}
          >
            <Ionicons name="stats-chart-outline" size={15} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardInner} onPress={() => onPress(exercise)} activeOpacity={0.7}>
            {/* Nom + badges */}
            <View style={styles.topRow}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {exercise.name}
              </Text>
              {exercise.isUnilateral && (
                <View style={[styles.pill, { backgroundColor: colors.accent + '28' }]}>
                  <Text style={[styles.pillText, { color: colors.accent }]}>Uni</Text>
                </View>
              )}
              {exercise.equipment === 'weighted_bodyweight' && (
                <View style={[styles.pill, { backgroundColor: colors.success + '28' }]}>
                  <Text style={[styles.pillText, { color: colors.success }]}>Lestable</Text>
                </View>
              )}
            </View>

            {/* Groupe · Équipement · Type */}
            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{muscleLabel}</Text>
              <Text style={[styles.sep, { color: colors.border }]}> · </Text>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{equipLabel}</Text>
              <Text style={[styles.sep, { color: colors.border }]}> · </Text>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {exercise.exerciseType === 'compound' ? 'Poly-art.' : 'Isolation'}
              </Text>
            </View>

            {/* Prise · Angle (si renseignés) */}
            {hasTechDetails && (
              <View style={[styles.metaRow, styles.techRow]}>
                {exercise.grip && (
                  <Text style={[styles.techText, { color: colors.textMuted }]}>
                    {GRIP_SHORT[exercise.grip] ?? exercise.grip}
                  </Text>
                )}
                {exercise.grip && exercise.workingAngle && (
                  <Text style={[styles.sep, { color: colors.border }]}> · </Text>
                )}
                {exercise.workingAngle && (
                  <Text style={[styles.techText, { color: colors.textMuted }]}>
                    {ANGLE_SHORT[exercise.workingAngle] ?? exercise.workingAngle}
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={styles.chevron} />
        </Animated.View>
      </GestureDetector>

      <ProgressChart
        visible={showChart}
        exerciseId={exercise.id}
        exerciseName={exercise.name}
        onClose={() => setShowChart(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: 16, marginBottom: 8, borderRadius: 12, overflow: 'hidden' },
  deleteZone: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  deleteLabel: { color: '#fff', fontSize: 11, fontWeight: '600' },
  card: { borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  cardInner: { flex: 1, padding: 14 },
  chartBtn: {
    padding: 10,
    borderRightWidth: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '600', flex: 1 },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  pillText: { fontSize: 11, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  techRow: { marginTop: 2 },
  metaText: { fontSize: 13 },
  techText: { fontSize: 12 },
  sep: { fontSize: 13 },
  chevron: { marginRight: 12 },
});

export default React.memo(ExerciseCard);

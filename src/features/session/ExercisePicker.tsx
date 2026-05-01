import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useExercises } from '@/hooks/useExercises';
import type Exercise from '@/db/models/Exercise';
import { MUSCLE_GROUP_SHORT, EQUIPMENT_LABELS } from '@/features/exercises/exerciseData';

const MUSCLE_FILTERS: Array<{ value: string; label: string; color: string; icon: string }> = [
  { value: 'chest',     label: 'Pecto',    color: '#EF4444', icon: 'body-outline' },
  { value: 'back',      label: 'Dos',      color: '#3B82F6', icon: 'body-outline' },
  { value: 'legs',      label: 'Jambes',   color: '#10B981', icon: 'body-outline' },
  { value: 'shoulders', label: 'Épaules',  color: '#F59E0B', icon: 'body-outline' },
  { value: 'arms',      label: 'Bras',     color: '#8B5CF6', icon: 'body-outline' },
  { value: 'core',      label: 'Core',     color: '#6B7280', icon: 'body-outline' },
];

const MUSCLE_COLORS: Record<string, string> = Object.fromEntries(
  MUSCLE_FILTERS.map(f => [f.value, f.color]),
);

interface Props {
  visible: boolean;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

function MuscleChip({
  label, color, active, onPress,
}: {
  label: string; color: string; active: boolean; onPress: () => void;
}) {
  const { theme: { colors } } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.muscleChip,
        {
          backgroundColor: active ? color : colors.surface,
          borderColor: active ? color : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {!active && (
        <View style={[styles.muscleDot, { backgroundColor: color }]} />
      )}
      <Text style={[styles.muscleChipTxt, { color: active ? '#fff' : colors.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ExerciseRow({ exercise, onPress }: { exercise: Exercise; onPress: () => void }) {
  const { theme: { colors, radius } } = useTheme();
  const muscleColor = MUSCLE_COLORS[exercise.primaryMuscleGroup] ?? colors.textMuted;
  const muscleLabel = MUSCLE_GROUP_SHORT[exercise.primaryMuscleGroup] ?? exercise.primaryMuscleGroup;
  const equipLabel = EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment;

  return (
    <TouchableOpacity
      style={[styles.exoRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.65}
    >
      {/* Muscle color indicator */}
      <View style={[styles.exoColorBar, { backgroundColor: muscleColor }]} />

      {/* Content */}
      <View style={styles.exoContent}>
        <Text style={[styles.exoName, { color: colors.text }]} numberOfLines={1}>
          {exercise.name}
        </Text>
        <View style={styles.exoMeta}>
          <View style={[styles.exoMusclePill, { backgroundColor: muscleColor + '18', borderColor: muscleColor + '40' }]}>
            <Text style={[styles.exoMuscleTxt, { color: muscleColor }]}>{muscleLabel}</Text>
          </View>
          <Text style={[styles.exoEquip, { color: colors.textMuted }]}>
            {equipLabel}{exercise.isUnilateral ? ' · Uni' : ''}
          </Text>
        </View>
      </View>

      <Ionicons name="add-circle" size={24} color={colors.accent} />
    </TouchableOpacity>
  );
}

export default function ExercisePicker({ visible, onSelect, onClose }: Props) {
  const { theme: { colors, radius } } = useTheme();
  const exercises = useExercises();
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return exercises.filter(ex => {
      if (q && !ex.name.toLowerCase().includes(q)) return false;
      if (muscle && ex.primaryMuscleGroup !== muscle) return false;
      return true;
    });
  }, [exercises, search, muscle]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* ── Header ── */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: colors.text }]}>Ajouter un exercice</Text>
            {filtered.length > 0 && (
              <Text style={[styles.resultCount, { color: colors.textMuted }]}>
                {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.border + '80', borderRadius: 14 }]}
            onPress={onClose}
            hitSlop={12}
          >
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Search bar ── */}
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un exercice…"
            placeholderTextColor={colors.textMuted}
            autoFocus
            clearButtonMode="while-editing"
          />
        </View>

        {/* ── Muscle group filters ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {MUSCLE_FILTERS.map(f => (
            <MuscleChip
              key={f.value}
              label={f.label}
              color={f.color}
              active={muscle === f.value}
              onPress={() => setMuscle(prev => prev === f.value ? null : f.value)}
            />
          ))}
        </ScrollView>

        {/* ── Exercise list ── */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ExerciseRow exercise={item} onPress={() => onSelect(item)} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={40} color={colors.border} />
              <Text style={[styles.emptyTxt, { color: colors.textMuted }]}>
                {search ? `Aucun résultat pour "${search}"` : 'Aucun exercice trouvé'}
              </Text>
            </View>
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerLeft: { flex: 1, gap: 2 },
  title: { fontSize: 18, fontWeight: '800' },
  resultCount: { fontSize: 12 },
  closeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 16, padding: 0 },

  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  muscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  muscleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  muscleChipTxt: { fontSize: 13, fontWeight: '700' },

  exoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingRight: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  exoColorBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginLeft: 16,
  },
  exoContent: { flex: 1, gap: 4 },
  exoName: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  exoMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exoMusclePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  exoMuscleTxt: { fontSize: 11, fontWeight: '700' },
  exoEquip: { fontSize: 12 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTxt: { fontSize: 15, textAlign: 'center', paddingHorizontal: 24 },
});

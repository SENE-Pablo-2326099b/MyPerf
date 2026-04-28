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

const MUSCLE_FILTERS = [
  { value: 'chest', label: 'Pecto' },
  { value: 'back', label: 'Dos' },
  { value: 'legs', label: 'Jambes' },
  { value: 'shoulders', label: 'Épaules' },
  { value: 'arms', label: 'Bras' },
  { value: 'core', label: 'Core' },
] as const;

interface Props {
  visible: boolean;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme: { colors } } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { backgroundColor: active ? colors.accent : colors.surface, borderColor: active ? colors.accent : colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, { color: active ? '#fff' : colors.textMuted }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ExerciseRow({ exercise, onPress }: { exercise: Exercise; onPress: () => void }) {
  const { theme: { colors } } = useTheme();
  const muscleLabel = MUSCLE_GROUP_SHORT[exercise.primaryMuscleGroup] ?? exercise.primaryMuscleGroup;
  const equipLabel = EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment;

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.65}
    >
      <View style={styles.rowContent}>
        <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
          {exercise.name}
        </Text>
        <Text style={[styles.rowMeta, { color: colors.textMuted }]}>
          {muscleLabel} · {equipLabel}
          {exercise.isUnilateral ? ' · Uni' : ''}
        </Text>
      </View>
      <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
    </TouchableOpacity>
  );
}

export default function ExercisePicker({ visible, onSelect, onClose }: Props) {
  const { theme: { colors } } = useTheme();
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
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Ajouter un exercice</Text>
          <TouchableOpacity onPress={onClose} hitSlop={16}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={17} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher…"
            placeholderTextColor={colors.textMuted}
            autoFocus
            clearButtonMode="while-editing"
          />
        </View>

        {/* Muscle filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {MUSCLE_FILTERS.map(f => (
            <FilterChip
              key={f.value}
              label={f.label}
              active={muscle === f.value}
              onPress={() => setMuscle(prev => (prev === f.value ? null : f.value))}
            />
          ))}
        </ScrollView>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ExerciseRow exercise={item} onPress={() => onSelect(item)} />
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textMuted }]}>Aucun exercice trouvé</Text>
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
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 17, fontWeight: '600' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 16, padding: 0 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontWeight: '500' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowContent: { flex: 1 },
  rowName: { fontSize: 16, fontWeight: '500', marginBottom: 2 },
  rowMeta: { fontSize: 13 },
  empty: { textAlign: 'center', marginTop: 48, fontSize: 15 },
});

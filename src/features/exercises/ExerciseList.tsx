import { useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import type Exercise from '@/db/models/Exercise';
import ExerciseCard from './ExerciseCard';

interface Props {
  exercises: Exercise[];
  onPress: (exercise: Exercise) => void;
  onCreateNew: () => void;
}

const MUSCLE_FILTERS = [
  { value: 'chest', label: 'Pecto' },
  { value: 'back', label: 'Dos' },
  { value: 'legs', label: 'Jambes' },
  { value: 'shoulders', label: 'Épaules' },
  { value: 'arms', label: 'Bras' },
  { value: 'core', label: 'Core' },
] as const;

const EQUIPMENT_FILTERS = [
  { value: 'barbell', label: 'Barre' },
  { value: 'ez_bar', label: 'Barre EZ' },
  { value: 'smith_machine', label: 'Smith' },
  { value: 'dumbbell', label: 'Haltères' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'cable', label: 'Câble' },
  { value: 'machine', label: 'Machine' },
  { value: 'bodyweight', label: 'Poids corps' },
  { value: 'weighted_bodyweight', label: 'Lestable' },
] as const;

const TYPE_FILTERS = [
  { value: 'compound', label: 'Poly-art.' },
  { value: 'isolation', label: 'Isolation' },
] as const;

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const {
    theme: { colors },
  } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.accent : colors.surface,
          borderColor: active ? colors.accent : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, { color: active ? '#fff' : colors.textMuted }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ExerciseList({ exercises, onPress, onCreateNew }: Props) {
  const {
    theme: { colors },
  } = useTheme();
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState<string | null>(null);
  const [equip, setEquip] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return exercises.filter(ex => {
      if (q && !ex.name.toLowerCase().includes(q)) return false;
      if (muscle && ex.primaryMuscleGroup !== muscle) return false;
      if (equip && ex.equipment !== equip) return false;
      if (type && ex.exerciseType !== type) return false;
      return true;
    });
  }, [exercises, search, muscle, equip, type]);

  // Empty library
  if (exercises.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="barbell-outline" size={64} color={colors.border} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Ta bibliothèque est vide</Text>
        <Text style={[styles.emptySub, { color: colors.textMuted }]}>
          Crée ton premier exercice pour commencer à tracker tes séances.
        </Text>
        <TouchableOpacity
          style={[styles.emptyBtn, { backgroundColor: colors.accent }]}
          onPress={onCreateNew}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyBtnText}>Créer un exercice</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const header = (
    <>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={17} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher…"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={17} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {MUSCLE_FILTERS.map(f => (
          <Chip
            key={f.value}
            label={f.label}
            active={muscle === f.value}
            onPress={() => setMuscle(prev => (prev === f.value ? null : f.value))}
          />
        ))}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        {EQUIPMENT_FILTERS.map(f => (
          <Chip
            key={f.value}
            label={f.label}
            active={equip === f.value}
            onPress={() => setEquip(prev => (prev === f.value ? null : f.value))}
          />
        ))}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        {TYPE_FILTERS.map(f => (
          <Chip
            key={f.value}
            label={f.label}
            active={type === f.value}
            onPress={() => setType(prev => (prev === f.value ? null : f.value))}
          />
        ))}
      </ScrollView>

      {/* Result count */}
      <Text style={[styles.count, { color: colors.textMuted }]}>
        {filtered.length} exercice{filtered.length !== 1 ? 's' : ''}
      </Text>
    </>
  );

  return (
    <FlatList
      data={filtered}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <ExerciseCard exercise={item} onPress={onPress} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <View style={styles.noResultWrap}>
          <Text style={[styles.noResult, { color: colors.textMuted }]}>
            Aucun exercice pour ces filtres
          </Text>
        </View>
      }
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: 12, paddingBottom: 100 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 16, padding: 0 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 6, gap: 8, alignItems: 'center' },
  divider: { width: 1, height: 20, marginHorizontal: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontWeight: '500' },
  count: { fontSize: 13, marginHorizontal: 16, marginTop: 4, marginBottom: 4 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12 },
  emptyBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  noResultWrap: { paddingTop: 48, alignItems: 'center' },
  noResult: { fontSize: 15 },
});

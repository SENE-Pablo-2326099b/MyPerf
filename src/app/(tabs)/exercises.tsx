import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useExercises } from '@/hooks/useExercises';
import ExerciseList from '@/features/exercises/ExerciseList';
import ExerciseForm from '@/features/exercises/ExerciseForm';
import type Exercise from '@/db/models/Exercise';

export default function ExercisesScreen() {
  const {
    theme: { colors },
  } = useTheme();
  const exercises = useExercises();
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [showForm, setShowForm] = useState(false);

  const openEdit = (exercise: Exercise) => {
    setSelected(exercise);
    setShowForm(true);
  };

  const openCreate = () => {
    setSelected(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setSelected(null);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ExerciseList exercises={exercises} onPress={openEdit} onCreateNew={openCreate} />

      {exercises.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.accent }]}
          onPress={openCreate}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}

      <ExerciseForm exercise={selected} visible={showForm} onClose={closeForm} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});

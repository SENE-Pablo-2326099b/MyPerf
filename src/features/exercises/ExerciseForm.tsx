import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { database } from '@/db/database';
import type Exercise from '@/db/models/Exercise';
import type { Equipment, ExerciseType, Grip, SpecificMuscle, WorkingAngle } from '@/db/models/Exercise';
import {
  ANGLE_OPTIONS,
  EQUIPMENT_OPTIONS,
  EXERCISE_TYPES,
  GRIP_OPTIONS,
  MUSCLE_GROUP_MAP,
  MUSCLE_GROUPS,
} from './exerciseData';

interface Props {
  exercise: Exercise | null;
  visible: boolean;
  onClose: () => void;
}

// ── Composants internes ────────────────────────────────────────────────────

function SectionHeader({ title, colors }: { title: string; colors: any }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
      <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
    </View>
  );
}

function Chip({
  label,
  sub,
  active,
  onPress,
  colors,
}: {
  label: string;
  sub?: string;
  active: boolean;
  onPress: () => void;
  colors: any;
}) {
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
      <Text style={[styles.chipLabel, { color: active ? '#fff' : colors.text }]}>{label}</Text>
      {sub && (
        <Text style={[styles.chipSub, { color: active ? 'rgba(255,255,255,0.75)' : colors.textMuted }]}>
          {sub}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ── Formulaire principal ───────────────────────────────────────────────────

export default function ExerciseForm({ exercise, visible, onClose }: Props) {
  const { theme: { colors } } = useTheme();

  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('chest');
  const [specificMuscles, setSpecificMuscles] = useState<SpecificMuscle[]>([]);
  const [equipment, setEquipment] = useState<Equipment>('barbell');
  const [type, setType] = useState<ExerciseType>('compound');
  const [grip, setGrip] = useState<Grip | null>(null);
  const [angle, setAngle] = useState<WorkingAngle | null>(null);
  const [unilateral, setUnilateral] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const nameRef = useRef<TextInput>(null);

  // Populate from exercise on open
  useEffect(() => {
    if (!visible) return;
    setName(exercise?.name ?? '');
    setMuscleGroup(exercise?.primaryMuscleGroup ?? 'chest');
    setSpecificMuscles((exercise?.specificMuscles as SpecificMuscle[]) ?? []);
    setEquipment(exercise?.equipment ?? 'barbell');
    setType(exercise?.exerciseType ?? 'compound');
    setGrip(exercise?.grip ?? null);
    setAngle(exercise?.workingAngle ?? null);
    setUnilateral(exercise?.isUnilateral ?? false);
    setNotes(exercise?.notes ?? '');
  }, [visible, exercise]);

  // Reset specific muscles when group changes
  const handleGroupChange = useCallback((g: string) => {
    setMuscleGroup(g);
    setSpecificMuscles([]);
  }, []);

  const toggleMuscle = useCallback((m: SpecificMuscle) => {
    setSpecificMuscles(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m],
    );
  }, []);

  const toggleOptional = useCallback(<T,>(
    current: T | null,
    value: T,
    setter: (v: T | null) => void,
  ) => {
    setter(current === value ? null : value);
  }, []);

  const handleSave = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Nom requis', 'Donne un nom à cet exercice.');
      return;
    }
    setSaving(true);
    try {
      await database.write(async () => {
        if (exercise) {
          await exercise.update(r => {
            r.name = trimmed;
            r.primaryMuscleGroup = muscleGroup;
            r.specificMuscles = specificMuscles as any;
            r.equipment = equipment;
            r.exerciseType = type;
            r.isUnilateral = unilateral;
            r.grip = grip;
            r.workingAngle = angle;
            r.notes = notes.trim() || null;
          });
        } else {
          await database.get<Exercise>('exercises').create(r => {
            r.name = trimmed;
            r.primaryMuscleGroup = muscleGroup;
            r.secondaryMuscleGroups = [];
            r.specificMuscles = specificMuscles as any;
            r.equipment = equipment;
            r.exerciseType = type;
            r.isUnilateral = unilateral;
            r.grip = grip;
            r.workingAngle = angle;
            r.notes = notes.trim() || null;
          });
        }
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }, [name, muscleGroup, specificMuscles, equipment, type, grip, angle, unilateral, notes, exercise, onClose]);

  const currentGroup = MUSCLE_GROUP_MAP[muscleGroup];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={16}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {exercise ? 'Modifier' : 'Nouvel exercice'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} hitSlop={16}>
            <Text style={[styles.saveBtn, { color: saving ? colors.textMuted : colors.accent }]}>
              {saving ? '…' : 'Sauver'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Nom ────────────────────────────────────────────── */}
          <SectionHeader title="NOM *" colors={colors} />
          <TextInput
            ref={nameRef}
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="ex. Dips lestés, Squat barre haute…"
            placeholderTextColor={colors.textMuted}
            autoFocus={!exercise}
            returnKeyType="done"
          />

          {/* ── Groupe musculaire ───────────────────────────────── */}
          <SectionHeader title="GROUPE MUSCULAIRE" colors={colors} />
          <View style={styles.chips}>
            {MUSCLE_GROUPS.map(g => (
              <Chip
                key={g.value}
                label={g.label}
                active={muscleGroup === g.value}
                onPress={() => handleGroupChange(g.value)}
                colors={colors}
              />
            ))}
          </View>

          {/* ── Muscles précis (sous-sélection) ────────────────── */}
          {currentGroup && (
            <>
              <View style={styles.subHeader}>
                <Text style={[styles.subTitle, { color: colors.textMuted }]}>
                  MUSCLES CIBLÉS — {currentGroup.label.toUpperCase()}
                </Text>
                {specificMuscles.length > 0 && (
                  <TouchableOpacity onPress={() => setSpecificMuscles([])} hitSlop={8}>
                    <Text style={[styles.clearBtn, { color: colors.textMuted }]}>Effacer</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.chips}>
                {currentGroup.muscles.map(m => (
                  <Chip
                    key={m.value}
                    label={m.label}
                    active={specificMuscles.includes(m.value)}
                    onPress={() => toggleMuscle(m.value)}
                    colors={colors}
                  />
                ))}
              </View>
            </>
          )}

          {/* ── Équipement ─────────────────────────────────────── */}
          <SectionHeader title="ÉQUIPEMENT" colors={colors} />
          <View style={styles.chips}>
            {EQUIPMENT_OPTIONS.map(eq => (
              <Chip
                key={eq.value}
                label={eq.label}
                sub={eq.sub}
                active={equipment === eq.value}
                onPress={() => setEquipment(eq.value)}
                colors={colors}
              />
            ))}
          </View>

          {/* Message "lestable" si weighted_bodyweight */}
          {equipment === 'weighted_bodyweight' && (
            <View style={[styles.infoBox, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '40' }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
              <Text style={[styles.infoText, { color: colors.accent }]}>
                Poids du corps + lest additionnel. Le lest sera enregistré dans chaque série.
              </Text>
            </View>
          )}

          {/* ── Type ───────────────────────────────────────────── */}
          <SectionHeader title="TYPE" colors={colors} />
          <View style={styles.chips}>
            {EXERCISE_TYPES.map(t => (
              <Chip
                key={t.value}
                label={t.label}
                active={type === t.value}
                onPress={() => setType(t.value)}
                colors={colors}
              />
            ))}
          </View>

          {/* ── Prise ──────────────────────────────────────────── */}
          <SectionHeader title="PRISE (optionnel)" colors={colors} />
          <View style={styles.chips}>
            {GRIP_OPTIONS.map(g => (
              <Chip
                key={g.value}
                label={g.label}
                sub={g.sub}
                active={grip === g.value}
                onPress={() => toggleOptional(grip, g.value, setGrip)}
                colors={colors}
              />
            ))}
          </View>

          {/* ── Angle de travail ────────────────────────────────── */}
          <SectionHeader title="ANGLE DE TRAVAIL (optionnel)" colors={colors} />
          <View style={styles.chips}>
            {ANGLE_OPTIONS.map(a => (
              <Chip
                key={a.value}
                label={a.label}
                active={angle === a.value}
                onPress={() => toggleOptional(angle, a.value, setAngle)}
                colors={colors}
              />
            ))}
          </View>

          {/* ── Unilatéral ─────────────────────────────────────── */}
          <SectionHeader title="OPTIONS" colors={colors} />
          <View style={[styles.toggleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>Unilatéral</Text>
              <Text style={[styles.toggleSub, { color: colors.textMuted }]}>Un côté à la fois</Text>
            </View>
            <Switch
              value={unilateral}
              onValueChange={setUnilateral}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#fff"
            />
          </View>

          {/* ── Notes ──────────────────────────────────────────── */}
          <SectionHeader title="NOTES (optionnel)" colors={colors} />
          <TextInput
            style={[
              styles.input,
              styles.notesInput,
              { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Indications techniques, variantes, points d'attention…"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.bottomPad} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

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
  headerTitle: { fontSize: 17, fontWeight: '600' },
  saveBtn: { fontSize: 16, fontWeight: '600' },
  scroll: { padding: 20 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 28, marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9 },
  sectionLine: { flex: 1, height: StyleSheet.hairlineWidth },

  subHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 10 },
  subTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.7 },
  clearBtn: { fontSize: 13 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, gap: 2 },
  chipLabel: { fontSize: 14, fontWeight: '500' },
  chipSub: { fontSize: 11 },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },

  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  notesInput: { minHeight: 88, paddingTop: 12 },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  toggleTitle: { fontSize: 16, fontWeight: '500' },
  toggleSub: { fontSize: 13, marginTop: 2 },

  bottomPad: { height: 48 },
});

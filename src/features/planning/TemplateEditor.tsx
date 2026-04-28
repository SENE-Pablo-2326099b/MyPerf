import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useTemplateExercises } from '@/hooks/useTemplateExercises';
import { useExercises } from '@/hooks/useExercises';
import {
  addExerciseToTemplate,
  createTemplate,
  deleteTemplate,
  removeExerciseFromTemplate,
  updateTemplate,
  updateTemplateExercise,
} from './templateActions';
import ExercisePicker from '@/features/session/ExercisePicker';
import { BLOCK_DEFAULTS, BLOCK_LIST, BLOCK_LABELS, BLOCK_COLORS, formatRestTime } from './blockUtils';
import type WorkoutTemplate from '@/db/models/WorkoutTemplate';
import type TemplateExercise from '@/db/models/TemplateExercise';
import type Exercise from '@/db/models/Exercise';
import type { Intention } from '@/db/models/ExerciseInstance';
import type { BlockType } from './blockUtils';

const INTENTIONS: Array<{ value: Intention; label: string }> = [
  { value: 'power', label: 'Puissance' },
  { value: 'strength', label: 'Force' },
  { value: 'hypertrophy', label: 'Hypertrophie' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'metabolic', label: 'Métabolique' },
];

const REST_PRESETS = [60, 90, 120, 180, 300];

interface TeRowProps {
  te: TemplateExercise;
  exerciseName: string;
  onRemove: () => void;
}

function TemplateExerciseRow({ te, exerciseName, onRemove }: TeRowProps) {
  const { theme: { colors } } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const repLabel =
    te.repRangeMin != null && te.repRangeMax != null
      ? `${te.repRangeMin}–${te.repRangeMax} reps`
      : te.repRangeMin != null
      ? `${te.repRangeMin}+ reps`
      : '— reps';

  const setsLabel = te.targetSets != null ? `${te.targetSets} × ` : '';
  const rpeLabel = te.rpeTarget != null ? ` @ RPE ${te.rpeTarget}` : '';
  const restLabel = te.restSeconds != null ? ` · ${formatRestTime(te.restSeconds)}` : '';

  return (
    <View style={[styles.teCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.teHeader}
        onPress={() => setExpanded(v => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.teHeaderLeft}>
          <Text style={[styles.teName, { color: colors.text }]} numberOfLines={1}>{exerciseName}</Text>
          <Text style={[styles.teSummary, { color: colors.textMuted }]}>
            {setsLabel}{repLabel}{rpeLabel}{restLabel}
          </Text>
        </View>
        <View style={styles.teHeaderRight}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textMuted}
          />
          <TouchableOpacity onPress={onRemove} hitSlop={12}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.teBody, { borderTopColor: colors.border }]}>
          {/* Intention */}
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>INTENTION</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              {INTENTIONS.map(opt => {
                const active = te.intention === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.chip,
                      { backgroundColor: active ? colors.accent : colors.background, borderColor: active ? colors.accent : colors.border },
                    ]}
                    onPress={() => updateTemplateExercise(te, { intention: opt.value })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, { color: active ? '#fff' : colors.textMuted }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Pré-remplir depuis bloc */}
          <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 12 }]}>
            PRÉ-REMPLIR DEPUIS UN BLOC
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              {BLOCK_LIST.map(bt => {
                const color = BLOCK_COLORS[bt];
                return (
                  <TouchableOpacity
                    key={bt}
                    style={[styles.chip, { backgroundColor: color + '22', borderColor: color + '55' }]}
                    onPress={() => {
                      const d = BLOCK_DEFAULTS[bt];
                      updateTemplateExercise(te, {
                        repRangeMin: d.repMin,
                        repRangeMax: d.repMax,
                        rpeTarget: d.rpe,
                        restSeconds: d.restSeconds,
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, { color }]}>{BLOCK_LABELS[bt]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Séries / Reps / RPE / Repos */}
          <View style={styles.fieldsGrid}>
            <NumberField
              label="Séries"
              value={te.targetSets}
              onSave={v => updateTemplateExercise(te, { targetSets: v })}
              colors={colors}
            />
            <NumberField
              label="Reps min"
              value={te.repRangeMin}
              onSave={v => updateTemplateExercise(te, { repRangeMin: v })}
              colors={colors}
            />
            <NumberField
              label="Reps max"
              value={te.repRangeMax}
              onSave={v => updateTemplateExercise(te, { repRangeMax: v })}
              colors={colors}
            />
            <NumberField
              label="RPE cible"
              value={te.rpeTarget}
              decimal
              onSave={v => updateTemplateExercise(te, { rpeTarget: v })}
              colors={colors}
            />
          </View>

          {/* Repos presets */}
          <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 12 }]}>REPOS ENTRE SÉRIES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              {REST_PRESETS.map(s => {
                const active = te.restSeconds === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, { backgroundColor: active ? colors.accent : colors.background, borderColor: active ? colors.accent : colors.border }]}
                    onPress={() => updateTemplateExercise(te, { restSeconds: s })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, { color: active ? '#fff' : colors.textMuted }]}>
                      {formatRestTime(s)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function NumberField({
  label,
  value,
  decimal,
  onSave,
  colors,
}: {
  label: string;
  value: number | null;
  decimal?: boolean;
  onSave: (v: number | null) => void;
  colors: any;
}) {
  return (
    <View style={styles.numberField}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        style={[styles.numInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
        defaultValue={value != null ? String(value) : ''}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        placeholder="—"
        placeholderTextColor={colors.textMuted}
        selectTextOnFocus
        onEndEditing={e => {
          const raw = e.nativeEvent.text.replace(',', '.');
          const n = decimal ? parseFloat(raw) : parseInt(raw, 10);
          onSave(isNaN(n) ? null : n);
        }}
      />
    </View>
  );
}

interface Props {
  template: WorkoutTemplate | null;
  visible: boolean;
  onClose: () => void;
}

export default function TemplateEditor({ template, visible, onClose }: Props) {
  const { theme: { colors } } = useTheme();
  const templateExercises = useTemplateExercises(template?.id ?? null);
  const allExercises = useExercises();
  const [showPicker, setShowPicker] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setName(template?.name ?? '');
  }, [visible, template]);

  const exerciseMap = Object.fromEntries(allExercises.map(e => [e.id, e.name]));

  const handleSave = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) { Alert.alert('Nom requis'); return; }
    setSaving(true);
    try {
      if (template) {
        await updateTemplate(template, trimmed);
      } else {
        await createTemplate(trimmed);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }, [name, template, onClose]);

  const handleDelete = useCallback(() => {
    if (!template) return;
    Alert.alert('Supprimer le template ?', `"${template.name}" sera définitivement supprimé.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => { deleteTemplate(template); onClose(); } },
    ]);
  }, [template, onClose]);

  const handleAddExercise = useCallback(
    async (exercise: Exercise) => {
      if (!template) return;
      setShowPicker(false);
      await addExerciseToTemplate(template, exercise, templateExercises.length);
    },
    [template, templateExercises.length],
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={16}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {template ? 'Modifier le template' : 'Nouveau template'}
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
          keyboardDismissMode="on-drag"
        >
          {/* Nom */}
          <TextInput
            style={[styles.nameInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={name}
            onChangeText={setName}
            placeholder="Nom du template (ex. Push A, Jambes…)"
            placeholderTextColor={colors.textMuted}
            autoFocus={!template}
          />

          {/* Exercises */}
          {template && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                EXERCICES ({templateExercises.length})
              </Text>
              {templateExercises.map(te => (
                <TemplateExerciseRow
                  key={te.id}
                  te={te}
                  exerciseName={exerciseMap[te.exerciseId] ?? '…'}
                  onRemove={() => removeExerciseFromTemplate(te)}
                />
              ))}
              <TouchableOpacity
                style={[styles.addExBtn, { borderColor: colors.accent }]}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={colors.accent} />
                <Text style={[styles.addExText, { color: colors.accent }]}>Ajouter un exercice</Text>
              </TouchableOpacity>
            </>
          )}

          {template && (
            <TouchableOpacity style={[styles.deleteBtn, { borderColor: colors.danger }]} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={[styles.deleteText, { color: colors.danger }]}>Supprimer ce template</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <ExercisePicker
        visible={showPicker}
        onSelect={handleAddExercise}
        onClose={() => setShowPicker(false)}
      />
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
  headerTitle: { fontSize: 17, fontWeight: '600' },
  saveBtn: { fontSize: 16, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 48 },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 24,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  teCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  teHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 8,
  },
  teHeaderLeft: { flex: 1 },
  teHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  teName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  teSummary: { fontSize: 13 },
  teBody: { padding: 14, borderTopWidth: StyleSheet.hairlineWidth },
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  chipScroll: { marginBottom: 4 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1.5 },
  chipText: { fontSize: 12, fontWeight: '600' },
  fieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  numberField: { width: '45%' },
  numInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addExText: { fontSize: 15, fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 32,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  deleteText: { fontSize: 14, fontWeight: '600' },
});

import React, { useState } from 'react';
import {
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
import { addBodyMetric } from './bodyActions';

const MONTH_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function fmtDate(d: Date): string {
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface NumberFieldProps {
  label: string;
  unit: string;
  value: string;
  onChangeText: (v: string) => void;
  large?: boolean;
}

function NumberField({ label, unit, value, onChangeText, large }: NumberFieldProps) {
  const { theme: { colors, radius } } = useTheme();
  return (
    <View style={styles.fieldRow}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted, fontSize: large ? 14 : 12 }]}>
        {label}
      </Text>
      <View style={[styles.fieldInputWrap, {
        backgroundColor: colors.surfaceRaised,
        borderColor: colors.border,
        borderRadius: radius.sm,
      }]}>
        <TextInput
          style={[styles.fieldInput, {
            color: colors.text,
            fontSize: large ? 24 : 15,
            fontWeight: large ? '800' : '600',
          }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholder="—"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={[styles.fieldUnit, { color: colors.textMuted, fontSize: large ? 16 : 12 }]}>
          {unit}
        </Text>
      </View>
    </View>
  );
}

export default function BodyMetricModal({ visible, onClose }: Props) {
  const { theme: { colors, radius } } = useTheme();

  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d;
  });
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [leftArm, setLeftArm] = useState('');
  const [rightArm, setRightArm] = useState('');
  const [leftThigh, setLeftThigh] = useState('');
  const [rightThigh, setRightThigh] = useState('');
  const [notes, setNotes] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    setDate(d);
    setWeight('');
    setBodyFat('');
    setChest('');
    setWaist('');
    setHips('');
    setLeftArm('');
    setRightArm('');
    setLeftThigh('');
    setRightThigh('');
    setNotes('');
    setExpanded(false);
  }

  function shiftDay(delta: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d);
  }

  function parseNum(s: string): number | null {
    const n = parseFloat(s.replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  async function handleSave() {
    const w = parseNum(weight);
    if (!w) return;
    setSaving(true);
    try {
      await addBodyMetric({
        recordedAt: date,
        weightKg: w,
        bodyFatPct: parseNum(bodyFat),
        chestCm: parseNum(chest),
        waistCm: parseNum(waist),
        hipsCm: parseNum(hips),
        leftArmCm: parseNum(leftArm),
        rightArmCm: parseNum(rightArm),
        leftThighCm: parseNum(leftThigh),
        rightThighCm: parseNum(rightThigh),
        notes: notes.trim() || null,
      });
      resetForm();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  const canSave = weight.length > 0 && parseNum(weight) !== null && !saving;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Poids & Mensurations</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Date navigation */}
          <View style={[styles.dateRow, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
            <TouchableOpacity onPress={() => shiftDay(-1)} hitSlop={12} style={styles.dateArrow}>
              <Ionicons name="chevron-back" size={20} color={colors.accent} />
            </TouchableOpacity>
            <Text style={[styles.dateText, { color: colors.text }]}>{fmtDate(date)}</Text>
            <TouchableOpacity onPress={() => shiftDay(1)} hitSlop={12} style={styles.dateArrow}>
              <Ionicons name="chevron-forward" size={20} color={colors.accent} />
            </TouchableOpacity>
          </View>

          {/* Weight — quick section */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>POIDS DE CORPS</Text>
            <NumberField label="Poids" unit="kg" value={weight} onChangeText={setWeight} large />
          </View>

          {/* Toggle extended */}
          <TouchableOpacity
            style={[styles.toggleBtn, { borderColor: colors.border, borderRadius: radius.md }]}
            onPress={() => setExpanded(e => !e)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.accent}
            />
            <Text style={[styles.toggleText, { color: colors.accent }]}>
              {expanded ? 'Masquer les mensurations' : 'Mensurations détaillées'}
            </Text>
          </TouchableOpacity>

          {expanded && (
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>MENSURATIONS</Text>
              <NumberField label="% Masse grasse" unit="%" value={bodyFat} onChangeText={setBodyFat} />
              <NumberField label="Poitrine" unit="cm" value={chest} onChangeText={setChest} />
              <NumberField label="Tour de taille" unit="cm" value={waist} onChangeText={setWaist} />
              <NumberField label="Hanches" unit="cm" value={hips} onChangeText={setHips} />
              <NumberField label="Bras gauche" unit="cm" value={leftArm} onChangeText={setLeftArm} />
              <NumberField label="Bras droit" unit="cm" value={rightArm} onChangeText={setRightArm} />
              <NumberField label="Cuisse gauche" unit="cm" value={leftThigh} onChangeText={setLeftThigh} />
              <NumberField label="Cuisse droite" unit="cm" value={rightThigh} onChangeText={setRightThigh} />
            </View>
          )}

          {/* Notes */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>NOTES (optionnel)</Text>
            <TextInput
              style={[styles.notesInput, { color: colors.text, borderColor: colors.border, borderRadius: radius.sm }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Conditions, état général..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border, borderRadius: radius.md }]}
              onPress={handleClose}
            >
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, {
                backgroundColor: canSave ? colors.accent : colors.border,
                borderRadius: radius.md,
              }]}
              onPress={handleSave}
              disabled={!canSave}
            >
              <Text style={[styles.saveText, { color: canSave ? '#000' : colors.textMuted }]}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  body: { padding: 16, gap: 12, paddingBottom: 48 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  dateArrow: { padding: 4 },
  dateText: { fontSize: 15, fontWeight: '700' },
  section: {
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fieldLabel: { flex: 1, fontWeight: '600' },
  fieldInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    minWidth: 100,
  },
  fieldInput: { flex: 1, textAlign: 'right', minWidth: 60 },
  fieldUnit: { fontWeight: '600' },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  toggleText: { fontSize: 13, fontWeight: '700' },
  notesInput: {
    borderWidth: 1,
    padding: 10,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 72,
  },
  actions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '700' },
  saveBtn: {
    flex: 2,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveText: { fontSize: 15, fontWeight: '800' },
});

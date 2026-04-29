import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { getMesocycleWeek } from '@/db/models/Mesocycle';
import {
  MICRO_COLORS,
  MICRO_LABEL_LIST,
  MICRO_LABELS,
  MICRO_VOL_DEFAULTS,
  type MicroLabel,
} from './microcycleUtils';
import { saveMicrocycles, type MicroWeek } from './mesocycleActions';
import type Mesocycle from '@/db/models/Mesocycle';
import type Microcycle from '@/db/models/Microcycle';
import type { BlockType } from './blockUtils';

// ── Défaut intelligent selon le type de bloc ──────────────────────────────────

function blockToMicroLabel(bt: BlockType): MicroLabel {
  if (bt === 'deload') return 'deload';
  if (bt === 'realization') return 'realization';
  if (bt === 'accumulation') return 'accumulation';
  return 'intensification';
}

function buildDefaultWeeks(mesocycle: Mesocycle, existing: Microcycle[]): MicroWeek[] {
  const { total } = getMesocycleWeek(mesocycle);

  if (existing.length === total) {
    return existing.map(m => ({
      weekNumber: m.weekNumber,
      label: m.label,
      volumePct: m.volumePct,
      notes: m.notes,
    }));
  }

  const defaultLabel = blockToMicroLabel(mesocycle.blockType);

  return Array.from({ length: total }, (_, i) => {
    const weekNum = i + 1;
    const isLast = weekNum === total && total >= 3;
    const label: MicroLabel = isLast ? 'deload' : defaultLabel;
    return {
      weekNumber: weekNum,
      label,
      volumePct: MICRO_VOL_DEFAULTS[label],
      notes: null,
    };
  });
}

// ── Volume stepper ────────────────────────────────────────────────────────────

function VolumeStepper({ value, onChange, accent, border, text }: {
  value: number;
  onChange: (v: number) => void;
  accent: string;
  border: string;
  text: string;
}) {
  const dec = () => onChange(Math.max(30, value - 5));
  const inc = () => onChange(Math.min(150, value + 5));

  const barColor = value < 70 ? '#8B5CF6' : value > 105 ? '#EF4444' : accent;

  return (
    <View style={stepperStyles.wrap}>
      <TouchableOpacity onPress={dec} hitSlop={8} style={[stepperStyles.btn, { borderColor: border }]}>
        <Ionicons name="remove" size={14} color={value <= 30 ? border : text} />
      </TouchableOpacity>
      <View style={stepperStyles.center}>
        <Text style={[stepperStyles.value, { color: barColor }]}>{value}%</Text>
        <View style={[stepperStyles.bar, { backgroundColor: border }]}>
          <View style={[stepperStyles.fill, { width: `${Math.min(100, (value / 150) * 100)}%`, backgroundColor: barColor }]} />
        </View>
      </View>
      <TouchableOpacity onPress={inc} hitSlop={8} style={[stepperStyles.btn, { borderColor: border }]}>
        <Ionicons name="add" size={14} color={value >= 150 ? border : text} />
      </TouchableOpacity>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, gap: 3 },
  value: { fontSize: 13, fontWeight: '800', textAlign: 'center', fontVariant: ['tabular-nums'] },
  bar: { height: 3, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%' },
});

// ── Label selector ────────────────────────────────────────────────────────────

function LabelSelector({ value, onChange }: { value: MicroLabel; onChange: (l: MicroLabel) => void }) {
  const { theme: { colors, radius } } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={labelStyles.scroll}>
      {MICRO_LABEL_LIST.map(l => {
        const active = l === value;
        const color = MICRO_COLORS[l];
        return (
          <TouchableOpacity
            key={l}
            style={[labelStyles.chip, {
              backgroundColor: active ? color : colors.surface,
              borderColor: active ? color : colors.border,
              borderRadius: radius.sm,
            }]}
            onPress={() => onChange(l)}
            activeOpacity={0.75}
          >
            <Text style={[labelStyles.chipText, { color: active ? '#fff' : colors.textMuted }]}>
              {MICRO_LABELS[l]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const labelStyles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    marginRight: 6,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
});

// ── Main editor ───────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  mesocycle: Mesocycle;
  existingMicrocycles: Microcycle[];
  onClose: () => void;
}

export default function MicrocycleEditor({ visible, mesocycle, existingMicrocycles, onClose }: Props) {
  const { theme: { colors, radius, mode } } = useTheme();
  const isNeo = mode === 'neo';

  const [weeks, setWeeks] = useState<MicroWeek[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setWeeks(buildDefaultWeeks(mesocycle, existingMicrocycles));
    }
  }, [visible, mesocycle.id, existingMicrocycles.length]);

  const updateWeek = (weekNumber: number, patch: Partial<MicroWeek>) => {
    setWeeks(prev => prev.map(w => w.weekNumber === weekNumber ? { ...w, ...patch } : w));
  };

  const handleLabelChange = (weekNumber: number, label: MicroLabel) => {
    updateWeek(weekNumber, { label, volumePct: MICRO_VOL_DEFAULTS[label] });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveMicrocycles(mesocycle.id, weeks);
      onClose();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerSub, { color: colors.textMuted, letterSpacing: isNeo ? 1.5 : 0 }]}>
              {isNeo ? 'MICROCYCLES' : 'Microcycles'}
            </Text>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {mesocycle.name}
            </Text>
          </View>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={[styles.infoBox, { backgroundColor: colors.accentDim, borderRadius: radius.sm }]}>
            <Ionicons name="information-circle-outline" size={14} color={colors.accent} />
            <Text style={[styles.infoText, { color: colors.accent }]}>
              Configure le type et le volume de chaque semaine. Le volume % est indicatif pour ta planification.
            </Text>
          </View>

          {weeks.map(w => (
            <View
              key={w.weekNumber}
              style={[styles.weekCard, {
                backgroundColor: colors.surface,
                borderColor: MICRO_COLORS[w.label] + '55',
                borderLeftColor: MICRO_COLORS[w.label],
                borderRadius: radius.md,
              }]}
            >
              <View style={styles.weekHeader}>
                <View style={[styles.weekNumBadge, { backgroundColor: MICRO_COLORS[w.label] + '22' }]}>
                  <Text style={[styles.weekNumText, { color: MICRO_COLORS[w.label] }]}>
                    {isNeo ? `SEM. ${w.weekNumber}` : `Sem. ${w.weekNumber}`}
                  </Text>
                </View>
                <Text style={[styles.weekLabelText, { color: MICRO_COLORS[w.label] }]}>
                  {MICRO_LABELS[w.label]}
                </Text>
              </View>

              <LabelSelector
                value={w.label}
                onChange={label => handleLabelChange(w.weekNumber, label)}
              />

              <Text style={[styles.volLabel, { color: colors.textMuted }]}>
                {isNeo ? 'VOLUME' : 'Volume'}
              </Text>
              <VolumeStepper
                value={w.volumePct}
                onChange={v => updateWeek(w.weekNumber, { volumePct: v })}
                accent={colors.accent}
                border={colors.border}
                text={colors.text}
              />
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.border, borderRadius: radius.sm }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelBtnText, { color: colors.text }]}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: loading ? colors.border : colors.accent, borderRadius: radius.sm }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Ionicons name="checkmark" size={16} color="#000" />
            <Text style={[styles.saveBtnText, { letterSpacing: isNeo ? 0.8 : 0 }]}>
              {loading ? 'Enregistrement…' : isNeo ? 'ENREGISTRER' : 'Enregistrer'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerCenter: { flex: 1, gap: 2 },
  headerSub: { fontSize: 10, fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '800' },

  body: { padding: 16, gap: 12, paddingBottom: 48 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },

  weekCard: {
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 14,
    gap: 10,
  },
  weekHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weekNumBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  weekNumText: { fontSize: 10, fontWeight: '800' },
  weekLabelText: { fontSize: 14, fontWeight: '700' },
  volLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
  },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
});

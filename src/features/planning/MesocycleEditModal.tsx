import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { updateMesocycle } from './mesocycleActions';
import { BLOCK_COLORS, BLOCK_LABELS, BLOCK_LIST, type BlockType } from './blockUtils';
import type Mesocycle from '@/db/models/Mesocycle';
import type { WeekPatternEntry } from '@/db/models/Mesocycle';

const ISO_DAYS: Array<{ isoDay: 1 | 2 | 3 | 4 | 5 | 6 | 7; label: string; short: string }> = [
  { isoDay: 1, label: 'Lundi', short: 'L' },
  { isoDay: 2, label: 'Mardi', short: 'M' },
  { isoDay: 3, label: 'Mercredi', short: 'M' },
  { isoDay: 4, label: 'Jeudi', short: 'J' },
  { isoDay: 5, label: 'Vendredi', short: 'V' },
  { isoDay: 6, label: 'Samedi', short: 'S' },
  { isoDay: 7, label: 'Dimanche', short: 'D' },
];

const MONTH_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

function formatDateShort(d: Date): string {
  return `${d.getDate()} ${MONTH_FR[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Inline date picker ────────────────────────────────────────────────────────

function InlineDatePicker({ label, value, onChange }: {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
}) {
  const { theme: { colors, radius } } = useTheme();
  const adjust = (days: number) => {
    const d = new Date(value);
    d.setDate(d.getDate() + days);
    onChange(d);
  };
  return (
    <View style={dp.wrap}>
      <Text style={[dp.label, { color: colors.textMuted }]}>{label}</Text>
      <View style={[dp.row, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.sm }]}>
        <TouchableOpacity onPress={() => adjust(-7)} hitSlop={6} style={dp.btn}>
          <Text style={[dp.btnTxt, { color: colors.textMuted }]}>«</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => adjust(-1)} hitSlop={6} style={dp.btn}>
          <Text style={[dp.btnTxt, { color: colors.textMuted }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[dp.dateText, { color: colors.text }]}>{formatDateShort(value)}</Text>
        <TouchableOpacity onPress={() => adjust(1)} hitSlop={6} style={dp.btn}>
          <Text style={[dp.btnTxt, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => adjust(7)} hitSlop={6} style={dp.btn}>
          <Text style={[dp.btnTxt, { color: colors.textMuted }]}>»</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const dp = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  btn: { paddingHorizontal: 12, paddingVertical: 10 },
  btnTxt: { fontSize: 16, fontWeight: '600' },
  dateText: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700' },
});

// ── Main modal ────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  mesocycle: Mesocycle;
  onClose: () => void;
  onSaved: () => void;
}

export default function MesocycleEditModal({ visible, mesocycle, onClose, onSaved }: Props) {
  const { theme: { colors, radius, mode } } = useTheme();
  const isNeo = mode === 'neo';
  const templates = useWorkoutTemplates();

  const [name, setName] = useState('');
  const [blockType, setBlockType] = useState<BlockType>('hypertrophy');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [pattern, setPattern] = useState<WeekPatternEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(mesocycle.name);
      setBlockType(mesocycle.blockType as BlockType);
      setStartDate(new Date(mesocycle.startDate));
      setEndDate(new Date(mesocycle.endDate));
      setNotes(mesocycle.notes ?? '');
      setPattern(mesocycle.weekPattern ?? []);
    }
  }, [visible, mesocycle.id]);

  const toggleDay = (isoDay: 1 | 2 | 3 | 4 | 5 | 6 | 7, templateId: string | null) => {
    setPattern(prev => {
      const filtered = prev.filter(p => p.isoDay !== isoDay);
      if (templateId) return [...filtered, { isoDay, templateId }];
      return filtered;
    });
  };

  const getTemplateForDay = (isoDay: number) =>
    pattern.find(p => p.isoDay === isoDay)?.templateId ?? null;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nom requis', 'Donne un nom à ce bloc.');
      return;
    }
    if (endDate <= startDate) {
      Alert.alert('Dates invalides', 'La date de fin doit être après la date de début.');
      return;
    }
    setLoading(true);
    try {
      await updateMesocycle(mesocycle, {
        name: name.trim(),
        blockType,
        startDate,
        endDate,
        weekPattern: pattern,
        notes: notes.trim() || null,
      });
      onSaved();
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
              {isNeo ? 'MODIFIER LE BLOC' : 'Modifier le bloc'}
            </Text>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {mesocycle.name}
            </Text>
          </View>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Name */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted, letterSpacing: isNeo ? 1 : 0 }]}>
              {isNeo ? 'NOM' : 'Nom'}
            </Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
                borderRadius: radius.sm,
              }]}
              value={name}
              onChangeText={setName}
              placeholder="Nom du bloc…"
              placeholderTextColor={colors.textMuted}
              maxLength={80}
            />
          </View>

          {/* Block type */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted, letterSpacing: isNeo ? 1 : 0 }]}>
              {isNeo ? 'TYPE DE BLOC' : 'Type de bloc'}
            </Text>
            <View style={styles.blockRow}>
              {BLOCK_LIST.map(bt => {
                const active = bt === blockType;
                const color = BLOCK_COLORS[bt];
                return (
                  <TouchableOpacity
                    key={bt}
                    style={[styles.blockChip, {
                      backgroundColor: active ? color : colors.surface,
                      borderColor: active ? color : colors.border,
                      borderRadius: radius.sm,
                    }]}
                    onPress={() => setBlockType(bt)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.blockChipText, { color: active ? '#fff' : colors.textMuted }]}>
                      {BLOCK_LABELS[bt]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Dates */}
          <InlineDatePicker
            label={isNeo ? 'DÉBUT' : 'Date de début'}
            value={startDate}
            onChange={setStartDate}
          />
          <InlineDatePicker
            label={isNeo ? 'FIN' : 'Date de fin'}
            value={endDate}
            onChange={setEndDate}
          />

          {/* Week pattern */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted, letterSpacing: isNeo ? 1 : 0 }]}>
              {isNeo ? 'PROGRAMME HEBDOMADAIRE' : 'Programme par jour'}
            </Text>
            {templates.length === 0 ? (
              <Text style={[styles.noTemplates, { color: colors.textMuted }]}>
                Aucun template disponible — crée des templates dans Exercices.
              </Text>
            ) : (
              <View style={styles.patternGrid}>
                {ISO_DAYS.map(({ isoDay, label }) => {
                  const selectedId = getTemplateForDay(isoDay);
                  const selectedTemplate = templates.find(t => t.id === selectedId);
                  const color = BLOCK_COLORS[blockType];
                  return (
                    <View
                      key={isoDay}
                      style={[styles.dayRow, {
                        backgroundColor: colors.surface,
                        borderColor: selectedId ? color + '55' : colors.border,
                        borderRadius: radius.sm,
                        borderLeftWidth: selectedId ? 3 : 1,
                        borderLeftColor: selectedId ? color : colors.border,
                      }]}
                    >
                      <Text style={[styles.dayLabel, { color: selectedId ? color : colors.textMuted }]}>
                        {label}
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
                        <TouchableOpacity
                          style={[styles.templateChip, {
                            backgroundColor: !selectedId ? colors.border : 'transparent',
                            borderColor: colors.border,
                            borderRadius: radius.sm,
                          }]}
                          onPress={() => toggleDay(isoDay as 1|2|3|4|5|6|7, null)}
                        >
                          <Text style={[styles.templateChipText, { color: !selectedId ? colors.text : colors.textMuted }]}>
                            Repos
                          </Text>
                        </TouchableOpacity>
                        {templates.map(t => {
                          const active = selectedId === t.id;
                          return (
                            <TouchableOpacity
                              key={t.id}
                              style={[styles.templateChip, {
                                backgroundColor: active ? color : 'transparent',
                                borderColor: active ? color : colors.border,
                                borderRadius: radius.sm,
                              }]}
                              onPress={() => toggleDay(isoDay as 1|2|3|4|5|6|7, t.id)}
                            >
                              <Text style={[styles.templateChipText, { color: active ? '#fff' : colors.textMuted }]}>
                                {t.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Notes */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted, letterSpacing: isNeo ? 1 : 0 }]}>
              {isNeo ? 'NOTES' : 'Notes'}
            </Text>
            <TextInput
              style={[styles.notesInput, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
                borderRadius: radius.sm,
              }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes optionnelles…"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={400}
            />
          </View>
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
            style={[styles.saveBtn, {
              backgroundColor: loading ? colors.border : colors.accent,
              borderRadius: radius.sm,
            }]}
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
  body: { padding: 16, gap: 16, paddingBottom: 48 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 11, fontWeight: '700' },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  blockRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  blockChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1.5,
  },
  blockChipText: { fontSize: 12, fontWeight: '700' },
  noTemplates: { fontSize: 13, fontStyle: 'italic' },
  patternGrid: { gap: 8 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 8,
  },
  dayLabel: { width: 72, fontSize: 13, fontWeight: '700' },
  templateScroll: { flex: 1 },
  templateChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    marginRight: 6,
  },
  templateChipText: { fontSize: 12, fontWeight: '600' },
  notesInput: {
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 13,
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

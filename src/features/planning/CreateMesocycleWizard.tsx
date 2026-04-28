import React, { useState } from 'react';
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
import { useMacrocycles } from '@/hooks/useMacrocycles';
import { createMesocycle, generateMesocycleSessions } from './mesocycleActions';
import { BLOCK_COLORS, BLOCK_LABELS, BLOCK_LIST, type BlockType } from './blockUtils';
import type { WeekPatternEntry } from '@/db/models/Mesocycle';

// ── Constantes ────────────────────────────────────────────────────────────────

const ISO_DAYS: Array<{ isoDay: 1|2|3|4|5|6|7; short: string }> = [
  { isoDay: 1, short: 'L' },
  { isoDay: 2, short: 'M' },
  { isoDay: 3, short: 'M' },
  { isoDay: 4, short: 'J' },
  { isoDay: 5, short: 'V' },
  { isoDay: 6, short: 'S' },
  { isoDay: 7, short: 'D' },
];

const MONTH_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

function formatDateShort(d: Date): string {
  return `${d.getDate()} ${MONTH_FR[d.getMonth()]} ${d.getFullYear()}`;
}

function addWeeks(d: Date, weeks: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + weeks * 7 - 1);
  return r;
}

// ── Composant DatePicker inline ───────────────────────────────────────────────

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
    <View style={styles.datePickerWrap}>
      <Text style={[styles.pickerLabel, { color: colors.textMuted }]}>{label}</Text>
      <View style={[styles.datePicker, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.sm }]}>
        <TouchableOpacity onPress={() => adjust(-7)} style={styles.adjBtn} hitSlop={6}>
          <Text style={[styles.adjText, { color: colors.textMuted }]}>«</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => adjust(-1)} style={styles.adjBtn} hitSlop={6}>
          <Text style={[styles.adjText, { color: colors.textMuted }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.dateDisplay, { color: colors.text }]}>{formatDateShort(value)}</Text>
        <TouchableOpacity onPress={() => adjust(1)} style={styles.adjBtn} hitSlop={6}>
          <Text style={[styles.adjText, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => adjust(7)} style={styles.adjBtn} hitSlop={6}>
          <Text style={[styles.adjText, { color: colors.textMuted }]}>»</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Composant Stepper semaines ────────────────────────────────────────────────

function WeeksStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const { theme: { colors, radius } } = useTheme();

  return (
    <View style={styles.stepperRow}>
      <Text style={[styles.pickerLabel, { color: colors.textMuted }]}>Durée</Text>
      <View style={[styles.stepper, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.sm }]}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(1, value - 1))}
          style={styles.stepBtn}
          hitSlop={8}
        >
          <Ionicons name="remove" size={18} color={value <= 1 ? colors.border : colors.text} />
        </TouchableOpacity>
        <Text style={[styles.stepValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.stepUnit, { color: colors.textMuted }]}>semaine{value > 1 ? 's' : ''}</Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(20, value + 1))}
          style={styles.stepBtn}
          hitSlop={8}
        >
          <Ionicons name="add" size={18} color={value >= 20 ? colors.border : colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Wizard principal ──────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Step = 1 | 2 | 3;

export default function CreateMesocycleWizard({ visible, onClose }: Props) {
  const { theme: { colors, radius, mode } } = useTheme();
  const isNeo = mode === 'neo';
  const templates = useWorkoutTemplates();
  const macrocycles = useMacrocycles();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [name, setName] = useState('');
  const [blockType, setBlockType] = useState<BlockType>('hypertrophy');
  const [macrocycleId, setMacrocycleId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // Step 2
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  });
  const [weeks, setWeeks] = useState(4);

  // Step 3 — pattern: isoDay → templateId
  const [pattern, setPattern] = useState<Map<1|2|3|4|5|6|7, string>>(new Map());

  const endDate = addWeeks(startDate, weeks);
  const sessionCount = Array.from(pattern.keys()).length * weeks;

  const toggleDay = (isoDay: 1|2|3|4|5|6|7) => {
    setPattern(prev => {
      const next = new Map(prev);
      if (next.has(isoDay)) { next.delete(isoDay); }
      else if (templates.length > 0) { next.set(isoDay, templates[0].id); }
      return next;
    });
  };

  const setDayTemplate = (isoDay: 1|2|3|4|5|6|7, templateId: string) => {
    setPattern(prev => {
      const next = new Map(prev);
      next.set(isoDay, templateId);
      return next;
    });
  };

  const reset = () => {
    setStep(1);
    setName('');
    setBlockType('hypertrophy');
    setMacrocycleId(null);
    setNotes('');
    const d = new Date(); d.setHours(0,0,0,0);
    setStartDate(d);
    setWeeks(4);
    setPattern(new Map());
  };

  const handleClose = () => { reset(); onClose(); };

  const handleGenerate = async () => {
    if (pattern.size === 0) {
      Alert.alert('Aucun jour', 'Ajoute au moins un jour à ta semaine type.');
      return;
    }

    const weekPatternEntries: WeekPatternEntry[] = Array.from(pattern.entries()).map(
      ([isoDay, templateId]) => ({ isoDay, templateId }),
    );

    setLoading(true);
    try {
      const meso = await createMesocycle(
        name || BLOCK_LABELS[blockType],
        blockType,
        startDate,
        endDate,
        weekPatternEntries,
        macrocycleId,
        notes || null,
      );
      const count = await generateMesocycleSessions(meso, templates);
      Alert.alert(
        'Bloc créé',
        `${count} séance${count > 1 ? 's' : ''} planifiée${count > 1 ? 's' : ''} entre le ${formatDateShort(startDate)} et le ${formatDateShort(endDate)}.`,
        [{ text: 'OK', onPress: handleClose }],
      );
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step headers ──────────────────────────────────────────────────────────

  const STEP_LABELS: Record<Step, string> = {
    1: isNeo ? 'IDENTITÉ DU BLOC' : 'Identité du bloc',
    2: isNeo ? 'DURÉE' : 'Durée',
    3: isNeo ? 'SEMAINE TYPE' : 'Semaine type',
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, letterSpacing: isNeo ? 1.5 : 0 }]}>
            {isNeo ? 'NOUVEAU BLOC' : 'Nouveau bloc'}
          </Text>
          {/* Step indicator */}
          <View style={styles.stepDots}>
            {([1,2,3] as Step[]).map(s => (
              <View key={s} style={[styles.stepDot, {
                backgroundColor: s === step ? colors.accent : colors.border,
                borderRadius: isNeo ? 1 : 3,
              }]} />
            ))}
          </View>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.stepTitle, { color: colors.textMuted, letterSpacing: isNeo ? 1 : 0 }]}>
            {`${step}/3 — ${STEP_LABELS[step]}`}
          </Text>

          {/* ── STEP 1 : Identité ── */}
          {step === 1 && (
            <View style={styles.section}>
              {/* Nom */}
              <Text style={[styles.label, { color: colors.textMuted }]}>Nom du bloc</Text>
              <TextInput
                style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.sm }]}
                value={name}
                onChangeText={setName}
                placeholder={BLOCK_LABELS[blockType]}
                placeholderTextColor={colors.textMuted}
                maxLength={50}
              />

              {/* Type de bloc */}
              <Text style={[styles.label, { color: colors.textMuted }]}>Type de bloc</Text>
              <View style={styles.blockTypeGrid}>
                {BLOCK_LIST.map(bt => {
                  const active = bt === blockType;
                  const c = BLOCK_COLORS[bt];
                  return (
                    <TouchableOpacity
                      key={bt}
                      style={[styles.blockTypeChip, {
                        backgroundColor: active ? c : colors.surface,
                        borderColor: active ? c : colors.border,
                        borderRadius: radius.sm,
                        borderLeftWidth: active && isNeo ? 3 : 1,
                      }]}
                      onPress={() => setBlockType(bt)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.blockTypeText, { color: active ? '#000' : colors.textMuted }]}>
                        {BLOCK_LABELS[bt].toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Macrocycle (optionnel) */}
              {macrocycles.length > 0 && (
                <>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Macrocycle (optionnel)</Text>
                  <TouchableOpacity
                    style={[styles.macroChip, {
                      backgroundColor: macrocycleId ? colors.accentDim : colors.surface,
                      borderColor: macrocycleId ? colors.accent : colors.border,
                      borderRadius: radius.sm,
                    }]}
                    onPress={() => setMacrocycleId(null)}
                  >
                    <Text style={[styles.macroChipText, { color: macrocycleId ? colors.accent : colors.textMuted }]}>
                      Aucun
                    </Text>
                  </TouchableOpacity>
                  {macrocycles.map(mc => (
                    <TouchableOpacity
                      key={mc.id}
                      style={[styles.macroChip, {
                        backgroundColor: macrocycleId === mc.id ? colors.accentDim : colors.surface,
                        borderColor: macrocycleId === mc.id ? colors.accent : colors.border,
                        borderRadius: radius.sm,
                      }]}
                      onPress={() => setMacrocycleId(mc.id)}
                    >
                      <Text style={[styles.macroChipText, { color: macrocycleId === mc.id ? colors.accent : colors.text }]}>
                        {mc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Notes */}
              <Text style={[styles.label, { color: colors.textMuted }]}>Notes (optionnel)</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.sm }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Objectifs, contexte…"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={200}
              />
            </View>
          )}

          {/* ── STEP 2 : Durée ── */}
          {step === 2 && (
            <View style={styles.section}>
              <InlineDatePicker
                label="Début"
                value={startDate}
                onChange={setStartDate}
              />
              <WeeksStepper value={weeks} onChange={setWeeks} />

              <View style={[styles.endDateInfo, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.sm }]}>
                <Text style={[styles.endDateLabel, { color: colors.textMuted }]}>Fin calculée</Text>
                <Text style={[styles.endDateValue, { color: colors.accent }]}>{formatDateShort(endDate)}</Text>
              </View>

              <View style={[styles.infoBox, { backgroundColor: colors.accentDim, borderRadius: radius.sm }]}>
                <Ionicons name="information-circle-outline" size={14} color={colors.accent} />
                <Text style={[styles.infoText, { color: colors.accent }]}>
                  {weeks} semaine{weeks > 1 ? 's' : ''} × (jours définis à l'étape suivante) = séances générées automatiquement.
                </Text>
              </View>
            </View>
          )}

          {/* ── STEP 3 : Semaine type ── */}
          {step === 3 && (
            <View style={styles.section}>
              {templates.length === 0 ? (
                <View style={[styles.noTemplates, { borderColor: colors.border, borderRadius: radius.sm }]}>
                  <Ionicons name="clipboard-outline" size={32} color={colors.border} />
                  <Text style={[styles.noTemplatesText, { color: colors.textMuted }]}>
                    Aucun template. Crée-en un dans l'onglet Templates d'abord.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Jours d'entraînement</Text>
                  <View style={styles.daysRow}>
                    {ISO_DAYS.map(({ isoDay, short }) => {
                      const active = pattern.has(isoDay);
                      return (
                        <TouchableOpacity
                          key={isoDay}
                          style={[styles.dayBtn, {
                            backgroundColor: active ? colors.accent : colors.surface,
                            borderColor: active ? colors.accent : colors.border,
                            borderRadius: radius.sm,
                          }]}
                          onPress={() => toggleDay(isoDay)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.dayBtnText, { color: active ? '#000' : colors.textMuted }]}>
                            {short}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Template par jour actif */}
                  {Array.from(pattern.entries())
                    .sort(([a], [b]) => a - b)
                    .map(([isoDay, templateId]) => {
                      const dayDef = ISO_DAYS.find(d => d.isoDay === isoDay)!;
                      const DAY_NAMES = ['','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
                      return (
                        <View key={isoDay} style={styles.dayTemplateRow}>
                          <Text style={[styles.dayName, { color: colors.text }]}>{DAY_NAMES[isoDay]}</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
                            {templates.map(t => {
                              const sel = templateId === t.id;
                              return (
                                <TouchableOpacity
                                  key={t.id}
                                  style={[styles.templateChip, {
                                    backgroundColor: sel ? colors.accent : colors.surface,
                                    borderColor: sel ? colors.accent : colors.border,
                                    borderRadius: radius.sm,
                                  }]}
                                  onPress={() => setDayTemplate(isoDay, t.id)}
                                  activeOpacity={0.75}
                                >
                                  <Text style={[styles.templateChipText, { color: sel ? '#000' : colors.textMuted }]}>
                                    {t.name}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                      );
                    })
                  }

                  {pattern.size > 0 && (
                    <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.sm }]}>
                      <Text style={[styles.summaryText, { color: colors.text }]}>
                        <Text style={{ color: colors.accent, fontWeight: '800' }}>{sessionCount}</Text>
                        {' '}séance{sessionCount > 1 ? 's' : ''} seront créées
                      </Text>
                      <Text style={[styles.summaryRange, { color: colors.textMuted }]}>
                        {formatDateShort(startDate)} → {formatDateShort(endDate)}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </ScrollView>

        {/* Boutons navigation */}
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {step > 1 && (
            <TouchableOpacity
              style={[styles.backBtn, { borderColor: colors.border, borderRadius: radius.sm }]}
              onPress={() => setStep(s => (s - 1) as Step)}
            >
              <Ionicons name="chevron-back" size={16} color={colors.text} />
              <Text style={[styles.backBtnText, { color: colors.text }]}>Retour</Text>
            </TouchableOpacity>
          )}

          {step < 3 ? (
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: colors.accent, borderRadius: radius.sm, flex: step === 1 ? 1 : undefined }]}
              onPress={() => {
                if (step === 1 && !name.trim() && !BLOCK_LABELS[blockType]) {
                  Alert.alert('Nom manquant', 'Donne un nom à ton bloc.');
                  return;
                }
                setStep(s => (s + 1) as Step);
              }}
            >
              <Text style={[styles.nextBtnText, { letterSpacing: isNeo ? 0.8 : 0 }]}>
                {isNeo ? 'SUIVANT' : 'Suivant'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#000" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: loading ? colors.border : colors.accent, borderRadius: radius.sm }]}
              onPress={handleGenerate}
              disabled={loading}
            >
              <Ionicons name="flash" size={16} color="#000" />
              <Text style={[styles.nextBtnText, { letterSpacing: isNeo ? 0.8 : 0 }]}>
                {loading ? 'Génération…' : isNeo ? 'GÉNÉRER' : 'Générer le bloc'}
              </Text>
            </TouchableOpacity>
          )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 14, fontWeight: '800' },
  stepDots: { flexDirection: 'row', gap: 5 },
  stepDot: { width: 20, height: 4 },
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 40 },
  stepTitle: { fontSize: 11, fontWeight: '700', marginBottom: 20 },
  section: { gap: 12 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  textInput: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '500',
  },
  notesInput: { minHeight: 64, textAlignVertical: 'top' },
  blockTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  blockTypeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  blockTypeText: { fontSize: 11, fontWeight: '800' },
  macroChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  macroChipText: { fontSize: 14, fontWeight: '500' },

  // Step 2
  datePickerWrap: { gap: 6 },
  pickerLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  adjBtn: { padding: 8 },
  adjText: { fontSize: 16, fontWeight: '700' },
  dateDisplay: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700' },
  stepperRow: { gap: 6 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  stepBtn: { padding: 8 },
  stepValue: { flex: 1, textAlign: 'center', fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  stepUnit: { fontSize: 13, marginRight: 4 },
  endDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  endDateLabel: { fontSize: 12 },
  endDateValue: { fontSize: 15, fontWeight: '700' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },

  // Step 3
  daysRow: { flexDirection: 'row', gap: 8 },
  dayBtn: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayBtnText: { fontSize: 13, fontWeight: '800' },
  dayTemplateRow: { gap: 6 },
  dayName: { fontSize: 13, fontWeight: '700' },
  templateScroll: { flexGrow: 0 },
  templateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    marginRight: 8,
  },
  templateChipText: { fontSize: 13, fontWeight: '600' },
  summary: { padding: 14, borderWidth: 1, gap: 4 },
  summaryText: { fontSize: 15 },
  summaryRange: { fontSize: 12 },
  noTemplates: { borderWidth: 1, borderStyle: 'dashed', padding: 24, alignItems: 'center', gap: 8 },
  noTemplatesText: { fontSize: 13, textAlign: 'center' },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  backBtnText: { fontSize: 14, fontWeight: '600' },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
  },
  nextBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
});

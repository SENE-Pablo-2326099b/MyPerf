import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { deleteSet, updateSet } from './sessionActions';
import type WorkingSet from '@/db/models/WorkingSet';
import type { SetType } from '@/db/models/WorkingSet';
import type { GhostSet } from '@/hooks/useLastSets';

const DELETE_THRESHOLD = -72;
const DELETE_WIDTH = 84;

const TYPE_LABELS: Record<SetType, string> = {
  warmup: 'Chauffe',
  working: 'Travail',
  drop: 'Drop',
  rest_pause: 'R+P',
  myoreps: 'Myoreps',
};

const TYPE_CYCLE: SetType[] = ['working', 'warmup', 'drop', 'rest_pause', 'myoreps'];

const TYPE_COLORS: Record<SetType, string> = {
  working: '#3B82F6',
  warmup: '#F59E0B',
  drop: '#EF4444',
  rest_pause: '#8B5CF6',
  myoreps: '#10B981',
};

function fmt(e: number, pb: number, c: number, pt: number): string {
  if (e === 0 && pb === 0 && c === 0 && pt === 0) return '—';
  return `${e}-${pb}-${c === -1 ? 'X' : c}-${pt}`;
}

function rpeColor(
  rpe: number,
  colors: { success: string; warning: string; danger: string },
): string {
  if (rpe >= 9) return colors.danger;
  if (rpe >= 8) return colors.warning;
  return colors.success;
}

interface Props {
  set: WorkingSet;
  index: number;
  ghost?: GhostSet;
  onCompleted?: () => void;
  nextRef?: React.RefObject<TextInput>;
}

function SetRow({ set, index, ghost, onCompleted, nextRef }: Props) {
  const { theme: { colors } } = useTheme();
  const weightRef = useRef<TextInput>(null);
  const repsRef = useRef<TextInput>(null);
  const [editingTempo, setEditingTempo] = useState(false);
  const translateX = useSharedValue(0);
  const doneScale = useSharedValue(1);

  // Refs for current values used by +/- buttons (avoids stale closures)
  const weightValRef = useRef(set.weight);
  const repsValRef = useRef<number | null>(set.reps);
  useEffect(() => { weightValRef.current = set.weight; }, [set.weight]);
  useEffect(() => { repsValRef.current = set.reps; }, [set.reps]);

  // setType: local state for immediate UI feedback (React.memo + WatermelonDB
  // same-reference mutation would block re-renders without this)
  const [localType, setLocalType] = useState<SetType>(set.setType);
  useEffect(() => { setLocalType(set.setType); }, [set.setType]);

  // RPE: controlled state (no keyboard input, stepper only)
  const [rpeVal, setRpeVal] = useState<number | null>(set.rpe);
  useEffect(() => { setRpeVal(set.rpe); }, [set.rpe]);

  const [te, setTe] = useState(String(set.tempoEccentric));
  const [tpb, setTpb] = useState(String(set.tempoPauseBottom));
  const [tc, setTc] = useState(set.tempoConcentric === -1 ? 'X' : String(set.tempoConcentric));
  const [tpt, setTpt] = useState(String(set.tempoPauseTop));

  // Formate un poids en max 2 décimales, sans zéros inutiles
  const fmtWeight = useCallback((n: number): string => {
    if (n <= 0) return '';
    return parseFloat(n.toFixed(2)).toString();
  }, []);

  const cycleType = useCallback(() => {
    const idx = TYPE_CYCLE.indexOf(localType);
    const next = TYPE_CYCLE[(idx + 1) % TYPE_CYCLE.length];
    setLocalType(next); // mise à jour UI immédiate
    updateSet(set, { setType: next });
    Haptics.selectionAsync();
  }, [localType, set]);

  const handleWeight = useCallback((text: string) => {
    // Accepte au maximum 2 chiffres après la virgule
    const cleaned = text.replace(',', '.').replace(/[^0-9.]/g, '');
    const n = parseFloat(cleaned);
    const w = isNaN(n) || n < 0 ? 0 : Math.round(n * 100) / 100;
    weightValRef.current = w;
    weightRef.current?.setNativeProps({ text: fmtWeight(w) });
    updateSet(set, { weight: w });
  }, [set, fmtWeight]);

  const adjustWeight = useCallback((delta: number) => {
    const next = Math.max(0, Math.round((weightValRef.current + delta) * 4) / 4);
    weightValRef.current = next;
    weightRef.current?.setNativeProps({ text: fmtWeight(next) });
    updateSet(set, { weight: next });
    Haptics.selectionAsync();
  }, [set, fmtWeight]);

  const handleReps = useCallback((text: string) => {
    // Reps = entier uniquement, pas de décimales
    const clean = text.replace(/[^0-9]/g, '');
    const n = parseInt(clean, 10);
    const r = isNaN(n) || n <= 0 ? null : n;
    repsValRef.current = r;
    repsRef.current?.setNativeProps({ text: r !== null ? String(r) : '' });
    updateSet(set, { reps: r });
  }, [set]);

  const adjustReps = useCallback((delta: number) => {
    const next = Math.max(0, (repsValRef.current ?? 0) + delta);
    const r = next === 0 ? null : next;
    repsValRef.current = r;
    repsRef.current?.setNativeProps({ text: r !== null ? String(r) : '' });
    updateSet(set, { reps: r });
    Haptics.selectionAsync();
  }, [set]);

  const adjustRpe = useCallback((delta: number) => {
    setRpeVal(prev => {
      const current = prev ?? 7;
      const next = Math.min(10, Math.max(5, Math.round((current + delta) * 2) / 2));
      updateSet(set, { rpe: next });
      Haptics.selectionAsync();
      return next;
    });
  }, [set]);

  const clearRpe = useCallback(() => {
    setRpeVal(null);
    updateSet(set, { rpe: null });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [set]);

  const commitTempo = useCallback(() => {
    const ecc = parseInt(te, 10);
    const pb = parseInt(tpb, 10);
    const raw = tc.trim().toUpperCase();
    const conc = raw === 'X' ? -1 : parseInt(raw, 10);
    const pt = parseInt(tpt, 10);
    updateSet(set, {
      tempoEccentric: isNaN(ecc) ? 0 : ecc,
      tempoPauseBottom: isNaN(pb) ? 0 : pb,
      tempoConcentric: isNaN(conc) ? 0 : conc,
      tempoPauseTop: isNaN(pt) ? 0 : pt,
    });
    setEditingTempo(false);
  }, [set, te, tpb, tc, tpt]);

  const openTempoEditor = useCallback(() => {
    setTe(String(set.tempoEccentric));
    setTpb(String(set.tempoPauseBottom));
    setTc(set.tempoConcentric === -1 ? 'X' : String(set.tempoConcentric));
    setTpt(String(set.tempoPauseTop));
    setEditingTempo(true);
  }, [set]);

  const toggleComplete = useCallback(() => {
    const next = !set.completed;
    if (next) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      doneScale.value = withSequence(
        withSpring(1.35, { damping: 6, stiffness: 400 }),
        withSpring(1, { damping: 12, stiffness: 300 }),
      );
      onCompleted?.();
    }
    updateSet(set, { completed: next });
  }, [set, onCompleted, doneScale]);

  const confirmDelete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Supprimer la série ?', undefined, [
      { text: 'Annuler', style: 'cancel', onPress: () => { translateX.value = withSpring(0); } },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteSet(set) },
    ]);
  }, [set, translateX]);

  const pan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .onUpdate(e => {
      translateX.value = Math.max(-DELETE_WIDTH * 1.3, Math.min(0, e.translationX));
    })
    .onEnd(() => {
      if (translateX.value < DELETE_THRESHOLD) {
        translateX.value = withTiming(-DELETE_WIDTH);
        runOnJS(confirmDelete)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const doneStyle = useAnimatedStyle(() => ({ transform: [{ scale: doneScale.value }] }));

  const typeColor = TYPE_COLORS[localType] ?? colors.accent;
  const tempoStr = fmt(set.tempoEccentric, set.tempoPauseBottom, set.tempoConcentric, set.tempoPauseTop);
  const isDone = set.completed;
  const numColor = isDone ? colors.success : colors.text;

  return (
    <View style={[styles.wrapper, { borderBottomColor: colors.border }]}>
      {/* ── Delete reveal ── */}
      <View style={[styles.deleteReveal, { backgroundColor: colors.danger }]}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.deleteRevealText}>Retirer</Text>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.slide,
            { backgroundColor: isDone ? colors.success + '0F' : colors.surface },
            rowStyle,
          ]}
        >
          {/* ══ Ligne principale : # | poids | reps | ✓ ══ */}
          <View style={styles.mainRow}>
            <Text style={[styles.idx, { color: colors.textMuted }]}>{index + 1}</Text>

            {/* Stepper poids */}
            <View style={styles.stepper}>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => adjustWeight(-2.5)}
                activeOpacity={0.6}
              >
                <Ionicons name="remove" size={15} color={colors.textMuted} />
              </TouchableOpacity>
              <View style={styles.inputCol}>
                <View style={[styles.inputBox, {
                  backgroundColor: colors.background,
                  borderColor: isDone ? colors.success + '60' : colors.border,
                }]}>
                  <TextInput
                    ref={weightRef}
                    style={[styles.numInput, { color: numColor }]}
                    defaultValue={fmtWeight(set.weight)}
                    onEndEditing={e => handleWeight(e.nativeEvent.text)}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    selectTextOnFocus
                    returnKeyType="next"
                    onSubmitEditing={() => repsRef.current?.focus()}
                  />
                  <Text style={[styles.unitLbl, { color: colors.textMuted }]}>kg</Text>
                </View>
                {ghost && ghost.weight > 0 && (
                  <Text style={[styles.ghost, { color: colors.accent }]}>↑ {ghost.weight}</Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => adjustWeight(+2.5)}
                activeOpacity={0.6}
              >
                <Ionicons name="add" size={15} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Stepper reps */}
            <View style={[styles.stepper, styles.stepperReps]}>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => adjustReps(-1)}
                activeOpacity={0.6}
              >
                <Ionicons name="remove" size={15} color={colors.textMuted} />
              </TouchableOpacity>
              <View style={styles.inputCol}>
                <View style={[styles.inputBox, {
                  backgroundColor: colors.background,
                  borderColor: isDone ? colors.success + '60' : colors.border,
                }]}>
                  <TextInput
                    ref={repsRef}
                    style={[styles.numInput, styles.repsInput, { color: numColor }]}
                    defaultValue={set.reps != null ? String(set.reps) : ''}
                    onChangeText={text => {
                      const clean = text.replace(/[^0-9]/g, '');
                      if (clean !== text) repsRef.current?.setNativeProps({ text: clean });
                    }}
                    onEndEditing={e => handleReps(e.nativeEvent.text)}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    selectTextOnFocus
                    returnKeyType="done"
                    onSubmitEditing={() => nextRef?.current?.focus()}
                  />
                  <Text style={[styles.unitLbl, { color: colors.textMuted }]}>×</Text>
                </View>
                {ghost && ghost.reps != null && (
                  <Text style={[styles.ghost, { color: colors.accent }]}>↑ {ghost.reps}</Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => adjustReps(+1)}
                activeOpacity={0.6}
              >
                <Ionicons name="add" size={15} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Bouton valider */}
            <Animated.View style={doneStyle}>
              <TouchableOpacity
                style={[
                  styles.doneBtn,
                  {
                    backgroundColor: isDone ? colors.success : 'transparent',
                    borderColor: isDone ? colors.success : colors.border,
                  },
                ]}
                onPress={toggleComplete}
                hitSlop={6}
              >
                <Ionicons
                  name={isDone ? 'checkmark' : 'ellipse-outline'}
                  size={22}
                  color={isDone ? '#fff' : colors.border}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* ══ Méta-ligne : type | RPE | tempo ══ */}
          {!editingTempo ? (
            <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
              {/* Badge type — tap to cycle */}
              <TouchableOpacity
                style={[styles.typeBadge, { backgroundColor: typeColor + '18', borderColor: typeColor + '55' }]}
                onPress={cycleType}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.typeTxt, { color: typeColor }]}>{TYPE_LABELS[localType]}</Text>
                <Ionicons name="swap-horizontal-outline" size={10} color={typeColor + '99'} />
              </TouchableOpacity>

              <View style={styles.metaSpacer} />

              {/* Stepper RPE */}
              <View style={[styles.rpeBlock, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.rpeLbl, { color: colors.textMuted }]}>RPE</Text>
                <TouchableOpacity onPress={() => adjustRpe(-0.5)} hitSlop={8} style={styles.rpeAdjHit}>
                  <Ionicons name="remove" size={12} color={colors.textMuted} />
                </TouchableOpacity>
                <Text style={[styles.rpeVal, {
                  color: rpeVal !== null ? rpeColor(rpeVal, colors) : colors.textMuted + '70',
                }]}>
                  {rpeVal !== null ? String(rpeVal) : '—'}
                </Text>
                {rpeVal !== null && (
                  <TouchableOpacity onPress={clearRpe} hitSlop={10} style={styles.rpeClear}>
                    <Ionicons name="close" size={9} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => adjustRpe(+0.5)} hitSlop={8} style={styles.rpeAdjHit}>
                  <Ionicons name="add" size={12} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Bouton tempo */}
              <TouchableOpacity
                style={[styles.tempoBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={openTempoEditor}
                hitSlop={6}
              >
                <Ionicons
                  name="timer-outline"
                  size={12}
                  color={tempoStr !== '—' ? colors.accent : colors.textMuted}
                />
                <Text style={[styles.tempoTxt, {
                  color: tempoStr !== '—' ? colors.accent : colors.textMuted,
                }]}>
                  {tempoStr}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Éditeur de tempo ── */
            <View style={[styles.tempoEditor, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
              {(['Ecc', 'Bas', 'Con', 'Haut'] as const).map((lbl, i) => {
                const vals = [te, tpb, tc, tpt];
                const setters = [setTe, setTpb, setTc, setTpt];
                return (
                  <React.Fragment key={lbl}>
                    {i > 0 && <Text style={[styles.tempoDash, { color: colors.textMuted }]}>—</Text>}
                    <View style={styles.tempoGroup}>
                      <Text style={[styles.tempoLbl, { color: colors.textMuted }]}>{lbl}</Text>
                      <TextInput
                        style={[styles.tempoInput, {
                          color: colors.text,
                          borderColor: colors.border,
                          backgroundColor: colors.surface,
                        }]}
                        value={vals[i]}
                        onChangeText={setters[i]}
                        keyboardType={lbl === 'Con' ? 'default' : 'number-pad'}
                        placeholder={lbl === 'Con' ? 'X' : '0'}
                        placeholderTextColor={colors.textMuted}
                        maxLength={2}
                        selectTextOnFocus
                      />
                    </View>
                  </React.Fragment>
                );
              })}
              <TouchableOpacity
                style={[styles.tempoOk, { backgroundColor: colors.accent }]}
                onPress={commitTempo}
              >
                <Ionicons name="checkmark" size={15} color="#000" />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  deleteReveal: {
    position: 'absolute',
    right: 0, top: 0, bottom: 0,
    width: DELETE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteRevealText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  slide: {},

  // ── Ligne principale ──
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 6,
  },
  idx: {
    width: 20,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  stepper: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  stepperReps: {
    flex: 1,
  },
  stepBtn: {
    width: 28,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  inputCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 5,
    paddingVertical: 4,
    gap: 2,
    minHeight: 48,
  },
  numInput: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 36,
    padding: 0,
    fontVariant: ['tabular-nums'],
  },
  repsInput: {
    minWidth: 28,
  },
  unitLbl: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  ghost: {
    fontSize: 10,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    opacity: 0.75,
  },

  doneBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Méta-ligne ──
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 5,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  metaSpacer: { flex: 1 },

  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeTxt: { fontSize: 11, fontWeight: '800' },

  rpeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
  },
  rpeLbl: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  rpeAdjHit: { width: 18, alignItems: 'center' },
  rpeVal: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  rpeClear: { width: 14, alignItems: 'center' },

  tempoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  tempoTxt: { fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },

  // ── Éditeur tempo ──
  tempoEditor: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tempoGroup: { alignItems: 'center', gap: 2 },
  tempoLbl: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  tempoInput: {
    width: 36,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 2,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  tempoDash: { fontSize: 12, fontWeight: '600', marginTop: 12 },
  tempoOk: {
    marginLeft: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
});

// Comparaison explicite des champs du modèle WatermelonDB — le même objet peut
// être muté en place sans changer de référence, ce qui tromperait le memo par défaut.
export default React.memo(SetRow, (prev, next) => (
  prev.index === next.index &&
  prev.ghost === next.ghost &&
  prev.set.id === next.set.id &&
  prev.set.setType === next.set.setType &&
  prev.set.weight === next.set.weight &&
  prev.set.reps === next.set.reps &&
  prev.set.rpe === next.set.rpe &&
  prev.set.completed === next.set.completed &&
  prev.set.tempoEccentric === next.set.tempoEccentric &&
  prev.set.tempoConcentric === next.set.tempoConcentric &&
  prev.set.tempoPauseBottom === next.set.tempoPauseBottom &&
  prev.set.tempoPauseTop === next.set.tempoPauseTop
));

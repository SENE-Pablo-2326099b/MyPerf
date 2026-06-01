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
  working:    '#3B82F6',
  warmup:     '#F59E0B',
  drop:       '#EF4444',
  rest_pause: '#8B5CF6',
  myoreps:    '#10B981',
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
  const { theme: { colors, radius, mode } } = useTheme();
  const isNeo = mode === 'neo';
  const weightRef = useRef<TextInput>(null);
  const repsRef = useRef<TextInput>(null);
  const [editingTempo, setEditingTempo] = useState(false);
  const translateX = useSharedValue(0);
  const doneScale = useSharedValue(1);

  const weightValRef = useRef(set.weight);
  const repsValRef = useRef<number | null>(set.reps);
  useEffect(() => { weightValRef.current = set.weight; }, [set.weight]);
  useEffect(() => { repsValRef.current = set.reps; }, [set.reps]);

  const [localType, setLocalType] = useState<SetType>(set.setType);
  useEffect(() => { setLocalType(set.setType); }, [set.setType]);

  const [rpeVal, setRpeVal] = useState<number | null>(set.rpe);
  useEffect(() => { setRpeVal(set.rpe); }, [set.rpe]);

  const [te, setTe] = useState(String(set.tempoEccentric));
  const [tpb, setTpb] = useState(String(set.tempoPauseBottom));
  const [tc, setTc] = useState(set.tempoConcentric === -1 ? 'X' : String(set.tempoConcentric));
  const [tpt, setTpt] = useState(String(set.tempoPauseTop));

  const fmtWeight = useCallback((n: number): string => {
    if (n <= 0) return '';
    return parseFloat(n.toFixed(2)).toString();
  }, []);

  const cycleType = useCallback(() => {
    const idx = TYPE_CYCLE.indexOf(localType);
    const next = TYPE_CYCLE[(idx + 1) % TYPE_CYCLE.length];
    setLocalType(next);
    updateSet(set, { setType: next });
    Haptics.selectionAsync();
  }, [localType, set]);

  const handleWeight = useCallback((text: string) => {
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

  const autoComplete = useCallback(() => {
    if (set.completed) return;
    updateSet(set, { completed: true });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    doneScale.value = withSequence(
      withSpring(1.35, { damping: 6, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    );
    onCompleted?.();
  }, [set, onCompleted, doneScale]);

  const handleReps = useCallback((text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    const n = parseInt(clean, 10);
    const r = isNaN(n) || n <= 0 ? null : n;
    repsValRef.current = r;
    repsRef.current?.setNativeProps({ text: r !== null ? String(r) : '' });
    updateSet(set, { reps: r });
    if (r != null) autoComplete();
  }, [set, autoComplete]);

  const adjustReps = useCallback((delta: number) => {
    const next = Math.max(0, (repsValRef.current ?? 0) + delta);
    const r = next === 0 ? null : next;
    repsValRef.current = r;
    repsRef.current?.setNativeProps({ text: r !== null ? String(r) : '' });
    updateSet(set, { reps: r });
    if (r != null) {
      autoComplete();
    } else {
      Haptics.selectionAsync();
    }
  }, [set, autoComplete]);

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

  return (
    <View style={[styles.wrapper, { borderBottomColor: colors.border }]}>
      {/* Zone swipe-to-delete */}
      <View style={[styles.deleteReveal, { backgroundColor: colors.danger }]}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.deleteRevealText}>Retirer</Text>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[
          styles.slide,
          { backgroundColor: isDone ? colors.success + '12' : colors.surface },
          rowStyle,
        ]}>

          {/* ══ Ligne principale ══ */}
          <View style={styles.mainRow}>

            {/* Numéro */}
            <Text style={[styles.idx, { color: isDone ? colors.success : colors.textMuted }]}>
              {index + 1}
            </Text>

            {/* ── POIDS : [−] [input] [+] ── */}
            <View style={styles.inputGroup}>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.sm }]}
                onPress={() => adjustWeight(-2.5)}
                activeOpacity={0.6}
              >
                <Ionicons name="remove" size={15} color={colors.textMuted} />
                <Text style={[styles.stepHint, { color: colors.textMuted }]}>2.5</Text>
              </TouchableOpacity>

              <View style={styles.inputCell}>
                <View style={[styles.inputBox, {
                  backgroundColor: colors.background,
                  borderColor: isDone ? colors.success + '80' : colors.border,
                  borderRadius: radius.sm,
                }]}>
                  <TextInput
                    ref={weightRef}
                    style={[styles.numInput, { color: isDone ? colors.success : colors.text }]}
                    defaultValue={fmtWeight(set.weight)}
                    onEndEditing={e => handleWeight(e.nativeEvent.text)}
                    keyboardType="decimal-pad"
                    placeholder="—"
                    placeholderTextColor={colors.textMuted}
                    selectTextOnFocus
                    returnKeyType="next"
                    onSubmitEditing={() => repsRef.current?.focus()}
                  />
                  <Text style={[styles.unit, { color: colors.textMuted }]}>kg</Text>
                </View>
                {ghost && ghost.weight > 0 && (
                  <Text style={[styles.ghost, { color: colors.accent }]}>↑ {ghost.weight} kg</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.sm }]}
                onPress={() => adjustWeight(+2.5)}
                activeOpacity={0.6}
              >
                <Ionicons name="add" size={15} color={colors.textMuted} />
                <Text style={[styles.stepHint, { color: colors.textMuted }]}>2.5</Text>
              </TouchableOpacity>
            </View>

            {/* ── REPS : [−] [input] [+] ── */}
            <View style={[styles.inputGroup, styles.repsGroup]}>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.sm }]}
                onPress={() => adjustReps(-1)}
                activeOpacity={0.6}
              >
                <Ionicons name="remove" size={15} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={styles.inputCell}>
                <View style={[styles.inputBox, {
                  backgroundColor: colors.background,
                  borderColor: isDone ? colors.success + '80' : colors.border,
                  borderRadius: radius.sm,
                }]}>
                  <TextInput
                    ref={repsRef}
                    style={[styles.numInput, { color: isDone ? colors.success : colors.text }]}
                    defaultValue={set.reps != null ? String(set.reps) : ''}
                    onChangeText={text => {
                      const clean = text.replace(/[^0-9]/g, '');
                      if (clean !== text) repsRef.current?.setNativeProps({ text: clean });
                    }}
                    onEndEditing={e => handleReps(e.nativeEvent.text)}
                    keyboardType="number-pad"
                    placeholder="—"
                    placeholderTextColor={colors.textMuted}
                    selectTextOnFocus
                    returnKeyType="done"
                    onSubmitEditing={() => nextRef?.current?.focus()}
                  />
                  <Text style={[styles.unit, { color: colors.textMuted }]}>×</Text>
                </View>
                {ghost && ghost.reps != null && (
                  <Text style={[styles.ghost, { color: colors.accent }]}>↑ {ghost.reps}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.sm }]}
                onPress={() => adjustReps(+1)}
                activeOpacity={0.6}
              >
                <Ionicons name="add" size={15} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Bouton timer/valider */}
            <Animated.View style={doneStyle}>
              <TouchableOpacity
                style={[styles.timerBtn, {
                  backgroundColor: isDone ? colors.success + '22' : 'transparent',
                  borderColor: isDone ? colors.success + '70' : colors.border,
                  borderRadius: radius.sm,
                }]}
                onPress={toggleComplete}
                hitSlop={10}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={isDone ? 'checkmark-circle' : 'timer-outline'}
                  size={18}
                  color={isDone ? colors.success : colors.textMuted}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* ══ Ligne méta ══ */}
          {!editingTempo ? (
            <View style={[styles.metaRow, { borderTopColor: colors.border }]}>

              <TouchableOpacity
                style={[styles.typeBadge, {
                  backgroundColor: typeColor + '18',
                  borderColor: typeColor + '50',
                  borderRadius: radius.sm,
                }]}
                onPress={cycleType}
                hitSlop={8}
                activeOpacity={0.7}
              >
                <Text style={[styles.typeTxt, { color: typeColor }]}>{TYPE_LABELS[localType]}</Text>
                <Ionicons name="swap-horizontal-outline" size={10} color={typeColor} />
              </TouchableOpacity>

              <View style={styles.metaSpacer} />

              {/* RPE */}
              <View style={[styles.rpeBlock, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                borderRadius: radius.sm,
              }]}>
                <Text style={[styles.rpeLbl, { color: colors.textMuted }]}>RPE</Text>
                <TouchableOpacity onPress={() => adjustRpe(-0.5)} hitSlop={10} style={styles.rpeBtn}>
                  <Ionicons name="remove" size={13} color={colors.textMuted} />
                </TouchableOpacity>
                <Text style={[styles.rpeVal, {
                  color: rpeVal !== null ? rpeColor(rpeVal, colors) : colors.textMuted + '60',
                }]}>
                  {rpeVal !== null ? String(rpeVal) : '—'}
                </Text>
                {rpeVal !== null && (
                  <TouchableOpacity onPress={clearRpe} hitSlop={10}>
                    <Ionicons name="close-circle" size={12} color={colors.textMuted + '80'} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => adjustRpe(+0.5)} hitSlop={10} style={styles.rpeBtn}>
                  <Ionicons name="add" size={13} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Tempo */}
              <TouchableOpacity
                style={[styles.tempoBtn, {
                  backgroundColor: colors.background,
                  borderColor: tempoStr !== '—' ? colors.accent + '60' : colors.border,
                  borderRadius: radius.sm,
                }]}
                onPress={openTempoEditor}
                hitSlop={8}
              >
                <Ionicons name="timer-outline" size={12} color={tempoStr !== '—' ? colors.accent : colors.textMuted} />
                <Text style={[styles.tempoTxt, { color: tempoStr !== '—' ? colors.accent : colors.textMuted }]}>
                  {tempoStr}
                </Text>
              </TouchableOpacity>
            </View>

          ) : (
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
                          borderRadius: radius.sm,
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
                style={[styles.tempoOk, { backgroundColor: colors.accent, borderRadius: radius.sm }]}
                onPress={commitTempo}
              >
                <Ionicons name="checkmark" size={16} color="#000" />
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },

  idx: {
    width: 20,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },

  // Groupe [−] [input+ghost] [+]
  inputGroup: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  repsGroup: {
    flex: 1,
  },

  stepBtn: {
    width: 32,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 1,
  },
  stepHint: {
    fontSize: 9,
    fontWeight: '700',
  },

  inputCell: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    width: '100%',
    height: 48,
    paddingHorizontal: 4,
    gap: 2,
  },
  numInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    padding: 0,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontSize: 12,
    fontWeight: '700',
    alignSelf: 'flex-end',
    paddingBottom: 5,
  },
  ghost: {
    fontSize: 10,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  timerBtn: {
    width: 34,
    height: 34,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Ligne méta ──
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 7,
    paddingBottom: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 7,
  },
  metaSpacer: { flex: 1 },

  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth: 1,
  },
  typeTxt: { fontSize: 11, fontWeight: '800' },

  rpeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderWidth: 1,
    gap: 2,
  },
  rpeLbl: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginRight: 1 },
  rpeBtn: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  rpeVal: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 26,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },

  tempoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth: 1,
  },
  tempoTxt: { fontSize: 10, fontWeight: '700', fontVariant: ['tabular-nums'] },

  // ── Éditeur tempo ──
  tempoEditor: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tempoGroup: { alignItems: 'center', gap: 4 },
  tempoLbl: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  tempoInput: {
    width: 40,
    borderWidth: 1,
    paddingHorizontal: 2,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  tempoDash: { fontSize: 14, fontWeight: '600', marginTop: 14 },
  tempoOk: {
    marginLeft: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
});

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

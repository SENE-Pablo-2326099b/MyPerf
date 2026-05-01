import React, { useCallback, useRef, useState } from 'react';
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

interface Props {
  set: WorkingSet;
  index: number;
  ghost?: GhostSet;
  onCompleted?: () => void;
  nextRef?: React.RefObject<TextInput>;
}

function SetRow({ set, index, ghost, onCompleted, nextRef }: Props) {
  const { theme: { colors, radius } } = useTheme();
  const weightRef = useRef<TextInput>(null);
  const repsRef = useRef<TextInput>(null);
  const [editingTempo, setEditingTempo] = useState(false);
  const translateX = useSharedValue(0);

  const [te, setTe] = useState(String(set.tempoEccentric));
  const [tpb, setTpb] = useState(String(set.tempoPauseBottom));
  const [tc, setTc] = useState(set.tempoConcentric === -1 ? 'X' : String(set.tempoConcentric));
  const [tpt, setTpt] = useState(String(set.tempoPauseTop));

  const cycleType = useCallback(() => {
    const idx = TYPE_CYCLE.indexOf(set.setType);
    updateSet(set, { setType: TYPE_CYCLE[(idx + 1) % TYPE_CYCLE.length] });
  }, [set]);

  const handleWeight = useCallback((text: string) => {
    const n = parseFloat(text.replace(',', '.'));
    if (!isNaN(n) && n >= 0) updateSet(set, { weight: n });
  }, [set]);

  const handleReps = useCallback((text: string) => {
    const n = parseInt(text, 10);
    updateSet(set, { reps: isNaN(n) ? null : n });
  }, [set]);

  const handleRpe = useCallback((text: string) => {
    const n = parseFloat(text.replace(',', '.'));
    updateSet(set, { rpe: isNaN(n) || !text.trim() ? null : Math.min(10, Math.max(0, n)) });
  }, [set]);

  const handleRir = useCallback((text: string) => {
    const n = parseInt(text, 10);
    updateSet(set, { rir: isNaN(n) || !text.trim() ? null : Math.min(10, Math.max(0, n)) });
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
      onCompleted?.();
    }
    updateSet(set, { completed: next });
  }, [set, onCompleted]);

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

  const typeColor = TYPE_COLORS[set.setType] ?? colors.accent;
  const tempoStr = fmt(set.tempoEccentric, set.tempoPauseBottom, set.tempoConcentric, set.tempoPauseTop);
  const showGhostWeight = ghost && ghost.weight > 0;
  const showGhostReps = ghost && ghost.reps != null;
  const numColor = set.completed ? colors.success : colors.text;

  return (
    <View style={[styles.wrapper, { borderBottomColor: colors.border }]}>
      {/* ── Swipe-reveal delete ── */}
      <View style={[styles.deleteReveal, { backgroundColor: colors.danger }]}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.deleteRevealText}>Retirer</Text>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.slide,
            { backgroundColor: set.completed ? colors.success + '12' : colors.surface },
            rowStyle,
          ]}
        >
          {/* ── Main row ── */}
          <View style={styles.mainRow}>
            {/* Index */}
            <Text style={[styles.idx, { color: colors.textMuted }]}>{index + 1}</Text>

            {/* Type badge — tap to cycle */}
            <TouchableOpacity
              style={[styles.typeBadge, { backgroundColor: typeColor + '1A', borderColor: typeColor + '60' }]}
              onPress={cycleType}
              hitSlop={8}
            >
              <Text style={[styles.typeTxt, { color: typeColor }]}>{TYPE_LABELS[set.setType]}</Text>
            </TouchableOpacity>

            {/* Weight */}
            <View style={styles.numBlock}>
              <View style={styles.numInner}>
                <TextInput
                  ref={weightRef}
                  style={[styles.bigNum, { color: numColor, backgroundColor: colors.background }]}
                  defaultValue={set.weight > 0 ? String(set.weight) : ''}
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
              {showGhostWeight && (
                <Text style={[styles.ghost, { color: colors.accent }]}>↑ {ghost!.weight}</Text>
              )}
            </View>

            {/* Reps */}
            <View style={styles.numBlock}>
              <View style={styles.numInner}>
                <TextInput
                  ref={repsRef}
                  style={[styles.bigNum, styles.repsNum, { color: numColor, backgroundColor: colors.background }]}
                  defaultValue={set.reps != null ? String(set.reps) : ''}
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
              {showGhostReps && (
                <Text style={[styles.ghost, { color: colors.accent }]}>↑ {ghost!.reps}</Text>
              )}
            </View>

            {/* Complete button */}
            <TouchableOpacity
              style={[
                styles.doneBtn,
                {
                  backgroundColor: set.completed ? colors.success : 'transparent',
                  borderColor: set.completed ? colors.success : colors.border,
                },
              ]}
              onPress={toggleComplete}
              hitSlop={8}
            >
              <Ionicons
                name={set.completed ? 'checkmark' : 'ellipse-outline'}
                size={20}
                color={set.completed ? '#fff' : colors.border}
              />
            </TouchableOpacity>
          </View>

          {/* ── Detail row : RPE / RIR / Tempo ── */}
          {!editingTempo ? (
            <View style={styles.detailRow}>
              <View style={[styles.detailChip, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Text style={[styles.detailLbl, { color: colors.textMuted }]}>RPE</Text>
                <TextInput
                  style={[styles.detailNum, { color: colors.text }]}
                  defaultValue={set.rpe != null ? String(set.rpe) : ''}
                  onEndEditing={e => handleRpe(e.nativeEvent.text)}
                  keyboardType="decimal-pad"
                  placeholder="—"
                  placeholderTextColor={colors.textMuted}
                  selectTextOnFocus
                />
              </View>
              <View style={[styles.detailChip, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Text style={[styles.detailLbl, { color: colors.textMuted }]}>RIR</Text>
                <TextInput
                  style={[styles.detailNum, { color: colors.text }]}
                  defaultValue={set.rir != null ? String(set.rir) : ''}
                  onEndEditing={e => handleRir(e.nativeEvent.text)}
                  keyboardType="number-pad"
                  placeholder="—"
                  placeholderTextColor={colors.textMuted}
                  selectTextOnFocus
                />
              </View>
              <TouchableOpacity
                style={[styles.tempoChip, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={openTempoEditor}
                hitSlop={8}
              >
                <Ionicons name="timer-outline" size={11} color={colors.textMuted} />
                <Text style={[styles.tempoChipTxt, { color: tempoStr === '—' ? colors.textMuted : colors.accent }]}>
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
                    {i > 0 && <Text style={[styles.tempoDash, { color: colors.textMuted }]}>-</Text>}
                    <Text style={[styles.tempoEditorLbl, { color: colors.textMuted }]}>{lbl}</Text>
                    <TextInput
                      style={[styles.tempoInput, { color: colors.text, borderColor: colors.border }]}
                      value={vals[i]}
                      onChangeText={setters[i]}
                      keyboardType={lbl === 'Con' ? 'default' : 'number-pad'}
                      placeholder={lbl === 'Con' ? 'X' : '0'}
                      placeholderTextColor={colors.textMuted}
                      maxLength={2}
                      selectTextOnFocus
                    />
                  </React.Fragment>
                );
              })}
              <TouchableOpacity style={[styles.tempoOk, { backgroundColor: colors.accent }]} onPress={commitTempo}>
                <Ionicons name="checkmark" size={14} color="#000" />
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

  slide: { /* translating layer */ },

  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },

  idx: { width: 18, fontSize: 13, fontWeight: '700', textAlign: 'center' },

  typeBadge: {
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  typeTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  numBlock: { flex: 1, alignItems: 'center', gap: 3 },
  numInner: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  bigNum: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 54,
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 8,
    fontVariant: ['tabular-nums'],
  },
  repsNum: { minWidth: 40 },
  unit: { fontSize: 13, fontWeight: '600' },
  ghost: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
    opacity: 0.65,
  },

  doneBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 42,
    paddingRight: 14,
    paddingBottom: 10,
    paddingTop: 2,
    gap: 6,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  detailLbl: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  detailNum: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 26,
    padding: 0,
    fontVariant: ['tabular-nums'],
  },
  tempoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  tempoChipTxt: { fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },

  tempoEditor: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexWrap: 'wrap',
  },
  tempoEditorLbl: { fontSize: 10, fontWeight: '700' },
  tempoInput: {
    width: 32,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  tempoDash: { fontSize: 13, fontWeight: '600' },
  tempoOk: {
    marginLeft: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(SetRow);

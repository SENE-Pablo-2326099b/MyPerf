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

const DELETE_THRESHOLD = -64;
const DELETE_WIDTH = 72;

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

function formatTempo(e: number, pb: number, c: number, pt: number): string {
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
  const { theme: { colors } } = useTheme();
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
    updateSet(set, { rpe: isNaN(n) || text.trim() === '' ? null : Math.min(10, Math.max(0, n)) });
  }, [set]);

  const handleRir = useCallback((text: string) => {
    const n = parseInt(text, 10);
    updateSet(set, { rir: isNaN(n) || text.trim() === '' ? null : Math.min(10, Math.max(0, n)) });
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
      translateX.value = Math.max(-DELETE_WIDTH * 1.4, Math.min(0, e.translationX));
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
  const tempoStr = formatTempo(
    set.tempoEccentric, set.tempoPauseBottom, set.tempoConcentric, set.tempoPauseTop,
  );

  const showGhostWeight = ghost && ghost.weight > 0;
  const showGhostReps = ghost && ghost.reps != null;

  return (
    <View style={[styles.wrapper, { borderBottomColor: colors.border }]}>
      {/* Zone delete */}
      <View style={[styles.deleteZone, { backgroundColor: colors.danger }]}>
        <Ionicons name="trash-outline" size={16} color="#fff" />
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[{ opacity: set.completed ? 0.55 : 1 }, rowStyle]}>
      {/* ── Main row ── */}
      <View style={styles.mainRow}>
        <Text style={[styles.index, { color: colors.textMuted }]}>{index + 1}</Text>

        <TouchableOpacity
          style={[styles.typeBadge, { backgroundColor: typeColor + '22', borderColor: typeColor + '55' }]}
          onPress={cycleType}
          hitSlop={8}
        >
          <Text style={[styles.typeText, { color: typeColor }]}>{TYPE_LABELS[set.setType]}</Text>
        </TouchableOpacity>

        {/* Weight + ghost */}
        <View style={styles.fieldCol}>
          <View style={styles.fieldRow}>
            <TextInput
              ref={weightRef}
              style={[styles.numInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              defaultValue={set.weight > 0 ? String(set.weight) : ''}
              onEndEditing={e => handleWeight(e.nativeEvent.text)}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              selectTextOnFocus
              returnKeyType="next"
              onSubmitEditing={() => repsRef.current?.focus()}
            />
            <Text style={[styles.unit, { color: colors.textMuted }]}>kg</Text>
          </View>
          {showGhostWeight && (
            <Text style={[styles.ghost, { color: colors.textMuted }]}>↑{ghost.weight}</Text>
          )}
        </View>

        {/* Reps + ghost */}
        <View style={styles.fieldCol}>
          <View style={styles.fieldRow}>
            <TextInput
              ref={repsRef}
              style={[styles.numInput, styles.repsInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
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
            <Text style={[styles.ghost, { color: colors.textMuted }]}>↑{ghost.reps}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.doneBtn,
            { backgroundColor: set.completed ? colors.success : 'transparent', borderColor: set.completed ? colors.success : colors.border },
          ]}
          onPress={toggleComplete}
          hitSlop={8}
        >
          <Ionicons
            name={set.completed ? 'checkmark' : 'checkmark-outline'}
            size={18}
            color={set.completed ? '#fff' : colors.textMuted}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={confirmDelete} hitSlop={8} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* ── Detail row : RPE / RIR / Tempo ── */}
      <View style={styles.detailRow}>
        <View style={styles.detailField}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>RPE</Text>
          <TextInput
            style={[styles.detailInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            defaultValue={set.rpe != null ? String(set.rpe) : ''}
            onEndEditing={e => handleRpe(e.nativeEvent.text)}
            keyboardType="decimal-pad"
            placeholder="—"
            placeholderTextColor={colors.textMuted}
            selectTextOnFocus
          />
        </View>

        <View style={styles.detailSep} />

        <View style={styles.detailField}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>RIR</Text>
          <TextInput
            style={[styles.detailInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            defaultValue={set.rir != null ? String(set.rir) : ''}
            onEndEditing={e => handleRir(e.nativeEvent.text)}
            keyboardType="number-pad"
            placeholder="—"
            placeholderTextColor={colors.textMuted}
            selectTextOnFocus
          />
        </View>

        <View style={styles.detailSep} />

        <TouchableOpacity
          style={[styles.tempoChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={openTempoEditor}
          hitSlop={8}
        >
          <Ionicons name="timer-outline" size={11} color={colors.textMuted} />
          <Text style={[styles.tempoChipText, { color: tempoStr === '—' ? colors.textMuted : colors.text }]}>
            {tempoStr}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Tempo inline editor ── */}
      {editingTempo && (
        <View style={[styles.tempoEditorRow, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Ecc</Text>
          <TextInput style={[styles.tempoInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} value={te} onChangeText={setTe} keyboardType="number-pad" maxLength={2} selectTextOnFocus />
          <Text style={[styles.tempoDash, { color: colors.textMuted }]}>-</Text>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Bot</Text>
          <TextInput style={[styles.tempoInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} value={tpb} onChangeText={setTpb} keyboardType="number-pad" maxLength={2} selectTextOnFocus />
          <Text style={[styles.tempoDash, { color: colors.textMuted }]}>-</Text>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Con</Text>
          <TextInput style={[styles.tempoInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} value={tc} onChangeText={setTc} placeholder="X" placeholderTextColor={colors.textMuted} maxLength={2} selectTextOnFocus />
          <Text style={[styles.tempoDash, { color: colors.textMuted }]}>-</Text>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Top</Text>
          <TextInput style={[styles.tempoInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]} value={tpt} onChangeText={setTpt} keyboardType="number-pad" maxLength={2} selectTextOnFocus />
          <TouchableOpacity style={[styles.tempoConfirm, { backgroundColor: colors.accent }]} onPress={commitTempo}>
            <Ionicons name="checkmark" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderBottomWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  deleteZone: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  index: { width: 18, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 56,
    alignItems: 'center',
  },
  typeText: { fontSize: 11, fontWeight: '700' },
  fieldCol: { alignItems: 'center', gap: 2 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  numInput: {
    width: 56,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  repsInput: { width: 48 },
  unit: { fontSize: 12, fontWeight: '500' },
  ghost: { fontSize: 10, fontStyle: 'italic', letterSpacing: 0.2 },
  doneBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: { padding: 4 },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 38,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 10,
  },
  detailField: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  detailInput: {
    width: 38,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 3,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailSep: { width: StyleSheet.hairlineWidth, height: 14, backgroundColor: '#9CA3AF' },
  tempoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  tempoChipText: { fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },

  tempoEditorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 38,
    paddingVertical: 8,
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tempoInput: {
    width: 32,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 3,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  tempoDash: { fontSize: 13, fontWeight: '600' },
  tempoConfirm: {
    marginLeft: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(SetRow);

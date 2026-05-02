import React, { useState, useCallback } from 'react';
import {
  Alert,
  FlatList,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { useBodyMetrics } from '@/hooks/useBodyMetrics';
import { deleteBodyMetric } from '@/features/body/bodyActions';
import BodyMetricModal from '@/features/body/BodyMetricModal';
import type BodyMetric from '@/db/models/BodyMetric';

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const CHART_H = 180;
const DOT_R = 5;
const DELETE_THRESHOLD = -72;
const DELETE_WIDTH = 84;

// ── Types ─────────────────────────────────────────────────────────────────────

type MeasurementKey =
  | 'chestCm'
  | 'waistCm'
  | 'hipsCm'
  | 'leftArmCm'
  | 'rightArmCm'
  | 'leftThighCm'
  | 'rightThighCm'
  | 'bodyFatPct';

const MEASUREMENT_LABELS: Record<MeasurementKey, string> = {
  chestCm: 'Poitrine',
  waistCm: 'Taille',
  hipsCm: 'Hanches',
  leftArmCm: 'Bras G.',
  rightArmCm: 'Bras D.',
  leftThighCm: 'Cuisse G.',
  rightThighCm: 'Cuisse D.',
  bodyFatPct: '% Grasse',
};

const MEASUREMENT_KEYS: MeasurementKey[] = [
  'chestCm',
  'waistCm',
  'hipsCm',
  'leftArmCm',
  'rightArmCm',
  'leftThighCm',
  'rightThighCm',
  'bodyFatPct',
];

function getMeasurementUnit(key: MeasurementKey): string {
  return key === 'bodyFatPct' ? '%' : 'cm';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtShortDate(d: Date): string {
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

function fmtFullDate(d: Date): string {
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getDelta(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null) return null;
  return current - previous;
}

// ── Section 1 — Quick Stats Header Card ──────────────────────────────────────

function StatsHeader({ metrics, onAdd }: { metrics: BodyMetric[]; onAdd: () => void }) {
  const { theme: { colors, radius } } = useTheme();

  if (metrics.length === 0) {
    return (
      <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
        <Text style={[styles.emptyStats, { color: colors.textMuted }]}>
          Aucune donnée — appuie sur + pour commencer
        </Text>
      </View>
    );
  }

  const latest = metrics[0];
  const previous = metrics.length > 1 ? metrics[1] : null;
  const weightDelta = getDelta(latest.weightKg, previous?.weightKg ?? null);
  const weightDeltaColor = weightDelta == null
    ? colors.textMuted
    : weightDelta < 0
      ? colors.success
      : colors.danger;

  return (
    <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
      <View style={styles.statsMain}>
        <View style={styles.statsLeft}>
          <Text style={[styles.weightBig, { color: colors.text }]}>
            {latest.weightKg.toFixed(1)}<Text style={[styles.weightUnit, { color: colors.textMuted }]}> kg</Text>
          </Text>
          {weightDelta !== null && (
            <Text style={[styles.weightDelta, { color: weightDeltaColor }]}>
              {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)} kg
            </Text>
          )}
          <Text style={[styles.statsDate, { color: colors.textMuted }]}>
            {fmtFullDate(latest.recordedAt)}
          </Text>
        </View>
        <View style={styles.statsRight}>
          {latest.bodyFatPct != null && (
            <View style={[styles.statChip, { backgroundColor: colors.accentDim, borderRadius: radius.sm }]}>
              <Text style={[styles.statChipLabel, { color: colors.textMuted }]}>% grasse</Text>
              <Text style={[styles.statChipValue, { color: colors.accent }]}>
                {latest.bodyFatPct.toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Section 2 — Weight Chart ──────────────────────────────────────────────────

function WeightChart({ metrics }: { metrics: BodyMetric[] }) {
  const { theme: { colors, radius } } = useTheme();
  const [chartWidth, setChartWidth] = useState(300);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setChartWidth(e.nativeEvent.layout.width);
  }, []);

  const displayed = metrics.slice(0, 16).reverse();

  if (displayed.length < 2) return null;

  const vals = displayed.map(m => m.weightKg);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;

  const norm = (v: number) => (v - minV) / range;
  const yPos = (v: number) => CHART_H - DOT_R - (CHART_H - DOT_R * 2) * norm(v);

  const step = displayed.length > 1 ? (chartWidth - DOT_R * 2) / (displayed.length - 1) : 0;
  const xPos = (i: number) => DOT_R + i * step;

  const firstIdx = 0;
  const midIdx = Math.floor(displayed.length / 2);
  const lastIdx = displayed.length - 1;

  return (
    <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>POIDS</Text>
      <View style={{ height: CHART_H + 28 }} onLayout={onLayout}>
        {/* Y-axis labels */}
        <Text style={[styles.chartYLabel, { color: colors.textMuted, top: DOT_R - 6 }]}>
          {maxV.toFixed(1)}
        </Text>
        <Text style={[styles.chartYLabel, { color: colors.textMuted, top: CHART_H / 2 - 6 }]}>
          {((maxV + minV) / 2).toFixed(1)}
        </Text>
        <Text style={[styles.chartYLabel, { color: colors.textMuted, top: CHART_H - DOT_R - 6 }]}>
          {minV.toFixed(1)}
        </Text>

        {/* Reference lines */}
        {[0, 0.5, 1].map(pct => (
          <View
            key={pct}
            style={[styles.chartRefLine, {
              backgroundColor: colors.border,
              top: DOT_R + (CHART_H - DOT_R * 2) * (1 - pct),
              left: 36,
            }]}
          />
        ))}

        {/* Connecting lines */}
        {displayed.slice(0, -1).map((point, i) => {
          const x1 = xPos(i) + 36;
          const y1 = yPos(point.weightKg);
          const x2 = xPos(i + 1) + 36;
          const y2 = yPos(displayed[i + 1].weightKg);
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          return (
            <View
              key={i}
              style={[styles.chartLine, {
                backgroundColor: colors.accent + '88',
                width: len,
                left: x1,
                top: y1,
                transform: [{ rotate: `${angle}deg` }],
              }]}
            />
          );
        })}

        {/* Dots + X labels */}
        {displayed.map((point, i) => {
          const x = xPos(i) + 36;
          const y = yPos(point.weightKg);
          const isLast = i === lastIdx;
          const showLabel = i === firstIdx || i === midIdx || i === lastIdx;
          return (
            <React.Fragment key={point.id}>
              <View style={[styles.chartDot, {
                backgroundColor: isLast ? colors.accent : colors.accent + '88',
                left: x - DOT_R,
                top: y - DOT_R,
                width: isLast ? DOT_R * 2 + 4 : DOT_R * 2,
                height: isLast ? DOT_R * 2 + 4 : DOT_R * 2,
                borderRadius: isLast ? DOT_R + 2 : DOT_R,
                borderColor: isLast ? colors.surface : 'transparent',
                borderWidth: isLast ? 2 : 0,
              }]} />
              {showLabel && (
                <Text style={[styles.chartXLabel, { color: colors.textMuted, left: x - 22, top: CHART_H + 4 }]}>
                  {fmtShortDate(point.recordedAt)}
                </Text>
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

// ── Section 3 — Measurements Grid ────────────────────────────────────────────

function MeasurementsGrid({ metrics }: { metrics: BodyMetric[] }) {
  const { theme: { colors, radius } } = useTheme();

  // Find which measurements have at least one non-null value
  const visibleKeys = MEASUREMENT_KEYS.filter(key =>
    metrics.some(m => m[key] != null),
  );

  if (visibleKeys.length === 0) return null;

  // For each key, find the two most recent entries that have a non-null value
  function getLatestTwo(key: MeasurementKey): [BodyMetric | null, BodyMetric | null] {
    const withValue = metrics.filter(m => m[key] != null);
    return [withValue[0] ?? null, withValue[1] ?? null];
  }

  return (
    <View style={[styles.measureCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>MENSURATIONS</Text>
      <View style={styles.measureGrid}>
        {visibleKeys.map(key => {
          const [latest, previous] = getLatestTwo(key);
          const value = latest?.[key] as number | null | undefined;
          const prevValue = previous?.[key] as number | null | undefined;
          const delta = getDelta(value ?? null, prevValue ?? null);
          const unit = getMeasurementUnit(key);
          const deltaColor = delta == null
            ? colors.textMuted
            : key === 'waistCm' || key === 'hipsCm' || key === 'bodyFatPct'
              ? delta < 0 ? colors.success : colors.danger
              : delta > 0 ? colors.success : colors.danger;

          return (
            <View key={key} style={[styles.measureChip, { backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderRadius: radius.md }]}>
              <Text style={[styles.measureLabel, { color: colors.textMuted }]}>
                {MEASUREMENT_LABELS[key]}
              </Text>
              <Text style={[styles.measureValue, { color: colors.text }]}>
                {value != null ? `${value.toFixed(1)}${unit}` : '—'}
              </Text>
              {delta !== null && (
                <Text style={[styles.measureDelta, { color: deltaColor }]}>
                  {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Section 4 — History entry row (swipe-to-delete) ──────────────────────────

interface EntryRowProps {
  metric: BodyMetric;
  onDelete: (metric: BodyMetric) => void;
}

function EntryRow({ metric, onDelete }: EntryRowProps) {
  const { theme: { colors, radius } } = useTheme();
  const translateX = useSharedValue(0);

  const confirmDelete = useCallback(() => {
    Alert.alert('Supprimer cette entrée ?', undefined, [
      { text: 'Annuler', style: 'cancel', onPress: () => { translateX.value = withSpring(0); } },
      { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(metric) },
    ]);
  }, [metric, onDelete, translateX]);

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

  // Find non-null measurements
  const nonNullMeasurements = MEASUREMENT_KEYS.filter(k => metric[k] != null);

  return (
    <View style={[styles.entryWrapper, { borderBottomColor: colors.border }]}>
      {/* Delete reveal */}
      <View style={[styles.entryDeleteReveal, { backgroundColor: colors.danger }]}>
        <Ionicons name="trash-outline" size={18} color="#fff" />
        <Text style={styles.entryDeleteText}>Retirer</Text>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.entrySlide, { backgroundColor: colors.surface }, rowStyle]}>
          <View style={styles.entryMain}>
            <View style={styles.entryLeft}>
              <Text style={[styles.entryDate, { color: colors.text }]}>
                {fmtFullDate(metric.recordedAt)}
              </Text>
              <Text style={[styles.entryTime, { color: colors.textMuted }]}>
                {fmtTime(metric.recordedAt)}
              </Text>
            </View>
            <Text style={[styles.entryWeight, { color: colors.accent }]}>
              {metric.weightKg.toFixed(1)} kg
            </Text>
          </View>

          {nonNullMeasurements.length > 0 && (
            <View style={styles.entryChips}>
              {nonNullMeasurements.map(k => {
                const val = metric[k] as number;
                const unit = getMeasurementUnit(k);
                return (
                  <View key={k} style={[styles.entryChip, { backgroundColor: colors.surfaceRaised, borderRadius: radius.sm }]}>
                    <Text style={[styles.entryChipText, { color: colors.textMuted }]}>
                      {MEASUREMENT_LABELS[k]}: <Text style={{ color: colors.text }}>{val.toFixed(1)}{unit}</Text>
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function BodyScreen() {
  const { theme: { colors, radius } } = useTheme();
  const insets = useSafeAreaInsets();
  const metrics = useBodyMetrics();
  const [modalVisible, setModalVisible] = useState(false);

  const handleDelete = useCallback(async (metric: BodyMetric) => {
    await deleteBodyMetric(metric);
  }, []);

  const renderItem = useCallback(({ item }: { item: BodyMetric }) => (
    <EntryRow metric={item} onDelete={handleDelete} />
  ), [handleDelete]);

  const keyExtractor = useCallback((item: BodyMetric) => item.id, []);

  const ListHeader = (
    <>
      {/* Section 1 */}
      <StatsHeader metrics={metrics} onAdd={() => setModalVisible(true)} />

      {/* Section 2 */}
      <WeightChart metrics={metrics} />

      {/* Section 3 */}
      <MeasurementsGrid metrics={metrics} />

      {/* Section 4 header */}
      {metrics.length > 0 && (
        <Text style={[styles.historyTitle, { color: colors.textMuted }]}>HISTORIQUE</Text>
      )}
    </>
  );

  const ListEmpty = (
    <View style={styles.emptyContainer}>
      <Ionicons name="scale-outline" size={48} color={colors.border} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune donnée</Text>
      <Text style={[styles.emptySub, { color: colors.textMuted }]}>
        Commence par enregistrer ton poids avec le bouton +
      </Text>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Custom header */}
      <View style={[styles.header, {
        backgroundColor: colors.surface,
        borderBottomColor: colors.border,
        paddingTop: insets.top + 8,
      }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.accent} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Corps & Mensurations</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} hitSlop={12} style={styles.headerBtn}>
          <Ionicons name="add" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={metrics}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        style={{ backgroundColor: colors.background }}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, {
          backgroundColor: colors.accent,
          borderRadius: radius.lg,
          bottom: insets.bottom + 16,
        }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>

      <BodyMetricModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },

  // Content
  content: { paddingTop: 12, gap: 8 },

  // Section titles
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },

  // Stats header card (Section 1)
  statsCard: {
    marginHorizontal: 16,
    borderWidth: 1,
    padding: 16,
  },
  statsMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statsLeft: { gap: 4 },
  statsRight: { gap: 8, alignItems: 'flex-end' },
  weightBig: {
    fontSize: 36,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    lineHeight: 40,
  },
  weightUnit: { fontSize: 18, fontWeight: '600' },
  weightDelta: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statsDate: { fontSize: 12 },
  statChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    gap: 2,
  },
  statChipLabel: { fontSize: 10, fontWeight: '600' },
  statChipValue: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  emptyStats: { fontSize: 14, textAlign: 'center', paddingVertical: 12 },

  // Chart (Section 2)
  chartCard: {
    marginHorizontal: 16,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  chartYLabel: {
    position: 'absolute',
    left: 0,
    fontSize: 9,
    width: 32,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  chartRefLine: {
    position: 'absolute',
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  chartLine: {
    position: 'absolute',
    height: 1.5,
    transformOrigin: 'left center',
  },
  chartDot: {
    position: 'absolute',
  },
  chartXLabel: {
    position: 'absolute',
    fontSize: 9,
    width: 44,
    textAlign: 'center',
  },

  // Measurements (Section 3)
  measureCard: {
    marginHorizontal: 16,
    borderWidth: 1,
    padding: 16,
  },
  measureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  measureChip: {
    width: '47%',
    borderWidth: 1,
    padding: 10,
    gap: 3,
  },
  measureLabel: { fontSize: 10, fontWeight: '600' },
  measureValue: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  measureDelta: { fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'] },

  // History section title
  historyTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },

  // Entry row (Section 4)
  entryWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  entryDeleteReveal: {
    position: 'absolute',
    right: 0, top: 0, bottom: 0,
    width: DELETE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  entryDeleteText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  entrySlide: {},
  entryMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  entryLeft: { gap: 2 },
  entryDate: { fontSize: 14, fontWeight: '700' },
  entryTime: { fontSize: 11 },
  entryWeight: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  entryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  entryChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  entryChipText: { fontSize: 11 },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});

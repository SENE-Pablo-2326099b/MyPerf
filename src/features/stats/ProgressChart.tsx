import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useExerciseProgress } from '@/hooks/useExerciseProgress';
import type { ProgressPoint } from '@/hooks/useExerciseProgress';

type Metric = 'weight' | 'e1rm' | 'volume';

const MONTH_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

function fmtDate(d: Date) { return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`; }

// ── Chart View-based ──────────────────────────────────────────────────────────

const CHART_H = 140;
const DOT_R = 5;

function LineChart({ points, metric, accent, muted, border, text }: {
  points: ProgressPoint[];
  metric: Metric;
  accent: string;
  muted: string;
  border: string;
  text: string;
}) {
  if (points.length === 0) return null;

  const getValue = (p: ProgressPoint): number => {
    if (metric === 'e1rm') return p.maxE1RM;
    if (metric === 'volume') return p.totalVolume;
    return p.maxWeight;
  };

  const vals = points.map(getValue);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;

  const norm = (v: number) => (v - minV) / range;
  const yPos = (v: number) => CHART_H - DOT_R - (CHART_H - DOT_R * 2) * norm(v);

  const W = 300;
  const step = points.length > 1 ? (W - DOT_R * 2) / (points.length - 1) : 0;
  const xPos = (i: number) => DOT_R + i * step;

  return (
    <View style={{ height: CHART_H + 24, width: W }}>
      {/* Y-axis reference lines */}
      {[0, 0.5, 1].map(pct => (
        <View key={pct} style={[styles.refLine, {
          backgroundColor: border,
          top: DOT_R + (CHART_H - DOT_R * 2) * (1 - pct),
        }]} />
      ))}

      {/* Y labels */}
      <Text style={[styles.yLabel, { color: muted, top: DOT_R }]}>
        {metric === 'volume'
          ? maxV >= 1000 ? `${(maxV / 1000).toFixed(1)}t` : `${Math.round(maxV)}kg`
          : `${Math.round(maxV)}kg`}
      </Text>
      <Text style={[styles.yLabel, { color: muted, top: CHART_H / 2 }]}>
        {metric === 'volume'
          ? ((maxV + minV) / 2) >= 1000 ? `${((maxV + minV) / 2000).toFixed(1)}t` : `${Math.round((maxV + minV) / 2)}kg`
          : `${Math.round((maxV + minV) / 2)}kg`}
      </Text>

      {/* Connecting lines between dots */}
      {points.slice(0, -1).map((p, i) => {
        const x1 = xPos(i);
        const y1 = yPos(getValue(p));
        const x2 = xPos(i + 1);
        const y2 = yPos(getValue(points[i + 1]));
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        return (
          <View key={i} style={[styles.line, {
            backgroundColor: accent + '66',
            width: len,
            left: x1,
            top: y1,
            transform: [{ rotate: `${angle}deg` }],
          }]} />
        );
      })}

      {/* Dots + X labels */}
      {points.map((p, i) => {
        const x = xPos(i);
        const y = yPos(getValue(p));
        const isLast = i === points.length - 1;
        const isFirst = i === 0;
        const isMid = i === Math.floor(points.length / 2);
        return (
          <React.Fragment key={i}>
            <View style={[styles.dot, {
              backgroundColor: isLast ? accent : accent + '88',
              left: x - DOT_R,
              top: y - DOT_R,
              borderColor: isLast ? '#fff' : 'transparent',
              borderWidth: isLast ? 1.5 : 0,
            }]} />
            {(isFirst || isLast || (points.length <= 8) || isMid) && (
              <Text style={[styles.xLabel, { color: muted, left: x - 22, top: CHART_H + 2 }]}>
                {fmtDate(p.date)}
              </Text>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ── PR detection ──────────────────────────────────────────────────────────────

function PrBadge({ points, metric }: { points: ProgressPoint[]; metric: Metric }) {
  const { theme: { colors, radius } } = useTheme();
  if (points.length < 2) return null;

  const getValue = (p: ProgressPoint) =>
    metric === 'e1rm' ? p.maxE1RM : metric === 'volume' ? p.totalVolume : p.maxWeight;

  const lastVal = getValue(points[points.length - 1]);
  const prevMax = Math.max(...points.slice(0, -1).map(getValue));

  if (lastVal <= prevMax) return null;

  const diff = lastVal - prevMax;
  const label = metric === 'volume'
    ? diff >= 1000 ? `+${(diff / 1000).toFixed(1)}t` : `+${Math.round(diff)}kg`
    : `+${Math.round(diff)}kg`;

  return (
    <View style={[styles.prBadge, { backgroundColor: colors.success + '18', borderRadius: radius.sm }]}>
      <Ionicons name="trophy" size={12} color={colors.success} />
      <Text style={[styles.prText, { color: colors.success }]}>PR — {label} vs précédent</Text>
    </View>
  );
}

// ── Modal principal ───────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  exerciseId: string;
  exerciseName: string;
  onClose: () => void;
}

export default function ProgressChart({ visible, exerciseId, exerciseName, onClose }: Props) {
  const { theme: { colors, radius, mode } } = useTheme();
  const isNeo = mode === 'neo';
  const { points, loading } = useExerciseProgress(visible ? exerciseId : undefined);
  const [metric, setMetric] = useState<Metric>('weight');

  const METRICS: Array<{ key: Metric; label: string }> = [
    { key: 'weight', label: 'Poids max' },
    { key: 'e1rm', label: 'e1RM' },
    { key: 'volume', label: 'Volume' },
  ];

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
              {isNeo ? 'PROGRESSION' : 'Progression'}
            </Text>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {exerciseName}
            </Text>
          </View>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {/* Metric selector */}
          <View style={[styles.metricRow, { backgroundColor: colors.surface, borderRadius: radius.sm }]}>
            {METRICS.map(m => (
              <TouchableOpacity
                key={m.key}
                style={[styles.metricBtn, {
                  backgroundColor: metric === m.key ? colors.accent : 'transparent',
                  borderRadius: radius.sm,
                }]}
                onPress={() => setMetric(m.key)}
              >
                <Text style={[styles.metricText, { color: metric === m.key ? '#000' : colors.textMuted }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : points.length < 2 ? (
            <View style={styles.center}>
              <Ionicons name="stats-chart-outline" size={40} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {points.length === 0
                  ? 'Aucune donnée. Réalise des séances avec cet exercice.'
                  : 'Au moins 2 séances sont nécessaires pour afficher la progression.'}
              </Text>
            </View>
          ) : (
            <>
              {/* PR badge */}
              <PrBadge points={points} metric={metric} />

              {/* Chart */}
              <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
                    <LineChart
                      points={points}
                      metric={metric}
                      accent={colors.accent}
                      muted={colors.textMuted}
                      border={colors.border}
                      text={colors.text}
                    />
                  </View>
                </ScrollView>
              </View>

              {/* Last sessions table */}
              <View style={[styles.tableCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
                <Text style={[styles.tableTitle, { color: colors.textMuted, letterSpacing: isNeo ? 1 : 0 }]}>
                  {isNeo ? 'HISTORIQUE' : 'Historique'}
                </Text>
                {[...points].reverse().slice(0, 8).map((p, i) => {
                  const val = metric === 'e1rm' ? p.maxE1RM : metric === 'volume' ? p.totalVolume : p.maxWeight;
                  const isFirst = i === 0;
                  const prev = [...points].reverse()[i + 1];
                  const prevVal = prev ? (metric === 'e1rm' ? prev.maxE1RM : metric === 'volume' ? prev.totalVolume : prev.maxWeight) : null;
                  const delta = prevVal != null ? val - prevVal : null;

                  return (
                    <View key={i} style={[styles.tableRow, { borderTopColor: colors.border }]}>
                      <Text style={[styles.tableDate, { color: colors.textMuted }]}>{fmtDate(p.date)}</Text>
                      <Text style={[styles.tableVal, { color: isFirst ? colors.accent : colors.text }]}>
                        {metric === 'volume'
                          ? val >= 1000 ? `${(val / 1000).toFixed(1)}t` : `${Math.round(val)}kg`
                          : `${Math.round(val * 10) / 10}kg`}
                      </Text>
                      {delta != null && (
                        <Text style={[styles.tableDelta, { color: delta >= 0 ? colors.success : colors.danger }]}>
                          {delta >= 0 ? '+' : ''}{Math.round(delta * 10) / 10}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      </View>
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
  headerCenter: { flex: 1, gap: 2 },
  headerSub: { fontSize: 10, fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  body: { padding: 16, gap: 12, paddingBottom: 48 },

  metricRow: { flexDirection: 'row', padding: 4, gap: 2 },
  metricBtn: { flex: 1, paddingVertical: 7, alignItems: 'center' },
  metricText: { fontSize: 12, fontWeight: '700' },

  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  prText: { fontSize: 12, fontWeight: '700' },

  chartCard: { borderWidth: 1, overflow: 'hidden' },
  center: { paddingVertical: 48, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 24 },

  // Chart primitives
  refLine: { position: 'absolute', left: 28, right: 0, height: StyleSheet.hairlineWidth },
  yLabel: { position: 'absolute', left: 0, fontSize: 9, width: 26, textAlign: 'right' },
  line: { position: 'absolute', height: 1.5, transformOrigin: 'left center' },
  dot: { position: 'absolute', width: DOT_R * 2, height: DOT_R * 2, borderRadius: DOT_R },
  xLabel: { position: 'absolute', fontSize: 9, width: 44, textAlign: 'center' },

  tableCard: { borderWidth: 1, overflow: 'hidden' },
  tableTitle: { fontSize: 10, fontWeight: '700', padding: 12, paddingBottom: 8 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth },
  tableDate: { flex: 1, fontSize: 13 },
  tableVal: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'], minWidth: 64, textAlign: 'right' },
  tableDelta: { fontSize: 12, fontWeight: '600', minWidth: 40, textAlign: 'right', fontVariant: ['tabular-nums'] },
});

import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useBodyMetrics } from '@/hooks/useBodyMetrics';
import BodyMetricModal from './BodyMetricModal';
import type BodyMetric from '@/db/models/BodyMetric';

const MONTH_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function fmtDate(d: Date): string {
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

// ── Mini weight chart (View-based, same approach as ProgressChart) ─────────────

const CHART_H = 80;
const DOT_R = 4;
const CHART_W = 260;

function MiniWeightChart({ metrics, accent, border }: {
  metrics: BodyMetric[];
  accent: string;
  border: string;
}) {
  if (metrics.length < 2) return null;

  const last8 = [...metrics].reverse().slice(-8);
  const vals = last8.map(m => m.weightKg);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;

  const norm = (v: number) => (v - minV) / range;
  const yPos = (v: number) => CHART_H - DOT_R - (CHART_H - DOT_R * 2) * norm(v);

  const step = last8.length > 1 ? (CHART_W - DOT_R * 2) / (last8.length - 1) : 0;
  const xPos = (i: number) => DOT_R + i * step;

  return (
    <View style={{ height: CHART_H, width: CHART_W }}>
      {/* Reference lines */}
      {[0, 0.5, 1].map(pct => (
        <View key={pct} style={[chartStyles.refLine, {
          backgroundColor: border,
          top: DOT_R + (CHART_H - DOT_R * 2) * (1 - pct),
        }]} />
      ))}

      {/* Connecting lines */}
      {last8.slice(0, -1).map((m, i) => {
        const x1 = xPos(i);
        const y1 = yPos(m.weightKg);
        const x2 = xPos(i + 1);
        const y2 = yPos(last8[i + 1].weightKg);
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        return (
          <View key={i} style={[chartStyles.line, {
            backgroundColor: accent + '66',
            width: len,
            left: x1,
            top: y1,
            transform: [{ rotate: `${angle}deg` }],
          }]} />
        );
      })}

      {/* Dots */}
      {last8.map((m, i) => {
        const isLast = i === last8.length - 1;
        return (
          <View key={i} style={[chartStyles.dot, {
            backgroundColor: isLast ? accent : accent + '88',
            left: xPos(i) - DOT_R,
            top: yPos(m.weightKg) - DOT_R,
            borderColor: isLast ? '#fff' : 'transparent',
            borderWidth: isLast ? 1.5 : 0,
          }]} />
        );
      })}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  refLine: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  line: { position: 'absolute', height: 1.5, transformOrigin: 'left center' },
  dot: { position: 'absolute', width: DOT_R * 2, height: DOT_R * 2, borderRadius: DOT_R },
});

// ── Main card ─────────────────────────────────────────────────────────────────

export default function BodyMetricsCard() {
  const { theme: { colors, radius, mode } } = useTheme();
  const isNeo = mode === 'neo';
  const metrics = useBodyMetrics();
  const [modalVisible, setModalVisible] = useState(false);

  const last5 = metrics.slice(0, 5);
  const hasData = metrics.length > 0;
  const latest = metrics[0];
  const prev = metrics[1];

  const delta = latest && prev ? latest.weightKg - prev.weightKg : null;

  function fmtDelta(d: number): string {
    const sign = d >= 0 ? '+' : '';
    return `${sign}${Math.round(d * 10) / 10} kg`;
  }

  return (
    <>
      <View style={[styles.card, {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: radius.lg,
        borderLeftWidth: isNeo ? 2 : 0,
        borderLeftColor: colors.accent,
      }]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="scale-outline" size={14} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.text, letterSpacing: isNeo ? 1.5 : 0 }]}>
              {isNeo ? 'POIDS & MENSURATIONS' : 'Poids & Mensurations'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            hitSlop={12}
            style={[styles.addBtn, { backgroundColor: colors.accentDim, borderRadius: radius.sm }]}
          >
            <Ionicons name="add" size={18} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {!hasData ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Aucune mesure enregistrée. Appuie sur + pour commencer.
            </Text>
          </View>
        ) : (
          <>
            {/* Latest entry summary */}
            <View style={[styles.latestRow, { backgroundColor: colors.surfaceRaised, borderRadius: radius.md }]}>
              <View style={styles.latestLeft}>
                <Text style={[styles.latestDate, { color: colors.textMuted }]}>
                  {fmtDate(latest.recordedAt)}
                </Text>
                <View style={styles.latestWeightRow}>
                  <Text style={[styles.latestWeight, { color: colors.text }]}>
                    {Math.round(latest.weightKg * 10) / 10} kg
                  </Text>
                  {delta !== null && (
                    <Text style={[styles.latestDelta, {
                      color: delta <= 0 ? colors.success : colors.danger,
                    }]}>
                      {fmtDelta(delta)}
                    </Text>
                  )}
                </View>
                {latest.bodyFatPct != null && (
                  <Text style={[styles.latestFat, { color: colors.textMuted }]}>
                    {Math.round(latest.bodyFatPct * 10) / 10}% masse grasse
                  </Text>
                )}
              </View>
            </View>

            {/* Mini chart */}
            {metrics.length >= 2 && (
              <View style={styles.chartWrap}>
                <MiniWeightChart
                  metrics={metrics}
                  accent={colors.accent}
                  border={colors.border}
                />
              </View>
            )}

            {/* History table — last 5 */}
            <View style={[styles.table, { borderColor: colors.border, borderRadius: radius.md }]}>
              {last5.map((m, i) => {
                const prevM = metrics[i + 1];
                const d = prevM ? m.weightKg - prevM.weightKg : null;
                return (
                  <View key={m.id} style={[styles.tableRow, {
                    borderTopColor: colors.border,
                    borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                  }]}>
                    <Text style={[styles.tableDate, { color: colors.textMuted }]}>
                      {fmtDate(m.recordedAt)}
                    </Text>
                    <Text style={[styles.tableWeight, { color: i === 0 ? colors.accent : colors.text }]}>
                      {Math.round(m.weightKg * 10) / 10} kg
                    </Text>
                    {d !== null ? (
                      <Text style={[styles.tableDelta, {
                        color: d <= 0 ? colors.success : colors.danger,
                      }]}>
                        {fmtDelta(d)}
                      </Text>
                    ) : (
                      <Text style={[styles.tableDelta, { color: colors.textMuted }]}>—</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>

      <BodyMetricModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 12, fontWeight: '800' },
  addBtn: { padding: 4 },
  empty: { paddingVertical: 12, alignItems: 'center' },
  emptyText: { fontSize: 13, textAlign: 'center' },
  latestRow: {
    padding: 12,
    gap: 4,
  },
  latestLeft: { gap: 4 },
  latestDate: { fontSize: 11 },
  latestWeightRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  latestWeight: { fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
  latestDelta: { fontSize: 14, fontWeight: '700' },
  latestFat: { fontSize: 12 },
  chartWrap: { alignItems: 'center' },
  table: { borderWidth: 1, overflow: 'hidden' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  tableDate: { flex: 1, fontSize: 12 },
  tableWeight: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'], minWidth: 64, textAlign: 'right' },
  tableDelta: { fontSize: 12, fontWeight: '600', minWidth: 56, textAlign: 'right', fontVariant: ['tabular-nums'] },
});

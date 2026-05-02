import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useDailyReadiness } from '@/hooks/useDailyReadiness';
import { useTrainingLoad } from '@/hooks/useTrainingLoad';
import ReadinessCheckIn from './ReadinessCheckIn';
import type DailyReadiness from '@/db/models/DailyReadiness';

const MONTH_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function fmtDate(d: Date): string {
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

export function readinessScore(entry: DailyReadiness): number {
  return (entry.sleepQuality + (6 - entry.soreness) + (6 - entry.stressLevel) + entry.motivation) / 4;
}

function scoreColor(score: number, colors: { success: string; warning: string; danger: string }): string {
  if (score >= 3.5) return colors.success;
  if (score >= 2.5) return colors.warning;
  return colors.danger;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ── Readiness dot-timeline ────────────────────────────────────────────────────

function ReadinessDotTimeline({ entries }: { entries: DailyReadiness[] }) {
  const { theme: { colors } } = useTheme();

  const last7 = [...entries].reverse().slice(-7);
  if (last7.length === 0) return null;

  return (
    <View style={styles.timeline}>
      {last7.map(entry => {
        const score = readinessScore(entry);
        const color = scoreColor(score, colors);
        const size = 10 + score * 4; // 14–30px based on score
        return (
          <View key={entry.id} style={styles.timelineDot}>
            <View style={[styles.dot, {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
            }]} />
            <Text style={[styles.dotLabel, { color: colors.textMuted }]}>
              {fmtDate(entry.recordedAt)}
            </Text>
            <Text style={[styles.dotScore, { color }]}>
              {Math.round(score * 10) / 10}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── A:C ratio badge ───────────────────────────────────────────────────────────

function RatioBadge({ ratio, colors }: {
  ratio: number | null;
  colors: { success: string; warning: string; danger: string; textMuted: string };
}) {
  if (ratio === null) {
    return <Text style={[styles.ratioText, { color: colors.textMuted }]}>—</Text>;
  }

  let color: string;
  if (ratio < 1.3) color = colors.success;
  else if (ratio <= 1.5) color = colors.warning;
  else color = colors.danger;

  return (
    <View style={[styles.ratioBadge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.ratioText, { color }]}>
        {Math.round(ratio * 100) / 100}
      </Text>
    </View>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

export default function ReadinessCard() {
  const { theme: { colors, radius, mode } } = useTheme();
  const isNeo = mode === 'neo';
  const entries = useDailyReadiness();
  const load = useTrainingLoad();
  const [showCheckIn, setShowCheckIn] = useState(false);

  const today = new Date();
  const todayEntry = entries.find(e => isSameDay(e.recordedAt, today));
  const todayScore = todayEntry ? readinessScore(todayEntry) : null;
  const last7 = entries.slice(0, 7);

  // Deload suggestion
  const showDeloadWarning =
    load.ratio !== null &&
    load.ratio > 1.3 &&
    todayScore !== null &&
    todayScore < 3.0;

  return (
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
          <Ionicons name="heart-outline" size={14} color={colors.accent} />
          <Text style={[styles.cardTitle, { color: colors.text, letterSpacing: isNeo ? 1.5 : 0 }]}>
            {isNeo ? 'FORME & CHARGE' : 'Forme & Charge'}
          </Text>
        </View>
        {todayEntry && todayScore !== null && (
          <View style={[styles.todayBadge, {
            backgroundColor: scoreColor(todayScore, colors) + '20',
            borderRadius: radius.sm,
          }]}>
            <Text style={[styles.todayBadgeText, { color: scoreColor(todayScore, colors) }]}>
              ✓ {Math.round(todayScore * 10) / 10} / 5
            </Text>
          </View>
        )}
      </View>

      {/* Deload warning */}
      {showDeloadWarning && (
        <View style={[styles.deloadBanner, {
          backgroundColor: colors.warning + '18',
          borderColor: colors.warning + '44',
          borderRadius: radius.sm,
        }]}>
          <Ionicons name="warning-outline" size={14} color={colors.warning} />
          <Text style={[styles.deloadText, { color: colors.warning }]}>
            Déload recommandé : ta charge est élevée et ta forme est basse
          </Text>
        </View>
      )}

      {/* Section 1 — Readiness history */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted, letterSpacing: isNeo ? 1 : 0 }]}>
          {isNeo ? 'FORME DES 7 DERNIERS JOURS' : 'Forme des 7 derniers jours'}
        </Text>

        {last7.length > 0 ? (
          <ReadinessDotTimeline entries={last7} />
        ) : (
          <View style={styles.noDataRow}>
            <Text style={[styles.noDataText, { color: colors.textMuted }]}>Aucune donnée</Text>
          </View>
        )}

        {/* Today's check-in */}
        {!todayEntry ? (
          showCheckIn ? (
            <View style={[styles.checkInWrap, { borderColor: colors.border, borderRadius: radius.md }]}>
              <ReadinessCheckIn onSaved={() => setShowCheckIn(false)} />
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.evaluateBtn, {
                backgroundColor: colors.accentDim,
                borderRadius: radius.sm,
              }]}
              onPress={() => setShowCheckIn(true)}
            >
              <Ionicons name="add-circle-outline" size={14} color={colors.accent} />
              <Text style={[styles.evaluateBtnText, { color: colors.accent }]}>
                Évaluer ma forme
              </Text>
            </TouchableOpacity>
          )
        ) : null}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Section 2 — A:C ratio */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted, letterSpacing: isNeo ? 1 : 0 }]}>
          {isNeo ? 'CHARGE AIGUË / CHRONIQUE' : 'Charge aiguë / chronique'}
        </Text>

        {load.chronicLoad === 0 && load.acuteLoad === 0 ? (
          <Text style={[styles.noDataText, { color: colors.textMuted }]}>
            Pas assez de données
          </Text>
        ) : (
          <>
            <View style={styles.loadRow}>
              <View style={styles.loadStat}>
                <Text style={[styles.loadValue, { color: colors.text }]}>
                  {load.acuteLoad}
                </Text>
                <Text style={[styles.loadLabel, { color: colors.textMuted }]}>séries / sem.</Text>
              </View>
              <View style={[styles.loadDivider, { backgroundColor: colors.border }]} />
              <View style={styles.loadStat}>
                <Text style={[styles.loadValue, { color: colors.text }]}>
                  {Math.round(load.chronicLoad * 10) / 10}
                </Text>
                <Text style={[styles.loadLabel, { color: colors.textMuted }]}>moy. 4 sem.</Text>
              </View>
              <View style={[styles.loadDivider, { backgroundColor: colors.border }]} />
              <View style={styles.loadStat}>
                <RatioBadge ratio={load.ratio} colors={colors} />
                <Text style={[styles.loadLabel, { color: colors.textMuted }]}>ratio A:C</Text>
              </View>
            </View>
            {load.ratio !== null && load.ratio >= 1.3 && (
              <Text style={[styles.ratioHint, { color: colors.textMuted }]}>
                Ratio {'>'} 1.3 = surveiller la fatigue
              </Text>
            )}
          </>
        )}
      </View>
    </View>
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
  todayBadge: { paddingHorizontal: 8, paddingVertical: 3 },
  todayBadgeText: { fontSize: 11, fontWeight: '800' },
  deloadBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    padding: 10,
  },
  deloadText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 18 },
  section: { gap: 10 },
  sectionLabel: { fontSize: 10, fontWeight: '700' },
  timeline: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  timelineDot: { alignItems: 'center', gap: 3, minWidth: 36 },
  dot: {},
  dotLabel: { fontSize: 9 },
  dotScore: { fontSize: 10, fontWeight: '800' },
  noDataRow: { paddingVertical: 4 },
  noDataText: { fontSize: 13 },
  evaluateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  evaluateBtnText: { fontSize: 13, fontWeight: '700' },
  checkInWrap: {
    borderWidth: 1,
    padding: 14,
  },
  divider: { height: StyleSheet.hairlineWidth },
  loadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  loadStat: { flex: 1, alignItems: 'center', gap: 2 },
  loadValue: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  loadLabel: { fontSize: 10, textAlign: 'center' },
  loadDivider: { width: StyleSheet.hairlineWidth, height: 36 },
  ratioBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  ratioText: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  ratioHint: { fontSize: 11 },
});

import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { VOLUME_LANDMARKS, volumeZone, type VolumeLandmark } from '@/features/stats/volumeLandmarks';
import { MUSCLE_COLORS, MUSCLE_LABELS_FR } from '@/features/stats/muscleColors';
import { useMuscleGroupStats, type MuscleGroupStats } from '@/hooks/useMuscleGroupStats';
import { useMonthlyFrequency } from '@/hooks/useMonthlyFrequency';
import BodyMapFront, { type MuscleFills } from '@/features/stats/BodyMapFront';
import BodyMapBack from '@/features/stats/BodyMapBack';

// ── Constants ─────────────────────────────────────────────────────────────────

const GROUP_ICON: Record<string, string> = {
  chest:     'fitness-outline',
  back:      'body-outline',
  shoulders: 'arrow-up-outline',
  arms:      'barbell-outline',
  core:      'ellipse-outline',
  legs:      'walk-outline',
};

const ZONE_LABEL: Record<string, string> = {
  none:      'Aucune donnée',
  below_mev: 'Sous le MEV',
  mav:       'Zone MAV — Optimal',
  above_mav: 'Volume élevé',
  mrv:       'MRV atteint',
};

const ZONE_TIP: Record<string, string> = {
  none:      'Commence à entraîner ce groupe cette semaine.',
  below_mev: 'En dessous du volume minimum efficace. Ajoute des séries.',
  mav:       'Tu es dans la zone de développement optimal. Continue !',
  above_mav: 'Volume élevé. Surveille la récupération et la fatigue.',
  mrv:       'Volume maximal récupérable atteint. Évite d\'ajouter des séries.',
};

// ── Color helpers ─────────────────────────────────────────────────────────────

function muscleColorFill(group: string, sets: number): string {
  const base = MUSCLE_COLORS[group] ?? '#888888';
  if (sets === 0) return base + '22';
  const lm = VOLUME_LANDMARKS[group];
  if (!lm) return base + '66';
  const { mev, mavHigh, mrv } = lm;
  if (sets < mev) return base + '55';
  if (sets <= mavHigh) return base + 'BB';
  if (sets < mrv) return base + 'DD';
  return base + 'FF';
}

function zoneAccent(
  zone: ReturnType<typeof volumeZone>,
  colors: { success: string; warning: string; danger: string; textMuted: string },
): string {
  switch (zone) {
    case 'mav':       return colors.success;
    case 'above_mav': return colors.warning;
    case 'mrv':       return colors.danger;
    default:          return colors.textMuted;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MiniVolumeBar({
  sets,
  landmark,
  accent,
  border,
}: {
  sets: number;
  landmark: VolumeLandmark | undefined;
  accent: string;
  border: string;
}) {
  const max = Math.max(sets, landmark?.mrv ?? sets, 1);
  const fillPct  = Math.min((sets / max) * 100, 100);
  const mevPct   = landmark && landmark.mev     > 0 ? (landmark.mev     / max) * 100 : null;
  const mavPct   = landmark && landmark.mavHigh > 0 ? (landmark.mavHigh / max) * 100 : null;
  const mrvPct   = landmark && landmark.mrv     > 0 ? (landmark.mrv     / max) * 100 : null;

  return (
    <View style={barStyles.wrap}>
      <View style={[barStyles.track, { backgroundColor: border + '40' }]}>
        <View style={[barStyles.fill, { width: `${fillPct}%` as any, backgroundColor: accent }]} />
        {mevPct !== null && (
          <View style={[barStyles.marker, { left: `${mevPct}%` as any, backgroundColor: border }]}>
            <Text style={[barStyles.markerLabel, { color: border }]}>MEV</Text>
          </View>
        )}
        {mavPct !== null && (
          <View style={[barStyles.marker, { left: `${mavPct}%` as any, backgroundColor: border }]}>
            <Text style={[barStyles.markerLabel, { color: border }]}>MAV</Text>
          </View>
        )}
        {mrvPct !== null && (
          <View style={[barStyles.marker, { left: `${mrvPct}%` as any, backgroundColor: border }]}>
            <Text style={[barStyles.markerLabel, { color: border }]}>MRV</Text>
          </View>
        )}
      </View>
      {landmark && (
        <View style={barStyles.thresholds}>
          <Text style={[barStyles.thresh, { color: border }]}>
            MEV {landmark.mev} · MAV {landmark.mavHigh} · MRV {landmark.mrv}
          </Text>
        </View>
      )}
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrap: { gap: 6 },
  track: { height: 10, borderRadius: 5, overflow: 'visible', position: 'relative' },
  fill: { height: '100%', borderRadius: 5, position: 'absolute', left: 0, top: 0, bottom: 0 },
  marker: { position: 'absolute', width: 1.5, top: 0, bottom: 0, zIndex: 2 },
  markerLabel: { position: 'absolute', bottom: 13, fontSize: 8, fontWeight: '700', width: 24, textAlign: 'center', left: -11 },
  thresholds: { alignItems: 'center' },
  thresh: { fontSize: 10 },
});

function StatItem({
  label,
  value,
  accent,
  bgColor,
  textMuted,
  radius,
}: {
  label: string; value: string; accent: string;
  bgColor: string; textMuted: string; radius: number;
}) {
  return (
    <View style={[statStyles.box, { backgroundColor: bgColor, borderRadius: radius }]}>
      <Text style={[statStyles.value, { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[statStyles.label, { color: textMuted }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, gap: 2 },
  value: { fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  label: { fontSize: 9, textAlign: 'center' },
});

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BodyMapScreen() {
  const { theme: { colors, radius, mode } } = useTheme();
  const muscleStats = useMuscleGroupStats();
  const isNeo = mode === 'neo';

  const [side, setSide] = useState<'front' | 'back'>('front');
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const frequency = useMonthlyFrequency();

  const fills: MuscleFills = {
    chest:     muscleColorFill('chest',     muscleStats.chest?.sets     ?? 0),
    back:      muscleColorFill('back',      muscleStats.back?.sets      ?? 0),
    shoulders: muscleColorFill('shoulders', muscleStats.shoulders?.sets ?? 0),
    arms:      muscleColorFill('arms',      muscleStats.arms?.sets      ?? 0),
    core:      muscleColorFill('core',      muscleStats.core?.sets      ?? 0),
    legs:      muscleColorFill('legs',      muscleStats.legs?.sets      ?? 0),
    outline:   colors.text + '18',
    neutral:   colors.border + '50',
  };

  function handleGroupPress(group: string) {
    setActiveGroup(prev => (prev === group ? null : group));
  }

  const sel = activeGroup;
  const selStats: MuscleGroupStats | null = sel ? (muscleStats[sel] ?? null) : null;
  const selSets = selStats?.sets ?? 0;
  const selZone = sel ? volumeZone(selSets, sel) : 'none';
  const selAccent = sel ? zoneAccent(selZone, colors) : colors.textMuted;
  const selLandmark = sel ? VOLUME_LANDMARKS[sel] : undefined;
  const selColor = sel ? (MUSCLE_COLORS[sel] ?? selAccent) : selAccent;

  const selFreq = sel ? (frequency as any)[sel] as [number, number, number, number] | undefined : undefined;
  const selFreqTotal = selFreq ? selFreq.reduce((a: number, b: number) => a + b, 0) : 0;
  const selFreqThisWeek = selFreq ? selFreq[3] : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.accent} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, letterSpacing: isNeo ? 2 : 0 }]}>
          {isNeo ? 'CARTE MUSCULAIRE' : 'Carte musculaire'}
        </Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Front / Back toggle */}
        <View style={[styles.toggle, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
          {(['front', 'back'] as const).map(s => {
            const active = side === s;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.toggleBtn, { borderRadius: radius.sm }, active && { backgroundColor: colors.accent }]}
                onPress={() => setSide(s)}
                activeOpacity={0.75}
              >
                <Text style={[styles.toggleLabel, { color: active ? '#fff' : colors.textMuted }]}>
                  {s === 'front' ? 'Avant' : 'Dos'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SVG avec labels */}
        <View style={styles.svgWrap}>
          {side === 'front'
            ? <BodyMapFront fills={fills} height={360} onGroupPress={handleGroupPress} activeGroup={activeGroup} showLabels />
            : <BodyMapBack  fills={fills} height={360} onGroupPress={handleGroupPress} activeGroup={activeGroup} showLabels />}
        </View>

        {!activeGroup && (
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Appuie sur un muscle ou une étiquette pour voir les stats
          </Text>
        )}

        {/* ── Carte détail ── */}
        {activeGroup && (
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: selColor + '60', borderRadius: radius.lg }]}>
            {/* Close */}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setActiveGroup(null)} hitSlop={8}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Header row */}
            <View style={styles.infoHeader}>
              <View style={[styles.infoIconWrap, { backgroundColor: selColor + '20', borderRadius: radius.sm }]}>
                <Ionicons name={GROUP_ICON[activeGroup] as any} size={22} color={selColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoName, { color: colors.text }]}>
                  {MUSCLE_LABELS_FR[activeGroup] ?? activeGroup}
                </Text>
                <View style={[styles.zoneBadge, { backgroundColor: selAccent + '20' }]}>
                  <Text style={[styles.zoneBadgeText, { color: selAccent }]}>
                    {ZONE_LABEL[selZone]}
                  </Text>
                </View>
              </View>
              <View style={styles.setsBadge}>
                <Text style={[styles.setsNum, { color: selColor }]}>{selSets}</Text>
                <Text style={[styles.setsSub, { color: colors.textMuted }]}>séries</Text>
              </View>
            </View>

            {/* Volume bar */}
            {(selSets > 0 || selLandmark) && (
              <MiniVolumeBar sets={selSets} landmark={selLandmark} accent={selAccent} border={colors.border} />
            )}

            {/* Stats grid 3×2 */}
            {selStats && selStats.sets > 0 && (
              <>
                <View style={styles.statsGrid}>
                  <StatItem
                    label="Tonnage"
                    value={`${selStats.tonnage.toLocaleString('fr-FR')} kg`}
                    accent={selColor}
                    bgColor={colors.background}
                    textMuted={colors.textMuted}
                    radius={radius.sm}
                  />
                  <StatItem
                    label="Charge max"
                    value={`${selStats.maxWeight} kg`}
                    accent={selColor}
                    bgColor={colors.background}
                    textMuted={colors.textMuted}
                    radius={radius.sm}
                  />
                  <StatItem
                    label="Charge moy."
                    value={`${selStats.avgWeight} kg`}
                    accent={selColor}
                    bgColor={colors.background}
                    textMuted={colors.textMuted}
                    radius={radius.sm}
                  />
                  <StatItem
                    label="Reps moy."
                    value={selStats.avgReps.toFixed(1)}
                    accent={selColor}
                    bgColor={colors.background}
                    textMuted={colors.textMuted}
                    radius={radius.sm}
                  />
                  <StatItem
                    label="Exercices"
                    value={`${selStats.exerciseCount}`}
                    accent={selColor}
                    bgColor={colors.background}
                    textMuted={colors.textMuted}
                    radius={radius.sm}
                  />
                  <StatItem
                    label="Séances"
                    value={`${selStats.sessionCount}`}
                    accent={selColor}
                    bgColor={colors.background}
                    textMuted={colors.textMuted}
                    radius={radius.sm}
                  />
                </View>

                {selStats.topExercise && (
                  <View style={[styles.topExRow, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
                    <Text style={[styles.topExLabel, { color: colors.textMuted }]}>Exercice principal</Text>
                    <Text style={[styles.topExValue, { color: colors.text }]} numberOfLines={1}>
                      {selStats.topExercise}
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Fréquence 4 semaines */}
            {selFreq && (
              <View style={[styles.freqRow, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
                <View style={styles.freqStat}>
                  <Text style={[styles.freqValue, { color: colors.text }]}>{selFreqThisWeek}</Text>
                  <Text style={[styles.freqLabel, { color: colors.textMuted }]}>séances / sem.</Text>
                </View>
                <View style={[styles.freqDivider, { backgroundColor: colors.border }]} />
                <View style={styles.freqStat}>
                  <Text style={[styles.freqValue, { color: colors.text }]}>{selFreqTotal}</Text>
                  <Text style={[styles.freqLabel, { color: colors.textMuted }]}>sur 4 semaines</Text>
                </View>
                {selLandmark && selSets < selLandmark.mev && selLandmark.mev > 0 && (
                  <>
                    <View style={[styles.freqDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.freqStat}>
                      <Text style={[styles.freqValue, { color: colors.warning }]}>
                        +{selLandmark.mev - selSets}
                      </Text>
                      <Text style={[styles.freqLabel, { color: colors.textMuted }]}>séries pour MEV</Text>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Conseil */}
            <Text style={[styles.tip, { color: colors.textMuted }]}>
              {ZONE_TIP[selZone]}
            </Text>
          </View>
        )}

        {/* Liste des groupes quand rien n'est sélectionné */}
        {!activeGroup && (
          <View style={styles.groupList}>
            {Object.entries(MUSCLE_LABELS_FR).map(([group, label]) => {
              const stats = muscleStats[group];
              const sets = stats?.sets ?? 0;
              const zone = volumeZone(sets, group);
              const accent = zoneAccent(zone, colors);
              const muscleColor = MUSCLE_COLORS[group] ?? accent;
              return (
                <TouchableOpacity
                  key={group}
                  style={[styles.groupRow, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}
                  onPress={() => handleGroupPress(group)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.groupDot, { backgroundColor: muscleColor }]} />
                  <Text style={[styles.groupLabel, { color: colors.text }]}>{label}</Text>
                  <View style={styles.groupRight}>
                    <Text style={[styles.groupSets, { color: muscleColor }]}>
                      {sets > 0 ? `${sets} séries` : '—'}
                    </Text>
                    {stats && stats.sets > 0 && (
                      <Text style={[styles.groupTonnage, { color: colors.textMuted }]}>
                        {stats.tonnage.toLocaleString('fr-FR')} kg
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.groupZone, { color: accent }]}>
                    {zone === 'none' ? '' : ZONE_LABEL[zone]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 34, alignItems: 'flex-start' },
  headerTitle: { fontSize: 15, fontWeight: '800' },
  content: { paddingBottom: 32, paddingHorizontal: 16, gap: 12 },
  toggle: {
    flexDirection: 'row',
    borderWidth: 1,
    padding: 4,
    gap: 4,
    alignSelf: 'center',
    marginTop: 12,
  },
  toggleBtn: { paddingHorizontal: 28, paddingVertical: 8 },
  toggleLabel: { fontSize: 13, fontWeight: '700' },
  svgWrap: { alignItems: 'center' },
  hint: { textAlign: 'center', fontSize: 12, fontStyle: 'italic' },
  infoCard: {
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
    position: 'relative',
  },
  closeBtn: { position: 'absolute', top: 12, right: 12, zIndex: 1 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIconWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  infoName: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  zoneBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  zoneBadgeText: { fontSize: 11, fontWeight: '700' },
  setsBadge: { alignItems: 'center' },
  setsNum: { fontSize: 28, fontWeight: '900', lineHeight: 32 },
  setsSub: { fontSize: 10, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  topExRow: { padding: 10, gap: 2 },
  topExLabel: { fontSize: 10, fontWeight: '600' },
  topExValue: { fontSize: 13, fontWeight: '700' },
  freqRow: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 12 },
  freqStat: { flex: 1, alignItems: 'center', gap: 2 },
  freqValue: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
  freqLabel: { fontSize: 9, textAlign: 'center' },
  freqDivider: { width: StyleSheet.hairlineWidth, height: 28 },
  tip: { fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  groupList: { gap: 6, marginTop: 4 },
  groupRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, borderWidth: 1 },
  groupDot: { width: 10, height: 10, borderRadius: 5 },
  groupLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  groupRight: { alignItems: 'flex-end', gap: 1 },
  groupSets: { fontSize: 13, fontWeight: '800' },
  groupTonnage: { fontSize: 10 },
  groupZone: { fontSize: 11, maxWidth: 90, textAlign: 'right' },
});

import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useFourWeekVolume } from '@/hooks/useFourWeekVolume';
import { FREQ_GROUPS } from '@/hooks/useMonthlyFrequency';

const GROUP_LABEL: Record<string, string> = {
  chest: 'Pecto',
  back: 'Dos',
  shoulders: 'Épaules',
  legs: 'Jambes',
  arms: 'Bras',
  core: 'Core',
};

const WEEK_LABELS = ['S-3', 'S-2', 'S-1', 'Cur.'];

function Sparkline({ values, accent, border }: { values: number[]; accent: string; border: string }) {
  const max = Math.max(...values, 1);
  return (
    <View style={spark.row}>
      {values.map((v, i) => (
        <View key={i} style={spark.barWrap}>
          <View style={[spark.bar, {
            height: Math.max(2, Math.round((v / max) * 28)),
            backgroundColor: v === 0 ? border : accent,
            opacity: v === 0 ? 0.3 : 0.5 + (i / values.length) * 0.5,
          }]} />
          {v > 0 && (
            <Text style={[spark.val, { color: accent }]}>{v}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const spark = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 36 },
  barWrap: { alignItems: 'center', gap: 2, flex: 1 },
  bar: { width: '100%', minHeight: 2, borderRadius: 2 },
  val: { fontSize: 8, fontWeight: '700', fontVariant: ['tabular-nums'] },
});

export default function FourWeekVolumeChart() {
  const { theme: { colors, radius, mode } } = useTheme();
  const data = useFourWeekVolume();
  const isNeo = mode === 'neo';

  const hasData = FREQ_GROUPS.some(g => data[g].some(v => v > 0));

  return (
    <View style={[styles.card, {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderLeftWidth: isNeo ? 2 : 0,
      borderLeftColor: colors.accent,
    }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons name="bar-chart-outline" size={14} color={colors.accent} />
          <Text style={[styles.cardTitle, { color: colors.text, letterSpacing: isNeo ? 1.5 : 0 }]}>
            {isNeo ? 'VOLUME — 4 SEMAINES' : 'Volume 4 dernières semaines'}
          </Text>
        </View>
        <Text style={[styles.cardSub, { color: colors.textMuted }]}>séries travaillées</Text>
      </View>

      {!hasData ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Complète des séances pour voir l'évolution du volume.
        </Text>
      ) : (
        <View style={styles.grid}>
          {/* Week headers */}
          <View style={styles.headerRow}>
            <View style={styles.labelCol} />
            {WEEK_LABELS.map(label => (
              <Text key={label} style={[styles.weekHeader, { color: colors.textMuted }]}>
                {label}
              </Text>
            ))}
          </View>

          {/* Group rows */}
          {FREQ_GROUPS.map(group => {
            const values = data[group];
            const total = values.reduce((a, b) => a + b, 0);
            return (
              <View key={group} style={styles.groupRow}>
                <Text style={[styles.groupLabel, { color: colors.textMuted }]}>
                  {GROUP_LABEL[group]}
                </Text>
                <View style={styles.sparkWrap}>
                  <Sparkline values={values} accent={colors.accent} border={colors.border} />
                </View>
                <Text style={[styles.total, { color: total > 0 ? colors.text : colors.textMuted }]}>
                  {total}
                </Text>
              </View>
            );
          })}
        </View>
      )}
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
  cardSub: { fontSize: 11 },
  emptyText: { fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  grid: { gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  labelCol: { width: 58 },
  weekHeader: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  groupRow: { flexDirection: 'row', alignItems: 'center' },
  groupLabel: {
    width: 58,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    paddingRight: 6,
  },
  sparkWrap: { flex: 1 },
  total: {
    width: 24,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});

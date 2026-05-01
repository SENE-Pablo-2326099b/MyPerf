import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useMonthlyFrequency, FREQ_GROUPS } from '@/hooks/useMonthlyFrequency';

const GROUP_LABEL: Record<string, string> = {
  chest: 'Pecto',
  back: 'Dos',
  shoulders: 'Épaules',
  legs: 'Jambes',
  arms: 'Bras',
  core: 'Core',
};

const WEEK_LABELS = ['S-3', 'S-2', 'S-1', 'Cur.'];

function hexAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return hex + a;
}

function FreqCell({ count, accent, border }: { count: number; accent: string; border: string }) {
  const alpha = count === 0 ? 0 : count === 1 ? 0.28 : count === 2 ? 0.58 : 1;
  const bg = count === 0 ? border : hexAlpha(accent, alpha);
  const textColor = count === 0 ? 'transparent' : count >= 2 ? '#fff' : accent;

  return (
    <View style={[styles.cell, { backgroundColor: bg }]}>
      {count > 0 && (
        <Text style={[styles.cellText, { color: textColor }]}>{count}</Text>
      )}
    </View>
  );
}

export default function FrequencyHeatmap() {
  const { theme: { colors, radius, mode } } = useTheme();
  const data = useMonthlyFrequency();
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
          <Ionicons name="calendar-outline" size={14} color={colors.accent} />
          <Text style={[styles.cardTitle, { color: colors.text, letterSpacing: isNeo ? 1.5 : 0 }]}>
            {isNeo ? 'FRÉQUENCE — 4 SEMAINES' : 'Fréquence 4 dernières semaines'}
          </Text>
        </View>
        <Text style={[styles.cardSub, { color: colors.textMuted }]}>séances/sem.</Text>
      </View>

      {!hasData ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Complète des séances pour voir ta fréquence.
        </Text>
      ) : (
        <View style={styles.grid}>
          {/* Column headers */}
          <View style={styles.row}>
            <View style={styles.labelCell} />
            {WEEK_LABELS.map(label => (
              <Text key={label} style={[styles.weekHeader, { color: colors.textMuted }]}>
                {label}
              </Text>
            ))}
          </View>

          {/* Rows */}
          {FREQ_GROUPS.map(group => (
            <View key={group} style={styles.row}>
              <Text style={[styles.groupLabel, { color: colors.textMuted }]}>
                {GROUP_LABEL[group]}
              </Text>
              {data[group].map((count, wi) => (
                <FreqCell key={wi} count={count} accent={colors.accent} border={colors.border} />
              ))}
            </View>
          ))}

          {/* Legend */}
          <View style={styles.legend}>
            <Text style={[styles.legendText, { color: colors.textMuted }]}>0</Text>
            {[0.28, 0.58, 1].map((a, i) => (
              <View
                key={i}
                style={[styles.legendDot, { backgroundColor: hexAlpha(colors.accent, a) }]}
              />
            ))}
            <Text style={[styles.legendText, { color: colors.textMuted }]}>3+</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const CELL_SIZE = 34;

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
  grid: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  labelCell: { width: 52 },
  weekHeader: {
    width: CELL_SIZE,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  groupLabel: {
    width: 52,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    justifyContent: 'flex-end',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: { fontSize: 10, fontVariant: ['tabular-nums'] },
});

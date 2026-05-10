import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { usePRs } from '@/hooks/usePRs';
import type { PR } from '@/hooks/usePRs';

const MUSCLE_FR: Record<string, string> = {
  chest: 'Pectoraux',
  back: 'Dos',
  legs: 'Jambes',
  shoulders: 'Épaules',
  arms: 'Bras',
  core: 'Abdominaux',
};

const MUSCLE_ORDER = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core'];

const MONTH_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

function fmtDate(d: Date): string {
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtWeight(w: number): string {
  return w >= 1000 ? `${(w / 1000).toFixed(1)} t` : `${Math.round(w)} kg`;
}

function PRRow({ pr }: { pr: PR }) {
  const { theme: { colors, radius } } = useTheme();
  const e1rm = Math.round(pr.maxE1RM);

  return (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      <View style={styles.rowLeft}>
        <Text style={[styles.exoName, { color: colors.text }]} numberOfLines={1}>
          {pr.exerciseName}
        </Text>
        <Text style={[styles.rowMeta, { color: colors.textMuted }]}>
          {fmtDate(pr.lastDate)} · {pr.sessionCount} séance{pr.sessionCount > 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.rowRight}>
        {/* e1RM — primary metric */}
        <View style={[styles.e1rmBadge, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30', borderRadius: radius.sm }]}>
          <Ionicons name="trending-up-outline" size={11} color={colors.accent} />
          <Text style={[styles.e1rmText, { color: colors.accent }]}>{e1rm} kg</Text>
          <Text style={[styles.e1rmLabel, { color: colors.accent + '90' }]}>e1RM</Text>
        </View>
        {/* Max weight — secondary */}
        <Text style={[styles.maxWeight, { color: colors.textMuted }]}>
          {fmtWeight(pr.maxWeight)} max
        </Text>
      </View>
    </View>
  );
}

function MuscleSection({ muscle, prs }: { muscle: string; prs: PR[] }) {
  const { theme: { colors } } = useTheme();
  const label = MUSCLE_FR[muscle] ?? muscle;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>
      {prs.map(pr => <PRRow key={pr.exerciseId} pr={pr} />)}
    </View>
  );
}

export default function PRList() {
  const { theme: { colors, radius, mode } } = useTheme();
  const prs = usePRs();
  const isNeo = mode === 'neo';

  const grouped = useMemo(() => {
    const map: Record<string, PR[]> = {};
    for (const pr of prs) {
      const g = pr.muscleGroup ?? 'other';
      if (!map[g]) map[g] = [];
      map[g].push(pr);
    }
    // Sort groups by MUSCLE_ORDER, others at end
    return Object.entries(map).sort(([a], [b]) => {
      const ia = MUSCLE_ORDER.indexOf(a);
      const ib = MUSCLE_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [prs]);

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
          <Ionicons name="trophy-outline" size={14} color={colors.accent} />
          <Text style={[styles.cardTitle, { color: colors.text, letterSpacing: isNeo ? 1.5 : 0 }]}>
            {isNeo ? 'RECORDS PERSONNELS' : 'Records personnels'}
          </Text>
        </View>
        {prs.length > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.accent + '20' }]}>
            <Text style={[styles.badgeTxt, { color: colors.accent }]}>{prs.length}</Text>
          </View>
        )}
      </View>

      {prs.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Complète des séances pour voir tes records
        </Text>
      ) : (
        <View style={styles.groupsWrap}>
          {grouped.map(([muscle, list]) => (
            <MuscleSection key={muscle} muscle={muscle} prs={list} />
          ))}
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
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeTxt: { fontSize: 11, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center', paddingVertical: 8 },

  groupsWrap: { gap: 16 },
  section: { gap: 0 },
  sectionTitle: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  rowLeft: { flex: 1, gap: 2 },
  exoName: { fontSize: 13, fontWeight: '600' },
  rowMeta: { fontSize: 10 },

  rowRight: { alignItems: 'flex-end', gap: 3 },
  e1rmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  e1rmText: { fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  e1rmLabel: { fontSize: 9, fontWeight: '700' },
  maxWeight: { fontSize: 10, fontVariant: ['tabular-nums'] },
});

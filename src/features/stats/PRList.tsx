import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { usePRs } from '@/hooks/usePRs';
import type { PR } from '@/hooks/usePRs';

function PRRow({ pr }: { pr: PR }) {
  const { theme: { colors } } = useTheme();

  return (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      <Text style={[styles.exoName, { color: colors.text }]} numberOfLines={1}>
        {pr.exerciseName}
      </Text>
      <View style={styles.chips}>
        <View style={[styles.chip, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}>
          <Ionicons name="barbell-outline" size={10} color={colors.accent} />
          <Text style={[styles.chipTxt, { color: colors.accent }]}>
            {pr.maxWeight >= 1000
              ? `${(pr.maxWeight / 1000).toFixed(1)} t`
              : `${Math.round(pr.maxWeight)} kg`}
          </Text>
        </View>
        <View style={[styles.chip, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
          <Ionicons name="trending-up-outline" size={10} color={colors.success} />
          <Text style={[styles.chipTxt, { color: colors.success }]}>
            {Math.round(pr.maxE1RM)} kg
          </Text>
        </View>
        <Text style={[styles.count, { color: colors.textMuted }]}>
          {pr.sessionCount} séance{pr.sessionCount > 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );
}

export default function PRList() {
  const { theme: { colors, radius, mode } } = useTheme();
  const prs = usePRs();
  const isNeo = mode === 'neo';

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
        <FlatList
          data={prs}
          keyExtractor={item => item.exerciseId}
          renderItem={({ item }) => <PRRow pr={item} />}
          scrollEnabled={false}
        />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  exoName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  chipTxt: { fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  count: { fontSize: 11, fontVariant: ['tabular-nums'] },
});

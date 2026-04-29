import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useSessions } from '@/hooks/useSessions';
import { useWeeklyVolume } from '@/hooks/useWeeklyVolume';
import SessionCard from '@/features/history/SessionCard';
import BodyMap from '@/features/stats/BodyMap';

const GROUP_FR: Record<string, string> = {
  chest: 'Pecto',
  back: 'Dos',
  legs: 'Jambes',
  shoulders: 'Épaules',
  arms: 'Bras',
  core: 'Core',
};

const GROUP_ORDER = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core'];

function VolumeBar({ label, sets, max, accent }: { label: string; sets: number; max: number; accent: string }) {
  const { theme: { colors, radius } } = useTheme();
  const pct = max > 0 ? Math.min(sets / max, 1) : 0;
  const barColor = sets >= 10 ? colors.danger : sets >= 5 ? colors.warning : accent;

  return (
    <View style={styles.barRow}>
      <Text style={[styles.barLabel, { color: colors.textMuted }]}>{label}</Text>
      <View style={[styles.barTrack, { backgroundColor: colors.border, borderRadius: radius.sm }]}>
        <View style={[styles.barFill, {
          width: `${pct * 100}%`,
          backgroundColor: barColor,
          borderRadius: radius.sm,
          shadowColor: barColor,
          shadowOpacity: 0.5,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 0 },
        }]} />
      </View>
      <Text style={[styles.barCount, { color: sets > 0 ? colors.text : colors.textMuted }]}>
        {sets}
      </Text>
    </View>
  );
}

function WeeklyVolume() {
  const { theme: { colors, radius, mode } } = useTheme();
  const volume = useWeeklyVolume();
  const isNeo = mode === 'neo';
  const hasData = Object.values(volume).some(v => v > 0);
  const maxSets = Math.max(...GROUP_ORDER.map(g => volume[g] ?? 0), 1);

  return (
    <View style={[styles.volumeCard, {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderLeftWidth: isNeo ? 2 : 0,
      borderLeftColor: colors.accent,
    }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons name="stats-chart" size={14} color={colors.accent} />
          <Text style={[styles.cardTitle, { color: colors.text, letterSpacing: isNeo ? 1.5 : 0 }]}>
            {isNeo ? 'VOLUME — 7 JOURS' : 'Volume 7 derniers jours'}
          </Text>
        </View>
        <Text style={[styles.cardSub, { color: colors.textMuted }]}>séries travaillées</Text>
      </View>

      {hasData ? (
        <>
          <View style={styles.barsContainer}>
            {GROUP_ORDER.map(group => (
              <VolumeBar
                key={group}
                label={GROUP_FR[group] ?? group}
                sets={volume[group] ?? 0}
                max={maxSets}
                accent={colors.accent}
              />
            ))}
          </View>
          <BodyMap />
        </>
      ) : (
        <View style={styles.emptyVolume}>
          <Text style={[styles.emptyVolumeText, { color: colors.textMuted }]}>
            Complète des séances pour voir ton volume hebdomadaire.
          </Text>
        </View>
      )}
    </View>
  );
}

export default function HistoryScreen() {
  const { theme: { colors } } = useTheme();
  const sessions = useSessions();

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={sessions}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <SessionCard session={item} />}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<WeeklyVolume />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={48} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune séance terminée</Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>
            Tes séances apparaîtront ici une fois terminées.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  volumeCard: {
    margin: 16,
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
  barsContainer: { gap: 10 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 52, fontSize: 11, fontWeight: '600', textAlign: 'right' },
  barTrack: { flex: 1, height: 6, overflow: 'hidden' },
  barFill: { height: '100%' },
  barCount: { width: 22, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'], textAlign: 'right' },
  emptyVolume: { paddingVertical: 16, alignItems: 'center' },
  emptyVolumeText: { fontSize: 13, textAlign: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});

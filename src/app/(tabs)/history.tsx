import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { useSessions } from '@/hooks/useSessions';
import { useWeeklyVolume } from '@/hooks/useWeeklyVolume';
import SessionCard from '@/features/history/SessionCard';
import BodyMap from '@/features/stats/BodyMap';
import FrequencyHeatmap from '@/features/stats/FrequencyHeatmap';
import PRList from '@/features/stats/PRList';
import ReadinessCard from '@/features/readiness/ReadinessCard';
import { VOLUME_LANDMARKS, volumeZone } from '@/features/stats/volumeLandmarks';

const GROUP_FR: Record<string, string> = {
  chest: 'Pecto',
  back: 'Dos',
  legs: 'Jambes',
  shoulders: 'Épaules',
  arms: 'Bras',
  core: 'Core',
};

const GROUP_ORDER = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core'];

function VolumeBar({ label, sets, group }: { label: string; sets: number; group: string }) {
  const { theme: { colors, radius } } = useTheme();
  const landmark = VOLUME_LANDMARKS[group];
  const scale = Math.max(sets, landmark?.mrv ?? sets, 1);
  const pct = sets / scale;
  const zone = volumeZone(sets, group);

  let barColor: string;
  switch (zone) {
    case 'mav':      barColor = colors.success;  break;
    case 'above_mav': barColor = colors.warning; break;
    case 'mrv':      barColor = colors.danger;   break;
    default:         barColor = colors.textMuted; break;
  }

  const mevPct  = landmark && landmark.mev > 0    ? (landmark.mev     / scale) * 100 : null;
  const mavPct  = landmark && landmark.mavHigh > 0 ? (landmark.mavHigh / scale) * 100 : null;

  return (
    <View style={styles.barRow}>
      <Text style={[styles.barLabel, { color: colors.textMuted }]}>{label}</Text>
      <View style={[styles.barTrack, { backgroundColor: colors.border, borderRadius: radius.sm }]}>
        {mevPct !== null && (
          <View style={[styles.barMarker, { left: `${mevPct}%` as any, backgroundColor: colors.textMuted + '70' }]} />
        )}
        {mavPct !== null && (
          <View style={[styles.barMarker, { left: `${mavPct}%` as any, backgroundColor: colors.textMuted + '50' }]} />
        )}
        <View style={[styles.barFill, {
          width: `${pct * 100}%`,
          backgroundColor: barColor,
          borderRadius: radius.sm,
          shadowColor: barColor,
          shadowOpacity: sets > 0 ? 0.45 : 0,
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

function VolumeLegend() {
  const { theme: { colors } } = useTheme();
  const items: Array<{ color: string; label: string }> = [
    { color: colors.textMuted, label: 'Sous MEV' },
    { color: colors.success,   label: 'MAV optimal' },
    { color: colors.warning,   label: 'Élevé' },
    { color: colors.danger,    label: 'MRV dépassé' },
  ];
  return (
    <View style={styles.legend}>
      {items.map(({ color, label }) => (
        <View key={label} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: color }]} />
          <Text style={[styles.legendLabel, { color: colors.textMuted }]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function WeeklyVolume() {
  const { theme: { colors, radius, mode } } = useTheme();
  const volume = useWeeklyVolume();
  const isNeo = mode === 'neo';
  const hasData = Object.values(volume).some(v => v > 0);

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
                group={group}
              />
            ))}
          </View>
          <VolumeLegend />
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
  const { theme: { colors, radius } } = useTheme();
  const sessions = useSessions();
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? sessions.filter(s => {
        const q = search.toLowerCase();
        return (s.name ?? '').toLowerCase().includes(q)
            || (s.notes ?? '').toLowerCase().includes(q);
      })
    : sessions;

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={filtered}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <SessionCard session={item} />}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      ListHeaderComponent={
        <>
          <WeeklyVolume />
          <TouchableOpacity
            style={[styles.navCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}
            onPress={() => router.push('/body')}
            activeOpacity={0.75}
          >
            <Ionicons name="body-outline" size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[{ color: colors.text, fontSize: 14, fontWeight: '700' }]}>Corps & Mensurations</Text>
              <Text style={[{ color: colors.textMuted, fontSize: 12, marginTop: 2 }]}>Poids, % grasse, mensurations</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <ReadinessCard />
          <PRList />
          <FrequencyHeatmap />

          {/* Recherche */}
          <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
            <Ionicons name="search-outline" size={16} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher une séance…"
              placeholderTextColor={colors.textMuted}
              clearButtonMode="while-editing"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {search.length > 0 && (
            <Text style={[styles.searchCount, { color: colors.textMuted }]}>
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
            </Text>
          )}
        </>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons
            name={search ? 'search-outline' : 'time-outline'}
            size={48}
            color={colors.border}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {search ? 'Aucun résultat' : 'Aucune séance terminée'}
          </Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>
            {search
              ? `Aucune séance ne correspond à "${search}".`
              : 'Tes séances apparaîtront ici une fois terminées.'}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  navCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 8, padding: 14, borderWidth: 1 },
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
  barTrack: { flex: 1, height: 7, overflow: 'hidden', position: 'relative' },
  barFill: { height: '100%', position: 'absolute', left: 0, top: 0, bottom: 0 },
  barMarker: { position: 'absolute', width: 1.5, top: 0, bottom: 0, zIndex: 2 },
  barCount: { width: 22, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'], textAlign: 'right' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 10 },
  emptyVolume: { paddingVertical: 16, alignItems: 'center' },
  emptyVolumeText: { fontSize: 13, textAlign: 'center' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  searchCount: { fontSize: 12, paddingHorizontal: 20, marginBottom: 8 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});

import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useWeeklyVolume } from '@/hooks/useWeeklyVolume';
import { VOLUME_LANDMARKS } from './volumeLandmarks';
import { MUSCLE_COLORS, MUSCLE_LABELS_FR } from './muscleColors';
import BodyMapFront, { type MuscleFills } from './BodyMapFront';
import BodyMapBack from './BodyMapBack';

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

export default function BodyMap() {
  const { theme: { colors, radius, mode } } = useTheme();
  const volume = useWeeklyVolume();
  const [side, setSide] = useState<'front' | 'back'>('front');
  const isNeo = mode === 'neo';

  const fills: MuscleFills = {
    chest:     muscleColorFill('chest',     volume.chest     ?? 0),
    back:      muscleColorFill('back',      volume.back      ?? 0),
    shoulders: muscleColorFill('shoulders', volume.shoulders ?? 0),
    arms:      muscleColorFill('arms',      volume.arms      ?? 0),
    core:      muscleColorFill('core',      volume.core      ?? 0),
    legs:      muscleColorFill('legs',      volume.legs      ?? 0),
    outline:   colors.text + '18',
    neutral:   colors.border + '50',
  };

  return (
    <View style={styles.root}>
      <View style={[styles.toggle, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radius.sm }]}>
        {(['front', 'back'] as const).map(s => {
          const active = side === s;
          return (
            <TouchableOpacity
              key={s}
              style={[
                styles.toggleBtn,
                { borderRadius: radius.sm - 2 },
                active && { backgroundColor: colors.surface, borderColor: colors.accent },
              ]}
              onPress={() => setSide(s)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.toggleLabel,
                { color: active ? colors.accent : colors.textMuted,
                  letterSpacing: isNeo ? 1.2 : 0 },
              ]}>
                {isNeo
                  ? (s === 'front' ? 'AVANT' : 'DOS')
                  : (s === 'front' ? 'Avant' : 'Dos')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.svgWrap}>
        {side === 'front'
          ? <BodyMapFront fills={fills} height={280} />
          : <BodyMapBack  fills={fills} height={280} />}
      </View>

      {/* Légende par muscle */}
      <View style={styles.legend}>
        {Object.entries(MUSCLE_LABELS_FR).map(([group, label]) => (
          <View key={group} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: MUSCLE_COLORS[group] }]} />
            <Text style={[styles.legendLabel, { color: colors.textMuted }]}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10, alignItems: 'center' },
  toggle: {
    flexDirection: 'row',
    borderWidth: 1,
    padding: 3,
    gap: 3,
    alignSelf: 'center',
  },
  toggleBtn: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleLabel: { fontSize: 12, fontWeight: '700' },
  svgWrap: { alignItems: 'center' },
  legend: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 10 },
});

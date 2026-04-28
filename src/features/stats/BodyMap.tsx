import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core';

const GROUP_TO_PATHS: Record<string, string[]> = {
  chest:     ['chest_l', 'chest_r'],
  back:      ['lat_l', 'lat_r', 'trap_l', 'trap_r', 'lower_back'],
  shoulders: ['front_delt_l', 'front_delt_r', 'rear_delt_l', 'rear_delt_r'],
  arms:      ['bicep_l', 'bicep_r', 'forearm_fl', 'forearm_fr', 'tricep_l', 'tricep_r', 'forearm_bl', 'forearm_br'],
  legs:      ['quad_l', 'quad_r', 'hamstring_l', 'hamstring_r', 'glute_l', 'glute_r', 'calf_fl', 'calf_fr', 'calf_bl', 'calf_br'],
  core:      ['abs', 'oblique_l', 'oblique_r'],
};

export const MUSCLE_PATH_IDS = Object.values(GROUP_TO_PATHS).flat();

export function volumeColor(sets: number): string {
  if (sets <= 0) return 'transparent';
  if (sets < 5)  return '#60A5FA77';
  if (sets < 10) return '#F59E0BAA';
  if (sets < 16) return '#EF4444BB';
  return '#991B1BCC';
}

export function muscleGroupToFills(
  volumeData: Partial<Record<string, number>>,
): Record<string, string> {
  const fills: Record<string, string> = {};
  for (const [group, sets] of Object.entries(volumeData)) {
    const color = volumeColor(sets ?? 0);
    for (const id of GROUP_TO_PATHS[group] ?? []) {
      fills[id] = color;
    }
  }
  return fills;
}

interface Props {
  data?: Record<string, string>;
  width?: number;
}

export default function BodyMap({ width }: Props) {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { width: width ?? 180, borderColor: theme.colors.border }]}>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>Carte musculaire</Text>
      <Text style={[styles.sub, { color: theme.colors.textMuted }]}>À venir</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 120,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: { fontSize: 14, fontWeight: '500' },
  sub:   { fontSize: 12 },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { useWeeklyVolume } from '@/hooks/useWeeklyVolume';

// ── Coordinate system: viewBox "0 0 100 270" per panel ───────────────────────
// Head: cx=50 cy=13 rx=12 ry=13
// Shoulders: x=16–84 at y=38
// Waist: x=28–72 at y=100
// Crotch: y=130
// Knees: y=195  Ankles: y=252

// ── Base silhouette parts (shared front / back) ───────────────────────────────

const NECK = 'M43,26 L57,26 L57,38 L43,38 Z';
// Torso with slight V-crotch indent for leg separation
const TORSO = 'M16,38 L84,38 L78,100 L74,122 L76,130 L52,130 L50,134 L48,130 L24,130 L26,122 L22,100 Z';
const ARM_L = 'M5,44 L17,44 L15,150 L3,148 Z';
const ARM_R = 'M95,44 L83,44 L85,150 L97,148 Z';
const LEG_L = 'M22,130 L48,130 L44,196 L42,252 L20,252 L16,196 Z';
const LEG_R = 'M78,130 L52,130 L56,196 L58,252 L80,252 L84,196 Z';

// ── Front muscle paths ────────────────────────────────────────────────────────

const F: Record<string, string> = {
  chest_l:   'M16,38 L43,38 L43,70 L24,74 L16,60 Z',
  chest_r:   'M84,38 L57,38 L57,70 L76,74 L84,60 Z',
  trap_f:    'M36,36 L43,38 L50,46 L57,38 L64,36 L58,32 L50,30 L42,32 Z',
  sho_fl:    'M5,44 L16,38 L24,50 L14,66 L5,62 Z',
  sho_fr:    'M95,44 L84,38 L76,50 L86,66 L95,62 Z',
  bicep_l:   'M5,62 L14,66 L12,100 L3,98 Z',
  bicep_r:   'M95,62 L86,66 L88,100 L97,98 Z',
  fore_fl:   'M3,98 L12,100 L10,148 L1,146 Z',
  fore_fr:   'M97,98 L88,100 L90,148 L99,146 Z',
  abs:       'M24,74 L76,74 L78,114 L50,120 L22,114 Z',
  obliq_l:   'M16,60 L24,74 L22,114 L14,106 Z',
  obliq_r:   'M84,60 L76,74 L78,114 L86,106 Z',
  quad_l:    'M22,130 L46,130 L42,196 L16,196 Z',
  quad_r:    'M78,130 L54,130 L58,196 L84,196 Z',
  calf_fl:   'M16,196 L42,196 L40,252 L18,252 Z',
  calf_fr:   'M84,196 L58,196 L60,252 L82,252 Z',
};

// ── Back muscle paths ─────────────────────────────────────────────────────────

const B: Record<string, string> = {
  trap_b:    'M16,38 L84,38 L80,66 L50,70 L20,66 Z',
  rdelt_l:   'M5,44 L16,38 L20,66 L10,62 L5,52 Z',
  rdelt_r:   'M95,44 L84,38 L80,66 L90,62 L95,52 Z',
  lat_l:     'M16,66 L44,66 L44,110 L26,122 L14,102 Z',
  lat_r:     'M84,66 L56,66 L56,110 L74,122 L86,102 Z',
  midback:   'M28,66 L44,66 L44,90 L56,90 L56,66 L72,66 L70,108 L50,112 L30,108 Z',
  loback:    'M34,108 L66,108 L64,130 L36,130 Z',
  tri_l:     'M5,52 L10,62 L10,100 L2,98 Z',
  tri_r:     'M95,52 L90,62 L90,100 L98,98 Z',
  fore_bl:   'M2,98 L10,100 L8,148 L0,146 Z',
  fore_br:   'M98,98 L90,100 L92,148 L100,146 Z',
  glutes:    'M22,130 L78,130 L80,174 L20,174 Z',
  ham_l:     'M16,174 L44,174 L42,196 L40,252 L18,252 Z',
  ham_r:     'M84,174 L56,174 L58,196 L60,252 L82,252 Z',
  calf_bl:   'M16,196 L42,196 L40,252 L18,252 Z',
  calf_br:   'M84,196 L58,196 L60,252 L82,252 Z',
};

// ── Group → region keys ───────────────────────────────────────────────────────

const FRONT_GROUPS: Record<string, string[]> = {
  chest:     ['chest_l', 'chest_r'],
  back:      ['trap_f'],
  shoulders: ['sho_fl', 'sho_fr'],
  arms:      ['bicep_l', 'bicep_r', 'fore_fl', 'fore_fr'],
  core:      ['abs', 'obliq_l', 'obliq_r'],
  legs:      ['quad_l', 'quad_r', 'calf_fl', 'calf_fr'],
};

const BACK_GROUPS: Record<string, string[]> = {
  back:      ['trap_b', 'lat_l', 'lat_r', 'midback', 'loback'],
  shoulders: ['rdelt_l', 'rdelt_r'],
  arms:      ['tri_l', 'tri_r', 'fore_bl', 'fore_br'],
  core:      ['loback'],
  legs:      ['glutes', 'ham_l', 'ham_r', 'calf_bl', 'calf_br'],
};

// ── Color helpers ─────────────────────────────────────────────────────────────

function regionStyle(
  sets: number,
  accent: string,
  border: string,
): { fill: string; opacity: number } {
  if (sets === 0) return { fill: border, opacity: 0.18 };
  if (sets <= 4) return { fill: accent, opacity: 0.40 };
  if (sets <= 9) return { fill: accent, opacity: 0.65 };
  if (sets <= 14) return { fill: accent, opacity: 0.85 };
  return { fill: accent, opacity: 1 };
}

// ── Body panel ────────────────────────────────────────────────────────────────

function BodyPanel({
  label,
  regions,
  groups,
  volume,
  accent,
  border,
  surface,
}: {
  label: string;
  regions: Record<string, string>;
  groups: Record<string, string[]>;
  volume: Record<string, number>;
  accent: string;
  border: string;
  surface: string;
}) {
  const { theme: { colors, mode } } = useTheme();
  const isNeo = mode === 'neo';

  // Region key → { fill, opacity } (take max opacity on collision)
  const colorMap: Record<string, { fill: string; opacity: number }> = {};
  for (const [group, keys] of Object.entries(groups)) {
    const sets = volume[group] ?? 0;
    const style = regionStyle(sets, accent, border);
    for (const key of keys) {
      const existing = colorMap[key];
      if (!existing || style.opacity > existing.opacity) {
        colorMap[key] = style;
      }
    }
  }

  const silhouetteFill = surface;
  const silhouetteStroke = border;
  const sw = '0.6'; // strokeWidth

  return (
    <View style={panelStyles.wrap}>
      <Text style={[panelStyles.label, { color: colors.textMuted, letterSpacing: isNeo ? 1.5 : 0 }]}>
        {isNeo ? label.toUpperCase() : label}
      </Text>
      <Svg viewBox="0 0 100 270" width="100%" style={panelStyles.svg}>
        {/* Silhouette base */}
        <Ellipse cx="50" cy="13" rx="12" ry="13" fill={silhouetteFill} stroke={silhouetteStroke} strokeWidth={sw} />
        <Path d={NECK} fill={silhouetteFill} stroke={silhouetteStroke} strokeWidth={sw} />
        <Path d={TORSO} fill={silhouetteFill} stroke={silhouetteStroke} strokeWidth={sw} />
        <Path d={ARM_L} fill={silhouetteFill} stroke={silhouetteStroke} strokeWidth={sw} />
        <Path d={ARM_R} fill={silhouetteFill} stroke={silhouetteStroke} strokeWidth={sw} />
        <Path d={LEG_L} fill={silhouetteFill} stroke={silhouetteStroke} strokeWidth={sw} />
        <Path d={LEG_R} fill={silhouetteFill} stroke={silhouetteStroke} strokeWidth={sw} />

        {/* Muscle overlays */}
        {Object.entries(regions).map(([key, path]) => {
          const s = colorMap[key] ?? { fill: border, opacity: 0.15 };
          return <Path key={key} d={path} fill={s.fill} opacity={s.opacity} />;
        })}

        {/* Outline on top to keep silhouette edges crisp */}
        <Ellipse cx="50" cy="13" rx="12" ry="13" fill="none" stroke={silhouetteStroke} strokeWidth={sw} />
        <Path d={TORSO} fill="none" stroke={silhouetteStroke} strokeWidth={sw} />
        <Path d={ARM_L} fill="none" stroke={silhouetteStroke} strokeWidth={sw} />
        <Path d={ARM_R} fill="none" stroke={silhouetteStroke} strokeWidth={sw} />
        <Path d={LEG_L} fill="none" stroke={silhouetteStroke} strokeWidth={sw} />
        <Path d={LEG_R} fill="none" stroke={silhouetteStroke} strokeWidth={sw} />
      </Svg>
    </View>
  );
}

const panelStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: 10, fontWeight: '700' },
  svg: { aspectRatio: 100 / 270 },
});

// ── Scale legend ──────────────────────────────────────────────────────────────

function ScaleLegend({ accent, border }: { accent: string; border: string }) {
  const { theme: { colors } } = useTheme();
  const steps = [
    { label: '0', fill: border, opacity: 0.18 },
    { label: '1–4', fill: accent, opacity: 0.40 },
    { label: '5–9', fill: accent, opacity: 0.65 },
    { label: '10–14', fill: accent, opacity: 0.85 },
    { label: '15+', fill: accent, opacity: 1 },
  ];

  return (
    <View style={legendStyles.row}>
      {steps.map(s => (
        <View key={s.label} style={legendStyles.item}>
          <View style={[legendStyles.swatch, {
            backgroundColor: s.fill,
            opacity: s.opacity,
            borderColor: border,
          }]} />
          <Text style={[legendStyles.text, { color: colors.textMuted }]}>{s.label}</Text>
        </View>
      ))}
      <Text style={[legendStyles.unit, { color: colors.textMuted }]}>séries</Text>
    </View>
  );
}

const legendStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  swatch: { width: 10, height: 10, borderRadius: 2, borderWidth: 0.5 },
  text: { fontSize: 10 },
  unit: { fontSize: 10, fontStyle: 'italic' },
});

// ── Main export ───────────────────────────────────────────────────────────────

export default function BodyMap() {
  const { theme: { colors } } = useTheme();
  const volume = useWeeklyVolume();

  return (
    <View style={styles.root}>
      <View style={styles.panels}>
        <BodyPanel
          label="Avant"
          regions={F}
          groups={FRONT_GROUPS}
          volume={volume}
          accent={colors.accent}
          border={colors.border}
          surface={colors.surface}
        />
        <BodyPanel
          label="Dos"
          regions={B}
          groups={BACK_GROUPS}
          volume={volume}
          accent={colors.accent}
          border={colors.border}
          surface={colors.surface}
        />
      </View>
      <ScaleLegend accent={colors.accent} border={colors.border} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  panels: { flexDirection: 'row', gap: 8 },
});

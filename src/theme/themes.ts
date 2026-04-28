export type ThemeMode = 'light' | 'dark' | 'oled' | 'neo';
export type ThemeSetting = ThemeMode | 'system';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  textMuted: string;
  accent: string;
  accentDim: string;
  border: string;
  borderAccent: string;
  danger: string;
  success: string;
  warning: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  radius: { sm: number; md: number; lg: number };
}

const light: ThemeColors = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  text: '#111111',
  textMuted: '#6B7280',
  accent: '#3B82F6',
  accentDim: '#DBEAFE',
  border: '#E5E7EB',
  borderAccent: '#3B82F6',
  danger: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
};

const dark: ThemeColors = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceRaised: '#252525',
  text: '#EFEFEF',
  textMuted: '#9CA3AF',
  accent: '#60A5FA',
  accentDim: '#1E3A5F',
  border: '#374151',
  borderAccent: '#60A5FA',
  danger: '#F87171',
  success: '#4ADE80',
  warning: '#FBBF24',
};

const oled: ThemeColors = {
  background: '#000000',
  surface: '#0D0D0D',
  surfaceRaised: '#141414',
  text: '#FFFFFF',
  textMuted: '#9CA3AF',
  accent: '#60A5FA',
  accentDim: '#0F1F3D',
  border: '#1F1F1F',
  borderAccent: '#60A5FA',
  danger: '#F87171',
  success: '#4ADE80',
  warning: '#FBBF24',
};

// ── Néo-futuriste : bleu-noir profond, cyan électrique ──────────────────────
const neo: ThemeColors = {
  background: '#06080F',
  surface: '#0C1120',
  surfaceRaised: '#111928',
  text: '#C8DCFF',
  textMuted: '#3A567A',
  accent: '#00C6FF',
  accentDim: '#002233',
  border: '#1A2E48',
  borderAccent: '#00C6FF',
  danger: '#FF4569',
  success: '#00E676',
  warning: '#FFB300',
};

export const themes: Record<ThemeMode, Theme> = {
  light: { mode: 'light', colors: light, isDark: false, radius: { sm: 8, md: 12, lg: 16 } },
  dark:  { mode: 'dark',  colors: dark,  isDark: true,  radius: { sm: 8, md: 12, lg: 16 } },
  oled:  { mode: 'oled',  colors: oled,  isDark: true,  radius: { sm: 8, md: 12, lg: 16 } },
  neo:   { mode: 'neo',   colors: neo,   isDark: true,  radius: { sm: 4, md: 8,  lg: 12 } },
};

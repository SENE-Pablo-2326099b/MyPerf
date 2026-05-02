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
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceRaised: '#FAFAFA',
  text: '#0A0A0A',
  textMuted: '#6B7280',
  accent: '#2563EB',
  accentDim: '#EFF6FF',
  border: '#E4E6EA',
  borderAccent: '#2563EB',
  danger: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
};

const dark: ThemeColors = {
  background: '#0F0F0F',
  surface: '#1C1C1E',
  surfaceRaised: '#2C2C2E',
  text: '#F2F2F7',
  textMuted: '#8E8E93',
  accent: '#0A84FF',
  accentDim: '#0A2444',
  border: '#38383A',
  borderAccent: '#0A84FF',
  danger: '#FF453A',
  success: '#30D158',
  warning: '#FFD60A',
};

const oled: ThemeColors = {
  background: '#000000',
  surface: '#111111',
  surfaceRaised: '#1C1C1E',
  text: '#FFFFFF',
  textMuted: '#8E8E93',
  accent: '#0A84FF',
  accentDim: '#041422',
  border: '#2C2C2E',
  borderAccent: '#0A84FF',
  danger: '#FF453A',
  success: '#30D158',
  warning: '#FFD60A',
};

// ── Néo-futuriste : bleu-noir profond, cyan électrique ──────────────────────
const neo: ThemeColors = {
  background: '#040810',
  surface: '#080E1C',
  surfaceRaised: '#0D1526',
  text: '#C8DCFF',
  textMuted: '#4A6A90',
  accent: '#00D4FF',
  accentDim: '#001E2E',
  border: '#1A3050',
  borderAccent: '#00D4FF',
  danger: '#FF4466',
  success: '#00E676',
  warning: '#FFAA00',
};

export const themes: Record<ThemeMode, Theme> = {
  light: { mode: 'light', colors: light, isDark: false, radius: { sm: 8, md: 12, lg: 16 } },
  dark:  { mode: 'dark',  colors: dark,  isDark: true,  radius: { sm: 8, md: 12, lg: 16 } },
  oled:  { mode: 'oled',  colors: oled,  isDark: true,  radius: { sm: 8, md: 12, lg: 16 } },
  neo:   { mode: 'neo',   colors: neo,   isDark: true,  radius: { sm: 4, md: 8,  lg: 12 } },
};

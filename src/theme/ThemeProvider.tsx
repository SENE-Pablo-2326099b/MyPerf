import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { themes, type Theme, type ThemeMode, type ThemeSetting } from './themes';

const themeFile = new File(Paths.document, 'theme-setting.json');

async function loadPersistedTheme(): Promise<ThemeSetting> {
  try {
    if (themeFile.exists) {
      const raw = await themeFile.text();
      const { setting } = JSON.parse(raw) as { setting: ThemeSetting };
      return setting;
    }
  } catch {}
  return 'neo';
}

function persistTheme(setting: ThemeSetting): void {
  try {
    themeFile.write(JSON.stringify({ setting }));
  } catch {}
}

interface ThemeContextValue {
  theme: Theme;
  themeSetting: ThemeSetting;
  setThemeSetting: (setting: ThemeSetting) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeSetting, setThemeSettingState] = useState<ThemeSetting>('neo');

  useEffect(() => {
    loadPersistedTheme().then(setThemeSettingState);
  }, []);

  const setThemeSetting = useCallback((setting: ThemeSetting) => {
    setThemeSettingState(setting);
    persistTheme(setting);
  }, []);

  const theme = useMemo((): Theme => {
    const mode: ThemeMode =
      themeSetting === 'system'
        ? systemScheme === 'dark' ? 'dark' : 'light'
        : themeSetting;
    return themes[mode];
  }, [themeSetting, systemScheme]);

  const value = useMemo(
    () => ({ theme, themeSetting, setThemeSetting }),
    [theme, themeSetting, setThemeSetting],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

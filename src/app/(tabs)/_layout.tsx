import { Tabs } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import CustomTabBar from '@/components/CustomTabBar';

export default function TabsLayout() {
  const { theme: { colors, mode } } = useTheme();
  const isNeo = mode === 'neo';

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '700',
          letterSpacing: isNeo ? 1.5 : 0,
          fontSize: 14,
          textTransform: isNeo ? 'uppercase' : 'none',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Aujourd'hui" }} />
      <Tabs.Screen name="planning" options={{ title: 'Planning' }} />
      <Tabs.Screen name="history" options={{ title: 'Historique' }} />
      <Tabs.Screen name="exercises" options={{ title: 'Exercices' }} />
      <Tabs.Screen name="settings" options={{ title: 'Réglages' }} />
    </Tabs>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused, color, size, isNeo }: {
  name: IconName;
  focused: boolean;
  color: string;
  size: number;
  isNeo: boolean;
}) {
  if (!isNeo || !focused) {
    return <Ionicons name={name} size={size} color={color} />;
  }
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute',
        width: 32,
        height: 32,
        borderRadius: 4,
        backgroundColor: color + '18',
      }} />
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  const { theme: { colors, mode } } = useTheme();
  const isNeo = mode === 'neo';

  const tabBarStyle = isNeo
    ? {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        elevation: 0,
      }
    : {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
      };

  return (
    <Tabs
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
        tabBarStyle,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: isNeo ? 0.8 : 0,
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Aujourd'hui",
          tabBarLabel: 'TODAY',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name={(focused ? 'flash' : 'flash-outline') as IconName} focused={focused} color={color} size={size} isNeo={isNeo} />
          ),
        }}
      />
      <Tabs.Screen
        name="planning"
        options={{
          title: 'Planning',
          tabBarLabel: 'PLAN',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name={(focused ? 'calendar' : 'calendar-outline') as IconName} focused={focused} color={color} size={size} isNeo={isNeo} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarLabel: 'LOG',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name={(focused ? 'stats-chart' : 'stats-chart-outline') as IconName} focused={focused} color={color} size={size} isNeo={isNeo} />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercices',
          tabBarLabel: 'EXOS',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name={(focused ? 'barbell' : 'barbell-outline') as IconName} focused={focused} color={color} size={size} isNeo={isNeo} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Réglages',
          tabBarLabel: 'CFG',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name={(focused ? 'settings' : 'settings-outline') as IconName} focused={focused} color={color} size={size} isNeo={isNeo} />
          ),
        }}
      />
    </Tabs>
  );
}

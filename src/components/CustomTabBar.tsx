import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeProvider';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export const TAB_BAR_HEIGHT = 60;

const TAB_CONFIG: Record<string, { icon: IconName; iconFocused: IconName; label: string }> = {
  index: { icon: 'flash-outline', iconFocused: 'flash', label: 'TODAY' },
  planning: { icon: 'calendar-outline', iconFocused: 'calendar', label: 'PLAN' },
  history: { icon: 'stats-chart-outline', iconFocused: 'stats-chart', label: 'LOG' },
  exercises: { icon: 'barbell-outline', iconFocused: 'barbell', label: 'EXOS' },
  settings: { icon: 'settings-outline', iconFocused: 'settings', label: 'CFG' },
};

// Visual order: planning | history | TODAY(center) | exercises | settings
const VISUAL_ORDER = ['planning', 'history', 'index', 'exercises', 'settings'];

export default function CustomTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const { theme: { colors, mode } } = useTheme();
  const isNeo = mode === 'neo';

  const sortedRoutes = VISUAL_ORDER
    .map(name => state.routes.find(r => r.name === name))
    .filter((r): r is (typeof state.routes)[number] => r != null);

  return (
    <View style={[styles.container, {
      backgroundColor: colors.surface,
      borderTopColor: isNeo ? colors.accent + '30' : colors.border,
      paddingBottom: insets.bottom,
      height: TAB_BAR_HEIGHT + insets.bottom,
    }]}>
      {sortedRoutes.map(route => {
        const cfg = TAB_CONFIG[route.name];
        if (!cfg) return null;
        const isFocused = state.routes[state.index]?.name === route.name;
        const isCenter = route.name === 'index';

        const onPress = () => {
          Haptics.selectionAsync();
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name as never);
          }
        };

        if (isCenter) {
          return (
            <TouchableOpacity
              key={route.key}
              style={styles.centerTab}
              onPress={onPress}
              activeOpacity={0.85}
            >
              <View style={[styles.centerCircle, {
                backgroundColor: isFocused ? colors.accent : colors.surface,
                borderColor: isFocused ? colors.accent : colors.border,
                shadowColor: colors.accent,
                shadowOpacity: isNeo ? (isFocused ? 0.55 : 0.2) : 0,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 0 },
                elevation: isFocused ? 8 : 3,
              }]}>
                <Ionicons
                  name={isFocused ? cfg.iconFocused : cfg.icon}
                  size={24}
                  color={isFocused ? '#000' : colors.textMuted}
                />
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            activeOpacity={0.75}
          >
            {isNeo && isFocused && (
              <View style={[styles.neoFocusBg, { backgroundColor: colors.accent + '18', borderRadius: 4 }]} />
            )}
            <Ionicons
              name={isFocused ? cfg.iconFocused : cfg.icon}
              size={20}
              color={isFocused ? colors.accent : colors.textMuted}
            />
            <Text style={[styles.label, {
              color: isFocused ? colors.accent : colors.textMuted,
              letterSpacing: 0.6,
            }]}>
              {cfg.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    overflow: 'visible',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 10,
    paddingBottom: 8,
  },
  centerTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
    overflow: 'visible',
  },
  centerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  neoFocusBg: {
    position: 'absolute',
    width: 36,
    height: 36,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
  },
});

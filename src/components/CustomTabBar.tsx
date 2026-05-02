import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeProvider';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

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

// ── TabButton (non-center) ────────────────────────────────────────────────────

interface TabButtonProps {
  routeKey: string;
  routeName: string;
  isFocused: boolean;
  isNeo: boolean;
  onPress: () => void;
  accent: string;
  textMuted: string;
}

function TabButton({ routeKey, routeName, isFocused, isNeo, onPress, accent, textMuted }: TabButtonProps) {
  const cfg = TAB_CONFIG[routeName];
  const scale = useSharedValue(1);
  const indicatorOpacity = useSharedValue(isFocused ? 1 : 0);

  // Keep indicator in sync with focus state
  indicatorOpacity.value = withTiming(isFocused ? 1 : 0, { duration: 180 });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
  }));

  function handlePress() {
    scale.value = withSequence(
      withTiming(0.85, { duration: 80 }),
      withSpring(1, { damping: 8, stiffness: 300 }),
    );
    onPress();
  }

  if (!cfg) return null;

  return (
    <TouchableOpacity
      key={routeKey}
      style={styles.tab}
      onPress={handlePress}
      activeOpacity={1}
    >
      {isNeo && isFocused && (
        <View style={[styles.neoFocusBg, { backgroundColor: accent + '18', borderRadius: 4 }]} />
      )}
      <Animated.View style={[styles.tabContent, animatedStyle]}>
        {/* Active indicator top-border */}
        <Animated.View
          style={[styles.activeIndicator, { backgroundColor: accent }, indicatorStyle]}
        />
        <Ionicons
          name={isFocused ? cfg.iconFocused : cfg.icon}
          size={20}
          color={isFocused ? accent : textMuted}
        />
        <Text style={[styles.label, {
          color: isFocused ? accent : textMuted,
          letterSpacing: 0.6,
        }]}>
          {cfg.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── CenterButton ─────────────────────────────────────────────────────────────

interface CenterButtonProps {
  routeKey: string;
  routeName: string;
  isFocused: boolean;
  isNeo: boolean;
  onPress: () => void;
  accent: string;
  surface: string;
  border: string;
  textMuted: string;
}

function CenterButton({ routeKey, routeName, isFocused, isNeo, onPress, accent, surface, border, textMuted }: CenterButtonProps) {
  const cfg = TAB_CONFIG[routeName];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    scale.value = withSequence(
      withTiming(0.88, { duration: 80 }),
      withSpring(1, { damping: 8, stiffness: 300 }),
    );
    onPress();
  }

  if (!cfg) return null;

  return (
    <TouchableOpacity
      key={routeKey}
      style={styles.centerTab}
      onPress={handlePress}
      activeOpacity={1}
    >
      <Animated.View style={animatedStyle}>
        <View style={[styles.centerCircle, {
          backgroundColor: isFocused ? accent : surface,
          borderColor: isFocused ? accent : border,
          shadowColor: accent,
          shadowOpacity: isNeo ? (isFocused ? 0.55 : 0.2) : 0,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 },
          elevation: isFocused ? 8 : 3,
        }]}>
          <Ionicons
            name={isFocused ? cfg.iconFocused : cfg.icon}
            size={24}
            color={isFocused ? '#000' : textMuted}
          />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── CustomTabBar ──────────────────────────────────────────────────────────────

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
            <CenterButton
              key={route.key}
              routeKey={route.key}
              routeName={route.name}
              isFocused={isFocused}
              isNeo={isNeo}
              onPress={onPress}
              accent={colors.accent}
              surface={colors.surface}
              border={colors.border}
              textMuted={colors.textMuted}
            />
          );
        }

        return (
          <TabButton
            key={route.key}
            routeKey={route.key}
            routeName={route.name}
            isFocused={isFocused}
            isNeo={isNeo}
            onPress={onPress}
            accent={colors.accent}
            textMuted={colors.textMuted}
          />
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
    paddingTop: 10,
    paddingBottom: 8,
  },
  tabContent: {
    alignItems: 'center',
    gap: 3,
  },
  activeIndicator: {
    height: 2,
    width: 28,
    borderRadius: 1,
    marginBottom: 2,
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

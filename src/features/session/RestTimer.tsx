import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeProvider';
import type { Intention } from '@/db/models/ExerciseInstance';

export const REST_DEFAULTS: Record<Intention, number> = {
  power: 240,
  strength: 180,
  hypertrophy: 90,
  endurance: 60,
  metabolic: 45,
};

const INTENTION_LABELS: Record<Intention, string> = {
  power: 'PUISSANCE',
  strength: 'FORCE',
  hypertrophy: 'HYPERTROPHIE',
  endurance: 'ENDURANCE',
  metabolic: 'MÉTABOLIQUE',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function RestTimer({ intention, onDismiss }: { intention: Intention; onDismiss: () => void }) {
  const { theme: { colors, radius, mode } } = useTheme();
  const isNeo = mode === 'neo';
  const defaultSeconds = REST_DEFAULTS[intention];
  const [remaining, setRemaining] = useState(defaultSeconds);
  const slideAnim = useRef(new Animated.Value(140)).current;

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
  }, [slideAnim]);

  useEffect(() => {
    if (remaining <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onDismiss();
      return;
    }
    if (remaining === 10) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const id = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, onDismiss]);

  const adjust = useCallback((delta: number) => setRemaining(r => Math.max(1, r + delta)), []);

  const dismiss = useCallback(() => {
    Animated.timing(slideAnim, { toValue: 140, duration: 200, useNativeDriver: true }).start(onDismiss);
  }, [slideAnim, onDismiss]);

  const progress = remaining / defaultSeconds;
  const isWarning = remaining <= 10;
  const timerColor = isWarning ? colors.danger : colors.accent;

  return (
    <Animated.View style={[
      styles.container,
      {
        backgroundColor: colors.surface,
        borderColor: isNeo ? timerColor + '55' : colors.border,
        borderRadius: radius.lg,
        transform: [{ translateY: slideAnim }],
        shadowColor: isNeo ? timerColor : '#000',
        shadowOpacity: isNeo ? 0.3 : 0.15,
        shadowRadius: isNeo ? 20 : 12,
        shadowOffset: { width: 0, height: -4 },
        elevation: 12,
      },
    ]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.titleRow}>
          <View style={[styles.intentBadge, { backgroundColor: timerColor + '18', borderRadius: radius.sm }]}>
            <Text style={[styles.intentLabel, { color: timerColor, letterSpacing: isNeo ? 1 : 0 }]}>
              {INTENTION_LABELS[intention]}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={dismiss} hitSlop={12}>
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBg, { backgroundColor: colors.border, borderRadius: radius.sm }]}>
        <View style={[styles.progressFill, {
          width: `${progress * 100}%`,
          backgroundColor: timerColor,
          borderRadius: radius.sm,
          shadowColor: timerColor,
          shadowOpacity: isNeo ? 0.7 : 0,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 0 },
        }]} />
      </View>

      {/* Controls */}
      <View style={styles.body}>
        <TouchableOpacity
          style={[styles.adjBtn, { borderColor: colors.border, borderRadius: radius.sm }]}
          onPress={() => adjust(-30)}
          hitSlop={8}
        >
          <Text style={[styles.adjText, { color: colors.textMuted }]}>-30s</Text>
        </TouchableOpacity>

        <Text style={[styles.countdown, { color: timerColor, letterSpacing: isNeo ? 4 : 0 }]}>
          {formatTime(remaining)}
        </Text>

        <TouchableOpacity
          style={[styles.adjBtn, { borderColor: colors.border, borderRadius: radius.sm }]}
          onPress={() => adjust(30)}
          hitSlop={8}
        >
          <Text style={[styles.adjText, { color: colors.textMuted }]}>+30s</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.skipBtn, { backgroundColor: colors.accent, borderRadius: radius.sm }]}
        onPress={dismiss}
        activeOpacity={0.85}
      >
        <Ionicons name="play-skip-forward" size={14} color="#000" />
        <Text style={[styles.skipText, { color: '#000', letterSpacing: isNeo ? 0.8 : 0 }]}>
          {isNeo ? 'PASSER' : 'Passer'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 14,
    right: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  intentBadge: { paddingHorizontal: 8, paddingVertical: 3 },
  intentLabel: { fontSize: 10, fontWeight: '800' },
  progressBg: { height: 3, overflow: 'hidden' },
  progressFill: { height: '100%' },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adjBtn: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  adjText: { fontSize: 13, fontWeight: '700' },
  countdown: { fontSize: 52, fontWeight: '800', fontVariant: ['tabular-nums'] },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
  },
  skipText: { fontSize: 13, fontWeight: '800' },
});

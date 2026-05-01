import React, { useCallback, useEffect, useRef } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeProvider';

export const WHEEL_ITEM_H = 44;
const VISIBLE = 5;
const PAD = WHEEL_ITEM_H * Math.floor(VISIBLE / 2);

interface Props {
  values: (number | null)[];
  selected: number | null;
  onChange: (val: number | null) => void;
  formatLabel: (val: number | null) => string;
  width?: number;
}

export default function WheelPicker({ values, selected, onChange, formatLabel, width = 80 }: Props) {
  const { theme: { colors, radius } } = useTheme();
  const listRef = useRef<FlatList>(null);
  const lastIndex = useRef(-1);

  const initIndex = values.findIndex(v => v === selected);

  useEffect(() => {
    const idx = Math.max(0, initIndex);
    setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: idx * WHEEL_ITEM_H, animated: false });
    }, 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.max(0, Math.min(values.length - 1, Math.round(y / WHEEL_ITEM_H)));
    if (idx !== lastIndex.current) {
      lastIndex.current = idx;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(values[idx]);
    }
  }, [values, onChange]);

  return (
    <View style={[styles.root, { width, height: WHEEL_ITEM_H * VISIBLE }]}>
      {/* Selection highlight */}
      <View style={[styles.highlight, {
        top: WHEEL_ITEM_H * 2,
        height: WHEEL_ITEM_H,
        backgroundColor: colors.accentDim,
        borderColor: colors.accent + '60',
        borderRadius: radius.sm,
      }]} pointerEvents="none" />

      <FlatList
        ref={listRef}
        data={values}
        keyExtractor={(_, i) => String(i)}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingTop: PAD, paddingBottom: PAD }}
        getItemLayout={(_, i) => ({ length: WHEEL_ITEM_H, offset: PAD + i * WHEEL_ITEM_H, index: i })}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        initialNumToRender={7}
        windowSize={3}
        renderItem={({ item }) => {
          const dist = values.indexOf(item) >= 0
            ? Math.abs(values.indexOf(item) - Math.max(0, initIndex))
            : 2;
          return (
            <View style={styles.item}>
              <Text style={[styles.label, {
                color: dist === 0 ? colors.text : colors.textMuted,
                fontSize: dist === 0 ? 18 : 15,
                fontWeight: dist === 0 ? '700' : '400',
                opacity: dist <= 1 ? 1 : 0.35,
              }]}>
                {formatLabel(item)}
              </Text>
            </View>
          );
        }}
      />

      {/* Top + bottom fade overlays */}
      <View style={[styles.fadeTop, { backgroundColor: colors.surface + 'CC' }]} pointerEvents="none" />
      <View style={[styles.fadeBottom, { backgroundColor: colors.surface + 'CC' }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden', position: 'relative' },
  highlight: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderWidth: 1,
    zIndex: 0,
  },
  item: {
    height: WHEEL_ITEM_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { fontVariant: ['tabular-nums'] },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: WHEEL_ITEM_H * 2,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: WHEEL_ITEM_H * 2,
  },
});

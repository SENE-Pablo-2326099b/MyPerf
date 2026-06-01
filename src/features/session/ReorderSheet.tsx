import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/ThemeProvider';
const ITEM_H = 64;

interface Item {
  id: string;
  name: string;
}

interface Props {
  visible: boolean;
  items: Item[];
  onReorder: (orderedIds: string[]) => void;
  onClose: () => void;
}

export default function ReorderSheet({ visible, items: itemsProp, onReorder, onClose }: Props) {
  const { theme: { colors, radius, mode } } = useTheme();
  const isNeo = mode === 'neo';

  const [order, setOrder] = useState<Item[]>([]);
  const [renderActiveId, setRenderActiveId] = useState<string | null>(null);
  const [renderFromIdx, setRenderFromIdx] = useState(0);
  const [renderToIdx, setRenderToIdx] = useState(0);

  const orderRef = useRef<Item[]>([]);
  const fromIdxRef = useRef(0);
  const toIdxRef = useRef(0);
  const activeIdRef = useRef<string | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;

  useEffect(() => { orderRef.current = order; }, [order]);

  useEffect(() => {
    if (visible) {
      setOrder(itemsProp);
      orderRef.current = itemsProp;
    }
  }, [visible, itemsProp]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const touchY = e.nativeEvent.locationY;
        const idx = Math.max(0, Math.min(
          orderRef.current.length - 1,
          Math.floor(touchY / ITEM_H),
        ));
        activeIdRef.current = orderRef.current[idx]?.id ?? null;
        fromIdxRef.current = idx;
        toIdxRef.current = idx;
        dragY.setValue(0);
        setRenderActiveId(activeIdRef.current);
        setRenderFromIdx(idx);
        setRenderToIdx(idx);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      },
      onPanResponderMove: (_, g) => {
        dragY.setValue(g.dy);
        const newTo = Math.max(0, Math.min(
          orderRef.current.length - 1,
          fromIdxRef.current + Math.round(g.dy / ITEM_H),
        ));
        if (newTo !== toIdxRef.current) {
          toIdxRef.current = newTo;
          setRenderToIdx(newTo);
          Haptics.selectionAsync();
        }
      },
      onPanResponderRelease: (_, g) => {
        const from = fromIdxRef.current;
        const to = Math.max(0, Math.min(
          orderRef.current.length - 1,
          from + Math.round(g.dy / ITEM_H),
        ));
        if (from !== to) {
          setOrder(prev => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
          });
        }
        Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start();
        activeIdRef.current = null;
        setRenderActiveId(null);
      },
    }),
  ).current;

  const handleSave = useCallback(() => {
    onReorder(order.map(i => i.id));
    onClose();
  }, [order, onReorder, onClose]);

  const moveItem = useCallback((fromIdx: number, toIdx: number) => {
    Haptics.selectionAsync();
    setOrder(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }, []);

  const listHeight = order.length * ITEM_H;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, {
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
        }]}>
          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            <Text style={[styles.sheetTitle, { color: colors.text, letterSpacing: isNeo ? 1 : 0 }]}>
              {isNeo ? 'RÉORDONNER' : 'Réordonner les exercices'}
            </Text>
            <TouchableOpacity onPress={handleSave} hitSlop={12}>
              <Text style={[styles.doneBtn, { color: colors.accent }]}>
                {isNeo ? 'OK' : 'Terminé'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Glisse les lignes pour réordonner
          </Text>

          {/* Drag list */}
          <View
            style={[styles.listWrap, { height: listHeight }]}
            {...panResponder.panHandlers}
          >
            {order.map((item, idx) => {
              const isActive = item.id === renderActiveId;
              const from = renderFromIdx;
              const to = renderToIdx;

              let visualIdx = idx;
              if (!isActive && renderActiveId) {
                if (from < to && idx > from && idx <= to) visualIdx = idx - 1;
                else if (from > to && idx >= to && idx < from) visualIdx = idx + 1;
              }

              if (isActive) {
                return (
                  <Animated.View
                    key={item.id}
                    style={[
                      styles.item,
                      {
                        backgroundColor: colors.accent + '18',
                        borderColor: colors.accent + '60',
                        borderRadius: radius.sm,
                        position: 'absolute',
                        top: from * ITEM_H,
                        left: 0,
                        right: 0,
                        zIndex: 10,
                        elevation: 8,
                        shadowColor: colors.accent,
                        shadowOpacity: 0.3,
                        shadowRadius: 12,
                        shadowOffset: { width: 0, height: 4 },
                      },
                      { transform: [{ translateY: dragY }] },
                    ]}
                  >
                    <Text style={[styles.itemIdx, { color: colors.accent }]}>{to + 1}</Text>
                    <Text style={[styles.itemName, { color: colors.accent }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Ionicons name="reorder-three-outline" size={22} color={colors.accent} />
                  </Animated.View>
                );
              }

              return (
                <View
                  key={item.id}
                  style={[
                    styles.item,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      borderRadius: radius.sm,
                      position: 'absolute',
                      top: visualIdx * ITEM_H,
                      left: 0,
                      right: 0,
                    },
                  ]}
                >
                  <Text style={[styles.itemIdx, { color: colors.textMuted }]}>{visualIdx + 1}</Text>
                  <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.arrowBtns}>
                    <TouchableOpacity
                      hitSlop={8}
                      disabled={idx === 0}
                      onPress={() => moveItem(idx, idx - 1)}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={18}
                        color={idx === 0 ? colors.border : colors.textMuted}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      hitSlop={8}
                      disabled={idx === order.length - 1}
                      onPress={() => moveItem(idx, idx + 1)}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={18}
                        color={idx === order.length - 1 ? colors.border : colors.textMuted}
                      />
                    </TouchableOpacity>
                    <Ionicons name="reorder-three-outline" size={22} color={colors.textMuted} />
                  </View>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, {
              backgroundColor: colors.accent,
              borderRadius: radius.md,
              margin: 16,
              marginTop: 12,
            }]}
            onPress={handleSave}
          >
            <Ionicons name="checkmark" size={18} color="#000" />
            <Text style={[styles.saveBtnText, { letterSpacing: isNeo ? 1 : 0 }]}>
              {isNeo ? 'ENREGISTRER' : 'Enregistrer'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000060',
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: { fontSize: 15, fontWeight: '800' },
  doneBtn: { fontSize: 14, fontWeight: '800' },
  hint: { fontSize: 12, textAlign: 'center', paddingVertical: 8 },
  listWrap: { position: 'relative', marginHorizontal: 16 },
  item: {
    height: ITEM_H - 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  itemIdx: {
    width: 20,
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  itemName: { flex: 1, fontSize: 15, fontWeight: '600' },
  arrowBtns: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
});

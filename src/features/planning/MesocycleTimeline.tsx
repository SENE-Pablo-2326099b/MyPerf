import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { BLOCK_COLORS, BLOCK_LABELS } from './blockUtils';
import { countMesocycleSessions, deleteMesocycle } from './mesocycleActions';
import { getMesocycleStatus, getMesocycleWeek } from '@/db/models/Mesocycle';
import { Alert } from 'react-native';
import type Mesocycle from '@/db/models/Mesocycle';
import type Macrocycle from '@/db/models/Macrocycle';

const MONTH_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

function fmtDate(d: Date) {
  return `${d.getDate()} ${MONTH_FR[d.getMonth()]}`;
}

// ── Timeline bar ──────────────────────────────────────────────────────────────

function TimelineBar({ mesocycles }: { mesocycles: Mesocycle[] }) {
  const { theme: { colors, radius } } = useTheme();

  if (mesocycles.length === 0) return null;

  const globalStart = mesocycles.reduce(
    (min, m) => Math.min(min, m.startDate.getTime()),
    Infinity,
  );
  const globalEnd = mesocycles.reduce(
    (max, m) => Math.max(max, m.endDate.getTime()),
    -Infinity,
  );
  const totalMs = globalEnd - globalStart || 1;
  const now = Date.now();
  const todayPct = Math.max(0, Math.min(1, (now - globalStart) / totalMs));
  const showToday = now >= globalStart && now <= globalEnd;

  return (
    <View style={styles.timelineBarWrap}>
      <View style={[styles.timelineTrack, { backgroundColor: colors.border }]}>
        {mesocycles.map(m => {
          const left = (m.startDate.getTime() - globalStart) / totalMs;
          const width = (m.endDate.getTime() - m.startDate.getTime()) / totalMs;
          const color = BLOCK_COLORS[m.blockType];
          const status = getMesocycleStatus(m);

          return (
            <View
              key={m.id}
              style={[styles.timelineSegment, {
                left: `${left * 100}%`,
                width: `${Math.max(width * 100, 8)}%`,
                backgroundColor: color,
                borderRadius: radius.sm,
                opacity: status === 'completed' ? 0.4 : 1,
                borderWidth: status === 'active' ? 1.5 : 0,
                borderColor: '#fff',
              }]}
            />
          );
        })}

        {/* Curseur aujourd'hui */}
        {showToday && (
          <View style={[styles.todayCursor, { left: `${todayPct * 100}%`, backgroundColor: colors.text }]} />
        )}
      </View>

      {/* Labels */}
      <View style={styles.timelineLabels}>
        <Text style={[styles.timelineLabel, { color: colors.textMuted }]}>{fmtDate(new Date(globalStart))}</Text>
        {showToday && (
          <Text style={[styles.timelineLabelCenter, { color: colors.text }]}>Auj.</Text>
        )}
        <Text style={[styles.timelineLabel, { color: colors.textMuted }]}>{fmtDate(new Date(globalEnd))}</Text>
      </View>
    </View>
  );
}

// ── Mesocycle card ────────────────────────────────────────────────────────────

function MesocycleCard({ mesocycle, onDeleted }: { mesocycle: Mesocycle; onDeleted: () => void }) {
  const { theme: { colors, radius, mode } } = useTheme();
  const isNeo = mode === 'neo';
  const status = getMesocycleStatus(mesocycle);
  const color = BLOCK_COLORS[mesocycle.blockType];
  const [sessionCount, setSessionCount] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    countMesocycleSessions(mesocycle.id).then(n => { if (alive) setSessionCount(n); });
    return () => { alive = false; };
  }, [mesocycle.id]);

  const weekInfo = status === 'active' ? getMesocycleWeek(mesocycle) : null;

  const handleDelete = () => {
    Alert.alert(
      'Supprimer ce bloc ?',
      `"${mesocycle.name}" — ${sessionCount ?? '?'} séances planifiées`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Garder les séances',
          onPress: async () => { await deleteMesocycle(mesocycle, false); onDeleted(); },
        },
        {
          text: 'Tout supprimer',
          style: 'destructive',
          onPress: async () => { await deleteMesocycle(mesocycle, true); onDeleted(); },
        },
      ],
    );
  };

  return (
    <View style={[styles.mesoCard, {
      backgroundColor: colors.surface,
      borderColor: status === 'active' ? color + '66' : colors.border,
      borderRadius: radius.md,
      borderLeftWidth: isNeo ? 3 : 1,
      borderLeftColor: color,
    }]}>
      {/* Top row */}
      <View style={styles.mesoCardTop}>
        <View style={styles.mesoCardLeft}>
          <View style={styles.mesoNameRow}>
            <Text style={[styles.mesoName, { color: colors.text }]} numberOfLines={1}>
              {mesocycle.name}
            </Text>
            {status === 'active' && (
              <View style={[styles.activePill, { backgroundColor: color + '22', borderRadius: radius.sm }]}>
                <View style={[styles.activeDot, { backgroundColor: color }]} />
                <Text style={[styles.activeText, { color }]}>
                  {isNeo ? 'ACTIF' : 'Actif'}
                </Text>
              </View>
            )}
            {status === 'completed' && (
              <View style={[styles.activePill, { backgroundColor: colors.border, borderRadius: radius.sm }]}>
                <Ionicons name="checkmark" size={10} color={colors.textMuted} />
                <Text style={[styles.activeText, { color: colors.textMuted }]}>Terminé</Text>
              </View>
            )}
          </View>

          <View style={[styles.blockBadge, { backgroundColor: color + '18', borderRadius: radius.sm }]}>
            <Text style={[styles.blockBadgeText, { color, letterSpacing: isNeo ? 1 : 0 }]}>
              {BLOCK_LABELS[mesocycle.blockType].toUpperCase()}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleDelete} hitSlop={12} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={15} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Dates + stats */}
      <View style={styles.mesoMeta}>
        <Text style={[styles.metaText, { color: colors.textMuted }]}>
          {fmtDate(mesocycle.startDate)} → {fmtDate(mesocycle.endDate)}
        </Text>
        {sessionCount !== null && (
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {sessionCount} séance{sessionCount !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* Semaine courante */}
      {weekInfo && (
        <View style={[styles.weekBar, { backgroundColor: colors.background, borderRadius: radius.sm }]}>
          <View style={styles.weekBarInfo}>
            <Text style={[styles.weekLabel, { color: colors.textMuted, letterSpacing: isNeo ? 1 : 0 }]}>
              {isNeo ? 'SEMAINE' : 'Semaine'}
            </Text>
            <Text style={[styles.weekValue, { color }]}>{weekInfo.current}/{weekInfo.total}</Text>
          </View>
          <View style={[styles.weekProgress, { backgroundColor: colors.border, borderRadius: radius.sm }]}>
            <View style={[styles.weekProgressFill, {
              width: `${(weekInfo.current / weekInfo.total) * 100}%`,
              backgroundColor: color,
              borderRadius: radius.sm,
              shadowColor: color,
              shadowOpacity: isNeo ? 0.6 : 0,
              shadowRadius: 4,
            }]} />
          </View>
        </View>
      )}

      {mesocycle.notes ? (
        <Text style={[styles.mesoNotes, { color: colors.textMuted }]} numberOfLines={2}>
          {mesocycle.notes}
        </Text>
      ) : null}
    </View>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface Props {
  mesocycles: Mesocycle[];
  macrocycles: Macrocycle[];
  onCreatePress: () => void;
  refreshKey: number;
  onRefresh: () => void;
}

export default function MesocycleTimeline({ mesocycles, macrocycles, onCreatePress, refreshKey, onRefresh }: Props) {
  const { theme: { colors, radius, mode } } = useTheme();
  const isNeo = mode === 'neo';

  const grouped = macrocycles.length > 0
    ? macrocycles.map(mc => ({
        macro: mc,
        mesos: mesocycles.filter(m => m.macrocycleId === mc.id),
      })).filter(g => g.mesos.length > 0)
    : null;
  const orphan = mesocycles.filter(m => !m.macrocycleId);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Timeline globale */}
      {mesocycles.length > 0 && (
        <View style={[styles.timelineCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted, letterSpacing: isNeo ? 1.5 : 0 }]}>
            {isNeo ? 'TIMELINE' : 'Timeline'}
          </Text>
          <TimelineBar mesocycles={mesocycles} />
        </View>
      )}

      {/* Blocs groupés par macrocycle */}
      {grouped?.map(({ macro, mesos }) => (
        <View key={macro.id} style={styles.macroGroup}>
          <View style={styles.macroHeader}>
            <Ionicons name="layers-outline" size={13} color={colors.accent} />
            <Text style={[styles.macroName, { color: colors.accent, letterSpacing: isNeo ? 1 : 0 }]}>
              {macro.name.toUpperCase()}
            </Text>
          </View>
          {mesos.map(m => (
            <MesocycleCard key={m.id} mesocycle={m} onDeleted={onRefresh} />
          ))}
        </View>
      ))}

      {/* Blocs sans macrocycle */}
      {orphan.map(m => (
        <MesocycleCard key={m.id} mesocycle={m} onDeleted={onRefresh} />
      ))}

      {/* Empty state */}
      {mesocycles.length === 0 && (
        <View style={[styles.empty, { borderColor: colors.border, borderRadius: radius.md }]}>
          <Ionicons name="layers-outline" size={40} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {isNeo ? 'AUCUN BLOC' : 'Aucun bloc de periodisation'}
          </Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>
            Crée ton premier mésocycle pour planifier tes entraînements sur plusieurs semaines.
          </Text>
        </View>
      )}

      {/* FAB-like create button */}
      <TouchableOpacity
        style={[styles.createBtn, {
          backgroundColor: colors.accent,
          borderRadius: radius.md,
          shadowColor: colors.accent,
          shadowOpacity: isNeo ? 0.4 : 0,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        }]}
        onPress={onCreatePress}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={20} color="#000" />
        <Text style={[styles.createBtnText, { letterSpacing: isNeo ? 1 : 0 }]}>
          {isNeo ? 'NOUVEAU BLOC' : 'Nouveau bloc'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, paddingBottom: 48, gap: 12 },

  timelineCard: { borderWidth: 1, padding: 14, gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '700' },
  timelineBarWrap: { gap: 6 },
  timelineTrack: { height: 24, borderRadius: 4, position: 'relative', overflow: 'visible' },
  timelineSegment: { position: 'absolute', height: '100%' },
  todayCursor: { position: 'absolute', top: -4, bottom: -4, width: 2 },
  timelineLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timelineLabel: { fontSize: 10 },
  timelineLabelCenter: { fontSize: 10, fontWeight: '700' },

  macroGroup: { gap: 8 },
  macroHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 2 },
  macroName: { fontSize: 11, fontWeight: '800' },

  mesoCard: { borderWidth: 1, padding: 14, gap: 10 },
  mesoCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  mesoCardLeft: { flex: 1, gap: 6 },
  mesoNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  mesoName: { fontSize: 16, fontWeight: '800', flexShrink: 1 },
  activePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3 },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeText: { fontSize: 10, fontWeight: '800' },
  blockBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3 },
  blockBadgeText: { fontSize: 10, fontWeight: '800' },
  deleteBtn: { padding: 2 },

  mesoMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: 12 },

  weekBar: { padding: 10, gap: 6 },
  weekBarInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekLabel: { fontSize: 10, fontWeight: '700' },
  weekValue: { fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  weekProgress: { height: 4, overflow: 'hidden' },
  weekProgressFill: { height: '100%' },

  mesoNotes: { fontSize: 12, fontStyle: 'italic', lineHeight: 18 },

  empty: { borderWidth: 1, borderStyle: 'dashed', padding: 32, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 4,
  },
  createBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
});

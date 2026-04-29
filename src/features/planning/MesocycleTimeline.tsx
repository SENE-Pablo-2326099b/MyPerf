import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { BLOCK_COLORS, BLOCK_LABELS } from './blockUtils';
import { MICRO_COLORS, MICRO_LABELS } from './microcycleUtils';
import { countMesocycleSessions, deleteMacrocycle, deleteMesocycle } from './mesocycleActions';
import { getMesocycleStatus, getMesocycleWeek } from '@/db/models/Mesocycle';
import { useMicrocycles } from '@/hooks/useMicrocycles';
import MicrocycleEditor from './MicrocycleEditor';
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

  const globalStart = mesocycles.reduce((min, m) => Math.min(min, m.startDate.getTime()), Infinity);
  const globalEnd = mesocycles.reduce((max, m) => Math.max(max, m.endDate.getTime()), -Infinity);
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
        {showToday && (
          <View style={[styles.todayCursor, { left: `${todayPct * 100}%`, backgroundColor: colors.text }]} />
        )}
      </View>
      <View style={styles.timelineLabels}>
        <Text style={[styles.timelineLabel, { color: colors.textMuted }]}>{fmtDate(new Date(globalStart))}</Text>
        {showToday && <Text style={[styles.timelineLabelCenter, { color: colors.text }]}>Auj.</Text>}
        <Text style={[styles.timelineLabel, { color: colors.textMuted }]}>{fmtDate(new Date(globalEnd))}</Text>
      </View>
    </View>
  );
}

// ── Microcycle summary inline ─────────────────────────────────────────────────

function MicroSummary({ mesocycle }: { mesocycle: Mesocycle }) {
  const { theme: { colors, radius, mode } } = useTheme();
  const isNeo = mode === 'neo';
  const micros = useMicrocycles(mesocycle.id);
  const [showEditor, setShowEditor] = useState(false);

  return (
    <>
      <View style={[styles.microSection, { borderTopColor: colors.border }]}>
        <View style={styles.microHeader}>
          <Text style={[styles.microTitle, { color: colors.textMuted, letterSpacing: isNeo ? 1 : 0 }]}>
            {isNeo ? 'MICROCYCLES' : 'Microcycles'}
          </Text>
          <TouchableOpacity onPress={() => setShowEditor(true)} hitSlop={8}>
            <Text style={[styles.microEditBtn, { color: colors.accent }]}>
              {micros.length > 0 ? (isNeo ? 'MODIFIER' : 'Modifier') : (isNeo ? 'CONFIGURER' : 'Configurer')}
            </Text>
          </TouchableOpacity>
        </View>

        {micros.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.microScroll}>
            {micros.map(m => (
              <View key={m.id} style={[styles.microChip, {
                backgroundColor: MICRO_COLORS[m.label] + '18',
                borderColor: MICRO_COLORS[m.label] + '55',
                borderRadius: radius.sm,
              }]}>
                <Text style={[styles.microChipWeek, { color: colors.textMuted }]}>S{m.weekNumber}</Text>
                <Text style={[styles.microChipLabel, { color: MICRO_COLORS[m.label] }]}>
                  {MICRO_LABELS[m.label]}
                </Text>
                <Text style={[styles.microChipVol, { color: MICRO_COLORS[m.label] }]}>
                  {m.volumePct}%
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={[styles.microEmpty, { color: colors.textMuted }]}>
            Semaines non configurées — touche Configurer pour définir le volume par semaine.
          </Text>
        )}
      </View>

      <MicrocycleEditor
        visible={showEditor}
        mesocycle={mesocycle}
        existingMicrocycles={micros}
        onClose={() => setShowEditor(false)}
      />
    </>
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
              <View style={[styles.statusPill, { backgroundColor: color + '22', borderRadius: radius.sm }]}>
                <View style={[styles.activeDot, { backgroundColor: color }]} />
                <Text style={[styles.statusText, { color }]}>{isNeo ? 'ACTIF' : 'Actif'}</Text>
              </View>
            )}
            {status === 'completed' && (
              <View style={[styles.statusPill, { backgroundColor: colors.border, borderRadius: radius.sm }]}>
                <Ionicons name="checkmark" size={10} color={colors.textMuted} />
                <Text style={[styles.statusText, { color: colors.textMuted }]}>Terminé</Text>
              </View>
            )}
            {status === 'upcoming' && (
              <View style={[styles.statusPill, { backgroundColor: color + '15', borderRadius: radius.sm }]}>
                <Text style={[styles.statusText, { color }]}>{isNeo ? 'À VENIR' : 'À venir'}</Text>
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

      {/* Microcycles */}
      <MicroSummary mesocycle={mesocycle} />
    </View>
  );
}

// ── Macrocycle section header ─────────────────────────────────────────────────

function MacrocycleHeader({
  macrocycle,
  onDelete,
}: {
  macrocycle: Macrocycle;
  onDelete: () => void;
}) {
  const { theme: { colors, mode } } = useTheme();
  const isNeo = mode === 'neo';

  const handleDelete = () => {
    Alert.alert(
      'Supprimer ce macrocycle ?',
      `"${macrocycle.name}" — les mésocycles liés deviendront indépendants.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: async () => { await deleteMacrocycle(macrocycle); onDelete(); } },
      ],
    );
  };

  const dateStr = macrocycle.endDate
    ? `${fmtDate(macrocycle.startDate)} → ${fmtDate(macrocycle.endDate)}`
    : `Depuis le ${fmtDate(macrocycle.startDate)}`;

  return (
    <View style={styles.macroHeader}>
      <Ionicons name="layers-outline" size={13} color={colors.accent} />
      <View style={styles.macroHeaderCenter}>
        <Text style={[styles.macroName, { color: colors.accent, letterSpacing: isNeo ? 1 : 0 }]}>
          {macrocycle.name.toUpperCase()}
        </Text>
        <Text style={[styles.macroDates, { color: colors.textMuted }]}>{dateStr}</Text>
        {macrocycle.goalDescription ? (
          <Text style={[styles.macroGoal, { color: colors.textMuted }]} numberOfLines={1}>
            {macrocycle.goalDescription}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity onPress={handleDelete} hitSlop={12}>
        <Ionicons name="trash-outline" size={14} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface Props {
  mesocycles: Mesocycle[];
  macrocycles: Macrocycle[];
  onCreateMeso: () => void;
  onCreateMacro: () => void;
  refreshKey?: number;
  onRefresh: () => void;
}

export default function MesocycleTimeline({
  mesocycles,
  macrocycles,
  onCreateMeso,
  onCreateMacro,
  onRefresh,
}: Props) {
  const { theme: { colors, radius, mode } } = useTheme();
  const isNeo = mode === 'neo';

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

      {/* Macrocycles avec leurs mésocycles */}
      {macrocycles.map(mc => {
        const mesos = mesocycles.filter(m => m.macrocycleId === mc.id);
        return (
          <View key={mc.id} style={styles.macroGroup}>
            <MacrocycleHeader macrocycle={mc} onDelete={onRefresh} />
            {mesos.length > 0
              ? mesos.map(m => <MesocycleCard key={m.id} mesocycle={m} onDeleted={onRefresh} />)
              : (
                <View style={[styles.macroEmpty, { borderColor: colors.border, borderRadius: radius.sm }]}>
                  <Text style={[styles.macroEmptyText, { color: colors.textMuted }]}>
                    Aucun bloc dans ce macrocycle. Crée un mésocycle et rattache-le.
                  </Text>
                </View>
              )
            }
          </View>
        );
      })}

      {/* Blocs sans macrocycle */}
      {orphan.length > 0 && (
        <View style={styles.orphanSection}>
          {macrocycles.length > 0 && (
            <Text style={[styles.orphanTitle, { color: colors.textMuted, letterSpacing: isNeo ? 1 : 0 }]}>
              {isNeo ? 'SANS MACROCYCLE' : 'Sans macrocycle'}
            </Text>
          )}
          {orphan.map(m => <MesocycleCard key={m.id} mesocycle={m} onDeleted={onRefresh} />)}
        </View>
      )}

      {/* Empty state global */}
      {mesocycles.length === 0 && macrocycles.length === 0 && (
        <View style={[styles.empty, { borderColor: colors.border, borderRadius: radius.md }]}>
          <Ionicons name="layers-outline" size={40} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {isNeo ? 'AUCUN BLOC' : 'Aucun bloc de périodisation'}
          </Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>
            Crée un macrocycle pour organiser ta saison, puis des mésocycles pour planifier tes entraînements.
          </Text>
        </View>
      )}

      {/* Actions */}
      <TouchableOpacity
        style={[styles.createBtn, {
          backgroundColor: colors.accent,
          borderRadius: radius.md,
          shadowColor: colors.accent,
          shadowOpacity: isNeo ? 0.4 : 0,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        }]}
        onPress={onCreateMeso}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={20} color="#000" />
        <Text style={[styles.createBtnText, { letterSpacing: isNeo ? 1 : 0 }]}>
          {isNeo ? 'NOUVEAU BLOC (MÉSO)' : 'Nouveau bloc'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.createMacroBtn, {
          borderColor: colors.accent,
          borderRadius: radius.md,
        }]}
        onPress={onCreateMacro}
        activeOpacity={0.85}
      >
        <Ionicons name="layers-outline" size={18} color={colors.accent} />
        <Text style={[styles.createMacroBtnText, { color: colors.accent, letterSpacing: isNeo ? 1 : 0 }]}>
          {isNeo ? 'NOUVEAU MACROCYCLE' : 'Nouveau macrocycle'}
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
  macroHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingLeft: 2, paddingRight: 4 },
  macroHeaderCenter: { flex: 1, gap: 1 },
  macroName: { fontSize: 11, fontWeight: '800' },
  macroDates: { fontSize: 10 },
  macroGoal: { fontSize: 11, fontStyle: 'italic' },
  macroEmpty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 14,
    alignItems: 'center',
  },
  macroEmptyText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },

  orphanSection: { gap: 8 },
  orphanTitle: { fontSize: 11, fontWeight: '700', paddingLeft: 2 },

  mesoCard: { borderWidth: 1, padding: 14, gap: 10 },
  mesoCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  mesoCardLeft: { flex: 1, gap: 6 },
  mesoNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  mesoName: { fontSize: 16, fontWeight: '800', flexShrink: 1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3 },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800' },
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

  // Microcycles inline
  microSection: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 8 },
  microHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  microTitle: { fontSize: 10, fontWeight: '700' },
  microEditBtn: { fontSize: 11, fontWeight: '700' },
  microScroll: { flexGrow: 0 },
  microChip: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 8,
    gap: 1,
    alignItems: 'center',
  },
  microChipWeek: { fontSize: 9, fontWeight: '700' },
  microChipLabel: { fontSize: 11, fontWeight: '700' },
  microChipVol: { fontSize: 10, fontWeight: '600', fontVariant: ['tabular-nums'] },
  microEmpty: { fontSize: 11, lineHeight: 16 },

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
  createMacroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderWidth: 1.5,
    marginTop: 4,
  },
  createMacroBtnText: { fontSize: 13, fontWeight: '800' },
});

import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useScheduledSessionsForDate } from '@/hooks/useScheduledSessions';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { useSessions } from '@/hooks/useSessions';
import { useActiveMesocycle } from '@/hooks/useMesocycles';
import { useDailyReadiness } from '@/hooks/useDailyReadiness';
import { getMesocycleWeek } from '@/db/models/Mesocycle';
import { BLOCK_COLORS, BLOCK_LABELS } from '@/features/planning/blockUtils';
import { startSession } from '@/features/session/sessionActions';
import { startFromTemplate } from '@/features/planning/planningActions';
import { readinessScore } from '@/features/readiness/ReadinessCard';
import ActiveSessionView from '@/features/session/ActiveSessionView';
import ReadinessModal from '@/features/readiness/ReadinessModal';
import type ScheduledSession from '@/db/models/ScheduledSession';

const DAY_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTH_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function useWeekSessionCount() {
  const sessions = useSessions();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return sessions.filter(s => s.startedAt >= start).length;
}

function ActiveMesocycleBanner() {
  const { theme: { colors, radius, mode } } = useTheme();
  const isNeo = mode === 'neo';
  const meso = useActiveMesocycle();
  if (!meso) return null;

  const color = BLOCK_COLORS[meso.blockType];
  const week = getMesocycleWeek(meso);
  const isDeload = meso.blockType === 'deload';

  return (
    <View style={[styles.mesoBanner, {
      backgroundColor: color + '14',
      borderColor: color + '44',
      borderLeftColor: color,
      borderLeftWidth: 3,
      borderRadius: radius.sm,
    }]}>
      <View style={styles.mesoBannerLeft}>
        <Text style={[styles.mesoBannerType, { color, letterSpacing: isNeo ? 1 : 0 }]}>
          {BLOCK_LABELS[meso.blockType].toUpperCase()}
        </Text>
        <Text style={[styles.mesoBannerName, { color: colors.text }]} numberOfLines={1}>
          {meso.name}
        </Text>
      </View>
      <View style={styles.mesoBannerRight}>
        {isDeload && (
          <View style={[styles.deloadPill, { backgroundColor: color + '22', borderRadius: radius.sm }]}>
            <Text style={[styles.deloadText, { color }]}>-40%</Text>
          </View>
        )}
        <Text style={[styles.weekBadge, { color }]}>S{week.current}/{week.total}</Text>
      </View>
    </View>
  );
}

function DateHeader() {
  const { theme: { colors, mode } } = useTheme();
  const now = new Date();
  const weekCount = useWeekSessionCount();
  const isNeo = mode === 'neo';

  return (
    <View style={[styles.dateHeader, { borderBottomColor: colors.border }]}>
      <View>
        <Text style={[styles.dayName, { color: colors.textMuted, letterSpacing: isNeo ? 2 : 0 }]}>
          {isNeo ? DAY_FR[now.getDay()].toUpperCase() : DAY_FR[now.getDay()]}
        </Text>
        <Text style={[styles.dateNum, { color: colors.text }]}>
          {now.getDate()} {MONTH_FR[now.getMonth()]}
        </Text>
      </View>
      {weekCount > 0 && (
        <View style={[styles.streakChip, { backgroundColor: colors.accentDim, borderColor: colors.borderAccent }]}>
          <Ionicons name="flame" size={13} color={colors.accent} />
          <Text style={[styles.streakText, { color: colors.accent }]}>
            {weekCount} séance{weekCount > 1 ? 's' : ''} cette semaine
          </Text>
        </View>
      )}
    </View>
  );
}

function TodayPlannedCard({
  scheduled,
  templateName,
  onStart,
}: {
  scheduled: ScheduledSession;
  templateName: string | null;
  onStart: () => void;
}) {
  const { theme: { colors, radius } } = useTheme();
  const blockColor = scheduled.blockType ? BLOCK_COLORS[scheduled.blockType] : colors.accent;
  const blockLabel = scheduled.blockType ? BLOCK_LABELS[scheduled.blockType] : null;

  return (
    <View style={[styles.plannedCard, {
      backgroundColor: colors.surface,
      borderColor: blockColor + '55',
      borderRadius: radius.lg,
      borderLeftColor: blockColor,
      borderLeftWidth: 3,
    }]}>
      <View style={styles.plannedCardTop}>
        {blockLabel && (
          <View style={[styles.blockBadge, { backgroundColor: blockColor + '18', borderRadius: radius.sm }]}>
            <Text style={[styles.blockBadgeText, { color: blockColor }]}>{blockLabel.toUpperCase()}</Text>
          </View>
        )}
        <Text style={[styles.plannedLabel, { color: colors.textMuted }]}>PLANIFIÉ AUJOURD'HUI</Text>
      </View>

      <Text style={[styles.plannedTitle, { color: colors.text }]}>
        {scheduled.title ?? templateName ?? 'Séance planifiée'}
      </Text>

      <TouchableOpacity
        style={[styles.startBtn, { backgroundColor: blockColor, borderRadius: radius.md }]}
        onPress={onStart}
        activeOpacity={0.85}
      >
        <Ionicons name="play" size={16} color="#000" />
        <Text style={[styles.startBtnText, { color: '#000' }]}>Lancer la séance</Text>
      </TouchableOpacity>
    </View>
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function TodayReadinessBadge({ onOpenModal }: { onOpenModal: () => void }) {
  const { theme: { colors, radius } } = useTheme();
  const entries = useDailyReadiness();
  const today = new Date();
  const todayEntry = entries.find(e => isSameDay(e.recordedAt, today));

  if (todayEntry) {
    const score = readinessScore(todayEntry);
    let dotColor: string;
    if (score >= 3.5) dotColor = colors.success;
    else if (score >= 2.5) dotColor = colors.warning;
    else dotColor = colors.danger;

    return (
      <View style={[styles.readinessBadge, {
        backgroundColor: dotColor + '15',
        borderColor: dotColor + '40',
        borderRadius: radius.sm,
      }]}>
        <View style={[styles.readinessDot, { backgroundColor: dotColor }]} />
        <Text style={[styles.readinessBadgeText, { color: dotColor }]}>
          {Math.round(score * 10) / 10} / 5 — Forme évaluée
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.readinessBadge, {
        backgroundColor: colors.accentDim,
        borderColor: colors.borderAccent + '44',
        borderRadius: radius.sm,
      }]}
      onPress={onOpenModal}
      activeOpacity={0.8}
    >
      <Ionicons name="heart-outline" size={13} color={colors.accent} />
      <Text style={[styles.readinessBadgeText, { color: colors.accent }]}>
        Évaluer ta forme →
      </Text>
    </TouchableOpacity>
  );
}

function NoSessionView({
  scheduled,
  templateName,
  onStartPlanned,
  onStartFree,
}: {
  scheduled: ScheduledSession | null;
  templateName: string | null;
  onStartPlanned: () => void;
  onStartFree: () => void;
}) {
  const { theme: { colors, radius, mode } } = useTheme();
  const isNeo = mode === 'neo';
  const [showReadinessModal, setShowReadinessModal] = useState(false);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <DateHeader />
      <View style={{ paddingHorizontal: 16, paddingTop: 10, gap: 8 }}>
        <ActiveMesocycleBanner />
        <TodayReadinessBadge onOpenModal={() => setShowReadinessModal(true)} />
      </View>
      <ReadinessModal visible={showReadinessModal} onClose={() => setShowReadinessModal(false)} />

      <View style={styles.centerZone}>
        <View style={[styles.iconRing, {
          borderColor: colors.border,
          borderRadius: isNeo ? 8 : 48,
        }]}>
          <Ionicons name="barbell-outline" size={40} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text, letterSpacing: isNeo ? 1 : 0 }]}>
          {isNeo ? 'PRÊT À ENTRAÎNER' : 'Prêt à s\'entraîner ?'}
        </Text>

        {scheduled ? (
          <>
            <TodayPlannedCard
              scheduled={scheduled}
              templateName={templateName}
              onStart={onStartPlanned}
            />
            <TouchableOpacity onPress={onStartFree} activeOpacity={0.7} style={styles.freeLink}>
              <Text style={[styles.freeLinkText, { color: colors.textMuted }]}>
                Démarrer une séance libre à la place
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Aucune séance planifiée. Lance une séance libre ou configure ton planning.
            </Text>
            <TouchableOpacity
              style={[styles.startFreeBtn, {
                backgroundColor: colors.accent,
                borderRadius: radius.md,
                shadowColor: colors.accent,
                shadowOpacity: isNeo ? 0.4 : 0,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: isNeo ? 6 : 0,
              }]}
              onPress={onStartFree}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={18} color="#000" />
              <Text style={[styles.startBtnText, { color: '#000' }]}>Séance libre</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

export default function TodayScreen() {
  const { theme: { colors } } = useTheme();
  const session = useActiveSession();
  const today = new Date();
  const scheduledToday = useScheduledSessionsForDate(today);
  const templates = useWorkoutTemplates();

  if (session === undefined) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (session !== null) {
    return <ActiveSessionView session={session} />;
  }

  const nextScheduled = scheduledToday.find(s => s.sessionId == null) ?? null;
  const templateName = nextScheduled?.templateId
    ? (templates.find(t => t.id === nextScheduled.templateId)?.name ?? null)
    : null;

  const handleStartPlanned = async () => {
    if (!nextScheduled) return;
    if (nextScheduled.templateId) {
      const tmpl = templates.find(t => t.id === nextScheduled.templateId);
      if (tmpl) { await startFromTemplate(tmpl, nextScheduled); return; }
    }
    const s = await startSession();
    await nextScheduled.update(p => { p.sessionId = s.id; });
  };

  return (
    <NoSessionView
      scheduled={nextScheduled}
      templateName={templateName}
      onStartPlanned={handleStartPlanned}
      onStartFree={startSession}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayName: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  dateNum: { fontSize: 22, fontWeight: '800' },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  streakText: { fontSize: 12, fontWeight: '700' },
  centerZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  iconRing: {
    width: 96,
    height: 96,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  plannedCard: {
    width: '100%',
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  plannedCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  blockBadge: { paddingHorizontal: 8, paddingVertical: 3 },
  blockBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  plannedLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  plannedTitle: { fontSize: 20, fontWeight: '800' },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 13,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  startFreeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  startBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  freeLink: { paddingVertical: 4 },
  freeLinkText: { fontSize: 13, textDecorationLine: 'underline' },
  mesoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 8,
  },
  mesoBannerLeft: { flex: 1, gap: 2 },
  mesoBannerType: { fontSize: 9, fontWeight: '800' },
  mesoBannerName: { fontSize: 13, fontWeight: '700' },
  mesoBannerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deloadPill: { paddingHorizontal: 7, paddingVertical: 2 },
  deloadText: { fontSize: 11, fontWeight: '800' },
  weekBadge: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  readinessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  readinessDot: { width: 8, height: 8, borderRadius: 4 },
  readinessBadgeText: { fontSize: 13, fontWeight: '600', flex: 1 },
});

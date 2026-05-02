import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useScheduledSessionsInRange } from '@/hooks/useScheduledSessions';
import { useSessions } from '@/hooks/useSessions';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { deleteScheduledSession, startFromTemplate } from '@/features/planning/planningActions';
import { startSession } from '@/features/session/sessionActions';
import { useActiveSession } from '@/hooks/useActiveSession';
import ScheduleModal from '@/features/planning/ScheduleModal';
import TemplateEditor from '@/features/planning/TemplateEditor';
import CreateMesocycleWizard from '@/features/planning/CreateMesocycleWizard';
import CreateMacrocycleModal from '@/features/planning/CreateMacrocycleModal';
import MesocycleTimeline from '@/features/planning/MesocycleTimeline';
import { BLOCK_COLORS, BLOCK_LABELS } from '@/features/planning/blockUtils';
import { useMesocycles } from '@/hooks/useMesocycles';
import { useMacrocycles } from '@/hooks/useMacrocycles';
import { formatDate, formatDuration, formatTime } from '@/utils/format';
import type WorkoutTemplate from '@/db/models/WorkoutTemplate';
import type ScheduledSession from '@/db/models/ScheduledSession';
import type Session from '@/db/models/Session';

// ── Semaine helpers ──────────────────────────────────────────────────────────

function getWeekDays(baseMonday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(baseMonday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// ── Week Calendar ────────────────────────────────────────────────────────────

interface WeekCalendarProps {
  monday: Date;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  scheduledByDay: Map<string, number>;
  completedByDay: Map<string, number>;
}

function WeekCalendar({
  monday,
  selectedDate,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  scheduledByDay,
  completedByDay,
}: WeekCalendarProps) {
  const { theme: { colors } } = useTheme();
  const today = new Date();
  const days = getWeekDays(monday);

  const monthLabel = monday.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <View style={[styles.calendarWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      {/* Month nav */}
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={onPrevWeek} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: colors.text }]}>{monthLabel}</Text>
        <TouchableOpacity onPress={onNextWeek} hitSlop={12}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Days */}
      <View style={styles.daysRow}>
        {days.map((day, idx) => {
          const key = day.toISOString().split('T')[0];
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const hasScheduled = (scheduledByDay.get(key) ?? 0) > 0;
          const hasCompleted = (completedByDay.get(key) ?? 0) > 0;

          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.dayCell,
                isSelected && { backgroundColor: colors.accent + '22', borderRadius: 12 },
              ]}
              onPress={() => onSelectDate(day)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayName, { color: isToday ? colors.accent : colors.textMuted }]}>
                {DAY_LABELS[idx]}
              </Text>
              <View style={[
                styles.dayNumber,
                isToday && { backgroundColor: colors.accent },
                isSelected && !isToday && { backgroundColor: colors.accent + '40' },
              ]}>
                <Text style={[
                  styles.dayNumberText,
                  { color: isToday ? '#fff' : isSelected ? colors.accent : colors.text },
                ]}>
                  {day.getDate()}
                </Text>
              </View>
              {/* Dots */}
              <View style={styles.dotRow}>
                {hasCompleted && <View style={[styles.dot, { backgroundColor: colors.success }]} />}
                {hasScheduled && <View style={[styles.dot, { backgroundColor: colors.accent }]} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Scheduled session card ───────────────────────────────────────────────────

function ScheduledCard({
  scheduled,
  templateName,
  onStart,
  onDelete,
}: {
  scheduled: ScheduledSession;
  templateName: string | null;
  onStart: () => void;
  onDelete: () => void;
}) {
  const { theme: { colors } } = useTheme();
  const blockColor = scheduled.blockType ? BLOCK_COLORS[scheduled.blockType] : colors.accent;
  const blockLabel = scheduled.blockType ? BLOCK_LABELS[scheduled.blockType] : null;
  const isStarted = scheduled.sessionId != null;
  const vol = scheduled.volumePct;
  const volColor = vol != null && vol <= 70 ? '#8B5CF6' : vol != null && vol >= 110 ? '#EF4444' : colors.textMuted;

  return (
    <View style={[styles.sessionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.sessionCardAccent, { backgroundColor: blockColor }]} />
      <View style={styles.sessionCardContent}>
        <View style={styles.sessionCardTop}>
          <Text style={[styles.sessionCardTitle, { color: colors.text }]} numberOfLines={1}>
            {scheduled.title ?? templateName ?? 'Séance libre'}
          </Text>
          <TouchableOpacity onPress={onDelete} hitSlop={12}>
            <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={styles.sessionCardMeta}>
          {blockLabel && (
            <View style={[styles.blockBadge, { backgroundColor: blockColor + '22' }]}>
              <Text style={[styles.blockBadgeText, { color: blockColor }]}>{blockLabel}</Text>
            </View>
          )}
          {vol != null && (
            <Text style={[styles.volBadge, { color: volColor }]}>{vol}% vol.</Text>
          )}
          {isStarted ? (
            <View style={[styles.startedBadge, { backgroundColor: colors.success + '22' }]}>
              <Ionicons name="checkmark-circle" size={13} color={colors.success} />
              <Text style={[styles.startedText, { color: colors.success }]}>Terminée</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: colors.accent }]}
              onPress={onStart}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={13} color="#fff" />
              <Text style={styles.startBtnText}>Démarrer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Completed session card ───────────────────────────────────────────────────

function CompletedCard({ session }: { session: Session }) {
  const { theme: { colors } } = useTheme();
  const duration = session.endedAt
    ? formatDuration(session.endedAt.getTime() - session.startedAt.getTime())
    : null;

  return (
    <TouchableOpacity
      style={[styles.sessionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.75}
      onPress={() => router.push(`/session/${session.id}`)}
    >
      <View style={[styles.sessionCardAccent, { backgroundColor: colors.success }]} />
      <View style={styles.sessionCardContent}>
        <View style={styles.sessionCardTop}>
          <Text style={[styles.sessionCardTitle, { color: colors.text }]} numberOfLines={1}>
            {session.name ?? 'Séance libre'}
          </Text>
          {duration && (
            <Text style={[styles.durationText, { color: colors.textMuted }]}>{duration}</Text>
          )}
        </View>
        <Text style={[styles.sessionTime, { color: colors.textMuted }]}>
          {formatTime(session.startedAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onEdit,
}: {
  template: WorkoutTemplate;
  onEdit: () => void;
}) {
  const { theme: { colors } } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.templateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onEdit}
      activeOpacity={0.7}
    >
      <Ionicons name="clipboard-outline" size={20} color={colors.accent} />
      <Text style={[styles.templateCardName, { color: colors.text }]} numberOfLines={1}>
        {template.name}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

type TabMode = 'calendar' | 'blocs' | 'templates';

export default function PlanningScreen() {
  const { theme: { colors, mode } } = useTheme();
  const isNeo = mode === 'neo';
  const activeSession = useActiveSession();
  const templates = useWorkoutTemplates();
  const mesocycles = useMesocycles();
  const macrocycles = useMacrocycles();

  const [tab, setTab] = useState<TabMode>('calendar');
  const [monday, setMonday] = useState(() => getMonday(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null | undefined>(undefined);
  const [showMesoWizard, setShowMesoWizard] = useState(false);
  const [showMacroModal, setShowMacroModal] = useState(false);
  const [mesoRefreshKey, setMesoRefreshKey] = useState(0);

  const weekEnd = new Date(monday);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const scheduledSessions = useScheduledSessionsInRange(monday, weekEnd);
  const completedSessions = useSessions();

  // Build dot maps for calendar
  const scheduledByDay = new Map<string, number>();
  for (const s of scheduledSessions) {
    const key = s.plannedDate.toISOString().split('T')[0];
    scheduledByDay.set(key, (scheduledByDay.get(key) ?? 0) + 1);
  }
  const completedByDay = new Map<string, number>();
  for (const s of completedSessions) {
    if (s.startedAt >= monday && s.startedAt <= weekEnd) {
      const key = s.startedAt.toISOString().split('T')[0];
      completedByDay.set(key, (completedByDay.get(key) ?? 0) + 1);
    }
  }

  const selectedKey = selectedDate.toISOString().split('T')[0];

  const dayScheduled = scheduledSessions.filter(
    s => s.plannedDate.toISOString().split('T')[0] === selectedKey,
  );
  const dayCompleted = completedSessions.filter(
    s => s.startedAt.toISOString().split('T')[0] === selectedKey,
  );

  const handleStartScheduled = useCallback(
    async (scheduled: ScheduledSession) => {
      if (activeSession) {
        Alert.alert('Séance déjà en cours', 'Termine ta séance actuelle avant d\'en démarrer une nouvelle.');
        return;
      }
      if (scheduled.templateId) {
        const template = templates.find(t => t.id === scheduled.templateId);
        if (template) {
          await startFromTemplate(template, scheduled);
          return;
        }
      }
      const session = await startSession();
      await scheduled.update(s => { s.sessionId = session.id; });
    },
    [activeSession, templates],
  );

  const handleDeleteScheduled = useCallback((scheduled: ScheduledSession) => {
    Alert.alert('Supprimer ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteScheduledSession(scheduled) },
    ]);
  }, []);

  const templateMap = Object.fromEntries(templates.map(t => [t.id, t.name]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPast = selectedDate < today;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['calendar', 'blocs', 'templates'] as TabMode[]).map(t => {
          const label = t === 'calendar' ? 'Calendrier' : t === 'blocs' ? 'Blocs' : 'Templates';
          const active = tab === t;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, active && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, { color: active ? colors.accent : colors.textMuted, letterSpacing: isNeo ? 0.5 : 0 }]}>
                {isNeo ? label.toUpperCase() : label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {tab === 'blocs' ? (
        <>
          <MesocycleTimeline
            mesocycles={mesocycles}
            macrocycles={macrocycles}
            onCreateMeso={() => setShowMesoWizard(true)}
            onCreateMacro={() => setShowMacroModal(true)}
            refreshKey={mesoRefreshKey}
            onRefresh={() => setMesoRefreshKey(k => k + 1)}
          />
          <CreateMesocycleWizard
            visible={showMesoWizard}
            onClose={() => setShowMesoWizard(false)}
          />
          <CreateMacrocycleModal
            visible={showMacroModal}
            onClose={() => setShowMacroModal(false)}
          />
        </>
      ) : tab === 'calendar' ? (
        <>
          <WeekCalendar
            monday={monday}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onPrevWeek={() => setMonday(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
            onNextWeek={() => setMonday(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
            scheduledByDay={scheduledByDay}
            completedByDay={completedByDay}
          />

          {/* Day detail */}
          <ScrollView style={styles.dayDetail} contentContainerStyle={styles.dayDetailContent}>
            <View style={styles.dayDetailHeader}>
              <Text style={[styles.dayDetailTitle, { color: colors.text }]}>
                {formatDate(selectedDate)}
              </Text>
              {!isPast && (
                <TouchableOpacity
                  style={[styles.addDayBtn, { backgroundColor: colors.accent }]}
                  onPress={() => setShowScheduleModal(true)}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.addDayBtnText}>Planifier</Text>
                </TouchableOpacity>
              )}
            </View>

            {dayScheduled.map(s => (
              <ScheduledCard
                key={s.id}
                scheduled={s}
                templateName={s.templateId ? (templateMap[s.templateId] ?? null) : null}
                onStart={() => handleStartScheduled(s)}
                onDelete={() => handleDeleteScheduled(s)}
              />
            ))}

            {dayCompleted.map(s => (
              <CompletedCard key={s.id} session={s} />
            ))}

            {dayScheduled.length === 0 && dayCompleted.length === 0 && (
              isPast ? (
                <View style={styles.emptyDay}>
                  <Text style={[styles.emptyDayText, { color: colors.textMuted }]}>
                    Pas de séance ce jour-là.
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyDayFuture}>
                  <Ionicons name="calendar-outline" size={48} color={colors.border} />
                  <Text style={[styles.emptyDayTitle, { color: colors.text }]}>
                    Aucune séance planifiée
                  </Text>
                  <TouchableOpacity
                    style={[styles.planBtn, { backgroundColor: colors.accent, borderRadius: 10 }]}
                    onPress={() => setShowScheduleModal(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={styles.planBtnText}>Planifier une séance</Text>
                  </TouchableOpacity>
                </View>
              )
            )}
          </ScrollView>

          <ScheduleModal
            visible={showScheduleModal}
            date={selectedDate}
            onClose={() => setShowScheduleModal(false)}
          />
        </>
      ) : (
        <>
          <FlatList
            data={templates}
            keyExtractor={t => t.id}
            renderItem={({ item }) => (
              <TemplateCard template={item} onEdit={() => setEditingTemplate(item)} />
            )}
            contentContainerStyle={styles.templateList}
            ListEmptyComponent={
              <View style={styles.emptyDay}>
                <Ionicons name="clipboard-outline" size={48} color={colors.border} />
                <Text style={[styles.emptyDayText, { color: colors.textMuted }]}>
                  Aucun template. Crée ton premier programme !
                </Text>
              </View>
            }
          />

          {/* FAB créer template */}
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.accent }]}
            onPress={() => setEditingTemplate(null)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={30} color="#fff" />
          </TouchableOpacity>

          <TemplateEditor
            template={editingTemplate ?? null}
            visible={editingTemplate !== undefined}
            onClose={() => setEditingTemplate(undefined)}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 15, fontWeight: '600' },
  calendarWrap: {
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  monthLabel: { fontSize: 15, fontWeight: '600', textTransform: 'capitalize' },
  daysRow: { flexDirection: 'row', paddingHorizontal: 8 },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: 6, gap: 4 },
  dayName: { fontSize: 11, fontWeight: '600' },
  dayNumber: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  dayNumberText: { fontSize: 14, fontWeight: '700' },
  dotRow: { flexDirection: 'row', gap: 3, height: 6 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dayDetail: { flex: 1 },
  dayDetailContent: { padding: 16, paddingBottom: 40 },
  dayDetailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  dayDetailTitle: { fontSize: 16, fontWeight: '700', textTransform: 'capitalize' },
  addDayBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  addDayBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  sessionCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  sessionCardAccent: { width: 4 },
  sessionCardContent: { flex: 1, padding: 12 },
  sessionCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sessionCardTitle: { fontSize: 15, fontWeight: '600', flex: 1 },
  sessionCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blockBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  blockBadgeText: { fontSize: 11, fontWeight: '700' },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7 },
  startBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  startedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  startedText: { fontSize: 11, fontWeight: '600' },
  volBadge: { fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  durationText: { fontSize: 13 },
  sessionTime: { fontSize: 12 },
  emptyDay: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyDayText: { fontSize: 14, textAlign: 'center' },
  emptyDayFuture: { alignItems: 'center', paddingTop: 48, gap: 16 },
  emptyDayTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  planBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 11 },
  planBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  templateList: { padding: 16, paddingBottom: 100 },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  templateCardName: { flex: 1, fontSize: 16, fontWeight: '500' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

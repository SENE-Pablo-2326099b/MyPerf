import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useSessionExercises } from '@/hooks/useSessionExercises';
import { addExerciseToSession, endSession } from './sessionActions';
import ExerciseInstanceCard from './ExerciseInstanceCard';
import ExercisePicker from './ExercisePicker';
import RestTimer from './RestTimer';
import { formatDuration } from '@/utils/format';
import type Session from '@/db/models/Session';
import type Exercise from '@/db/models/Exercise';
import type { Intention } from '@/db/models/ExerciseInstance';

interface Props {
  session: Session;
}

export default function ActiveSessionView({ session }: Props) {
  const { theme: { colors, radius, mode } } = useTheme();
  const isNeo = mode === 'neo';
  const instances = useSessionExercises(session.id);
  const [showPicker, setShowPicker] = useState(false);
  const [elapsed, setElapsed] = useState(() => Date.now() - session.startedAt.getTime());
  const [restIntention, setRestIntention] = useState<Intention | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Date.now() - session.startedAt.getTime());
    }, 1000);
    return () => clearInterval(id);
  }, [session.startedAt]);

  const handleSelectExercise = useCallback(
    async (exercise: Exercise) => {
      setShowPicker(false);
      await addExerciseToSession(session, exercise, instances.length);
    },
    [session, instances.length],
  );

  const handleSetComplete = useCallback((intention: Intention) => {
    setRestIntention(intention);
  }, []);

  const confirmEnd = useCallback(async () => {
    await endSession(session, sessionNotes);
    setShowEndModal(false);
  }, [session, sessionNotes]);

  const completedSets = instances.length; // proxy for busyness

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, {
        backgroundColor: colors.surface,
        borderBottomColor: isNeo ? colors.accent + '30' : colors.border,
        borderBottomWidth: isNeo ? 1 : StyleSheet.hairlineWidth,
      }]}>
        {/* Timer + live dot */}
        <View style={styles.timerBlock}>
          <View style={[styles.liveDot, {
            backgroundColor: colors.success,
            shadowColor: colors.success,
            shadowOpacity: 0.8,
            shadowRadius: isNeo ? 6 : 3,
            shadowOffset: { width: 0, height: 0 },
          }]} />
          <Text style={[styles.timer, { color: colors.text, letterSpacing: isNeo ? 3 : 1 }]}>
            {formatDuration(elapsed)}
          </Text>
        </View>

        {/* Session info */}
        <View style={styles.headerCenter}>
          <Text style={[styles.sessionName, { color: colors.text }]} numberOfLines={1}>
            {session.name ?? 'Séance libre'}
          </Text>
          <Text style={[styles.headerMeta, { color: colors.textMuted }]}>
            {instances.length} exercice{instances.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* End button */}
        <TouchableOpacity
          style={[styles.endBtn, {
            backgroundColor: colors.danger + '18',
            borderColor: colors.danger + '50',
            borderRadius: radius.md,
          }]}
          onPress={() => setShowEndModal(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="stop-circle-outline" size={14} color={colors.danger} />
          <Text style={[styles.endBtnText, { color: colors.danger, letterSpacing: isNeo ? 0.8 : 0 }]}>
            {isNeo ? 'FIN' : 'Fin'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {instances.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, {
              borderColor: colors.accent + '40',
              borderRadius: isNeo ? 8 : 48,
              backgroundColor: colors.accent + '0C',
            }]}>
              <Ionicons name="barbell-outline" size={44} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Séance en cours</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Appuie sur <Text style={{ color: colors.accent, fontWeight: '700' }}>+</Text> pour ajouter ton premier exercice.
            </Text>
          </View>
        ) : (
          instances.map(instance => (
            <ExerciseInstanceCard
              key={instance.id}
              instance={instance}
              onSetComplete={handleSetComplete}
            />
          ))
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[styles.fab, {
          backgroundColor: colors.accent,
          borderRadius: isNeo ? 10 : 30,
          shadowColor: colors.accent,
          shadowOpacity: 0.45,
          shadowRadius: isNeo ? 20 : 10,
          shadowOffset: { width: 0, height: 5 },
          elevation: 10,
        }]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={22} color="#000" />
        <Text style={styles.fabLabel}>Exercice</Text>
      </TouchableOpacity>

      {/* ── Rest timer ── */}
      {restIntention && (
        <RestTimer
          intention={restIntention}
          onDismiss={() => setRestIntention(null)}
        />
      )}

      {/* ── End session modal with notes ── */}
      <Modal visible={showEndModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.lg,
          }]}>
            <Text style={[styles.modalTitle, { color: colors.text, letterSpacing: isNeo ? 1 : 0 }]}>
              {isNeo ? 'TERMINER LA SÉANCE' : 'Terminer la séance ?'}
            </Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Durée : {formatDuration(elapsed)} · {instances.length} exercice{instances.length !== 1 ? 's' : ''}
            </Text>

            <TextInput
              style={[styles.notesInput, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
                borderRadius: radius.sm,
              }]}
              placeholder="Notes de séance (optionnel)…"
              placeholderTextColor={colors.textMuted}
              value={sessionNotes}
              onChangeText={setSessionNotes}
              multiline
              maxLength={400}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border, borderRadius: radius.sm }]}
                onPress={() => setShowEndModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Continuer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.accent, borderRadius: radius.sm }]}
                onPress={confirmEnd}
              >
                <Text style={[styles.modalConfirmText, { color: '#000' }]}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ExercisePicker
        visible={showPicker}
        onSelect={handleSelectExercise}
        onClose={() => setShowPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
  },
  timerBlock: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  timer: { fontSize: 32, fontWeight: '800', fontVariant: ['tabular-nums'] },
  headerCenter: { flex: 1, gap: 1 },
  sessionName: { fontSize: 13, fontWeight: '700' },
  headerMeta: { fontSize: 11 },
  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  endBtnText: { fontSize: 12, fontWeight: '800' },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 12, paddingBottom: 120 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 16, paddingHorizontal: 40 },
  emptyIcon: { width: 88, height: 88, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  fabLabel: { fontSize: 14, fontWeight: '800', color: '#000' },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    borderWidth: 1,
    padding: 24,
    gap: 14,
  },
  modalTitle: { fontSize: 16, fontWeight: '800' },
  modalSub: { fontSize: 13 },
  notesInput: {
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancelBtn: { flex: 1, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600' },
  modalConfirmBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  modalConfirmText: { fontSize: 14, fontWeight: '800' },
});

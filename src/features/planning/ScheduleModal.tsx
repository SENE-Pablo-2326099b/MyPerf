import { useCallback, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { scheduleSession } from './planningActions';
import { BLOCK_COLORS, BLOCK_LABELS, BLOCK_LIST, type BlockType } from './blockUtils';
import { formatDate } from '@/utils/format';

interface Props {
  visible: boolean;
  date: Date;
  onClose: () => void;
}

export default function ScheduleModal({ visible, date, onClose }: Props) {
  const { theme: { colors } } = useTheme();
  const templates = useWorkoutTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<BlockType | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const tmpl = templates.find(t => t.id === selectedTemplateId);
      await scheduleSession(date, selectedTemplateId, selectedBlock, tmpl?.name);
      onClose();
      setSelectedTemplateId(null);
      setSelectedBlock(null);
    } finally {
      setSaving(false);
    }
  }, [date, selectedTemplateId, selectedBlock, templates, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={16}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Planifier une séance</Text>
            <Text style={[styles.headerDate, { color: colors.textMuted }]}>
              {formatDate(date)}
            </Text>
          </View>
          <TouchableOpacity onPress={handleSave} disabled={saving} hitSlop={16}>
            <Text style={[styles.saveBtn, { color: saving ? colors.textMuted : colors.accent }]}>
              {saving ? '…' : 'Ajouter'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Template selection */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>TEMPLATE (optionnel)</Text>

          {/* Free session option */}
          <TouchableOpacity
            style={[
              styles.templateRow,
              {
                backgroundColor: selectedTemplateId === null ? colors.accent + '18' : colors.surface,
                borderColor: selectedTemplateId === null ? colors.accent : colors.border,
              },
            ]}
            onPress={() => setSelectedTemplateId(null)}
            activeOpacity={0.7}
          >
            <Ionicons name="flash-outline" size={20} color={selectedTemplateId === null ? colors.accent : colors.textMuted} />
            <Text style={[styles.templateName, { color: selectedTemplateId === null ? colors.accent : colors.text }]}>
              Séance libre
            </Text>
            {selectedTemplateId === null && (
              <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
            )}
          </TouchableOpacity>

          {templates.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.templateRow,
                {
                  backgroundColor: selectedTemplateId === t.id ? colors.accent + '18' : colors.surface,
                  borderColor: selectedTemplateId === t.id ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setSelectedTemplateId(t.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="clipboard-outline" size={20} color={selectedTemplateId === t.id ? colors.accent : colors.textMuted} />
              <Text style={[styles.templateName, { color: selectedTemplateId === t.id ? colors.accent : colors.text }]} numberOfLines={1}>
                {t.name}
              </Text>
              {selectedTemplateId === t.id && (
                <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
              )}
            </TouchableOpacity>
          ))}

          {/* Block type */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: 24 }]}>
            TYPE DE BLOC (optionnel)
          </Text>
          <View style={styles.blockGrid}>
            {BLOCK_LIST.map(bt => {
              const active = selectedBlock === bt;
              const color = BLOCK_COLORS[bt];
              return (
                <TouchableOpacity
                  key={bt}
                  style={[
                    styles.blockChip,
                    { backgroundColor: active ? color : color + '18', borderColor: active ? color : color + '44' },
                  ]}
                  onPress={() => setSelectedBlock(prev => (prev === bt ? null : bt))}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.blockText, { color: active ? '#fff' : color }]}>
                    {BLOCK_LABELS[bt]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  headerDate: { fontSize: 13, textAlign: 'center', textTransform: 'capitalize' },
  saveBtn: { fontSize: 16, fontWeight: '600' },
  scroll: { padding: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  templateName: { flex: 1, fontSize: 15, fontWeight: '500' },
  blockGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  blockChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  blockText: { fontSize: 14, fontWeight: '700' },
});

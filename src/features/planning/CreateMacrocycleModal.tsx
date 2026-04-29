import React, { useState } from 'react';
import {
  Alert,
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
import { createMacrocycle } from './mesocycleActions';

const MONTH_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

function fmtDate(d: Date): string {
  return `${d.getDate()} ${MONTH_FR[d.getMonth()]} ${d.getFullYear()}`;
}

function InlineDatePicker({ label, value, onChange }: {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
}) {
  const { theme: { colors, radius } } = useTheme();
  const adjust = (days: number) => {
    const d = new Date(value);
    d.setDate(d.getDate() + days);
    onChange(d);
  };

  return (
    <View style={styles.datePickerWrap}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <View style={[styles.datePicker, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.sm }]}>
        <TouchableOpacity onPress={() => adjust(-30)} style={styles.adjBtn} hitSlop={6}>
          <Text style={[styles.adjText, { color: colors.textMuted }]}>«</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => adjust(-7)} style={styles.adjBtn} hitSlop={6}>
          <Text style={[styles.adjText, { color: colors.textMuted }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.dateDisplay, { color: colors.text }]}>{fmtDate(value)}</Text>
        <TouchableOpacity onPress={() => adjust(7)} style={styles.adjBtn} hitSlop={6}>
          <Text style={[styles.adjText, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => adjust(30)} style={styles.adjBtn} hitSlop={6}>
          <Text style={[styles.adjText, { color: colors.textMuted }]}>»</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CreateMacrocycleModal({ visible, onClose }: Props) {
  const { theme: { colors, radius, mode } } = useTheme();
  const isNeo = mode === 'neo';

  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState<Date>(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 6); d.setHours(0, 0, 0, 0); return d;
  });
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName('');
    setGoal('');
    const d = new Date(); d.setHours(0, 0, 0, 0);
    setStartDate(d);
    setHasEndDate(false);
    const e = new Date(); e.setMonth(e.getMonth() + 6); e.setHours(0, 0, 0, 0);
    setEndDate(e);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Nom manquant', 'Donne un nom à ton macrocycle.');
      return;
    }
    setLoading(true);
    try {
      await createMacrocycle(
        name,
        goal.trim() || null,
        startDate,
        hasEndDate ? endDate : null,
      );
      handleClose();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} hitSlop={12}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, letterSpacing: isNeo ? 1.5 : 0 }]}>
            {isNeo ? 'NOUVEAU MACROCYCLE' : 'Nouveau macrocycle'}
          </Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
          <View style={[styles.infoBox, { backgroundColor: colors.accentDim, borderRadius: radius.sm }]}>
            <Ionicons name="layers-outline" size={14} color={colors.accent} />
            <Text style={[styles.infoText, { color: colors.accent }]}>
              Un macrocycle est un plan sur plusieurs mois regroupant plusieurs mésocycles (blocs de périodisation).
            </Text>
          </View>

          {/* Nom */}
          <Text style={[styles.label, { color: colors.textMuted }]}>Nom *</Text>
          <TextInput
            style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.sm }]}
            value={name}
            onChangeText={setName}
            placeholder="Ex : Prépa compétition, Prise de masse 2026…"
            placeholderTextColor={colors.textMuted}
            maxLength={60}
            autoFocus
          />

          {/* Objectif */}
          <Text style={[styles.label, { color: colors.textMuted }]}>Objectif (optionnel)</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.sm }]}
            value={goal}
            onChangeText={setGoal}
            placeholder="Descris ton objectif principal…"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={200}
          />

          {/* Date début */}
          <InlineDatePicker label="Début" value={startDate} onChange={setStartDate} />

          {/* Date fin (toggle) */}
          <TouchableOpacity
            style={[styles.toggleRow, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.sm }]}
            onPress={() => setHasEndDate(v => !v)}
            activeOpacity={0.7}
          >
            <View style={[styles.toggleCheck, {
              borderColor: hasEndDate ? colors.accent : colors.border,
              backgroundColor: hasEndDate ? colors.accent : 'transparent',
              borderRadius: 4,
            }]}>
              {hasEndDate && <Ionicons name="checkmark" size={12} color="#000" />}
            </View>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>Définir une date de fin</Text>
          </TouchableOpacity>

          {hasEndDate && (
            <InlineDatePicker label="Fin" value={endDate} onChange={setEndDate} />
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.border, borderRadius: radius.sm }]}
            onPress={handleClose}
          >
            <Text style={[styles.cancelBtnText, { color: colors.text }]}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: loading ? colors.border : colors.accent, borderRadius: radius.sm }]}
            onPress={handleCreate}
            disabled={loading}
          >
            <Ionicons name="layers-outline" size={16} color="#000" />
            <Text style={[styles.createBtnText, { letterSpacing: isNeo ? 0.8 : 0 }]}>
              {loading ? 'Création…' : isNeo ? 'CRÉER' : 'Créer le macrocycle'}
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 14, fontWeight: '800' },
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 40, gap: 12 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  textInput: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '500',
  },
  notesInput: { minHeight: 72, textAlignVertical: 'top' },

  datePickerWrap: { gap: 6 },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  adjBtn: { padding: 8 },
  adjText: { fontSize: 16, fontWeight: '700' },
  dateDisplay: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700' },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
  },
  toggleCheck: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: { fontSize: 14, fontWeight: '500' },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600' },
  createBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
  },
  createBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
});

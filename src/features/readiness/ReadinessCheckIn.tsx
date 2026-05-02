import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { addReadiness } from './readinessActions';

interface Props {
  onSaved?: () => void;
}

interface RatingRowProps {
  emoji: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  inverseColor?: boolean; // true = higher value → danger color
}

function RatingRow({ emoji, label, value, onChange, inverseColor }: RatingRowProps) {
  const { theme: { colors, radius } } = useTheme();

  function dotColor(level: number): string {
    if (value !== level) return 'transparent';
    if (inverseColor) {
      if (level <= 2) return colors.success;
      if (level === 3) return colors.warning;
      return colors.danger;
    } else {
      if (level >= 4) return colors.success;
      if (level === 3) return colors.warning;
      return colors.danger;
    }
  }

  function dotBorderColor(level: number): string {
    if (inverseColor) {
      if (level <= 2) return colors.success;
      if (level === 3) return colors.warning;
      return colors.danger;
    } else {
      if (level >= 4) return colors.success;
      if (level === 3) return colors.warning;
      return colors.danger;
    }
  }

  return (
    <View style={styles.ratingRow}>
      <Text style={styles.ratingEmoji}>{emoji}</Text>
      <Text style={[styles.ratingLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.ratingDots}>
        {[1, 2, 3, 4, 5].map(level => (
          <TouchableOpacity
            key={level}
            onPress={() => onChange(level)}
            style={[styles.ratingDot, {
              backgroundColor: dotColor(level),
              borderColor: dotBorderColor(level),
              borderRadius: radius.sm,
            }]}
          >
            <Text style={[styles.ratingDotText, {
              color: value === level ? '#000' : dotBorderColor(level),
              opacity: value === level ? 1 : 0.5,
            }]}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function ReadinessCheckIn({ onSaved }: Props) {
  const { theme: { colors, radius } } = useTheme();
  const [sleep, setSleep] = useState(0);
  const [soreness, setSoreness] = useState(0);
  const [stress, setStress] = useState(0);
  const [motivation, setMotivation] = useState(0);
  const [notes, setNotes] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const allSelected = sleep > 0 && soreness > 0 && stress > 0 && motivation > 0;

  async function handleSave() {
    if (!allSelected) return;
    setSaving(true);
    try {
      await addReadiness({
        recordedAt: new Date(),
        sleepQuality: sleep,
        soreness,
        stressLevel: stress,
        motivation,
        notes: notes.trim() || null,
      });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <RatingRow emoji="😴" label="Sommeil" value={sleep} onChange={setSleep} />
      <RatingRow emoji="💪" label="Courbatures" value={soreness} onChange={setSoreness} inverseColor />
      <RatingRow emoji="🧠" label="Stress" value={stress} onChange={setStress} inverseColor />
      <RatingRow emoji="🔥" label="Motivation" value={motivation} onChange={setMotivation} />

      {/* Notes toggle */}
      <TouchableOpacity
        style={styles.notesToggle}
        onPress={() => setNotesOpen(o => !o)}
      >
        <Text style={[styles.notesToggleText, { color: colors.textMuted }]}>
          {notesOpen ? '− Notes' : '+ Notes (optionnel)'}
        </Text>
      </TouchableOpacity>

      {notesOpen && (
        <TextInput
          style={[styles.notesInput, {
            color: colors.text,
            borderColor: colors.border,
            borderRadius: radius.sm,
            backgroundColor: colors.surfaceRaised,
          }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Comment tu te sens ?"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={2}
        />
      )}

      <TouchableOpacity
        style={[styles.saveBtn, {
          backgroundColor: allSelected ? colors.accent : colors.border,
          borderRadius: radius.md,
        }]}
        onPress={handleSave}
        disabled={!allSelected || saving}
      >
        <Text style={[styles.saveBtnText, { color: allSelected ? '#000' : colors.textMuted }]}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingEmoji: { fontSize: 18, width: 24 },
  ratingLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  ratingDots: { flexDirection: 'row', gap: 6 },
  ratingDot: {
    width: 30,
    height: 30,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingDotText: { fontSize: 12, fontWeight: '700' },
  notesToggle: { paddingVertical: 4 },
  notesToggleText: { fontSize: 12, fontWeight: '600' },
  notesInput: {
    borderWidth: 1,
    padding: 10,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 60,
  },
  saveBtn: {
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 15, fontWeight: '800' },
});

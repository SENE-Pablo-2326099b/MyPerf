import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { seedDatabase } from '@/db/seed';
import { useTheme } from '@/theme/ThemeProvider';
import type { ThemeSetting } from '@/theme/themes';

const THEME_OPTIONS: Array<{ label: string; sub: string; value: ThemeSetting; icon: string }> = [
  { label: 'Automatique', sub: 'Suit le système', value: 'system', icon: 'phone-portrait-outline' },
  { label: 'Clair', sub: 'Fond blanc', value: 'light', icon: 'sunny-outline' },
  { label: 'Sombre', sub: 'Gris foncé', value: 'dark', icon: 'moon-outline' },
  { label: 'OLED', sub: 'Noir absolu', value: 'oled', icon: 'contrast-outline' },
  { label: 'Néo', sub: 'Bleu-noir · Cyan', value: 'neo', icon: 'flash-outline' },
];

function handleSeed() {
  Alert.alert(
    'Insérer les données de test',
    '18 exercices · 3 templates · 11 séances. À faire uniquement sur une base vide.',
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Insérer',
        style: 'destructive',
        onPress: () =>
          seedDatabase()
            .then(() => Alert.alert('OK', 'Données insérées. Redémarre l\'app.'))
            .catch((e: Error) => Alert.alert('Erreur', e.message)),
      },
    ],
  );
}

export default function SettingsScreen() {
  const { theme: { colors, radius, mode }, themeSetting, setThemeSetting } = useTheme();
  const isNeo = mode === 'neo';

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      {/* Apparence */}
      <Text style={[styles.section, { color: colors.textMuted, letterSpacing: isNeo ? 2 : 0.8 }]}>
        APPARENCE
      </Text>
      {THEME_OPTIONS.map((opt) => {
        const active = themeSetting === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.row, {
              backgroundColor: colors.surface,
              borderColor: active ? colors.accent : colors.border,
              borderRadius: radius.md,
              borderLeftWidth: active && isNeo ? 3 : 1,
              borderLeftColor: active ? colors.accent : colors.border,
            }]}
            onPress={() => setThemeSetting(opt.value)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={opt.icon as any}
              size={18}
              color={active ? colors.accent : colors.textMuted}
            />
            <View style={styles.rowTexts}>
              <Text style={[styles.rowLabel, { color: active ? colors.accent : colors.text }]}>
                {opt.label}
              </Text>
              <Text style={[styles.rowSub, { color: colors.textMuted }]}>{opt.sub}</Text>
            </View>
            {active && (
              <View style={[styles.activeDot, { backgroundColor: colors.accent, borderRadius: isNeo ? 1 : 4 }]} />
            )}
          </TouchableOpacity>
        );
      })}

      {/* Dev tools — masqués en production */}
      {__DEV__ && (
        <>
          <Text style={[styles.section, { color: colors.textMuted, letterSpacing: isNeo ? 2 : 0.8, marginTop: 24 }]}>
            DÉVELOPPEMENT
          </Text>
          <TouchableOpacity
            style={[styles.row, {
              backgroundColor: colors.surface,
              borderColor: colors.danger + '44',
              borderRadius: radius.md,
            }]}
            onPress={handleSeed}
            activeOpacity={0.7}
          >
            <Ionicons name="flask-outline" size={18} color={colors.danger} />
            <View style={styles.rowTexts}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Insérer données de test</Text>
              <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                18 exercices · 3 templates · 11 séances
              </Text>
            </View>
          </TouchableOpacity>
        </>
      )}

      {/* App info */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>MyPerf · v1.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  section: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 10,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  rowTexts: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 1 },
  activeDot: { width: 8, height: 8 },
  footer: { marginTop: 32, alignItems: 'center' },
  footerText: { fontSize: 12 },
});

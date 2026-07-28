import FadeInView from '@/components/ui/FadeInView';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';

/**
 * My Appointments — feature not built yet.
 * Rather than a blank stub, this is a proper themed screen with a header,
 * back button, a designed "coming soon" state, and an escape hatch (Chat).
 * Matches the app's dark cosmic theme (Home / Trending).
 */
export default function MyAppointment() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const goBack = () => {
    if (router.canGoBack?.()) router.back();
    else router.push('/home');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={colors.bgGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={goBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('back')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{t('myAppointment')}</Text>
          <View style={styles.backBtnGhost} />
        </View>
      </View>

      {/* Coming soon state */}
      <FadeInView style={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.iconArea}>
          <View style={styles.iconGlow} />
          <View style={styles.iconRing}>
            <Ionicons name="calendar-outline" size={40} color={colors.gold} />
          </View>
        </View>

        <View style={styles.soonPill}>
          <Text style={styles.soonPillText}>{t('comingSoonLabel') || 'COMING SOON'}</Text>
        </View>

        <Text style={styles.title}>{t('appointmentsComingSoon')}</Text>
        <Text style={styles.subtitle}>{t('appointmentsComingSoonSub')}</Text>

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { transform: [{ scale: 0.97 }], opacity: 0.92 }]}
          onPress={() => router.push('/chat')}
          accessibilityRole="button"
          accessibilityLabel={t('chatWithAstrologerBtn')}
        >
          <LinearGradient
            colors={colors.goldGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaInner}
          >
            <Ionicons name="chatbubbles" size={18} color={colors.onGold} />
            <Text style={styles.ctaText}>{t('chatWithAstrologerBtn')}</Text>
          </LinearGradient>
        </Pressable>
      </FadeInView>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  headerBar: { paddingHorizontal: 16, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.ctrlBorder,
    backgroundColor: colors.ctrlBg,
  },
  backBtnGhost: { width: 40, height: 40 },
  headerTitle: {
    flex: 1, textAlign: 'center', color: colors.text,
    fontWeight: '800', fontSize: 18, marginHorizontal: 8,
  },

  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconArea: {
    width: 108, height: 108,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  iconGlow: {
    position: 'absolute', width: 108, height: 108, borderRadius: 54,
    backgroundColor: 'rgba(228,173,13,0.12)',
  },
  iconRing: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(228,173,13,0.5)',
    backgroundColor: 'rgba(228,173,13,0.05)',
  },
  soonPill: {
    backgroundColor: 'rgba(228,173,13,0.14)',
    borderColor: 'rgba(228,173,13,0.35)', borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
    marginBottom: 16,
  },
  soonPillText: { color: colors.goldText, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: {
    color: colors.text, fontSize: 22, fontWeight: '800',
    textAlign: 'center', marginBottom: 10,
  },
  subtitle: {
    color: colors.textMuted, fontSize: 14.5, lineHeight: 22,
    textAlign: 'center', maxWidth: 320, marginBottom: 30,
  },
  cta: { width: '100%', maxWidth: 320, borderRadius: 14, overflow: 'hidden' },
  ctaInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 15, borderRadius: 14,
  },
  ctaText: { color: colors.onGold, fontWeight: '800', fontSize: 15 },
});

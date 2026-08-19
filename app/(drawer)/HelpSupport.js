import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientScreen from '@/components/ui/GradientScreen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';
import { radius, spacing } from '@/lib/theme';

export default function ContactUsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const EMAIL = 'support@kundlitime.com';
  const ADDRESS =
    'B, 36, Sector 67 Rd, Block B, Sector 67, Noida, Uttar Pradesh 201301';

  const openEmail = () => Linking.openURL(`mailto:${EMAIL}`);
  const openMap = () => {
    const query = encodeURIComponent(ADDRESS);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  return (
    <GradientScreen>
      <ScreenHeader title={t('helpSupport') || 'Help & Support'} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <Text style={styles.title}>{t('contactUs') || 'Contact Us'}</Text>
        <Text style={styles.subtitle}>
          {t('contactUsSub') || 'We’d love to hear from you. Reach us directly through the details below.'}
        </Text>

        {/* Email — tappable */}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={openEmail}
          accessibilityRole="button"
          accessibilityLabel={`Email ${EMAIL}`}
        >
          <View style={[styles.iconRing, { borderColor: colors.goldRing, backgroundColor: 'rgba(228,173,13,0.10)' }]}>
            <Ionicons name="mail" size={20} color={colors.gold} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t('email') || 'Email'}</Text>
            <Text style={styles.cardText}>{EMAIL}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
        </Pressable>

        {/* Address */}
        <View style={styles.card}>
          <View style={[styles.iconRing, { borderColor: colors.goldRing, backgroundColor: 'rgba(228,173,13,0.10)' }]}>
            <Ionicons name="location" size={20} color={colors.gold} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t('address') || 'Address'}</Text>
            <Text style={styles.cardText}>{ADDRESS}</Text>
          </View>
        </View>

        {/* Map CTA */}
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 }]}
          onPress={openMap}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={colors.goldGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaInner}
          >
            <Ionicons name="map" size={19} color={colors.onGold} />
            <Text style={styles.ctaText}>{t('findUsOnMap') || 'Find us on the map'}</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </GradientScreen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  content: { padding: spacing.gutter, paddingTop: 6 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14.5, color: colors.textMuted, marginBottom: 22, lineHeight: 22, maxWidth: '92%' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 14,
  },
  cardPressed: { backgroundColor: colors.surfaceStrong, opacity: 0.95 },
  iconRing: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15.5, fontWeight: '700', color: colors.text, marginBottom: 3 },
  cardText: { fontSize: 14, color: colors.textMuted, lineHeight: 21 },

  cta: { borderRadius: radius.md, overflow: 'hidden', marginTop: 8 },
  ctaInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 15,
  },
  ctaText: { color: colors.onGold, fontSize: 15, fontWeight: '800' },
});

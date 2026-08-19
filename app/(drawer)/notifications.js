import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FadeInView from '@/components/ui/FadeInView';
import GradientScreen from '@/components/ui/GradientScreen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';

/**
 * Notifications screen. No notifications backend yet — shows a proper
 * cosmic empty state so the header bell is a real, honest affordance
 * (instead of a dead icon with a fake unread dot).
 */
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <GradientScreen>
      <ScreenHeader title={t('notifications')} />

      <FadeInView style={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.iconArea}>
          <View style={styles.iconGlow} />
          <View style={styles.iconRing}>
            <Ionicons name="notifications-outline" size={38} color={colors.gold} />
          </View>
        </View>
        <Text style={styles.title}>{t('noNotificationsTitle')}</Text>
        <Text style={styles.subtitle}>{t('noNotificationsSub')}</Text>
      </FadeInView>
    </GradientScreen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconArea: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  iconGlow: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(228,173,13,0.10)' },
  iconRing: {
    width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.goldRing, backgroundColor: 'rgba(228,173,13,0.05)',
  },
  title: { color: colors.text, fontSize: 19, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: colors.textMuted, fontSize: 14.5, lineHeight: 22, textAlign: 'center', maxWidth: 300 },
});

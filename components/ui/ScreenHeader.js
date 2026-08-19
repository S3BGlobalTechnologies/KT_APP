import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';
import { spacing } from '@/lib/theme';

/**
 * Standard app header: back button (left) + centered title + optional subtitle.
 * Safe-area aware. Use on every non-tab screen for a consistent top bar.
 *
 *   <ScreenHeader title={t('faq')} subtitle="..." />
 *
 * Props:
 *  - title       string (required)
 *  - subtitle    string (optional)
 *  - onBack      override the default back behaviour (optional)
 *  - right       node rendered on the right side (optional)
 */
export default function ScreenHeader({ title, subtitle, onBack, right, showBack = true }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack?.()) router.back();
    else router.push('/home');
  };

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 10 }]}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('back')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backSpacer} />
        )}

        <Text style={styles.title} numberOfLines={1}>{title}</Text>

        <View style={styles.rightSlot}>{right}</View>
      </View>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  bar: { paddingHorizontal: spacing.gutter, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.ctrlBorder,
    backgroundColor: colors.ctrlBg,
  },
  title: {
    flex: 1, textAlign: 'center', color: colors.text,
    fontWeight: '800', fontSize: 18, marginHorizontal: 8,
  },
  backSpacer: { width: 40, height: 40 },
  rightSlot: { minWidth: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 10 },
});

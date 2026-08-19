import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';
import { radius } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

/** Reveals text a few characters at a time. `skip` jumps straight to the end. */
export const useTypewriter = (fullText, tickMs = 16, charsPerTick = 2) => {
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!fullText) {
      setShown('');
      setDone(false);
      return undefined;
    }

    let cursor = 0;
    setShown('');
    setDone(false);

    const id = setInterval(() => {
      cursor += charsPerTick;
      if (cursor >= fullText.length) {
        setShown(fullText);
        setDone(true);
        clearInterval(id);
      } else {
        setShown(fullText.slice(0, cursor));
      }
    }, tickMs);

    return () => clearInterval(id);
  }, [fullText, tickMs, charsPerTick]);

  const skip = useCallback(() => {
    if (fullText) {
      setShown(fullText);
      setDone(true);
    }
  }, [fullText]);

  return { shown, done, skip };
};

/**
 * The reading itself: spinner while it is being generated, then a typewriter
 * reveal (tap to skip), then the continue button. Shared by the onboarding
 * wizard and the home-screen popup so both look and behave the same.
 */
export default function MindAnalysisReading({
  text,
  loading,
  error,
  onContinue,
  continueLabel,
  maxHeight = 420,
}) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scrollRef = useRef(null);

  const { shown, done, skip } = useTypewriter(text);

  // Keep the newest typed line in view.
  useEffect(() => {
    if (shown) {
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: false }));
    }
  }, [shown]);

  return (
    <View style={styles.wrap}>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.loadingText}>{t('onboardingReadingPreparing')}</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {text ? (
        <TouchableOpacity
          style={[styles.card, { maxHeight }]}
          activeOpacity={1}
          onPress={skip}
          accessibilityLabel={t('onboardingReadingTitle')}
        >
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <Text style={styles.text}>
              {shown}
              {!done ? <Text style={styles.caret}>▋</Text> : null}
            </Text>
          </ScrollView>
        </TouchableOpacity>
      ) : null}

      {!loading && onContinue ? (
        <TouchableOpacity style={styles.ctaBtn} onPress={onContinue} activeOpacity={0.9}>
          <LinearGradient
            colors={colors.goldGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaInner}
          >
            <Text style={styles.ctaText}>
              {continueLabel || t('onboardingContinueToChat')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: { width: '100%' },
  loading: { alignItems: 'center', paddingVertical: 48, gap: 14 },
  loadingText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  card: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
  },
  text: { color: colors.text, fontSize: 15, lineHeight: 24 },
  caret: { color: colors.gold },
  error: { color: colors.textMuted, fontSize: 14, lineHeight: 22, marginBottom: 8 },
  ctaBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: 20 },
  ctaInner: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: colors.onGold, fontSize: 16, fontWeight: '800' },
});

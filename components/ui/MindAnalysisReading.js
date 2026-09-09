import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';
import { radius } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Default label shown above the feedback slider. Callers can override via the
// `feedbackLabel` prop.
const DEFAULT_FEEDBACK_LABEL =
  'Feedback for mind analysis : How much of this analysis is relatable according to your current situation';

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
 * A dependency-free 0-100% slider built on the core `PanResponder` (no native
 * module, so it ships over-the-air). Tap anywhere on the track to jump there,
 * or drag the thumb. Controlled: the parent owns `value`.
 */
function FeedbackSlider({ value, onChange, disabled, styles }) {
  const trackWRef = useRef(1);
  const startRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const disabledRef = useRef(disabled);
  onChangeRef.current = onChange;
  disabledRef.current = disabled;

  const clamp = (v) => Math.max(0, Math.min(100, v));

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onPanResponderGrant: (e) => {
        const w = trackWRef.current || 1;
        const p = clamp(Math.round((e.nativeEvent.locationX / w) * 100));
        startRef.current = p;
        onChangeRef.current(p);
      },
      onPanResponderMove: (e, g) => {
        const w = trackWRef.current || 1;
        const p = clamp(Math.round(startRef.current + (g.dx / w) * 100));
        onChangeRef.current(p);
      },
    })
  ).current;

  return (
    <View>
      <Text style={styles.sliderValue}>{value}%</Text>
      <View
        style={styles.sliderTouch}
        onLayout={(e) => {
          trackWRef.current = e.nativeEvent.layout.width || 1;
        }}
        {...pan.panHandlers}
      >
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${value}%` }]} />
        </View>
        <View style={[styles.sliderThumb, { left: `${value}%` }]} />
      </View>
      <View style={styles.sliderScaleRow}>
        <Text style={styles.sliderScaleText}>0%</Text>
        <Text style={styles.sliderScaleText}>100%</Text>
      </View>
    </View>
  );
}

/**
 * The reading itself: spinner while it is being generated, then a typewriter
 * reveal (tap to skip), then the continue button. Shared by the onboarding
 * wizard and the home-screen popup so both look and behave the same.
 *
 * When `onSubmitFeedback` is supplied, a satisfaction slider (0-100%) is shown
 * under the reading and "Continue to chat" stays DISABLED until the user
 * submits it. `onSubmitFeedback(percentage)` should resolve to a boolean —
 * true unlocks Continue. Without the prop the component behaves exactly as
 * before (Continue enabled immediately), so existing callers are unaffected.
 */
export default function MindAnalysisReading({
  text,
  loading,
  error,
  onContinue,
  continueLabel,
  onSubmitFeedback,
  feedbackLabel,
  maxHeight = 420,
}) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scrollRef = useRef(null);

  const { shown, done, skip } = useTypewriter(text);

  const [pct, setPct] = useState(50);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fbError, setFbError] = useState('');

  // Keep the newest typed line in view.
  useEffect(() => {
    if (shown) {
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: false }));
    }
  }, [shown]);

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    setFbError('');
    try {
      const ok = await onSubmitFeedback(pct);
      if (ok === false) throw new Error('submit_failed');
      setSubmitted(true);
    } catch {
      setFbError(t('networkError') || 'Could not submit — please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [onSubmitFeedback, pct, submitting, submitted, t]);

  // Feedback is only asked for once there is an actual reading to rate. When the
  // reading is locked/errored (no text), no feedback is required and Continue
  // stays enabled.
  const showFeedback = !!onSubmitFeedback && !!text && !loading && !error;
  const continueDisabled = showFeedback && !submitted;

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

      {showFeedback ? (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackLabel}>{feedbackLabel || DEFAULT_FEEDBACK_LABEL}</Text>
          <FeedbackSlider value={pct} onChange={setPct} disabled={submitted} styles={styles} />

          {submitted ? (
            <Text style={styles.feedbackThanks}>✓ Thanks! Your feedback was submitted.</Text>
          ) : (
            <>
              {fbError ? <Text style={styles.feedbackError}>{fbError}</Text> : null}
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.9}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.onGold} />
                ) : (
                  <Text style={styles.submitText}>Submit Feedback</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : null}

      {!loading && onContinue ? (
        <>
          <TouchableOpacity
            style={[styles.ctaBtn, continueDisabled && styles.ctaDisabled]}
            onPress={continueDisabled ? undefined : onContinue}
            disabled={continueDisabled}
            activeOpacity={0.9}
          >
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
          {continueDisabled ? (
            <Text style={styles.ctaHint}>Submit your feedback to continue to chat.</Text>
          ) : null}
        </>
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

  // Feedback slider
  feedbackBox: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
  },
  feedbackLabel: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  sliderValue: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  sliderTouch: { height: 36, justifyContent: 'center' },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.ctrlBorder || colors.surfaceBorder,
    overflow: 'hidden',
  },
  sliderFill: { height: '100%', borderRadius: 4, backgroundColor: colors.gold },
  sliderThumb: {
    position: 'absolute',
    top: 4,
    width: 24,
    height: 24,
    marginLeft: -12,
    borderRadius: 12,
    backgroundColor: colors.gold,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  sliderScaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sliderScaleText: { color: colors.textMuted, fontSize: 12 },

  feedbackError: { color: '#FF9B8A', fontSize: 13, marginTop: 12 },
  feedbackThanks: { color: '#7BE6A8', fontSize: 14, fontWeight: '700', marginTop: 14, textAlign: 'center' },
  submitBtn: {
    marginTop: 16,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: colors.onGold, fontSize: 15, fontWeight: '800' },

  ctaBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: 20 },
  ctaDisabled: { opacity: 0.45 },
  ctaInner: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: colors.onGold, fontSize: 16, fontWeight: '800' },
  ctaHint: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 },
});

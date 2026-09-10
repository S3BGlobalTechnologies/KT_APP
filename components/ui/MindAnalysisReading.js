import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';
import { radius } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// A TextInput (non-editable) whose text we update via setNativeProps for a
// lag-free live number, and whose colour animates with the satisfaction value.
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// The feedback label + button + hints are translated (t('maFeedback*')) so they
// render in the app UI language; callers can still override the label via the
// `feedbackLabel` prop.

// Satisfaction gradient stops for the fill + percentage number: red (low) →
// amber (mid) → green (high). These are the semantic "how relatable" colors;
// the rest of the slider chrome uses the app theme.
const SAT_RED = '#F04438';
const SAT_AMBER = '#F5A623';
const SAT_GREEN = '#12B76A';

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
 * An animated, dependency-free 0-100% satisfaction slider (core `PanResponder`
 * + `Animated`, so it ships over-the-air). Tap anywhere on the track or drag
 * the thumb. As it moves, the fill and the big percentage number transition
 * smoothly red → amber → green, and the flanking 😔 / 😃 emojis grow toward
 * whichever end you approach. Controlled: the parent owns `value`.
 *
 * The visuals are driven by an `Animated.Value` updated via `setValue` on every
 * gesture frame, so the bar/colour stay 60fps-smooth independent of React
 * re-renders; `onChange` reports the rounded value for the number + submit.
 */
function FeedbackSlider({ value, onChange, disabled, styles }) {
  const trackWRef = useRef(1);
  const startFracRef = useRef(value / 100);
  const fracValRef = useRef(value / 100);
  const onChangeRef = useRef(onChange);
  const disabledRef = useRef(disabled);
  onChangeRef.current = onChange;
  disabledRef.current = disabled;

  // The live % number is written IMPERATIVELY via setNativeProps every gesture
  // frame — no React re-render. Driving it through state (parent OR slider-local)
  // let React batch the updates during the drag, so the number only caught up on
  // release; a direct native prop write tracks the thumb with zero lag. The parent
  // is told the final value on release (it only needs it to submit).
  const numRef = useRef(null);

  const frac = useRef(new Animated.Value(value / 100)).current; // 0..1 position
  const grab = useRef(new Animated.Value(0)).current; // 0..1 thumb press pop

  // Build the interpolations ONCE so a per-frame re-render doesn't allocate new
  // animated nodes.
  const anims = useRef(null);
  if (anims.current === null) {
    anims.current = {
      fillColor: frac.interpolate({ inputRange: [0, 0.5, 1], outputRange: [SAT_RED, SAT_AMBER, SAT_GREEN] }),
      fillWidth: frac.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
      thumbLeft: frac.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
      thumbScale: grab.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }),
      sadScale: frac.interpolate({ inputRange: [0, 0.4], outputRange: [1.4, 0.85], extrapolate: 'clamp' }),
      sadOpacity: frac.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0.4], extrapolate: 'clamp' }),
      happyScale: frac.interpolate({ inputRange: [0.6, 1], outputRange: [0.85, 1.4], extrapolate: 'clamp' }),
      happyOpacity: frac.interpolate({ inputRange: [0.5, 1], outputRange: [0.4, 1], extrapolate: 'clamp' }),
    };
  }
  const A = anims.current;

  const applyFrac = (f) => {
    const c = Math.max(0, Math.min(1, f));
    fracValRef.current = c;
    frac.setValue(c); // smooth visual: fill / colour / thumb / emojis
    numRef.current?.setNativeProps({ text: `${Math.round(c * 100)}%` }); // live, no re-render
  };
  const springTo = (v) =>
    Animated.spring(grab, { toValue: v, useNativeDriver: false, friction: 6, tension: 140 }).start();
  const reportFinal = () => onChangeRef.current(Math.round(fracValRef.current * 100));

  const pan = useRef(
    PanResponder.create({
      // Capture the touch so a surrounding ScrollView can't steal the drag
      // (which would drop the move events mid-gesture).
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onStartShouldSetPanResponderCapture: () => !disabledRef.current,
      onMoveShouldSetPanResponderCapture: () => !disabledRef.current,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        // Grab-and-drag only: anchor to the CURRENT value and never jump to the
        // touch point. A plain tap (no drag) therefore leaves the value unchanged
        // — the slider moves only while the finger actually slides.
        springTo(1);
        startFracRef.current = fracValRef.current;
      },
      onPanResponderMove: (e, g) => {
        const w = trackWRef.current || 1;
        applyFrac(startFracRef.current + g.dx / w);
      },
      onPanResponderRelease: () => {
        springTo(0);
        reportFinal();
      },
      onPanResponderTerminate: () => {
        springTo(0);
        reportFinal();
      },
    })
  ).current;

  return (
    <View style={styles.sliderWrap}>
      <AnimatedTextInput
        ref={numRef}
        editable={false}
        pointerEvents="none"
        underlineColorAndroid="transparent"
        defaultValue={`${Math.round(value)}%`}
        style={[styles.sliderValue, { color: A.fillColor }]}
      />

      <View style={styles.sliderRow}>
        <Animated.Text
          style={[styles.sliderEmoji, { transform: [{ scale: A.sadScale }], opacity: A.sadOpacity }]}
        >
          😔
        </Animated.Text>

        <View
          style={styles.sliderTouch}
          onLayout={(e) => {
            trackWRef.current = e.nativeEvent.layout.width || 1;
          }}
          {...pan.panHandlers}
        >
          <View style={styles.sliderTrack}>
            <Animated.View
              style={[styles.sliderFill, { width: A.fillWidth, backgroundColor: A.fillColor }]}
            />
          </View>
          <Animated.View
            style={[
              styles.sliderThumb,
              { left: A.thumbLeft, borderColor: A.fillColor, transform: [{ translateX: -13 }, { scale: A.thumbScale }] },
            ]}
          />
        </View>

        <Animated.Text
          style={[styles.sliderEmoji, { transform: [{ scale: A.happyScale }], opacity: A.happyOpacity }]}
        >
          😃
        </Animated.Text>
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
          <Text style={styles.feedbackLabel}>{feedbackLabel || t('maFeedbackLabel')}</Text>
          <FeedbackSlider value={pct} onChange={setPct} disabled={submitted} styles={styles} />

          {submitted ? (
            <Text style={styles.feedbackThanks}>✓ {t('maFeedbackThanks')}</Text>
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
                  <Text style={styles.submitText}>{t('maFeedbackSubmit')}</Text>
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
            <Text style={styles.ctaHint}>{t('maFeedbackContinueHint')}</Text>
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
  sliderWrap: { marginTop: 6 },
  sliderValue: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
    letterSpacing: 0.5,
    padding: 0,
    includeFontPadding: false,
    // color is set inline (animated red → amber → green)
  },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sliderEmoji: { fontSize: 26, width: 30, textAlign: 'center' },
  sliderTouch: { flex: 1, height: 40, justifyContent: 'center' },
  sliderTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.ctrlBg || colors.surfaceStrong || colors.surfaceBorder,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
  },
  sliderFill: { height: '100%', borderRadius: 6 }, // width + color set inline
  sliderThumb: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 4,
    // borderColor set inline (matches the fill)
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

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

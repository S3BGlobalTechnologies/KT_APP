import CityStateDropdown from '@/components/ui/CityStateDropdown';
import GradientScreen from '@/components/ui/GradientScreen';
import MindAnalysisReading from '@/components/ui/MindAnalysisReading';
import WheelPickerModal from '@/components/ui/WheelPickerModal';
import { useTheme } from '@/contexts/ThemeContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { LanguageProvider, normalizeLanguageCode, useLanguage } from '@/lib/i18n';
import {
  checkMindAnalysisAccess,
  recordMindAnalysisSession,
  requestMindAnalysisReading,
  resolveMindAnalysisUserId,
} from '@/lib/mindAnalysis';
import { createOrGetKkAgentProfile } from '@/lib/kkAgentProfile';
import { radius } from '@/lib/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

/**
 * First-run flow for a new signup, straight after OTP:
 *
 *   language -> name -> gender -> date of birth -> time of birth -> location
 *     -> profile saved -> free mind-analysis reading (typewriter) -> chat
 *
 * The reading is generated here and nowhere else; the chat screen does not
 * trigger it. Only the seven languages with i18n blocks are offered, and the
 * choice drives both the app UI and the language the reading comes back in.
 */

const STEPS = ['language', 'name', 'gender', 'dob', 'tob', 'location', 'reading'];
const INPUT_STEP_COUNT = STEPS.length - 1;

// Only the languages that have a translation block in lib/i18n.js.
const APP_LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'हिंदी' },
  { value: 'Marathi', label: 'मराठी' },
  { value: 'Gujarati', label: 'ગુજરાતી' },
  { value: 'Telugu', label: 'తెలుగు' },
  { value: 'Bengali', label: 'বাংলা' },
  { value: 'Kannada', label: 'ಕನ್ನಡ' },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/**
 * The route mounts its own LanguageProvider.
 *
 * A provider in app/_layout.js does not reach the screens in this app — that is
 * what made every label render as its raw key name here, and the same thing
 * happened to the drawer screens when the drawer's own provider was removed.
 * (drawer)/_layout.js mounts one for the drawer; this mounts one for onboarding.
 *
 * Both read and write the same APP_LANGUAGE key in AsyncStorage, so the
 * language chosen on the first step is what the drawer loads when it mounts.
 * A brand-new user has nothing stored yet, so this starts on English.
 */
export default function Onboarding() {
  return (
    <LanguageProvider>
      <OnboardingWizard />
    </LanguageProvider>
  );
}

function OnboardingWizard() {
  const router = useRouter();
  const { t, setLanguage: setAppLanguage } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { expoPushToken } = usePushNotifications();

  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];

  const [language, setLanguageValue] = useState('English');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [place, setPlace] = useState({ city: '', state: '', country: '' });

  const [email, setEmail] = useState('');
  const [authToken, setAuthToken] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [reading, setReading] = useState('');
  const [readingError, setReadingError] = useState('');
  const [readingLocked, setReadingLocked] = useState(false);
  const [readingLoading, setReadingLoading] = useState(false);

  const readingStartedRef = useRef(false);
  const mountedRef = useRef(true);
  const advanceTimerRef = useRef(null);

  // Fills the progress bar as the wizard moves along.
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: step === 'reading' ? 1 : (stepIndex + 1) / INPUT_STEP_COUNT,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // animating width, not transform
    }).start();
  }, [stepIndex, step, progress]);

  useEffect(() => () => clearTimeout(advanceTimerRef.current), []);

  /**
   * Selection steps move on by themselves — the user has just answered, so
   * there is nothing left to confirm. The short delay lets the tick render
   * first, otherwise the screen changes before the tap registers visually.
   */
  const autoAdvance = useCallback((run, delay = 260) => {
    setError('');
    clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      run();
    }, delay);
  }, []);

  const goToNextStep = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* Auth + prefill. Phone and email come from the account, not from the user. */
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('AUTH_TOKEN');
      if (!token) {
        router.replace('/');
        return;
      }
      if (mountedRef.current) setAuthToken(token);

      try {
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/user-info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) return;
        const json = await res.json();
        const user = json?.data;
        if (!user || !mountedRef.current) return;

        await AsyncStorage.setItem('USER_PROFILE', JSON.stringify(user));
        setEmail(user.email || '');
        if (user.fullName) setName(user.fullName);
        if (user.gender) setGender(user.gender);
      } catch (e) {
        console.warn('ONBOARDING_PREFILL_ERROR:', e?.message || e);
      }
    })();
  }, [router]);

  /* Hardware back walks the wizard; it never returns to the OTP screen. */
  useEffect(() => {
    const onBack = () => {
      if (stepIndex > 0 && step !== 'reading') {
        // Drop any pending auto-advance, or it would undo this straight away.
        clearTimeout(advanceTimerRef.current);
        setError('');
        setStepIndex((i) => i - 1);
      }
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [stepIndex, step]);

  const splitDob = useCallback(() => {
    const parts = String(dob).split('/');
    return {
      day: String(parts[0] || '').padStart(2, '0'),
      month: String(parts[1] || '').padStart(2, '0'),
      year: String(parts[2] || ''),
    };
  }, [dob]);

  const splitTime = useCallback(() => {
    const parts = String(time).split(':');
    return {
      hour: String(parts[0] || '').padStart(2, '0'),
      min: String(parts[1] || '').padStart(2, '0'),
      sec: '00',
    };
  }, [time]);

  /**
   * PUT /update-profile, then mirror the result into USER_PROFILE.
   *
   * Takes overrides because auto-advance fires from inside the same event that
   * set the value — React has not re-rendered yet, so reading `place` from
   * state here would use the previous city.
   */
  const saveProfile = useCallback(async (overrides = {}) => {
    const finalPlace = overrides.place || place;
    const { day, month, year } = splitDob();
    const { hour, min, sec } = splitTime();

    const payload = {
      fullName: name.trim(),
      email,
      day,
      month,
      year,
      hour,
      min,
      sec,
      gender,
      city: finalPlace.city,
      state: finalPlace.state,
      country: finalPlace.country,
      userCreatedBy: 'app',
      language,
      expoPushTokens: expoPushToken ? [expoPushToken] : [],
    };

    console.log('ONBOARDING_SAVE_PROFILE:', payload);

    const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/update-profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', token: authToken },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || 'Update failed');

    const serverUser = json?.data;
    let stored;
    if (serverUser && typeof serverUser === 'object') {
      stored = serverUser;
    } else {
      const existingRaw = await AsyncStorage.getItem('USER_PROFILE');
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      stored = { ...existing, ...payload };
    }

    // Create (or reuse) the kk-agent birth profile so chat can send
    // params.profile_id. Best-effort — chat still works without it,
    // just without birth-chart context.
    
     try {
      const kkProfileId = await createOrGetKkAgentProfile(stored);
      stored = { ...stored, kkAgentProfileId: kkProfileId };
    } catch (e) {
      console.warn('KK_AGENT_PROFILE_CREATE_ERROR:', e?.message || e);
    }

    await AsyncStorage.setItem('USER_PROFILE', JSON.stringify(stored));
    await AsyncStorage.setItem('FIRST_TIME_USER', 'false');
    return stored;
  }, [authToken, email, expoPushToken, gender, language, name, place, splitDob, splitTime]);

  /* The reading. Runs once, on entering the final step. */
  const runReading = useCallback(async (profile) => {
    if (readingStartedRef.current) return;
    readingStartedRef.current = true;

    setReadingLoading(true);
    setReadingError('');

    const sessionId = Date.now().toString();
    const token = authToken || (await AsyncStorage.getItem('AUTH_TOKEN')) || '';
    const userId = resolveMindAnalysisUserId(profile);

    try {
      await AsyncStorage.setItem('CHAT_SESSION_ID', sessionId);

      const verdict = await checkMindAnalysisAccess(userId, token);
      if (!verdict.allowed) {
        console.log('MIND_ANALYSIS_TRIGGER:', {
          stage: 'onboarding',
          willRun: false,
          reason: verdict.reason,
          remainingMs: verdict.remainingMs,
        });
        if (mountedRef.current) {
          setReadingLocked(true);
          setReadingError(t('mindAnalysisLockedDesc'));
        }
        return;
      }

      console.log('MIND_ANALYSIS_TRIGGER:', {
        stage: 'onboarding',
        willRun: true,
        reason: verdict.reason,
        sessionId,
        userId,
      });

      const answer = await requestMindAnalysisReading(profile, sessionId, language, token);
      if (mountedRef.current) setReading(answer);

      await recordMindAnalysisSession(sessionId, token, userId);
    } catch (e) {
      console.warn('MIND_ANALYSIS_ERROR:', e?.message || e);
      // The profile is already saved, so the user is never blocked by this.
      if (mountedRef.current) setReadingError(t('onboardingReadingFailed'));
    } finally {
      if (mountedRef.current) setReadingLoading(false);
    }
  }, [authToken, language, t]);

  const validateCurrentStep = () => {
    if (step === 'name' && !name.trim()) return t('nameRequired');
    if (step === 'gender' && !gender) return t('genderRequired');

    if (step === 'dob') {
      if (!dob) return t('dobRequired');
      const m = String(dob).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (!m) return t('dobInvalid');
      const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
      if (
        d.getFullYear() !== Number(m[3]) ||
        d.getMonth() !== Number(m[2]) - 1 ||
        d.getDate() !== Number(m[1])
      ) {
        return t('dobInvalid');
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d > today) return t('dobInvalid');
    }

    if (step === 'tob' && !time) return t('timeRequired');
    if (step === 'location' && !location) return t('locationRequired');
    return '';
  };

  // Last input step: persist the profile, then hand over to the reading.
  const finishInputSteps = useCallback(
    async (overrides) => {
      setSaving(true);
      setError('');
      try {
        const profile = await saveProfile(overrides);
        if (!mountedRef.current) return;
        setStepIndex(STEPS.indexOf('reading'));
        runReading(profile);
      } catch (e) {
        if (mountedRef.current) setError(e?.message || 'Something went wrong');
      } finally {
        if (mountedRef.current) setSaving(false);
      }
    },
    [runReading, saveProfile]
  );

  const goNext = async () => {
    Keyboard.dismiss();
    clearTimeout(advanceTimerRef.current);

    const message = validateCurrentStep();
    if (message) {
      setError(message);
      return;
    }
    setError('');

    if (step !== 'location') {
      goToNextStep();
      return;
    }

    await finishInputSteps();
  };

  const goToChat = () => router.replace('/chat');

  const initialDobForPicker = useMemo(() => {
    const m = String(dob).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return undefined;
    const monthIndex = Math.max(0, Math.min(11, Number(m[2]) - 1));
    return {
      day: String(m[1]).padStart(2, '0'),
      month: MONTH_NAMES[monthIndex],
      year: m[3],
    };
  }, [dob]);

  const initialTimeForPicker = useMemo(() => {
    const m = String(time).match(/^(\d{1,2}):(\d{1,2})$/);
    if (!m) return undefined;
    let hour = Number(m[1]);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return { hour: String(hour).padStart(2, '0'), minute: m[2], ampm };
  }, [time]);

  /* ---------------- step bodies ---------------- */

  const renderLanguageStep = () => (
    <View style={styles.optionList}>
      {APP_LANGUAGES.map((option) => {
        const active = option.value === language;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.optionRow, active && styles.optionRowActive]}
            onPress={() => {
              setLanguageValue(option.value);
              setAppLanguage(normalizeLanguageCode(option.value));
              autoAdvance(goToNextStep);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.optionText, active && styles.optionTextActive]}>
              {option.label}
            </Text>
            {active ? <Ionicons name="checkmark-circle" size={20} color={colors.gold} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderNameStep = () => (
    <TextInput
      value={name}
      onChangeText={(v) => {
        setName(v);
        if (error) setError('');
      }}
      style={styles.textField}
      placeholder={t('enterYourName')}
      placeholderTextColor={colors.textSubtle}
      autoFocus
      returnKeyType="next"
      onSubmitEditing={goNext}
    />
  );

  const renderGenderStep = () => (
    <View style={styles.genderRow}>
      {['male', 'female'].map((value) => {
        const active = gender === value;
        return (
          <TouchableOpacity
            key={value}
            style={[styles.genderCard, active && styles.genderCardActive]}
            onPress={() => {
              setGender(value);
              autoAdvance(goToNextStep);
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={value === 'male' ? 'male' : 'female'}
              size={28}
              color={active ? colors.gold : colors.textMuted}
            />
            <Text style={[styles.genderText, active && styles.genderTextActive]}>
              {t(value)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderPickerStep = (value, placeholder, icon, onPress) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={styles.pickerField}>
        <Text style={[styles.pickerValue, !value && styles.pickerPlaceholder]}>
          {value || placeholder}
        </Text>
        <Ionicons name={icon} size={20} color={colors.gold} />
      </View>
    </TouchableOpacity>
  );

  const renderLocationStep = () => (
    <View>
      <CityStateDropdown
        city={place.city}
        state={place.state}
        onChange={(val) => {
          if (!val) return;
          // The city list is Indian-only, so country is not part of the picker.
          const next = { city: val.city || '', state: val.state || '', country: 'India' };
          setPlace(next);
          setLocation([next.city, next.state, next.country].filter(Boolean).join(', '));
          // Last step: hand the city over explicitly, then save and read.
          // Slightly longer so the chosen place is visible before it moves on.
          autoAdvance(() => finishInputSteps({ place: next }), 450);
        }}
      />
      {location ? (
        <View style={styles.selectedPlace}>
          <Ionicons name="location" size={16} color={colors.gold} />
          <Text style={styles.selectedPlaceText}>{location}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderReadingStep = () => (
    <MindAnalysisReading
      text={reading}
      loading={readingLoading}
      error={readingError}
      onContinue={goToChat}
    />
  );

  const TITLES = {
    language: t('onboardingLanguageTitle'),
    name: t('onboardingNameTitle'),
    gender: t('onboardingGenderTitle'),
    dob: t('onboardingDobTitle'),
    tob: t('onboardingTobTitle'),
    location: t('onboardingLocationTitle'),
    reading: readingLocked ? t('mindAnalysisLockedTitle') : t('onboardingReadingTitle'),
  };

  // Every step says why it is asking — the birth details are not obvious.
  const SUBTITLES = {
    language: t('onboardingLanguageSubtitle'),
    name: t('onboardingNameSubtitle'),
    gender: t('onboardingGenderSubtitle'),
    dob: t('onboardingDobSubtitle'),
    tob: t('onboardingTobSubtitle'),
    location: t('onboardingLocationSubtitle'),
    reading: '',
  };

  return (
    <GradientScreen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <View style={styles.header}>
          {stepIndex > 0 && step !== 'reading' ? (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                clearTimeout(advanceTimerRef.current);
                setError('');
                setStepIndex((i) => i - 1);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}

          {step !== 'reading' ? (
            <Text style={styles.progressLabel}>
              {t('onboardingStep')} {stepIndex + 1}/{INPUT_STEP_COUNT}
            </Text>
          ) : null}

          <View style={styles.backBtn} />
        </View>

        {step !== 'reading' ? (
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        ) : null}

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{TITLES[step]}</Text>
          {SUBTITLES[step] ? (
            <Text style={styles.subtitle}>{SUBTITLES[step]}</Text>
          ) : null}

          <View style={styles.control}>
            {step === 'language' && renderLanguageStep()}
            {step === 'name' && renderNameStep()}
            {step === 'gender' && renderGenderStep()}
            {step === 'dob' &&
              renderPickerStep(dob, t('ddmmyyyy'), 'calendar-outline', () => {
                setError('');
                setShowDatePicker(true);
              })}
            {step === 'tob' &&
              renderPickerStep(time, 'HH : MM', 'time-outline', () => {
                setError('');
                setShowTimePicker(true);
              })}
            {step === 'location' && renderLocationStep()}
            {step === 'reading' && renderReadingStep()}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        {step !== 'reading' ? (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.ctaBtn, saving && styles.ctaDisabled]}
              onPress={goNext}
              disabled={saving}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={colors.goldGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaInner}
              >
                {saving ? (
                  <ActivityIndicator color={colors.onGold} />
                ) : (
                  <Text style={styles.ctaText}>{t('onboardingNext')}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <WheelPickerModal
        visible={showDatePicker}
        mode="date"
        initial={initialDobForPicker}
        onClose={() => setShowDatePicker(false)}
        onOk={(value) => {
          let day, month, year;
          if (Array.isArray(value)) [day, month, year] = value;
          else ({ day, month, year } = value);

          let monthNumber = Number(month);
          if (Number.isNaN(monthNumber)) {
            monthNumber =
              MONTH_NAMES.findIndex(
                (m) => m.toLowerCase() === String(month).toLowerCase().slice(0, 3)
              ) + 1;
          }
          setDob(
            `${String(Number(day)).padStart(2, '0')}/${String(monthNumber).padStart(2, '0')}/${year}`
          );
          setShowDatePicker(false);
          autoAdvance(goToNextStep);
        }}
      />

      <WheelPickerModal
        visible={showTimePicker}
        mode="time"
        initial={initialTimeForPicker}
        onClose={() => setShowTimePicker(false)}
        onOk={(value) => {
          let hour, minute, ampm;
          if (Array.isArray(value)) [hour, minute, ampm] = value;
          else ({ hour, minute, ampm } = value);

          if (!hour || !minute || !ampm) {
            setTime('');
            setShowTimePicker(false);
            return;
          }

          let hourNumber = parseInt(hour, 10);
          if (Number.isNaN(hourNumber)) hourNumber = 0;
          const upper = String(ampm).toUpperCase();
          if (upper === 'PM' && hourNumber !== 12) hourNumber += 12;
          if (upper === 'AM' && hourNumber === 12) hourNumber = 0;

          setTime(
            `${String(hourNumber).padStart(2, '0')}:${String(parseInt(minute, 10)).padStart(2, '0')}`
          );
          setShowTimePicker(false);
          autoAdvance(goToNextStep);
        }}
      />
    </GradientScreen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  progressLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: 24,
    marginTop: 10,
    backgroundColor: colors.ctrlBorder,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.gold,
  },

  body: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, flexGrow: 1 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', lineHeight: 34 },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 8 },
  control: { marginTop: 28 },

  optionList: { gap: 10 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  optionRowActive: { borderColor: colors.goldSoftBorder, backgroundColor: colors.goldSoftBg },
  optionText: { color: colors.text, fontSize: 16 },
  optionTextActive: { color: colors.goldText, fontWeight: '700' },

  textField: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    height: 54,
    fontSize: 16,
    color: colors.text,
    textTransform: 'capitalize',
  },

  genderRow: { flexDirection: 'row', gap: 14 },
  genderCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 26,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  genderCardActive: { borderColor: colors.goldSoftBorder, backgroundColor: colors.goldSoftBg },
  genderText: { color: colors.textMuted, fontSize: 15, fontWeight: '600' },
  genderTextActive: { color: colors.goldText },

  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    height: 54,
  },
  pickerValue: { color: colors.text, fontSize: 16 },
  pickerPlaceholder: { color: colors.textSubtle },

  selectedPlace: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  selectedPlaceText: { color: colors.goldText, fontSize: 14, flex: 1 },

  readingWrap: { flex: 1 },
  readingLoading: { alignItems: 'center', paddingVertical: 48, gap: 14 },
  readingLoadingText: { color: colors.textMuted, fontSize: 14 },
  readingCard: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    maxHeight: 420,
  },
  readingText: { color: colors.text, fontSize: 15, lineHeight: 24 },
  caret: { color: colors.gold },
  readingError: { color: colors.textMuted, fontSize: 14, lineHeight: 22, marginBottom: 8 },

  footer: { paddingHorizontal: 24, paddingBottom: 20, paddingTop: 8 },
  ctaBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: 20 },
  ctaInner: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: colors.onGold, fontSize: 16, fontWeight: '800' },

  error: { color: '#FF9B8A', marginTop: 14, fontWeight: '600' },
});

import { logMetaEvent } from '@/utils/metaEvents';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Animated, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import HomeLanguageDropdown from '@/components/ui/HomeLanguageDropdown';
import MindAnalysisReading from '@/components/ui/MindAnalysisReading';
// // import { useKeepAwake } from 'expo-keep-awake';
import VideoCarousel from '@/components/ui/videoCarousel';
import {
  MIND_ANALYSIS_REPEAT_AFTER_MS,
  checkMindAnalysisAccess,
  recordMindAnalysisSession,
  requestMindAnalysisReading,
  resolveMindAnalysisUserId,
  submitMindAnalysisFeedback,
} from '@/lib/mindAnalysis';
import { createOrGetKkAgentProfile } from '@/lib/kkAgentProfile';
import { CHAT_REMAINING_KEY, useChatTimer } from "@/contexts/chatTimerContext";
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';
import { verifyToken } from '@/utils/auth'; // ✅ use existing auth.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const fmtTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

// Twinkling star: pulses opacity (paired with a constant gold glow) so the
// header sparkles shimmer and catch the eye. Random start + varied duration
// keeps each one out of phase for a natural glitter.
function Sparkle({ style, duration = 900 }) {
  const anim = useRef(new Animated.Value(Math.random())).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.25, duration, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, duration]);
  return <Animated.Text style={[style, { opacity: anim }]}>✦</Animated.Text>;
}

// Module-level so it never remounts on Home re-renders.
function SectionHeader({ title, onPress }) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onPress ? (
        <TouchableOpacity style={styles.viewAllBtn} activeOpacity={0.7} onPress={onPress} hitSlop={8}>
          <Text style={styles.viewAllText}>{t('viewAll')}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.gold} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// Owns the per-second chat-timer subscription so ONLY this small band
// re-renders every second — not the entire Home screen.
function HomeLiveBand() {
  const { remainingSeconds } = useChatTimer();
  const { t } = useLanguage();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [hasRemaining, setHasRemaining] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const v = await AsyncStorage.getItem(CHAT_REMAINING_KEY);
          if (!mounted) return;
          const n = parseInt(v || '0', 10);
          setHasRemaining(Boolean(v) && !Number.isNaN(n) && n > 0);
        } catch { if (mounted) setHasRemaining(false); }
      })();
      return () => { mounted = false; };
    }, [])
  );

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const v = await AsyncStorage.getItem(CHAT_REMAINING_KEY);
        if (ignore) return;
        const n = parseInt(v || '0', 10);
        setHasRemaining(Boolean(v) && !Number.isNaN(n) && n > 0);
      } catch { if (!ignore) setHasRemaining(false); }
    })();
    return () => { ignore = true; };
  }, [remainingSeconds]);

  if (!hasRemaining) return null;
  return (
    <View style={styles.liveBand}>
      <View style={styles.liveBandContent}>
        <Text style={styles.liveLabel}>{t('live')}</Text>
        <View style={styles.liveBandTimeContainer}>
          <Text style={styles.liveBandTimeLabel}>{t('time')} : </Text>
          <Text style={styles.liveBandTime}>{fmtTime(remainingSeconds)}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.liveBandArrow} onPress={() => router.push('/chat')}>
        <Ionicons name="chevron-forward" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// The reading language is independent of the app UI language, so this list is
// not limited to the seven that have i18n blocks, and it includes Hinglish.
const MIND_ANALYSIS_LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Hinglish', label: 'Hinglish' },
  { value: 'Hindi', label: 'हिंदी' },
  { value: 'Bengali', label: 'বাংলা' },
  { value: 'Telugu', label: 'తెలుగు' },
  { value: 'Marathi', label: 'मराठी' },
  { value: 'Tamil', label: 'தமிழ்' },
  { value: 'Gujarati', label: 'ગુજરાતી' },
  { value: 'Kannada', label: 'ಕನ್ನಡ' },
  { value: 'Malayalam', label: 'മലയാളം' },
  { value: 'Punjabi', label: 'ਪੰਜਾਬੀ' },
  { value: 'Odia', label: 'ଓଡ଼ିଆ' },
  { value: 'Assamese', label: 'অসমীয়া' },
];

export default function Home() {
// console.log("API URL:", process.env.EXPO_PUBLIC_API_BASE_URL);

 const checkedRef = useRef(false);

useFocusEffect(
  useCallback(() => {
    // Prevent duplicate calls on fast focus changes
    if (checkedRef.current) return;
    checkedRef.current = true;

    const checkAuth = async () => {
      const result = await verifyToken();

      if (!result.valid) {
        await AsyncStorage.multiRemove(['AUTH_TOKEN', 'MIND_ANALYSIS_LAST_RUN_AT']);
        router.replace('/'); // login or index
      }
    };

    checkAuth();

    // Cleanup when screen loses focus
    return () => {
      checkedRef.current = false;
    };
  }, [])
);

  const router = useRouter();
  const navigation = useNavigation();
  const { t, language } = useLanguage();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const { width, height } = useWindowDimensions();
  const is1280x800 = width >= 1280 && height >= 800;

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  // Add UI state for date/time/place above services
  const formatDateValue = (d) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  const formatTimeValue = (d) => {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };
  const [metaDate, setMetaDate] = useState(formatDateValue(new Date()));
  const [metaTime, setMetaTime] = useState(formatTimeValue(new Date()));
  const [metaPlace, setMetaPlace] = useState('');
  // useKeepAwake();
  // Local images map - point to a placeholder for now. Replace with actual files later.
  // Map astrologer image file names to local assets. Replace these requires with the real images
  // when you add them to `assets/images` (use the exact filenames).
  const ASTRO_IMAGE_MAP = {
    'AIAacharyaRaghavSharma.png': require('../../assets/images/AIAacharyaRaghavSharma.png'),
    'AIGuruAnilJoshi.png': require('../../assets/images/AIGuruAnilJoshi.png'),
    'AIAstroMeeraDesai.png': require('../../assets/images/AIAstroMeeraDesai.png'),
    'AIPanditSureshIyyer.jpeg': require('../../assets/images/AIPanditSureshIyyer.jpeg'),
    'AIJyotishKavitaVerma.jpeg': require('../../assets/images/AIJyotishKavitaVerma.jpeg'),
  };

  // Tracks which users we've already backfilled a kk-agent profile for,
  // so the create call fires at most once per user per app session.
  const kkBackfillDoneRef = useRef(new Set());

  // Fetch user-info when Home gains focus
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const run = async () => {
        setProfileLoading(true);
        try {
          const token = await AsyncStorage.getItem('AUTH_TOKEN');
          if (!token) { if (!cancelled) setProfileLoading(false); return; }

          const base = process.env.EXPO_PUBLIC_API_BASE_URL;
          if (!base) {
            console.warn('API base URL missing; set EXPO_PUBLIC_API_BASE_URL');
            if (!cancelled) setProfileLoading(false);
            return;
          }

          const res = await fetch(`${base}/user-info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });

          if (!res.ok) { if (!cancelled) setProfileLoading(false); return; }
          const json = await res.json();
          const user = json?.data;
          setProfile(user);
          logMetaEvent('fb_mobile_home');
          if (!cancelled && user) {
            // Preserve any kk-agent profile id we've already cached locally.
            // user-info does not carry it (the id lives only on the device),
            // so without this merge a profile refresh would wipe it and make
            // the create call fire again. AsyncStorage survives app restarts,
            // so once cached the backfill below never runs again for this user.
            let cachedProfileId = user?.kkAgentProfileId || null;
            if (!cachedProfileId) {
              try {
                const prevRaw = await AsyncStorage.getItem('USER_PROFILE');
                cachedProfileId = prevRaw
                  ? JSON.parse(prevRaw)?.kkAgentProfileId || null
                  : null;
              } catch {}
            }

            const mergedUser = cachedProfileId
              ? { ...user, kkAgentProfileId: cachedProfileId }
              : user;
            setProfile(mergedUser);
            await AsyncStorage.setItem('USER_PROFILE', JSON.stringify(mergedUser));

            // Backfill only when NO profile id exists yet (neither on user-info
            // nor cached locally). The stored birth details go straight to
            // kk-agent, which mints the profile_id; we cache it so chat can send
            // it as params.profile_id. Fires at most once per user; kk-agent
            // creates it, no backend involved. Idempotent + best-effort — chat
            // still works without it, just without birth-chart context.
            const uid = resolveMindAnalysisUserId(user);
            const hasBirthData =
              user?.day && user?.month && user?.year && user?.city;
            if (
              uid &&
              !cachedProfileId &&
              hasBirthData &&
              !kkBackfillDoneRef.current.has(uid)
            ) {
              kkBackfillDoneRef.current.add(uid);
              try {
                const kkProfileId = await createOrGetKkAgentProfile(user);
                if (!cancelled && kkProfileId) {
                  const merged = { ...user, kkAgentProfileId: kkProfileId };
                  await AsyncStorage.setItem('USER_PROFILE', JSON.stringify(merged));
                  setProfile(merged);
                }
              } catch (e) {
                // Allow a later focus to retry.
                kkBackfillDoneRef.current.delete(uid);
                console.warn('KK_AGENT_PROFILE_BACKFILL_ERROR:', e?.message || e);
              }
            }
          }
        } catch (e) {
          console.warn('Home: failed to fetch user-info', e);
        } finally {
          if (!cancelled) setProfileLoading(false);
        }
      };

      run();
      return () => { cancelled = true; };
    }, [])
  );



  /* ================= MIND ANALYSIS (free reading) ================= */

  // null | 'intro' | 'language' | 'reading'
  const [maStage, setMaStage] = useState(null);
  const [maReading, setMaReading] = useState('');
  const [maError, setMaError] = useState('');
  const [maLoading, setMaLoading] = useState(false);
  // Epoch ms at which the 10-minute window closes; 0 means "available now".
  const [maUnlockAt, setMaUnlockAt] = useState(0);
  const maMountedRef = useRef(true);
  // The userId the gate has already been asked about, so re-focus does not
  // hammer the endpoint (profile gets a new identity on every focus).
  const maCheckedForRef = useRef(null);

  useEffect(() => {
    maMountedRef.current = true;
    return () => {
      maMountedRef.current = false;
    };
  }, []);

  const checkMindAnalysisGate = useCallback(async () => {
    const token = await AsyncStorage.getItem('AUTH_TOKEN');
    if (!token || !profile) return;

    const userId = resolveMindAnalysisUserId(profile);
    const verdict = await checkMindAnalysisAccess(userId, token);
    if (!maMountedRef.current) return;

    console.log('MIND_ANALYSIS_TRIGGER:', {
      stage: 'home',
      willRun: verdict.allowed,
      reason: verdict.reason,
      remainingMs: verdict.remainingMs,
      sessionStartLocal: verdict.sessionStartLocal,
      enabledAtLocal: verdict.enabledAtLocal,
      nowLocal: verdict.nowLocal,
    });

    if (verdict.allowed) {
      setMaUnlockAt(0);
      // Never interrupt a popup that is already open.
      setMaStage((current) => current || 'intro');
    } else {
      setMaUnlockAt(Date.now() + verdict.remainingMs);
    }
  }, [profile]);

  // First visit after the profile loads. An existing user has no access record,
  // so the GET comes back empty and the popup shows straight away.
  useFocusEffect(
    useCallback(() => {
      const userId = resolveMindAnalysisUserId(profile);
      if (!userId || maCheckedForRef.current === userId) return;
      maCheckedForRef.current = userId;
      checkMindAnalysisGate();
    }, [profile, checkMindAnalysisGate])
  );

  // Re-offer the moment the 10-minute window closes.
  useEffect(() => {
    if (!maUnlockAt) return undefined;
    const delay = Math.max(1000, maUnlockAt - Date.now() + 500);
    const id = setTimeout(() => {
      setMaUnlockAt(0);
      checkMindAnalysisGate();
    }, delay);
    return () => clearTimeout(id);
  }, [maUnlockAt, checkMindAnalysisGate]);

  const runMindAnalysisReading = useCallback(
    async (chosenLanguage) => {
      setMaStage('reading');
      setMaLoading(true);
      setMaError('');
      setMaReading('');

      const sessionId = Date.now().toString();
      const token = (await AsyncStorage.getItem('AUTH_TOKEN')) || '';
      const userId = resolveMindAnalysisUserId(profile);

      try {
        await AsyncStorage.setItem('CHAT_SESSION_ID', sessionId);
        const answer = await requestMindAnalysisReading(
          profile,
          sessionId,
          chosenLanguage,
          token
        );
        if (maMountedRef.current) setMaReading(answer);

        await recordMindAnalysisSession(sessionId, token, userId);
        if (maMountedRef.current) setMaUnlockAt(Date.now() + MIND_ANALYSIS_REPEAT_AFTER_MS);
      } catch (e) {
        console.warn('MIND_ANALYSIS_ERROR:', e?.message || e);
        if (maMountedRef.current) setMaError(t('onboardingReadingFailed'));
      } finally {
        if (maMountedRef.current) setMaLoading(false);
      }
    },
    [profile, t]
  );

  // Sends the satisfaction % to the response-feedback store. Returning true
  // unlocks "Continue to chat" inside MindAnalysisReading.
  const submitAnalysisFeedback = useCallback(
    async (percentage) => {
      const token = (await AsyncStorage.getItem('AUTH_TOKEN')) || '';
      const sid = (await AsyncStorage.getItem('CHAT_SESSION_ID')) || '';
      const userId = resolveMindAnalysisUserId(profile);
      return submitMindAnalysisFeedback({
        sessionId: sid,
        userId,
        percentage,
        reading: maReading,
        token,
      });
    },
    [profile, maReading]
  );

  // Dismissing runs no reading, so it must not consume the server window — just
  // snooze the offer locally for the same 10 minutes so it does not nag.
  const dismissMindAnalysis = useCallback(() => {
    setMaStage(null);
    setMaUnlockAt(Date.now() + MIND_ANALYSIS_REPEAT_AFTER_MS);
  }, []);

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};


  const trending = [
    { title: t('relationships'), emoji: '❤️' },
    { title: t('finance'), emoji: '💰' },
    { title: t('marriage'), emoji: '💍' },
    { title: t('health'), emoji: '🩺' },
    { title: t('education'), emoji: '📚' },
    { title: t('career'), emoji: '💼' },
    { title: t('remedies'), emoji: '🕉️' },
    { title: t('property'), emoji: '🏠' },
  ];

  const astrologers = [
    {
      name: 'Acharya Raghav ',
      name_en: 'Acharya Raghav',
      name_hi: 'आचार्य राघव',
      name_mr: 'आचार्य राघव',
      name_gu: 'આચાર્ય રાઘવ',
      name_te: 'ఆచార్య రాఘవ్',
      name_bn: 'আচার্য রাঘব',
      name_kn: 'ಆಚಾರ್ಯ ರಾಘವ್',
      specialty: 'Specialist in Kundli analysis and career guidance, known for practical remedies.',
      avatar: 'R',
      image: '/AIAacharyaRaghavSharma.png',
      exp: t('relationshipExp'),
      tag: t('relationships'),
      rating: '4.8',
      users: '1.2K+',
      color: 'from-[#2563EB] to-[#0b142e]',
    },
    {
      name: 'Guru Anil ',
      name_en: 'Guru Anil',
      name_hi: 'गुरु अनिल',
      name_mr: 'गुरु अनिल',
      name_gu: 'ગુરુ અનિલ',
      name_te: 'గురు అనిల్',
      name_bn: 'গুরু অনিল',
      name_kn: 'ಗುರು ಅನಿಲ್',
      specialty: 'Guiding individuals in relationships and family matters with simple astrological insights.',
      avatar: 'A',
      image: '/AIGuruAnilJoshi.png',
      exp: t('careerExp'),
      tag: t('career'),
      rating: '4.9',
      users: '980+',
      color: 'from-[#2563EB] to-[#0b142e]',
    },
    {
      name: 'Astro Meera ',
      name_en: 'Astro Meera',
      name_hi: 'एस्ट्रो मीरा',
      name_mr: 'अॅस्ट्रो मीरा',
      name_gu: 'એસ્ટ્રો મીરા',
      name_te: 'ఆస్ట్రో మీరా',
      name_bn: 'অ্যাস্ট্রো মীরা',
      name_kn: 'ಆಸ್ಟ್ರೋ ಮೀರಾ',
      specialty: 'Blends modern astrology with traditional wisdom to provide clarity on love and wellness.',
      avatar: 'M',
      image: '/AIAstroMeeraDesai.png',
      exp: t('mentalPeaceExp'),
      tag: t('health'),
      rating: '4.7',
      users: '1.1K+',
      color: 'from-[#2563EB] to-[#0b142e]',
    },
    {
      name: 'Pandit Suresh ',
      name_en: 'Pandit Suresh',
      name_hi: 'पंडित सुरेश',
      name_mr: 'पंडित सुरेश',
      name_gu: 'પંડિત સુરેશ',
      name_te: 'పండిత్ సురేశ్',
      name_bn: 'পণ্ডিত সুরেশ',
      name_kn: 'ಪಂಡಿತ್ ಸುರೇಶ್',
      specialty: 'Renowned for accurate horoscope readings and personalized life-path predictions.',
      avatar: 'S',
      image: '/AIPanditSureshIyyer.jpeg',
      exp: t('marriageExp'),
      tag: t('marriage'),
      rating: '4.8',
      users: '1.4K+',
      color: 'from-[#2563EB] to-[#0b142e]',
    },
    {
      name: 'Jyotishi Kavita',
      name_en: 'Jyotishi Kavita',
      name_hi: 'ज्योतिषी कविता',
      name_mr: 'ज्योतिषी कविता',
      name_gu: 'જ્યોતિષી કવિતા',
      name_te: 'జ్యోతిషి కవిత',
      name_bn: 'জ্যোতিষী কবিতা',
      name_kn: 'ಜ್ಯೋತಿಷಿ ಕವಿತಾ',
      specialty: 'Helps people discover balance in career and relationships through astrology and remedies.',
      avatar: 'K',
      image: '/AIJyotishKavitaVerma.jpeg',
      exp: t('moneyDirectionExp'),
      tag: t('finance'),
      rating: '4.9',
      users: '1.0K+',
      color: 'from-[#2563EB] to-[#0b142e]',
    },
  ];

  const transits = [
    { title: t('venusTransitTitle'), desc: t('venusTransitDesc'), gradient: ['#6b4c12', '#2a1c05'], glyph: '♀', accent: '#F0C24B' },
    { title: t('jupiterTransitTitle'), desc: t('jupiterTransitDesc'), gradient: ['#0f4a4a', '#0a2226'], glyph: '♃', accent: '#5EE0D6' },
    { title: t('saturnTransitTitle'), desc: t('saturnTransitDesc'), gradient: ['#4a1f6b', '#241338'], glyph: '♄', accent: '#C79BFF' },
    { title: t('mercuryTransitTitle'), desc: t('mercuryTransitDesc'), gradient: ['#332a78', '#1a1440'], glyph: '☿', accent: '#A99BFF' },
    { title: t('rahuKetuTransitTitle'), desc: t('rahuKetuTransitDesc'), gradient: ['#0f5a3a', '#0a2a20'], glyph: '☊', accent: '#5EE0A8' },
    { title: t('sunTransitTitle'), desc: t('sunTransitDesc'), gradient: ['#6b2f14', '#2e1305'], glyph: '☉', accent: '#FFB067' },
    { title: t('moonTransitTitle'), desc: t('moonTransitDesc'), gradient: ['#1e3a6b', '#0f1c38'], glyph: '☾', accent: '#8FB8FF' },
    { title: t('marsTransitTitle'), desc: t('marsTransitDesc'), gradient: ['#6b1f14', '#2e0d08'], glyph: '♂', accent: '#FF8A6B' },
  ];

  // Astro service tiles (visual grid) — logic/navigation preserved.
  const services = [
    {
      img: require('@/assets/images/chat.png'),
      label: t('chat'),
      sub: t('withastrologer'),
      onPress: () => router.push('/chat'),
    },
    {
      img: require('@/assets/images/manglik-dosh.png'),
      label: t('manglikDosh'),
      sub: t('checkstatus'),
      onPress: () => {
        logMetaEvent('fb_mobile_dosh_report_manglik');
        router.push({ pathname: '/dosh-report', params: { type: 'manglik-dosh' } });
      },
    },
    {
      img: require('@/assets/images/kalsharp-dosh.png'),
      label: t('kalSarpDosh'),
      sub: t('checkstatus'),
      onPress: () => {
        logMetaEvent('fb_mobile_dosh_report_kal_sarp');
        router.push({ pathname: '/dosh-report', params: { type: 'kal-sarp-dosh' } });
      },
    },
    {
      img: require('@/assets/images/sade-sati.png'),
      label: t('sadeSati'),
      sub: t('checkstatus'),
      onPress: () => {
        logMetaEvent('fb_mobile_dosh_report_sadhe_sati');
        router.push({ pathname: '/dosh-report', params: { type: 'sadhe-sati' } });
      },
    },
    {
      img: require('@/assets/images/ascendent.png'),
      label: t('ascendantInfo'),
      sub: t('checklagna'),
      onPress: () => router.push('/ascendant-info'),
    },
    {
      img: require('@/assets/images/dasha.png'),
      label: t('dashaInfo'),
      sub: t('currentperiod'),
      onPress: () => router.push('/dasha-info'),
    },
  ];

  const getFirstName = (name = '') => {
    if (!name) return 'User';
    const first = name.trim().split(' ')[0];
    return first.charAt(0).toUpperCase() + first.slice(1);
  };

  // Header birth-detail line — e.g. "14 Nov 1996" and "06:42 AM".
  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatMetaDate = (p) => {
    if (!p) return '';
    const m = parseInt(p.month, 10);
    const mon = Number.isNaN(m) ? p.month : (MONTHS_SHORT[(m - 1 + 12) % 12] || p.month);
    return `${p.day} ${mon} ${p.year}`;
  };
  const formatMeta12h = (p) => {
    if (!p) return '';
    let h = parseInt(p.hour, 10);
    const min = String(p.min).padStart(2, '0');
    if (Number.isNaN(h)) return `${p.hour}:${min}`;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${min} ${ampm}`;
  };

  // Time-aware greeting — makes the home feel alive and personal.
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return { text: t('greetingMorning'), emoji: '🌅' };
    if (h < 17) return { text: t('greetingAfternoon'), emoji: '☀️' };
    return { text: t('greetingEvening'), emoji: '🌙' };
  }, [t]);


  const videos = [
    { id: '1', source: require('../../assets/videos/kd.mp4') },
    { id: '2', source: require('../../assets/videos/meena.mp4') },
    { id: '3', source: require('../../assets/videos/naushin.mp4') },
    { id: '4', source: require('../../assets/videos/suraj.mp4') },
  ];

  const getLocalizedAstrologerName = (astrologer) => {
    if (language === 'hi') return astrologer.name_hi || astrologer.name_en || astrologer.name || '';
    if (language === 'mr') return astrologer.name_mr || astrologer.name_hi || astrologer.name_en || astrologer.name || '';
    if (language === 'gu') return astrologer.name_gu || astrologer.name_hi || astrologer.name_en || astrologer.name || '';
    if (language === 'te') return astrologer.name_te || astrologer.name_hi || astrologer.name_en || astrologer.name || '';
    if (language === 'bn') return astrologer.name_bn || astrologer.name_hi || astrologer.name_en || astrologer.name || '';
    if (language === 'kn') return astrologer.name_kn || astrologer.name_hi || astrologer.name_en || astrologer.name || '';
    return astrologer.name_en || astrologer.name || '';
  };

  const [remainingTime, setRemainingTime] = useState('05:30');

  const horizontalPadding = is1280x800 ? 40 : 0;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={colors.bgGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.headerBar}>
        <View style={[styles.headerRow, { paddingHorizontal: horizontalPadding }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.menuBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Menu"
              onPress={() => {
                navigation.setParams({
                  drawerUser: {
                    fullName: profile?.fullName,
                    phone: profile?.phone,
                  },
                });
                navigation.openDrawer();
              }}
            >
              <View style={styles.menuIcon}>
                <View style={styles.menuLine} />
                <View style={styles.menuLine} />
                <View style={styles.menuLine} />
              </View>
            </TouchableOpacity>
            <View style={styles.greetingWrap}>
              <Text style={styles.greetingText} numberOfLines={1}>
                <Text style={styles.greetingHello}>Namaste, </Text>
                <Text style={styles.greetingName}>{getFirstName(profile?.fullName)}</Text>
                {' '}
                <Sparkle style={styles.sparkle} duration={850} />
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconBtn}
              hitSlop={8}
              onPress={toggleTheme}
              accessibilityRole="button"
              accessibilityLabel="Toggle theme"
            >
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={colors.text} />
            </TouchableOpacity>
            <HomeLanguageDropdown />
            <TouchableOpacity
              style={styles.iconBtn}
              hitSlop={8}
              onPress={() => router.push('/notifications')}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Birth details line */}
        <View style={[styles.metaLineWrap, { paddingHorizontal: horizontalPadding }]}>
          {profileLoading ? (
            <View style={styles.metaLoading}>
              <ActivityIndicator size="small" color={colors.gold} />
              <Text style={styles.metaText}>Loading details...</Text>
            </View>
          ) : profile ? (
            <Text style={styles.metaText} numberOfLines={1} ellipsizeMode="tail">
              {formatMetaDate(profile)}
              {'  '}<Sparkle style={styles.sparkle} duration={1050} />{'  '}
              {formatMeta12h(profile)}
              {'  '}<Sparkle style={styles.sparkle} duration={1250} />{'  '}
              {`${profile?.city}, ${profile?.state}`}
            </Text>
          ) : (
            <Text style={styles.metaText}>—</Text>
          )}
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: horizontalPadding }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/chat')}>
          <LinearGradient
            colors={isDark ? ['#3B2A7A', '#2A1D5E', '#1B1140'] : ['#1F3E70', '#14284A', '#0A1526']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            {/* Decorative zodiac wheel */}
            <View style={styles.heroWheelWrap} pointerEvents="none">
              <View style={styles.heroWheelOuter}>
                <View style={styles.heroWheelInner}>
                  <Ionicons name="sunny" size={44} color="#F0C24B" />
                </View>
              </View>
              <View style={styles.heroGlow} />
            </View>

            <View style={styles.heroContent}>
              <View style={styles.heroTagRow}>
                <Ionicons name="sparkles" size={12} color="#E4AD0D" />
                <Text style={styles.heroTag}>{t('guidanceInStars').toUpperCase()}</Text>
              </View>
              <Text style={styles.heroHeading}>{t('findClarity')}</Text>
              <Text style={styles.heroHeading}>
                {t('embraceFuture')}
              </Text>
              <Text style={styles.heroSub}>{t('heroSubtitle')}</Text>

              <View style={styles.heroCtaRow}>
                <LinearGradient
                  colors={['#F4C752', '#E0A320']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroBtn}
                >
                  <Text style={styles.heroBtnText}>{t('chatWithAstrologerBtn')}</Text>
                </LinearGradient>
              </View>

              <View style={styles.heroUsersRow}>
                <View style={styles.heroAvatars}>
                  {astrologers.slice(0, 3).map((a, i) => {
                    const file = (a.image || '').replace(/^\//, '');
                    const localImg = ASTRO_IMAGE_MAP[file];
                    return (
                      <Image
                        key={i}
                        source={localImg}
                        style={[styles.heroAvatar, { marginLeft: i === 0 ? 0 : -10 }]}
                      />
                    );
                  })}
                </View>
                <Text style={styles.heroUsersText}>{t('happyUsers')}</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Astro Services */}
        <SectionHeader title={t('astroServices')} />
        <View style={styles.servicesGrid}>
          {services.map((s, idx) => (
            <Pressable
              key={idx}
              style={({ pressed }) => [styles.serviceCard, pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 }]}
              onPress={s.onPress}
            >
              <View style={styles.serviceIconRing}>
                <Image source={s.img} style={styles.serviceIcon} />
              </View>
              <Text style={styles.serviceLabel} numberOfLines={1}>{s.label}</Text>
              <Text style={styles.serviceSub} numberOfLines={1}>{s.sub}</Text>
              <View style={styles.serviceArrow}>
                <Ionicons name="arrow-forward" size={14} color={colors.gold} />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Trending Consultations */}
        <SectionHeader
          title={t('trendingConsultations')}
          onPress={() => router.push('/trending-consultations')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: horizontalPadding + 16, gap: 10 }}
        >
          {trending.map((tItem) => (
            <TouchableOpacity
              key={tItem.title}
              style={styles.trendingChip}
              activeOpacity={0.8}
              onPress={async () => {
                try {
                  await AsyncStorage.setItem('SELECTED_CONSULTATION_TITLE', tItem.title);
                  navigation.navigate('chat');
                } catch (e) { }
              }}
            >
              <Text style={styles.trendingEmoji}>{tItem.emoji}</Text>
              <Text style={styles.trendingText}>{tItem.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Talk to Our Top Astrologers */}
        <View style={styles.topAstroHeader}>
          <Text style={[styles.sectionTitle, { marginBottom: 2 }]}>{t('topAstrologers')}</Text>
          <Text style={styles.sectionSub}>{t('worriedSubTap')}</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: horizontalPadding + 16, gap: 14, paddingVertical: 4 }}
        >
          {astrologers.map((a, idx) => {
            const astroImageFile = (a.image || '').replace(/^\//, '');
            const localImg = ASTRO_IMAGE_MAP[astroImageFile];
            const base = process.env.EXPO_PUBLIC_CDN_BASE_URL || process.env.NEXT_PUBLIC_CDN_BASE_URL || '';
            const astroImageUri = localImg ? '' : `${base}/${astroImageFile}`;
            const imgSource = localImg ? localImg : { uri: astroImageUri };

            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.85}
                style={styles.astroCard}
                onPress={async () => {
                  try {
                    const astrologerName = getLocalizedAstrologerName(a);
                    await AsyncStorage.setItem('SELECTED_ASTROLOGER_NAME', astrologerName);
                    await AsyncStorage.setItem('SELECTED_ASTROLOGER_IMAGE', astroImageUri || astroImageFile || '');
                    router.push({ pathname: '/chat', params: { astrologerName, astrologerImage: astroImageUri || astroImageFile || '' } });
                  } catch (e) { }
                }}
              >
                <View style={styles.astroAvatarRing}>
                  <Image source={imgSource} style={styles.astroAvatar} resizeMode="cover" />
                  <View style={styles.onlineDot} />
                </View>
                <Text style={styles.astroName} numberOfLines={1}>{getLocalizedAstrologerName(a)}</Text>
                <Text style={styles.astroTag} numberOfLines={1}>{a.tag}</Text>
                <View style={styles.astroStatsRow}>
                  <Ionicons name="star" size={12} color={colors.gold} />
                  <Text style={styles.astroStat}>{a.rating}</Text>
                  <View style={styles.astroStatDivider} />
                  <Ionicons name="person" size={11} color={colors.textMuted} />
                  <Text style={styles.astroStat}>{a.users}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Reviews */}
        <SectionHeader title={t('reviewsTitle')} />
        <View style={styles.reviewsWrap}>
          <VideoCarousel />
        </View>

        {/* Planetary Effects */}
        <SectionHeader title={t('planetaryTransit')} />
        {transits.map((p) => (
          <Pressable
            key={p.title}
            onPress={async () => {
              try { await AsyncStorage.setItem('SELECTED_CONSULTATION_TITLE', p.title); } catch (e) {}
              router.push('/chat');
            }}
            style={({ pressed }) => pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 }}
            accessibilityRole="button"
            accessibilityLabel={p.title}
          >
            <LinearGradient
              colors={p.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.transitCard}
            >
              <View style={styles.transitPlanet}>
                <Text style={[styles.transitGlyphBig, { color: p.accent }]}>{p.glyph}</Text>
              </View>
              <View style={styles.transitTextWrap}>
                <Text style={styles.transitTitle}>{p.title}</Text>
                <View style={styles.transitBody}>
                  <Ionicons name="star" size={13} color={p.accent} style={{ marginTop: 2 }} />
                  <Text style={styles.transitDesc}>{p.desc}</Text>
                </View>
              </View>
              <View style={[styles.transitArrow, { borderColor: p.accent }]}>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </View>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>

      {/* Live band + Bottom navigation */}
      <View style={styles.bottomBarSpacer}>
        <HomeLiveBand />

        <LinearGradient
          colors={isDark ? ['#241A46', '#140E2C'] : ['#1F3E70', '#14284A', '#0A1526']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.bottomBar}
        >
          <View style={styles.bottomItem}>
            <View style={[styles.iconWrap, styles.iconWrapActive]}>
              <Ionicons name="home" size={20} color="#0B0A2E" />
            </View>
            <Text style={[styles.bottomLabel, styles.bottomLabelActive]}>{t('home')}</Text>
          </View>
          <TouchableOpacity style={styles.bottomItem} onPress={() => router.push('/chat')}>
            <View style={styles.iconWrap}>
              <Ionicons name="chatbubbles-outline" size={20} color="#B9B4D6" />
            </View>
            <Text style={styles.bottomLabel}>{t('chat')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomItem} onPress={() => router.push('/profile')}>
            <View style={styles.iconWrap}>
              <Ionicons name="person-outline" size={20} color="#B9B4D6" />
            </View>
            <Text style={styles.bottomLabel}>{t('profile')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomItem} onPress={() => router.push('/FAQ')}>
            <View style={styles.iconWrap}>
              <Ionicons name="help-circle-outline" size={20} color="#B9B4D6" />
            </View>
            <Text style={styles.bottomLabel}>{t('faq')}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Free reading: intro -> language -> reading */}
      <Modal
        visible={maStage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (maStage === 'reading' && !maLoading) setMaStage(null);
          else if (maStage === 'intro') dismissMindAnalysis();
        }}
      >
        <View style={styles.maOverlay}>
          <View style={styles.maCard}>
            {maStage === 'intro' ? (
              <>
                <Text style={styles.maTitle}>{t('mindAnalysisIntroTitle')}</Text>
                <Text style={styles.maDesc}>{t('mindAnalysisIntroDesc')}</Text>
                <TouchableOpacity
                  style={styles.maPrimaryBtn}
                  onPress={() => setMaStage('language')}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={colors.goldGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.maPrimaryInner}
                  >
                    <Text style={styles.maPrimaryText}>{t('mindAnalysisIntroCta')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.maSecondaryBtn} onPress={dismissMindAnalysis}>
                  <Text style={styles.maSecondaryText}>{t('mindAnalysisIntroDismiss')}</Text>
                </TouchableOpacity>
              </>
            ) : null}

            {maStage === 'language' ? (
              <>
                <Text style={styles.maTitle} numberOfLines={1} adjustsFontSizeToFit>{t('mindAnalysisLanguageTitle')}</Text>
                <Text style={styles.maDesc}>{t('mindAnalysisLanguageDesc')}</Text>
                <ScrollView
                  style={styles.maLangList}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {MIND_ANALYSIS_LANGUAGES.map((option) => {
                    const active = option.value === (profile?.language || 'English');
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={styles.maLangRow}
                        onPress={() => runMindAnalysisReading(option.value)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.maLangText, active && styles.maLangTextActive]}>
                          {option.label}
                        </Text>
                        {active ? (
                          <Ionicons name="checkmark" size={16} color={colors.gold} />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            ) : null}

            {maStage === 'reading' ? (
              <>
                <Text style={styles.maTitle}>{t('onboardingReadingTitle')}</Text>
                <View style={{ marginTop: 14 }}>
                  <MindAnalysisReading
                    text={maReading}
                    loading={maLoading}
                    error={maError}
                    maxHeight={340}
                    onSubmitFeedback={submitAnalysisFeedback}
                    onContinue={() => {
                      setMaStage(null);
                      router.push('/chat');
                    }}
                  />
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },

  // Header
  headerBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, minWidth: 0, marginRight: 10, gap: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // Bare hamburger (no chrome) beside the greeting.
  menuBtn: {
    width: 34, height: 38,
    alignItems: 'flex-start', justifyContent: 'center',
  },
  // Custom three parallel lines (hamburger).
  menuIcon: { width: 24, gap: 5, alignItems: 'flex-start' },
  menuLine: { width: 24, height: 2.5, borderRadius: 2, backgroundColor: colors.text },
  // "Namaste, <name> ✦" greeting sitting next to the menu.
  greetingWrap: { flexShrink: 1, minWidth: 0, marginLeft: 10, justifyContent: 'center' },
  greetingText: { fontSize: 16, lineHeight: 21 },
  greetingHello: { color: colors.textMuted, fontWeight: '600' },
  greetingName: { color: colors.goldText, fontWeight: '800' },
  // Circular control for the theme (moon/sun) toggle on the right.
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.ctrlBorder,
    backgroundColor: colors.ctrlBg,
  },
  sparkle: {
    color: colors.gold, fontWeight: '700',
    textShadowColor: colors.gold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 7,
  },

  // Monospace birth-detail line with sparkle separators.
  metaLineWrap: { marginTop: 14 },
  metaLoading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { color: colors.textMuted, fontSize: 12.5, fontFamily: 'monospace', letterSpacing: 0.2 },

  // Section header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 26, marginBottom: 14, paddingHorizontal: 16,
  },
  sectionTitle: { color: colors.text, fontWeight: '800', fontSize: 19 },
  sectionSub: { color: colors.textMuted, fontSize: 12.5, marginTop: 2 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { color: colors.goldText, fontWeight: '600', fontSize: 13 },

  // Hero
  hero: {
    marginHorizontal: 16, marginTop: 18,
    borderRadius: 22, padding: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(228,173,13,0.25)',
  },
  heroContent: { width: '72%' },
  heroWheelWrap: {
    position: 'absolute', right: -34, top: -10, bottom: 0,
    width: 190, alignItems: 'center', justifyContent: 'center',
  },
  heroWheelOuter: {
    width: 150, height: 150, borderRadius: 75,
    borderWidth: 1, borderColor: 'rgba(240,194,75,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroWheelInner: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 1, borderColor: 'rgba(240,194,75,0.5)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(240,194,75,0.06)',
  },
  heroGlow: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(240,194,75,0.14)',
  },
  heroTagRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  heroTag: { color: '#E4AD0D', fontSize: 9.5, fontWeight: '700', letterSpacing: 0.8 },
  heroHeading: { color: '#FFFFFF', fontSize: 25, fontWeight: '800', lineHeight: 31 },
  heroSub: { color: 'rgba(255,255,255,0.78)', fontSize: 12.5, marginTop: 8, marginBottom: 16 },
  heroCtaRow: { flexDirection: 'row' },
  heroBtn: { paddingVertical: 11, paddingHorizontal: 20, borderRadius: 12 },
  heroBtnText: { color: '#231A05', fontWeight: '800', fontSize: 13.5 },
  heroUsersRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8 },
  heroAvatars: { flexDirection: 'row' },
  heroAvatar: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
  },
  heroUsersText: { color: 'rgba(255,255,255,0.85)', fontSize: 11.5, fontWeight: '600' },

  // Services grid
  servicesGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, justifyContent: 'space-between',
  },
  serviceCard: {
    width: '31%', marginBottom: 12,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: 18, paddingVertical: 16, paddingHorizontal: 6,
    alignItems: 'center',
  },
  serviceIconRing: {
    width: 62, height: 62, borderRadius: 31,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(228,173,13,0.06)',
    borderWidth: 1, borderColor: 'rgba(228,173,13,0.22)',
    marginBottom: 10,
  },
  serviceIcon: { width: 46, height: 46, resizeMode: 'contain' },
  serviceLabel: { color: colors.text, fontWeight: '700', fontSize: 12.5, textAlign: 'center' },
  serviceSub: { color: colors.textSubtle, fontStyle: 'italic', fontSize: 10.5, textAlign: 'center', marginTop: 3, marginBottom: 10 },
  serviceArrow: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(228,173,13,0.35)',
  },
  // Mind-analysis popup (intro -> language -> reading)
  maOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  maCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: colors.elevated,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 20,
  },
  maTitle: { color: colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  maDesc: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
  },
  maPrimaryBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 20 },
  maPrimaryInner: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  maPrimaryText: { color: colors.onGold, fontSize: 15, fontWeight: '800' },
  maSecondaryBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  maSecondaryText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  maLangList: { marginTop: 16, alignSelf: 'stretch' },
  maLangRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  maLangText: { color: colors.text, fontSize: 15 },
  maLangTextActive: { color: colors.goldText, fontWeight: '700' },

  // Trending chips
  trendingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingVertical: 11, paddingHorizontal: 16, borderRadius: 999,
    backgroundColor: 'rgba(124,92,255,0.14)',
    borderWidth: 1, borderColor: 'rgba(160,130,255,0.35)',
  },
  trendingEmoji: { fontSize: 15 },
  trendingText: { color: isDark ? '#EDEAFB' : colors.text, fontWeight: '600', fontSize: 13.5 },

  // Top astrologers
  topAstroHeader: { marginTop: 26, marginBottom: 14, paddingHorizontal: 16 },
  astroCard: {
    width: 130, alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: 18, paddingVertical: 16, paddingHorizontal: 8,
  },
  astroAvatarRing: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 2, borderColor: 'rgba(228,173,13,0.5)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 9,
  },
  astroAvatar: { width: 60, height: 60, borderRadius: 30 },
  onlineDot: {
    position: 'absolute', bottom: 3, right: 6,
    width: 12, height: 12, borderRadius: 6, backgroundColor: '#3BD16F',
    borderWidth: 2, borderColor: '#12103A',
  },
  astroName: { color: colors.text, fontWeight: '700', fontSize: 13.5 },
  astroTag: { color: colors.textMuted, fontSize: 11, marginTop: 2, marginBottom: 8 },
  astroStatsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : colors.sunken,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.surfaceBorder,
  },
  astroStat: { color: isDark ? '#EDEAFB' : colors.text, fontSize: 11, fontWeight: '600' },
  astroStatDivider: { width: 1, height: 11, backgroundColor: isDark ? 'rgba(255,255,255,0.16)' : colors.hairline, marginHorizontal: 3 },

  // Reviews
  reviewsWrap: { paddingHorizontal: 4 },

  // Transit cards
  transitCard: {
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  transitPlanet: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
    marginRight: 14,
  },
  transitGlyphBig: { fontSize: 26, fontWeight: '700' },
  transitTextWrap: { flex: 1 },
  transitTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 17, marginBottom: 4 },
  transitBody: { flexDirection: 'row', alignItems: 'flex-start' },
  transitDesc: { flex: 1, color: '#E4E1F2', marginLeft: 6, fontSize: 12.5, lineHeight: 17 },
  transitArrow: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1,
    marginLeft: 10,
  },

  // Live band
  liveBand: {
    backgroundColor: colors.primarySolid,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    marginHorizontal: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  liveBandContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  liveLabel: {
    backgroundColor: '#FF6B35', color: '#fff', fontWeight: '700', fontSize: 12,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  liveBandTimeContainer: { flexDirection: 'row', alignItems: 'center' },
  liveBandTimeLabel: { color: colors.onPrimary, fontWeight: '600', fontSize: 13 },
  liveBandTime: { color: colors.onPrimary, fontWeight: '800', fontSize: 14 },
  liveBandArrow: {
    backgroundColor: '#FF6B35', width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },

  // Bottom bar
  bottomBarSpacer: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  bottomBar: {
    height: 74, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingHorizontal: 12, marginHorizontal: 14, marginBottom: 14,
    borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(228,173,13,0.22)',
  },
  bottomItem: { alignItems: 'center', justifyContent: 'center' },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: {
    backgroundColor: '#E4AD0D',
    shadowColor: '#E4AD0D', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 10, elevation: 6,
  },
  bottomLabel: { marginTop: 3, fontSize: 11, color: '#B9B4D6' },
  bottomLabelActive: { color: '#E4AD0D', fontWeight: '700' },
});


const formatExp = (exp, t) => {
  // Try to extract a numeric value from the exp if present
  const numericMatch = String(exp || '').match(/(\d+)/);
  const years = numericMatch ? parseInt(numericMatch[1], 10) : null;

  if (years !== null && !isNaN(years)) {
    return `${years} ${t('yrsExperienceSuffix')}`;
  }

  // If exp is already a localized label (e.g., "Career Experience"), return it directly
  if (exp) {
    return String(exp);
  }

  // Otherwise, fallback to a generic localized "experience"
  return t('experience');
};

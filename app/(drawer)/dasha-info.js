import ChatWithAstrologerSection from '@/components/ui/ChatWithAstrologerSection';
import FadeInView from '@/components/ui/FadeInView';
import GradientScreen from '@/components/ui/GradientScreen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';
import { radius, spacing } from '@/lib/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function DashaInfoScreen() {
  const router = useRouter();
  const { t ,language} = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const apiLanguage = ['hi'].includes(language) ? 'hi' : 'en';
  /* =======================
     PROFILE → API PAYLOAD
  ======================== */
const mapProfileToApi = (p) => ({
  city: p?.city || '',
  country: p?.country || '',
  day: p?.day ? String(p.day).padStart(2, '0') : '',
  full_name: p?.fullName || p?.full_name || p?.name || '',
  gender: p?.gender
    ? p.gender.charAt(0).toLowerCase() + p.gender.slice(1)
    : '',
  hour: p?.hour ? String(p.hour).padStart(2, '0') : '',
  min: p?.min ? String(p.min).padStart(2, '0') : '',
  month: p?.month ? String(p.month).padStart(2, '0') : '',
  sec: String(p?.sec ?? 0),
  state: p?.state || '',
  year: p?.year ? String(p.year) : '',
  language: language === 'hi' ? 'hi' : 'en',
});
console.log('language:', language);
  /* =======================
     FETCH DASHAS
  ======================== */
  const fetchInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem('AUTH_TOKEN');
      const language = await AsyncStorage.getItem('APP_LANGUAGE');
      const raw = await AsyncStorage.getItem('USER_PROFILE');
      const profile = raw ? JSON.parse(raw) : {};

      const base = (`${process.env.EXPO_PUBLIC_API_BASE_URL}`).replace(/\/$/, '');
      const url = `${base}/vimshottari`;

      const payload = {
        ...mapProfileToApi(profile),
         language: apiLanguage,
        token: token || null,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: token || '',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      setData(json?.data || null);
      console.log('json:', json);
    } catch (e) {
      setError(e?.message || 'Failed to load dasha info');
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     DATE HELPERS
  ======================== */
  const parseDate = (v) => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };

  /* =======================
     CORE LOGIC (USE THIS)
  ======================== */
  const findActivePeriod = (periodsObj, today = new Date()) => {
    if (!periodsObj || typeof periodsObj !== 'object') return null;

    const todayMs = today.getTime();
    let nearestFuture = null;

    for (const [planet, period] of Object.entries(periodsObj)) {
      const start = parseDate(period.start_date || period.start_time);
      const end = parseDate(period.end_date || period.end_time);
      if (!start || !end) continue;

      const startMs = start.getTime();
      const endMs = end.getTime();

      // ✅ Active range
      if (todayMs >= startMs && todayMs <= endMs) {
        return { planet, ...period };
      }

      // fallback
      if (endMs > todayMs) {
        if (
          !nearestFuture ||
          endMs <
            parseDate(
              nearestFuture.end_date || nearestFuture.end_time
            ).getTime()
        ) {
          nearestFuture = { planet, ...period };
        }
      }
    }

    return nearestFuture;
  };

  /* =======================
     SELECT ACTIVE DASHAS
  ======================== */
  const activeDashas = useMemo(() => {
    if (!data?.maha_dasha) {
      return { activeMaha: null, activeAntar: null, activePratyantar: null };
    }

    const today = new Date();

    const activeMaha = findActivePeriod(data.maha_dasha, today);

    let activeAntar = null;
    let activePratyantar = null;

    if (activeMaha?.antar_dasha) {
      activeAntar = findActivePeriod(activeMaha.antar_dasha, today);

      if (activeAntar?.pratyantar_dasha) {
        activePratyantar = findActivePeriod(
          activeAntar.pratyantar_dasha,
          today
        );
      }
    }

    return { activeMaha, activeAntar, activePratyantar };
  }, [data]);

  /* =======================
     LOAD ON FOCUS
  ======================== */
  useFocusEffect(
    useCallback(() => {
      fetchInfo();
    }, [language])
  );

  /* =======================
     UI
  ======================== */
  return (
    <GradientScreen>
      <ScreenHeader title={t('dashaInfo')} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.gold} />
            <Text style={styles.subtle}>{t('loadingReportEllipsis')}</Text>
          </View>
        )}

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && !error && activeDashas.activeMaha && (
          <FadeInView style={styles.resultBox}>
            <Text style={styles.resultTitle}>{t('activeDashaTodayLabel')}</Text>

            <View style={styles.dashaRow}>
              <Text style={styles.resultText}>{t('mahaDashaLabel')}</Text>
              <Text style={styles.resultTextnew}>{activeDashas.activeMaha?.planet || '—'}</Text>
            </View>
            <View style={styles.dashaRow}>
              <Text style={styles.resultText}>{t('antarDashaLabel')}</Text>
              <Text style={styles.resultTextnew}>{activeDashas.activeAntar?.planet || '—'}</Text>
            </View>
            <View style={styles.dashaRow}>
              <Text style={styles.resultText}>{t('pratyantarDashaLabel')}</Text>
              <Text style={styles.resultTextnew}>{activeDashas.activePratyantar?.planet || '—'}</Text>
            </View>

            <ChatWithAstrologerSection />
          </FadeInView>
        )}
      </ScrollView>
    </GradientScreen>
  );
}

/* =======================
   STYLES
======================= */
const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingTop: 6 },

  center: { alignItems: 'center', marginTop: 60 },
  subtle: { color: colors.textMuted, marginTop: 10 },

  errorBox: {
    backgroundColor: 'rgba(255,107,107,0.10)',
    borderColor: 'rgba(255,107,107,0.4)',
    borderWidth: 1,
    padding: 14,
    borderRadius: radius.md,
  },
  errorText: { color: '#FF9B8A' },

  resultBox: {
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 4,
  },
  resultTitle: { fontWeight: '800', color: colors.goldText, marginBottom: 12, fontSize: 15 },
  dashaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.hairline,
  },
  resultText: { color: colors.textMuted, fontWeight: '600' },
  resultTextnew: { color: colors.text, fontWeight: '800', fontSize: 15 },
});

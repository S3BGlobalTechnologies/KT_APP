import ChatWithAstrologerSection from '@/components/ui/ChatWithAstrologerSection';
import FadeInView from '@/components/ui/FadeInView';
import GradientScreen from '@/components/ui/GradientScreen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';
import { radius, spacing } from '@/lib/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function DoshReport() {
  const { type } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
   const { t, language } = useLanguage()
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const router =useRouter()

  const titleMap = {
    'manglik-dosh': t('manglikDosh'),
    'kal-sarp-dosh': t('kalSarpDosh'),
    'sade-sati': t('sadeSati'),
    'sadhe-sati': t('sadeSati'),
  };
// DivineAPI uses non-standard codes for some languages
  const DIVINE_API_LANGUAGE_MAP = {
    mr: 'ma',   // Marathi
    ta: 'tm',   // Tamil
    te: 'tl',   // Telugu
    // gu: Gujarati is NOT supported by DivineAPI — no code will work
  };

  const getApiLanguage = (lang, forType) => {
    if (forType === 'manglik-dosh') {
      if (lang === 'gu') return 'en'; // Gujarati unsupported — fallback to English
      if (DIVINE_API_LANGUAGE_MAP[lang]) return DIVINE_API_LANGUAGE_MAP[lang];
    }
    return lang || '';
  };
  const mapProfileToApi = (p) => ({
    full_name: p?.full_name || p?.fullName || p?.name || '',
    day: p?.day ? String(p.day).padStart(2, '0') : '',
    month: p?.month ? String(p.month).padStart(2, '0') : '',
    year: p?.year ? String(p.year) : '',
    hour: p?.hour ? String(p.hour).padStart(2, '0') : '',
    min: p?.min ? String(p.min).padStart(2, '0') : '',
    sec: p?.sec ? String(p.sec) : '0',
    gender: p?.gender ? (p.gender.charAt(0).toLowerCase() + p.gender.slice(1)) : '',
    city: p?.city || '',
    state: p?.state || '',
    country: p?.country || '',
    language: getApiLanguage(language, type),
  });
  
  console.log('language:', language);

  // Helpers
  const normalizeReport = (d) => (d?.data ? d.data : d || {});

  // Manglik Dosh UI
  const renderManglik = (r) => {
    const raw = r?.manglik_dosha;
    const isYes = raw === 'Yes' || raw === true || raw === 'true' || raw === 1;
    const isNo = raw === 'No' || raw === false || raw === 'false' || raw === 0;
    const statusLabel = isYes ? t('yesLabel') : isNo ? t('noLabel') : '-';
    const strengthVal = r?.strength;
    const strength = strengthVal === true || strengthVal === 'true' || strengthVal === 1
      ? t('yesLabel')
      : strengthVal === false || strengthVal === 'false' || strengthVal === 0
      ? t('noLabel')
      : '-';
    const percent = typeof r?.percentage === 'number' ? `${r.percentage}%` : r?.percentage ? String(r.percentage) : '-';
    const remedies = Array.isArray(r?.remedies) ? r.remedies : [];
    const comments = Array.isArray(r?.comment) ? r.comment : [];

    return (
      <View style={styles.cardBox}>
        <View style={styles.row}>
          <Text style={styles.resultTitle}>{t('manglikDosh')}</Text>
          <View style={[styles.pill, isYes ? styles.pillYes : styles.pillNo]}>
            <Text style={styles.pillText}>{statusLabel}</Text>
          </View>
        </View>
        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>{t('strengthLabel')}</Text>
          <Text style={styles.kvVal}>{strength}</Text>
        </View>
        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>{t('percentageLabel')}</Text>
          <Text style={styles.kvVal}>{percent}</Text>
        </View>

        <Text style={styles.sectionHeading}>{t('remediesLabel')}</Text>
        {remedies.length === 0 ? (
          <Text style={styles.subtle}>{t('noRemediesProvided')}</Text>
        ) : (
          remedies.map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <Text style={styles.listBullet}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))
        )}

        {comments.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>{t('commentsLabel')}</Text>
            {comments.map((c, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>{String(c)}</Text>
              </View>
            ))}
          </>
        )}
        <ChatWithAstrologerSection />
      </View>
    );
  };

  // Kal Sarp Dosh UI
  const renderKalSarp = (r) => {
    const present = r?.result === true || r?.result === 'true' || r?.present === true || r?.present === 'true';
    const statusLabel = present ? t('yesLabel') : t('noLabel');
    const intensity = r?.intensity ?? '-';
    const name = r?.name ?? '-';
    const direction = r?.direction ?? '-';
    const remedies = Array.isArray(r?.remedies) ? r.remedies : [];

    return (
      <View style={styles.cardBox}>
        <View style={styles.row}>
          <Text style={styles.resultTitle}>{t('kalSarpDosh')}</Text>
          <View style={[styles.pill, present ? styles.pillYes : styles.pillNo]}>
            <Text style={styles.pillText}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>{t('typeLabel')}</Text>
          <Text style={styles.kvVal}>{name}</Text>
        </View>
        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>{t('intensityLabel')}</Text>
          <Text style={styles.kvVal}>{intensity}</Text>
        </View>
        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>{t('directionLabel')}</Text>
          <Text style={styles.kvVal}>{direction}</Text>
        </View>

        <Text style={styles.sectionHeading}>{t('remediesLabel')}</Text>
        {remedies.length === 0 ? (
          <Text style={styles.subtle}>{t('noRemediesProvided')}</Text>
        ) : (
          remedies.map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <Text style={styles.listBullet}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))
        )}
        <ChatWithAstrologerSection />
      </View>
    );
  };

  // Sade Sati UI
  const renderSadeSati = (r) => {
    const ss = r?.sadhesati || {};
    const present = ss?.result === true || ss?.result === 'true';
    const statusLabel = present ? t('yesLabel') : t('noLabel');
    const consideration = ss?.consideration_date ?? '-';
    const saturnSign = ss?.saturn_sign ?? '-';
    const saturnRetro = ss?.saturn_retrograde === true || ss?.saturn_retrograde === 'true' ? t('yesLabel') : t('noLabel');
    const moonSign = r?.moon_sign ?? '-';
    const remedies = Array.isArray(r?.remedies) ? r.remedies : [];

    return (
      <View style={styles.cardBox}>
        <View style={styles.row}>
          <Text style={styles.resultTitle}>{t('sadeSati')}</Text>
          <View style={[styles.pill, present ? styles.pillYes : styles.pillNo]}>
            <Text style={styles.pillText}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>{t('considerationDateLabel')}</Text>
          <Text style={styles.kvVal}>{consideration}</Text>
        </View>
        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>{t('moonSign')}</Text>
          <Text style={styles.kvVal}>{moonSign}</Text>
        </View>
        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>{t('saturnSignLabel')}</Text>
          <Text style={styles.kvVal}>{saturnSign}</Text>
        </View>
        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>{t('saturnRetrogradeLabel')}</Text>
          <Text style={styles.kvVal}>{saturnRetro}</Text>
        </View>

        <Text style={styles.sectionHeading}>{t('remediesLabel')}</Text>
        {remedies.length === 0 ? (
          <Text style={styles.subtle}>{t('noRemediesProvided')}</Text>
        ) : (
          remedies.map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <Text style={styles.listBullet}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))
        )}

        <ChatWithAstrologerSection />
      </View>
    );
  };

  const fetchReport = async () => {
    if (!type) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const token = await AsyncStorage.getItem('AUTH_TOKEN');
      const rawProfile = await AsyncStorage.getItem('USER_PROFILE');
      const language = await AsyncStorage.getItem('APP_LANGUAGE');
      const profile = rawProfile ? JSON.parse(rawProfile) : null;
      const payload = mapProfileToApi(profile || {});

      const base = (`${process.env.EXPO_PUBLIC_API_BASE_URL}`).replace(/\/$/, '');
      const url = `${base}/${type}`;

      let res;
      // Always use POST since we need to send the payload
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token: token || '' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`POST ${res.status}`);

      const json = await res.json().catch(() => ({}));
      setData(json);
    } catch (e) {
      console.error('fetchReport error:', e);
      setError(e?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReport();
    }, [type,language])
  );

  return (
    <GradientScreen>
      <ScreenHeader title={titleMap[type] || t('astroServices')} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.center}><ActivityIndicator color={colors.gold} /><Text style={styles.subtle}>{t('loadingReportEllipsis')}</Text></View>
        )}
        {!!error && (
          <View style={styles.errorBox}><Text style={styles.errorText}>{String(error)}</Text></View>
        )}
        {!loading && !error && (
          <FadeInView>
            {type === 'manglik-dosh' && renderManglik(normalizeReport(data))}
            {type === 'kal-sarp-dosh' && renderKalSarp(normalizeReport(data))}
            {(type === 'sade-sati' || type === 'sadhe-sati') && renderSadeSati(normalizeReport(data))}
            {type !== 'manglik-dosh' && type !== 'kal-sarp-dosh' && type !== 'sade-sati' && type !== 'sadhe-sati' && (
              <View style={styles.resultBox}>
                <Text style={styles.resultTitle}>{t('resultLabel')}</Text>
                <Text style={styles.resultText}>{JSON.stringify(data, null, 2)}</Text>
              </View>
            )}
          </FadeInView>
        )}
      </ScrollView>
    </GradientScreen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingTop: 6, paddingBottom: 90 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  subtle: { color: colors.textMuted, marginTop: 10 },
  errorBox: {
    backgroundColor: 'rgba(255,107,107,0.10)', borderColor: 'rgba(255,107,107,0.4)',
    borderWidth: 1, borderRadius: radius.md, padding: 14,
  },
  errorText: { color: '#FF9B8A' },
  resultBox: { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1, borderRadius: radius.lg, padding: 16 },
  resultTitle: { fontWeight: '800', color: colors.text, fontSize: 18 },
  resultText: { color: colors.textSoft },
  cardBox: { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1, borderRadius: radius.lg, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  pillYes: { backgroundColor: 'rgba(59,209,111,0.14)', borderColor: 'rgba(59,209,111,0.45)' },
  pillNo: { backgroundColor: 'rgba(255,107,107,0.14)', borderColor: 'rgba(255,107,107,0.45)' },
  pillText: { color: colors.text, fontWeight: '700', fontSize: 12.5 },
  kvRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.hairline,
  },
  kvKey: { color: colors.textMuted },
  kvVal: { color: colors.text, fontWeight: '700', flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  sectionHeading: { marginTop: 16, marginBottom: 8, fontWeight: '800', color: colors.goldText, fontSize: 15 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 7 },
  listBullet: { color: colors.goldText, marginRight: 8 },
  listText: { color: colors.textSoft, flex: 1 },
});

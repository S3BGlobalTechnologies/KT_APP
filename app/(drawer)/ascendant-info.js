import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ChatWithAstrologerSection from '@/components/ui/ChatWithAstrologerSection';
import FadeInView from '@/components/ui/FadeInView';
import GradientScreen from '@/components/ui/GradientScreen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';
import { radius, spacing } from '@/lib/theme';
import { useRouter } from 'expo-router';

export default function AscendantInfoScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const router = useRouter();
const { t, language } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // DivineAPI uses non-standard codes for some languages
  const DIVINE_API_LANGUAGE_MAP = {
    mr: 'ma',   // Marathi
    ta: 'tm',   // Tamil
    te: 'tl',   // Telugu
  };

  const getApiLanguage = (lang) => {
    if (lang === 'gu') return 'en'; // Gujarati unsupported — fallback to English
    return DIVINE_API_LANGUAGE_MAP[lang] || lang || '';
  };

  const mapProfileToApi = (p) => ({
    city: p?.city || '',
    country: p?.country || '',
    day: p?.day ? String(p.day).padStart(2, '0') : '',
    full_name: p?.fullName || p?.full_name || p?.name || '',
    gender: p?.gender ? p.gender.charAt(0).toLowerCase() + p.gender.slice(1) : '',
    hour: p?.hour ? String(p.hour).padStart(2, '0') : '',
    min: p?.min ? String(p.min).padStart(2, '0') : '',
    month: p?.month ? String(p.month).padStart(2, '0') : '',
    sec: String(p?.sec ?? 0),
    state: p?.state || '',
    year: p?.year ? String(p.year) : '',
    language: getApiLanguage(language),
  });

  const fetchInfo = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const token = await AsyncStorage.getItem('AUTH_TOKEN');
      const language = await AsyncStorage.getItem('APP_LANGUAGE');
      const raw = await AsyncStorage.getItem('USER_PROFILE');
      const profile = raw ? JSON.parse(raw) : {};

      const base = (`${process.env.EXPO_PUBLIC_API_BASE_URL}`).replace(/\/$/, '');
      const url = `${base}/ascendant`;
      const payload = { ...mapProfileToApi(profile), token: token || null };

      console.log('=== ASCENDANT PAYLOAD SENT ===', JSON.stringify(payload));

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token: token || '', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json().catch(() => ({}));

      console.log('=== ASCENDANT RESPONSE ===', JSON.stringify(json));

      setData(json);
    } catch (e) {
      setError(e?.message || 'Failed to load ascendant info');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInfo();
    }, [language])
  );

  const normalized = data? data : data || {};

  const renderAscendant = (r) => {
    const asc = r?.data || {};
    const sign = asc?.ascendant ?? '-';
    const lord = asc?.planetary_lord ?? '-';
    const symbol = asc?.symbol ?? asc?.symble ?? '-';
    const chars = asc?.characteristics ?? '-';
    const fastDay = asc?.day_of_fast ?? '-';
    const stones = Array.isArray(asc?.lucky_stone)
      ? asc.lucky_stone
      : typeof asc?.lucky_stone === 'string'
      ? [asc.lucky_stone]
      : [];
    const article = asc?.article ?? '';
    const imageUrl = typeof asc?.image === 'string' ? asc.image.replace(/`/g, '').trim() : null;

    const paragraphs = String(article).split(/\n\n+/).filter(Boolean);

    return (
      <View style={styles.content}>
      <View style={styles.cardBox}>
        <View style={styles.ascHeader}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.ascImage} />
          ) : null}
          <View style={{ flex: 1, marginLeft: imageUrl ? 12 : 0 }}>
            <Text style={styles.ascName}>{sign}</Text>
            {symbol && symbol !== '-' && (
              <Text style={styles.ascSymbol}>{t('symbolLabel')}: {symbol}</Text>
            )}
          </View>
        </View>

        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>{t('planetaryLord')}</Text>
          <Text style={styles.kvVal}>{lord}</Text>
        </View>
        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>{t('characteristics')}</Text>
          <Text style={styles.kvVal}>{chars}</Text>
        </View>
        <View style={styles.kvRow}>
          <Text style={styles.kvKey}>{t('dayOfFast')}</Text>
          <Text style={styles.kvVal}>{fastDay}</Text>
        </View>

        <Text style={styles.sectionHeading}>{t('luckyStones')}</Text>
        {stones.length === 0 ? (
          <Text style={styles.subtle}>{t('noStonesProvided')}</Text>
        ) : (
          stones.map((s, idx) => (
            <View key={idx} style={styles.listItem}>
              <Text style={styles.listBullet}>•</Text>
              <Text style={styles.listText}>{s}</Text>
            </View>
          ))
        )}

        {!!paragraphs.length && (
          <>
            <Text style={styles.sectionHeading}>{t('article')}</Text>
            {paragraphs.map((p, idx) => (
              <Text key={idx} style={styles.article}>{p}</Text>
            ))}
          </>
        )}
        <ChatWithAstrologerSection />
      </View>
      </View>
    );
  };

  return (
    <GradientScreen>
      <ScreenHeader title={t('ascendantInfo')} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <ActivityIndicator color={colors.gold} />
            <Text style={{ color: colors.textMuted, marginTop: 10 }}>{t('loadingReportEllipsis')}</Text>
          </View>
        )}
        {!!error && (
          <View style={styles.errorBox}><Text style={styles.errorText}>{String(error)}</Text></View>
        )}
        {!loading && !error && <FadeInView>{renderAscendant(normalized)}</FadeInView>}
      </ScrollView>
    </GradientScreen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  content: { padding: spacing.gutter, paddingTop: 6, paddingBottom: 90 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
  subtle: { color: colors.textMuted, marginTop: 8 },
  errorBox: {
    backgroundColor: 'rgba(255,107,107,0.10)', borderColor: 'rgba(255,107,107,0.4)',
    borderWidth: 1, borderRadius: radius.md, padding: 14, margin: spacing.gutter,
  },
  errorText: { color: '#FF9B8A' },
  cardBox: {
    backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1,
    borderRadius: radius.lg, padding: 16,
  },
  ascHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  ascImage: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceStrong, borderWidth: 1, borderColor: colors.goldRing },
  ascName: { fontWeight: '800', color: colors.goldText, fontSize: 20 },
  ascSymbol: { color: colors.textMuted, marginTop: 3 },
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
  article: { color: colors.textSoft, lineHeight: 22, marginBottom: 10 },
});

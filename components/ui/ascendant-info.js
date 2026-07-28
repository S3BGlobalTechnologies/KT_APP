import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';


// Renders ascendant-related chips by calling the ascendant-info API with the full profile
export default function AscendantInfo({ profile, token, endpoint, privateMode = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const { t } = useLanguage();
  const { colors } = useTheme();
  const palette = {
    heading: colors.textMuted,
    value: colors.goldText,
    skeleton: colors.hairline,
    notice: colors.textMuted,
    error: colors.danger,
  };

  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  // Only run the shimmer loop while actually loading — otherwise it would
  // animate forever (e.g. the whole chat session) for no visible benefit.
  useEffect(() => {
    if (!loading) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [loading, fadeAnim]);

  // Validate that profile has the required fields before calling API
  const hasRequiredFields = (p) => {
    const num = (v) => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)));
    return (
      p &&
      num(p.day) &&
      num(p.month) &&
      num(p.year) &&
      num(p.hour) &&
      num(p.min) &&
      (p.city || p.state || p.country)
    );
  };

  const fetchAscendantInfo = async () => {
    if (!hasRequiredFields(profile)) {
      // Skip calling API if mandatory fields are missing
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const base = (`${process.env.EXPO_PUBLIC_API_BASE_URL}`).replace(/\/$/, '');
      const url = `${base}/ascendant-info`;
      const mapProfileToApi = (p) => ({
        city: p.city || '',
        country: p.country || '',
        day: String(p.day).padStart(2, '0'),
        full_name: p.fullName || p.full_name || p.name || '',
        gender: p.gender ? p.gender.charAt(0).toLowerCase() + p.gender.slice(1) : '',
        hour: String(p.hour).padStart(2, '0'),
        min: String(p.min).padStart(2, '0'),
        month: String(p.month).padStart(2, '0'),
        sec: String(p.sec ?? 0),
        state: p.state || '',
        year: String(p.year),
      });
      const payload = { ...mapProfileToApi(profile), token: token || null };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token: token || '', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json().catch(() => ({}));
      setData(json);
    } catch (e) {
      setError(e?.message || t('failedToLoadAscendantInfo'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAscendantInfo();
    }, [profile, token, endpoint])
  );


  const ascendant = data?.ascendant || {};
  const planetaryLord = ascendant['planetary_lord'] || ascendant.planetary_lord || ascendant.planetaryLord || ascendant.planetary_lord || null;
  const asc = ascendant.ascendent || ascendant.ascendant || ascendant.asc || null;
  const moonsign = data?.basicAstrologyDetails?.moonsign || data?.basicAstrologyDetails?.moonSign || data?.moonsign || null;

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={[styles.notice, { color: palette.notice }]}>
          {t('completeProfileToViewAscendant')}
        </Text>
      </View>
    );
  }

  const ValueOrSkeleton = ({ value }) => {
    if (loading) {
      return (
        <Animated.View
          style={[styles.skeletonInline, { opacity: fadeAnim, backgroundColor: palette.skeleton }]}
        />
      );
    }
    return <Text style={[styles.value, { color: palette.value }]}>{value || '-'}</Text>;
  };

  if (error) return (
    <View style={styles.container}>
      <Text style={[styles.error, { color: palette.error }]}>
        {t('unableToLoadAscendantInfo')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.footerChips}>
        <View style={styles.infoBlock}>
          <Text style={[styles.heading, { color: palette.heading }]}>{t('ascendant')}</Text>
          <ValueOrSkeleton value={asc} />
        </View>

        <View style={styles.infoBlock}>
          <Text style={[styles.heading, { color: palette.heading }]}>{t('planetLord')}</Text>
          <ValueOrSkeleton value={planetaryLord} />
        </View>

        <View style={styles.infoBlock}>
          <Text style={[styles.heading, { color: palette.heading }]}>{t('moonSign')}</Text>
          <ValueOrSkeleton value={moonsign} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  paddingTop:4
  },

  footerChips: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  infoBlock: {
    alignItems: 'center',
    
    minWidth: 90,
  },

  heading: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },

  value: {
    fontSize: 12,
    fontWeight: '700',
    color: '#073A8C',
    textAlign: 'center',
    marginTop: 0,
  },

  skeletonInline: {
    height: 14,
    width: 60,
    marginTop: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },

  notice: {
    color: '#6B7280',
    textAlign: 'center',
  },

  error: {
    color: '#DC2626',
    textAlign: 'center',
  },
});


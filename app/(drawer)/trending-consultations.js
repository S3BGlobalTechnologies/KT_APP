import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';

/**
 * Full-screen "View All" list for Trending Consultations.
 * Matches the home screen's dark cosmic theme (deep indigo + golden accents).
 * Each topic keeps the same behaviour as the home chips: store the selected
 * consultation title, then open Chat.
 */
export default function TrendingConsultationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  // Topic list mirrors the home screen `trending` array, with a per-topic
  // accent drawn from the app's existing transit/service colour vocabulary.
  const topics = [
    { key: 'relationships', emoji: '❤️', accent: '#FF6B8A' },
    { key: 'finance', emoji: '💰', accent: '#E4AD0D' },
    { key: 'marriage', emoji: '💍', accent: '#F0A6D8' },
    { key: 'health', emoji: '🩺', accent: '#5EE0D6' },
    { key: 'education', emoji: '📚', accent: '#7CA8FF' },
    { key: 'career', emoji: '💼', accent: '#FFB067' },
    { key: 'remedies', emoji: '🕉️', accent: '#C79BFF' },
    { key: 'property', emoji: '🏠', accent: '#5EE0A8' },
  ];

  // Staggered entrance — one shared driver, per-card delay via interpolation.
  const anim = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((enabled) => {
      if (!mounted) return;
      reduceMotion.current = !!enabled;
      if (enabled) {
        anim.setValue(1);
      } else {
        Animated.timing(anim, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }
    }).catch(() => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    return () => { mounted = false; };
  }, [anim]);

  const openConsultation = async (title) => {
    try {
      await AsyncStorage.setItem('SELECTED_CONSULTATION_TITLE', title);
    } catch (e) { /* non-fatal: proceed to chat regardless */ }
    router.push('/chat');
  };

  const goBack = () => {
    if (router.canGoBack?.()) router.back();
    else router.push('/home');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={colors.bgGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={goBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('back') || 'Back'}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t('trendingConsultations')}
          </Text>
          <View style={styles.backBtnGhost} />
        </View>
        <Text style={styles.headerSub}>{t('trendingScreenSubtitle')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {topics.map((topic, idx) => {
            const title = t(topic.key);
            // Per-card stagger: each card starts a touch later than the last.
            const start = Math.min(0.06 * idx, 0.6);
            const translateY = anim.interpolate({
              inputRange: [start, 1],
              outputRange: [18, 0],
              extrapolate: 'clamp',
            });
            const opacity = anim.interpolate({
              inputRange: [start, Math.min(start + 0.35, 1)],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={topic.key}
                style={[styles.cardWrap, { opacity, transform: [{ translateY }] }]}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.card,
                    { borderColor: hexA(topic.accent, 0.28) },
                    pressed && { transform: [{ scale: 0.97 }], opacity: 0.92 },
                  ]}
                  onPress={() => openConsultation(title)}
                  accessibilityRole="button"
                  accessibilityLabel={title}
                >
                  {/* Emoji in a glowing accent ring */}
                  <View style={styles.iconArea}>
                    <View style={[styles.iconGlow, { backgroundColor: hexA(topic.accent, 0.16) }]} />
                    <View style={[styles.iconRing, { borderColor: hexA(topic.accent, 0.55) }]}>
                      <Text style={styles.iconEmoji}>{topic.emoji}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>

                  <View style={styles.cardFooter}>
                    <Text style={[styles.cardCta, { color: isDark ? topic.accent : colors.textMuted }]} numberOfLines={1}>
                      {t('tapToConsult')}
                    </Text>
                    <View style={[styles.cardArrow, { borderColor: hexA(topic.accent, 0.45) }]}>
                      <Ionicons name="arrow-forward" size={13} color={topic.accent} />
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// Small helper: apply alpha to a #RRGGBB hex without a colour lib.
function hexA(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const GUTTER = 16;

const makeStyles = (colors, isDark) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  // Header
  headerBar: {
    paddingHorizontal: GUTTER,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.ctrlBorder,
    backgroundColor: colors.ctrlBg,
  },
  backBtnGhost: { width: 40, height: 40 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    fontWeight: '800',
    fontSize: 18,
    marginHorizontal: 8,
  },
  headerSub: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },

  // Grid
  scrollContent: { paddingHorizontal: GUTTER, paddingTop: 6 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrap: { width: '48%', marginBottom: 14 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
  },

  iconArea: {
    width: 68, height: 68,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  iconGlow: {
    position: 'absolute',
    width: 68, height: 68, borderRadius: 34,
  },
  iconRing: {
    width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.surfaceStrong,
  },
  iconEmoji: { fontSize: 26 },

  cardTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardCta: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  cardArrow: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
});

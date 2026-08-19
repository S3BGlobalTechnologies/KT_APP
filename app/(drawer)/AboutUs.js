import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientScreen from '@/components/ui/GradientScreen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing } from '@/lib/theme';

export default function AboutUs() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const Bullet = ({ children }) => (
    <View style={styles.bulletRow}>
      <View style={styles.dot} />
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );

  return (
    <GradientScreen>
      <ScreenHeader title="About Us" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>About Us</Text>

        <Text style={styles.paragraph}>
          At Kundli Time, we believe in combining the wisdom of ancient astrology
          with the ease of modern technology. Our platform is designed to simplify
          how people connect with trusted astrologers, explore personalized
          insights, and make informed life decisions with confidence.
        </Text>

        <Text style={styles.sectionTitle}>Who We Are</Text>
        <Text style={styles.paragraph}>
          We are a passionate team of innovators, blending tradition with
          technology. Our mission is to make astrology accessible, transparent,
          and trustworthy for everyone.
        </Text>
        <Text style={styles.paragraph}>
          No long waiting times, no guesswork—just accurate guidance, anytime you
          need it.
        </Text>

        <Text style={styles.sectionTitle}>What We Do</Text>
        <Bullet>Create digital kundlis instantly using accurate birth details.</Bullet>
        <Bullet>Connect users with verified astrologers for live consultations.</Bullet>
        <Bullet>Provide personalized insights on career, relationships, finance, and well-being.</Bullet>
        <Bullet>Manage bookings, refunds, and secure payments seamlessly.</Bullet>

        <Text style={styles.sectionTitle}>Why Choose Us</Text>
        <Bullet>User-Centric Flow – Simple, intuitive steps for effortless navigation.</Bullet>
        <Bullet>Trust &amp; Transparency – Verified experts, secure transactions, and fair policies.</Bullet>
        <Bullet>Anytime Access – Get guidance 24/7, wherever you are.</Bullet>
        <Bullet>Future-Ready – Constantly evolving features to serve you better.</Bullet>

        <Text style={styles.sectionTitle}>Our Vision</Text>
        <Text style={styles.paragraph}>
          To empower individuals by giving them clarity, confidence, and the right
          direction in life through the fusion of astrology and technology.
        </Text>
        <Text style={styles.paragraph}>
          At Kundli Time, it’s not just about predictions—it’s about meaningful
          connections and trusted guidance that truly makes a difference.
        </Text>
      </ScrollView>
    </GradientScreen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  content: { padding: spacing.gutter, paddingTop: 6 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 14 },
  sectionTitle: {
    fontSize: 17, fontWeight: '800', color: colors.goldText,
    marginTop: 24, marginBottom: 10,
  },
  paragraph: { fontSize: 14.5, lineHeight: 23, color: colors.textSoft, marginBottom: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 9 },
  dot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold,
    marginTop: 8,
  },
  bulletText: { flex: 1, fontSize: 14.5, lineHeight: 23, color: colors.textSoft },
});

import GradientScreen from '@/components/ui/GradientScreen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing } from '@/lib/theme';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CookiePolicyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const handleBackConfirm = () => { router.push('/home'); };

  return (
    <GradientScreen>
      <ScreenHeader title="Tracking Technologies Policy" onBack={handleBackConfirm} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
       <View style={styles.card}>

  <Text style={styles.heading}>1. Scope</Text>
  <Text style={styles.paragraph}>
    This policy applies solely to the Kundli Time Mobile Application (&quot;App&quot;).
    Our App utilizes mobile-specific tracking technologies, including Software
    Development Kits (SDKs) and Device Identifiers, to ensure the App functions
    correctly, securely, and reliably.
  </Text>

  <Text style={styles.heading}>2. Technologies We Use</Text>
  <Text style={styles.paragraph}>
    We use the following specific technologies on your Android device:
  </Text>

  <Text style={styles.listItem}>
    • <Text style={styles.bold}>Android Advertising ID (AAID)</Text> – A unique,
    resettable identifier provided by Google Play Services that helps us analyze
    aggregate user behavior, attribute app installations, and manage
    advertising-related functions.
  </Text>

  <Text style={styles.listItem}>
    • <Text style={styles.bold}>SDKs (Software Development Kits)</Text> – Code
    modules provided by our trusted partners (such as Google) that are embedded
    directly in the App to enable essential features including secure payments,
    analytics, crash reporting, and system notifications.
  </Text>

  <Text style={styles.heading}>3. Purpose of Tracking</Text>

  <Text style={styles.listItem}>
    • <Text style={styles.bold}>Essential Operations</Text> – To securely
    maintain your login session, authenticate users, and verify Google Play
    Billing purchase receipts.
  </Text>

  <Text style={styles.listItem}>
    • <Text style={styles.bold}>Performance & Crash Reporting</Text> – To monitor
    App stability, identify errors, and improve performance using tools such as
    Firebase Crashlytics.
  </Text>

  <Text style={styles.listItem}>
    • <Text style={styles.bold}>Analytics</Text> – To analyze feature usage
    patterns and user interactions in order to improve App functionality and
    overall user experience using Firebase Analytics.
  </Text>

  <Text style={styles.heading}>4. Third-Party Services</Text>

  <Text style={styles.listItem}>
    • Google Play Services – Required for secure payment processing,
    advertising services, and push notifications.
  </Text>

  <Text style={styles.listItem}>
    • Google Firebase – Used for anonymous analytics, crash reporting,
    and real-time database management.
  </Text>

  <Text style={styles.heading}>5. Your Choices (How to Opt-Out)</Text>

  <Text style={styles.listItem}>
    • Reset Advertising ID – Navigate to Settings &gt; Google &gt; Ads &gt;
    Reset advertising ID on your Android device to clear or reset your current
    advertising profile.
  </Text>

  <Text style={styles.listItem}>
    • Delete Data – You may request permanent deletion of your associated
    account and analytics data by using the &quot;Delete Account&quot; option available
    within the App settings.
  </Text>

  <Text style={styles.heading}>6. Contact Us</Text>
  <Text style={styles.paragraph}>
    If you have any questions or concerns regarding how the App uses tracking
    technologies or device data, please contact us at:
  </Text>

  <Pressable onPress={() => Linking.openURL('mailto:support@kundlitime.com')}>
    <Text style={styles.email}>support@kundlitime.com</Text>
  </Pressable>

</View>
      </ScrollView>
    </GradientScreen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  scrollContent: { paddingHorizontal: spacing.gutter, paddingTop: 6 },
  paragraph: { fontSize: 14.5, lineHeight: 23, color: colors.textSoft, marginBottom: 10 },
  heading: { fontSize: 16, fontWeight: '800', color: colors.goldText, marginTop: 18, marginBottom: 8 },
  listItem: { fontSize: 14.5, lineHeight: 23, color: colors.textSoft, marginBottom: 6 },
  bold: { fontWeight: '700', color: colors.text },
  email: { fontSize: 14, color: colors.goldText, textDecorationLine: 'underline', marginTop: 6 },
});

import GradientScreen from '@/components/ui/GradientScreen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing } from '@/lib/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const handleBackConfirm = async () => {
    try {
      if (typeof router.canGoBack === 'function' && router.canGoBack()) {
        router.back();
        return;
      }
      const token = await AsyncStorage.getItem('AUTH_TOKEN');
      if (token) {
        router.replace('/home');
      } else {
        router.replace('/');
      }
    } catch (_) {
      router.replace('/');
    }
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackConfirm();
      return true;
    });
    return () => sub.remove();
  }, []);

  const insets = useSafeAreaInsets();

  return (
    <GradientScreen>
      <ScreenHeader title="Privacy Policy" onBack={handleBackConfirm} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.meta}>
          {/* Last updated: 17/02/2026 • Version 1.1 */}
        </Text>

        <Text style={styles.paragraph}>
          We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, disclose, and protect your information when you interact with our platform, including but not limited to advertisements, chat interfaces, payment gateways, and communication features.
        </Text>

        <Text style={styles.paragraph}>
          This policy complies with applicable Indian data protection laws, including the Digital Personal Data Protection Act, 2023.
        </Text>

        <Text style={styles.heading}>1. Information We Collect</Text>
        <Text style={styles.listItem}>• Name</Text>
        <Text style={styles.listItem}>• Date of Birth (DOB)</Text>
        <Text style={styles.listItem}>• Time of Birth</Text>
        <Text style={styles.listItem}>• Place of Birth</Text>
        <Text style={styles.listItem}>• Email address</Text>
        <Text style={styles.listItem}>• Phone number</Text>
        <Text style={styles.listItem}>• Device, OS version, and log information for analytics and security purposes</Text>
        <Text style={styles.paragraph}>
          Payment Information: We do not collect or store your credit card, debit card, or banking details. All financial transactions are processed securely via the Google Play Store billing system. We only receive a transaction receipt (Transaction ID) from Google.
        </Text>

        <Text style={styles.heading}>1.1 Android App Permissions</Text>
        <Text style={styles.listItem}>• Internet: To connect to our servers for chat and astrology data</Text>
        <Text style={styles.listItem}>• Notifications: To alert you about chat responses or daily horoscopes</Text>

        <Text style={styles.heading}>2. How We Use Your Information</Text>
        <Text style={styles.listItem}>• To provide personalized chat experiences</Text>
        <Text style={styles.listItem}>• To process payments and unlock additional chat time</Text>
        <Text style={styles.listItem}>• To communicate with you via email or notifications</Text>
        <Text style={styles.listItem}>• To save your chat history for future reference</Text>
        <Text style={styles.listItem}>• To comply with legal obligations</Text>
        <Text style={styles.listItem}>• To improve services, UI, and security</Text>
        <Text style={styles.listItem}>• To prevent fraud, misuse, or unauthorized access</Text>

        <Text style={styles.heading}>3. Children’s Privacy</Text>
        <Text style={styles.paragraph}>
          Our services are intended for individuals who are 18 years of age or older. We do not knowingly collect or process data from children.
        </Text>
        <Text style={styles.paragraph}>
          If personal data of a minor is entered, you warrant that you are the parent or legal guardian and are authorized to provide such information. We reserve the right to verify this relationship.
        </Text>
        <Text style={styles.paragraph}>
          If we process minor data with parental consent, we do not engage in tracking, behavioral monitoring, or targeted advertising.
        </Text>

        <Text style={styles.heading}>4. Grievance Officer</Text>
        <Text style={styles.paragraph}>
          Name: Kapilesh Dubey{'\n'}
          Email: kapilesh.dubey@s3bglobal.com{'\n'}
          Address: B-36, Sector 67, Noida, Uttar Pradesh 201301
        </Text>

        <Text style={styles.heading}>5. Sharing of Information</Text>
        <Text style={styles.paragraph}>
          We do not sell your personal data. We may share information with Google for billing, legal authorities, or during mergers, acquisitions, or restructuring.
        </Text>

        <Text style={styles.heading}>6. Security</Text>
        <Text style={styles.paragraph}>
          We use industry-standard security practices, including encryption and secure servers. However, no system is 100% secure.
        </Text>

        <Text style={styles.heading}>7. Your Rights</Text>
        <Text style={styles.listItem}>• Right to access, update, or delete your data</Text>
        <Text style={styles.listItem}>• Right to restrict or object to processing</Text>
        <Text style={styles.listItem}>• Right to data portability</Text>
        <Text style={styles.listItem}>• Right to withdraw consent</Text>

        <Text style={styles.heading}>8.1 Account Deletion & Data Retention</Text>
        <Text style={styles.paragraph}>
          You may request account deletion through any of the following methods:
        </Text>
        <Text style={styles.listItem}>• In-App: App Side Menu &gt; Delete Account</Text>
        <Text style={styles.listItem}>• Web: https://kundlitime/delete-account</Text>
        <Text style={styles.listItem}>• Email: support@kundlitime.com (Subject: Account Deletion Request)</Text>
        <Text style={styles.paragraph}>
          Upon request, your account is immediately deactivated. All personal data is permanently deleted from active servers within 30 days. Backup copies are purged within 90 days. Transaction IDs are retained for 7 years for tax compliance purposes and cannot be deleted.
        </Text>

        <Text style={styles.heading}>9. Tracking Technologies & Advertising IDs</Text>
        <Text style={styles.paragraph}>
          We use Android Advertising ID (AAID) and device identifiers to maintain sessions, deliver personalized content, analyze performance, and manage advertisements. You may reset your AAID via device settings.
        </Text>

        <Text style={styles.heading}>10. International Data Transfers</Text>
        <Text style={styles.paragraph}>
          Your data may be stored and processed in countries outside of your residence, including jurisdictions with different data protection laws. We ensure adequate safeguards in compliance with international standards.
        </Text>

        <Text style={styles.heading}>11. Updates to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time.
        </Text>
      </ScrollView>
    </GradientScreen>
  );
}

/* ================= STYLES ================= */

const makeStyles = (colors) => StyleSheet.create({
  content: { padding: spacing.gutter, paddingTop: 6 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 6 },
  meta: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  heading: { fontSize: 17, fontWeight: '800', color: colors.goldText, marginTop: 22, marginBottom: 8 },
  paragraph: { fontSize: 14.5, color: colors.textSoft, lineHeight: 23, marginBottom: 10 },
  listItem: { fontSize: 14.5, color: colors.textSoft, lineHeight: 23, marginLeft: 8, marginBottom: 5 },
});

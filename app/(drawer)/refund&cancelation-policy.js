import GradientScreen from '@/components/ui/GradientScreen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { radius, spacing } from '@/lib/theme';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RefundPolicyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const handleBackConfirm = () => { router.push('/home'); };

  return (
    <GradientScreen>
      <ScreenHeader title="Refund and Cancellation Policy" onBack={handleBackConfirm} />
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.heading}>1. Free Trial & Introductory Offers</Text>
          <Text style={styles.paragraph}>
            Free Question Offer: We may, at our sole discretion, provide users with 1 free question as a promotional benefit. This offer is subject to our eligibility rules and may be updated from time to time.
          </Text>
          <Text style={styles.paragraph}>
            No Obligation: During this free period, no charges are applied, and no payment details are collected unless you choose to purchase additional credits.
          </Text>
          <Text style={styles.paragraph}>
            Right to Modify: We reserve the right to change, reduce, or discontinue the 1 free question offer at any time without prior notice.
          </Text>

          <Text style={styles.heading}>2. Paid Services & Payment Processing</Text>
          <Text style={styles.paragraph}>
            Payment Method: To continue chatting beyond the free limit, users may purchase additional minutes or credit packs.
          </Text>
          <Text style={styles.paragraph}>
            Secure Processing: All financial transactions are processed securely through the Google Play Store billing system. We do not collect, store, or have access to your credit card or banking details.
          </Text>

          <Text style={styles.heading}>3. No Refund Policy (Standard)</Text>
          <Text style={styles.paragraph}>
            Digital Goods: Since our services (Astrology Chats) are digital in nature and are consumed instantly upon purchase, all sales are final and non-refundable.
          </Text>
          <Text style={styles.paragraph}>
            Consumption: Once chat minutes have been credited to your wallet or consumed during a session, the transaction cannot be reversed.
          </Text>

          <Text style={styles.heading}>4. Exceptions & Technical Refunds</Text>
          <Text style={styles.paragraph}>
            While standard sales are final, we may issue a refund through the Google Play Console under the following technical circumstances:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• Non-Delivery: Payment was deducted by Google, but chat minutes were not credited to your account due to a server or system error.</Text>
            <Text style={styles.listItem}>• Duplicate Charge: You were charged more than once for the same transaction due to a Google Play processing issue.</Text>
          </View>
          <Text style={styles.paragraph}>How to Request a Refund:</Text>
          <Text style={styles.paragraph}>
            Please email{' '}
            <Text style={styles.link} onPress={() => Linking.openURL('mailto:support@kundlitime.com')}>
              support@kundlitime.com
            </Text>{' '}
            within 48 hours of the transaction with the following details:
          </Text>
          <View style={styles.list}>
            <Text style={styles.listItem}>• A brief description of the issue.</Text>
            <Text style={styles.listItem}>• The Google Play Order ID (format: GPA.xxxx-xxxx-xxxx-xxxx).</Text>
          </View>
          <Text style={styles.paragraph}>
            Note: Refunds are processed entirely through the Google Play Store. Once approved in our Google Play Console, the time taken for the funds to return to your account is determined by Google’s banking partners (typically 1-5 business days).
          </Text>

          <Text style={styles.heading}>5. Google Play Refund Policy</Text>
          <Text style={styles.paragraph}>
            As payments are processed by Google, users may also request a refund directly through Google Play within 48 hours of purchase if the service is defective or not delivered. Please refer to the official Google Play Refund Policy for further details.
          </Text>

          <Text style={styles.heading}>6. Cancellation Policy</Text>
          <Text style={styles.paragraph}>
            Instant Delivery: Since “Chat Minutes” are one-time consumable purchases and not recurring subscriptions, there is no cancellation process.
          </Text>
          <Text style={styles.paragraph}>
            Stop Use: Users who do not wish to continue using the service may simply stop purchasing additional chat minutes.
          </Text>

          <Text style={styles.heading}>7. Disputes & Chargebacks</Text>
          <Text style={styles.paragraph}>
            If you experience an issue with a transaction, we strongly encourage you to contact our support team or Google Play Support before initiating a chargeback.
          </Text>
          <Text style={styles.paragraph}>
            Initiating a fraudulent chargeback (for example, falsely claiming a valid purchase as unauthorized) may result in permanent suspension of your account and associated device identifiers from our platform.
          </Text>

          <Text style={styles.heading}>8. Governing Law</Text>
          <Text style={styles.paragraph}>
            This policy is governed by the laws of India. Any disputes relating to refunds, payments, or service delivery shall be subject to the exclusive jurisdiction of the courts located in Gurugram, Haryana.
          </Text>
        </View>
      </ScrollView>
    </GradientScreen>
  );
}

/* ===================== STYLES ===================== */

const makeStyles = (colors) => StyleSheet.create({
  container: { padding: spacing.gutter, paddingTop: 6 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.lg,
    padding: 18,
  },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 16, color: colors.text },
  heading: { fontSize: 17, fontWeight: '800', marginTop: 16, marginBottom: 8, color: colors.goldText },
  paragraph: { fontSize: 14.5, lineHeight: 23, color: colors.textSoft, marginBottom: 10 },
  list: { marginLeft: 8, marginBottom: 10 },
  listItem: { fontSize: 14.5, lineHeight: 23, color: colors.textSoft, marginBottom: 6 },
  link: { color: colors.goldText, textDecorationLine: 'underline', fontWeight: '500' },
  footer: {
    backgroundColor: colors.band,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerText: {
    color: colors.text,
    fontSize: 12,
    textAlign: 'center',
  },
});

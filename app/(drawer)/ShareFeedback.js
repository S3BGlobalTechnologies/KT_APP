import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientScreen from '@/components/ui/GradientScreen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';
import { radius, spacing } from '@/lib/theme';

export default function ShareFeedback() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSuccess(false);
    if (rating <= 0) {
      setError('Please select a star rating.');
      return;
    }
    setSubmitting(true);
    const token = await AsyncStorage.getItem('AUTH_TOKEN');
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/kundlikonnect/post-feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', token: token },
          body: JSON.stringify({ rating, comment: comment.trim() }),
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to submit feedback');
      }
      setSuccess(true);
      setRating(0);
      setComment('');
    } catch (e) {
      setError(e?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || rating === 0;

  return (
    <GradientScreen>
      <ScreenHeader title={t('shareFeedback') || 'Share Feedback'} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{t('shareFeedback') || 'Share Feedback'}</Text>
          <Text style={styles.subtle}>Tap the stars to rate your experience</Text>

          {/* STARS */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} onPress={() => setRating(i)} style={styles.starBtn} hitSlop={6}>
                <Ionicons
                  name={i <= rating ? 'star' : 'star-outline'}
                  size={38}
                  color={i <= rating ? colors.gold : colors.textSubtle}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionHeading}>Comments (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Write your feedback here..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.textSubtle}
          />

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {!!success && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>Thanks! Your feedback was submitted successfully.</Text>
            </View>
          )}

          {/* SUBMIT */}
          <TouchableOpacity
            style={[styles.submitBtn, disabled && styles.submitBtnDisabled]}
            onPress={onSubmit}
            activeOpacity={0.9}
            disabled={disabled}
          >
            <LinearGradient
              colors={colors.goldGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitInner}
            >
              {submitting ? (
                <ActivityIndicator color={colors.onGold} />
              ) : (
                <Text style={styles.submitText}>Submit Feedback</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientScreen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.gutter, paddingTop: 6 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 8 },
  subtle: { color: colors.textMuted, marginBottom: 16, fontSize: 14 },
  starsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 6 },
  starBtn: { padding: 2 },
  sectionHeading: { marginBottom: 8, fontWeight: '700', color: colors.text, fontSize: 15 },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    textAlignVertical: 'top',
    color: colors.text,
    fontSize: 14.5,
  },
  errorBox: {
    backgroundColor: 'rgba(255,107,107,0.10)', borderColor: 'rgba(255,107,107,0.4)',
    borderWidth: 1, borderRadius: radius.md, padding: 12, marginTop: 14,
  },
  errorText: { color: '#FF9B8A' },
  successBox: {
    backgroundColor: 'rgba(59,209,111,0.10)', borderColor: 'rgba(59,209,111,0.4)',
    borderWidth: 1, borderRadius: radius.md, padding: 12, marginTop: 14,
  },
  successText: { color: '#7BE6A8' },
  submitBtn: { marginTop: 22, borderRadius: radius.md, overflow: 'hidden' },
  submitBtnDisabled: { opacity: 0.45 },
  submitInner: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: colors.onGold, fontWeight: '800', fontSize: 15 },
});

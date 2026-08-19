import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const FEEDBACK_API =
  `${process.env.EXPO_PUBLIC_API_BASE_URL}/kundlikonnect/post-feedback`;

export default function FeedbackPopup({
  visible = true,
  status,
  onClose,
  token, // 🔑 pass auth token
  onFeedbackSuccess,
}) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const [rating, setRating] = useState(5); // ⭐ default 5 stars
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!visible) return null;

  const alreadyProvided =
    status === 'feedback_already_submitted' ||
    !!(status && status.feedbackExists === true);

  /* ================= SUBMIT FEEDBACK ================= */
  const submitFeedback = async () => {
     const token = await AsyncStorage.getItem('AUTH_TOKEN');
    if (!token) {
      setError('Authentication token missing');
      return;
    }

    try {
      
      setSubmitting(true);
      setError(null);

      const res = await fetch(FEEDBACK_API, {
        method: 'POST',
         headers: {
              'Content-Type': 'application/json',
              token: token,
              
            },
        body: JSON.stringify({
          rating, // ⭐ exact clicked star
          comment: comment || 'Awesome experience',
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || 'Failed to submit feedback');
      }

      onFeedbackSuccess?.(json);
      onClose();
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 32 : 0}
      >
        <View style={styles.popupBox}>
          {/* Close */}
          <TouchableOpacity style={styles.closeIconBtn} onPress={onClose} hitSlop={10}>
            <Text style={styles.closeIconText}>×</Text>
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconCircle}>
            <View style={styles.giftIconBg}>
              <Ionicons
                name={alreadyProvided ? 'checkmark-circle' : 'chatbubbles'}
                size={34}
                color={colors.onPrimary}
              />
            </View>
          </View>

          {/* Title */}
          <Text style={alreadyProvided ? styles.successText : styles.title}>
            {alreadyProvided ? t('feedbackThanksTitle') : t('feedbackTitle')}
          </Text>

          <Text style={styles.subtitle}>
            {alreadyProvided
              ? t('feedbackAlreadySubmitted')
              : t('feedbackSubtitle')}
          </Text>

          {!alreadyProvided && (
            <>
              {/* ⭐ STAR RATING */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    activeOpacity={0.7}
                    onPress={() => setRating(star)}
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={34}
                      color={star <= rating ? '#FBBF24' : '#D1D5DB'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* COMMENT */}
              <TextInput
                style={styles.input}
                placeholder={t('feedbackPlaceholder') || 'Write your feedback'}
                value={comment}
                onChangeText={setComment}
                placeholderTextColor={colors.textSubtle}
                multiline
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              {/* SUBMIT */}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={submitFeedback}
                activeOpacity={0.85}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>
                      {t('feedbackGiveFeedback')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* CLOSE */}
          {/* <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>{t('feedbackClose')}</Text>
          </TouchableOpacity> */}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ================= STYLES ================= */
const makeStyles = (colors, isDark) => StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(60, 49, 49, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  keyboardAvoiding: {
    width: '100%',
    alignItems: 'center',
  },
  popupBox: {
    width: 340,
    maxWidth: '90%',
    backgroundColor: colors.elevated,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    elevation: 12,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.surfaceBorder,
  },
  closeIconBtn: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconText: {
    fontSize: 26,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  iconCircle: {
    marginBottom: 8,
  },
  giftIconBg: {
    backgroundColor: colors.primarySolid,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.text,
    textAlign: 'center',
  },
  successText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.success,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 14,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  input: {
    width: '100%',
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    textAlignVertical: 'top',
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primarySolid,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  primaryBtnText: {
    color: colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    width: '100%',
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
});

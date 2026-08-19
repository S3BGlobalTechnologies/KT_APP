import { useTheme } from '@/contexts/ThemeContext';
import { radius } from '@/lib/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

const GUTTER = 22;
const MAX_CARD_WIDTH = 380;

/**
 * The app's one confirm dialog — go back home, log out, delete account.
 *
 * Everything comes from the active palette, so it tracks light/dark instead of
 * carrying leftover hex from the old blue design. `tone="danger"` swaps the
 * accent for irreversible actions; the primary is otherwise the same gold
 * gradient used by every other call to action in the app.
 *
 * `scrollable` wraps the card so a dialog carrying form fields (delete account)
 * stays reachable above the keyboard.
 */
export default function ConfirmDialog({
  visible,
  onRequestClose,
  icon,
  tone = 'default',
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmDisabled = false,
  confirmLoading = false,
  scrollable = false,
  children,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { width } = useWindowDimensions();

  const danger = tone === 'danger';
  const accent = danger ? colors.danger : colors.gold;

  // An explicit width, not '100%'. Inside the ScrollView the percentage
  // resolved against the wrong parent and the card ran off the right edge,
  // clipping the confirm button.
  const cardWidth = Math.min(MAX_CARD_WIDTH, width - GUTTER * 2);

  const card = (
    <View style={[styles.card, { width: cardWidth }]}>
      <View
        style={[
          styles.iconRing,
          {
            backgroundColor: danger ? 'rgba(231,76,60,0.12)' : colors.goldSoftBg,
            borderColor: danger ? 'rgba(231,76,60,0.35)' : colors.goldSoftBorder,
          },
        ]}
      >
        <Ionicons
          name={icon || (danger ? 'warning-outline' : 'help-circle-outline')}
          size={26}
          color={accent}
        />
      </View>

      {title ? <Text style={styles.title}>{title}</Text> : null}
      {description ? <Text style={styles.description}>{description}</Text> : null}

      {children ? <View style={styles.body}>{children}</View> : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onCancel}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelText}>{cancelLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmBtn, confirmDisabled && styles.confirmDisabled]}
          onPress={onConfirm}
          disabled={confirmDisabled || confirmLoading}
          activeOpacity={0.9}
        >
          {danger ? (
            <View style={[styles.confirmInner, { backgroundColor: colors.danger }]}>
              {confirmLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.confirmText, { color: '#FFFFFF' }]}>{confirmLabel}</Text>
              )}
            </View>
          ) : (
            <LinearGradient
              colors={colors.goldGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.confirmInner}
            >
              {confirmLoading ? (
                <ActivityIndicator color={colors.onGold} />
              ) : (
                <Text style={[styles.confirmText, { color: colors.onGold }]}>{confirmLabel}</Text>
              )}
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      {scrollable ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 32 : 0}
        >
          <View style={styles.backdrop}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {card}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.backdrop}>{card}</View>
      )}
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  card: {
    alignSelf: 'center',
    backgroundColor: colors.elevated,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  iconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  body: { marginTop: 16 },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ctrlBorder,
    backgroundColor: colors.ctrlBg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  confirmDisabled: { opacity: 0.6 },
  confirmInner: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '800',
  },
});

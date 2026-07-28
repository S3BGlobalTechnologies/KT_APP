import Snackbar from '@/components/ui/snackbar';
import GradientScreen from '@/components/ui/GradientScreen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { radius, spacing } from '@/lib/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatHistoryPage() {
  const RESUME_CHAT_KEY = 'RESUME_CHAT_PAYLOAD';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    rotateAnim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => { loop.stop(); rotateAnim.stopAnimation(); };
  }, []);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('AUTH_TOKEN');
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/kundlikonnect/get-all-chat-history`, {
        method: 'GET',
        headers: { token: token || '' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json().catch(() => ({}));
      let list = [];
      if (Array.isArray(json) && json.length > 0 && Array.isArray(json[0]?.result)) {
        list = json[0].result;
      } else if (Array.isArray(json?.result)) {
        list = json.result;
      }
      setSessions(list);
    } catch (e) {
      setError(e?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);
  useFocusEffect(useCallback(() => { loadHistory(); }, [loadHistory]));

  const toggle = (key) => setExpanded(expanded === key ? null : key);
  const openDeleteConfirm = (sessionId) => setConfirmId(sessionId);

  const handleDeleteConfirm = async () => {
    const sessionId = confirmId;
    setConfirmId(null);
    if (!sessionId) return;
    try {
      setDeletingId(sessionId);
      const token = await AsyncStorage.getItem('AUTH_TOKEN');
      const url = `${process.env.EXPO_PUBLIC_API_BASE_URL}/kundlikonnect/delete-chat-history?sessionId=${encodeURIComponent(sessionId)}`;
      const res = await fetch(url, { method: 'DELETE', headers: { token: token || '' } });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
        setToast({ message: 'Chat history deleted', type: 'success' });
        setTimeout(() => setToast(null), 1500);
      } else {
        setToast({ message: 'Failed to delete', type: 'error' });
        setTimeout(() => setToast(null), 2000);
      }
    } catch (e) {
      setToast({ message: 'Error deleting chat', type: 'error' });
      setTimeout(() => setToast(null), 2000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleResumeChat = async (session) => {
    if (!session?.sessionId) return;
    try {
      await AsyncStorage.setItem(
        RESUME_CHAT_KEY,
        JSON.stringify({
          sessionId: session.sessionId,
          conversation: Array.isArray(session.conversation) ? session.conversation : [],
          createdAt: session.createdAt || null,
        })
      );
      router.push({ pathname: '/chat', params: { resumeSessionId: String(session.sessionId) } });
    } catch (e) {
      setToast({ message: 'Unable to resume chat', type: 'error' });
      setTimeout(() => setToast(null), 2000);
    }
  };

  const truncate = (text, len = 50) => (text?.length > len ? text.slice(0, len) + '...' : text);

  const formatSessionDate = (createdAt) => {
    if (!createdAt) return 'Unknown date';
    const date = new Date(createdAt);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getConversationTitle = (conversation = []) => {
    if (!Array.isArray(conversation) || conversation.length === 0) return 'Astrology Consultation';
    const userMsg = conversation.find((m) => m.role === 'user');
    if (!userMsg) return 'Astrology Consultation';
    let question = null;
    if (typeof userMsg.userQuestion === 'string') {
      question = userMsg.userQuestion;
    } else if (typeof userMsg.content === 'object' && typeof userMsg.content.userQuestion === 'string') {
      question = userMsg.content.userQuestion;
    } else if (typeof userMsg.content === 'string' && userMsg.content.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(userMsg.content);
        if (typeof parsed.userQuestion === 'string') question = parsed.userQuestion;
      } catch {}
    } else if (typeof userMsg.content === 'string') {
      question = userMsg.content;
    }
    if (!question) return 'Astrology Consultation';
    return truncate(question);
  };

  const getReadableMessage = (conversation) => {
    if (typeof conversation?.userQuestion === 'string') return conversation.userQuestion;
    if (typeof conversation?.content === 'object' && typeof conversation.content.userQuestion === 'string') {
      return conversation.content.userQuestion;
    }
    if (typeof conversation?.content === 'string' && conversation.content.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(conversation.content);
        if (typeof parsed.userQuestion === 'string') return parsed.userQuestion;
      } catch {}
    }
    if (typeof conversation?.content === 'string') return conversation.content;
    return '';
  };

  const renderConversation = (conv = []) => {
    return conv.map((c, idx) => {
      const text =
        c.role === 'user'
          ? getReadableMessage(c)
          : typeof c.content === 'string'
          ? c.content
          : '';
      return (
        <View key={idx} style={[styles.convRow, c.role === 'user' ? styles.rowRight : styles.rowLeft]}>
          <View style={[styles.bubble, c.role === 'user' ? styles.userBubble : styles.astroBubble]}>
            <Text style={[styles.bubbleText, c.role === 'user' && styles.bubbleTextUser]}>{text}</Text>
          </View>
        </View>
      );
    });
  };

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <MaterialIcons name="refresh" size={34} color={colors.gold} />
          </Animated.View>
          <Text style={styles.muted}>Loading chat history...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={42} color={colors.danger} />
          <Text style={styles.errorCentered}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadHistory}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (sessions.length === 0) {
      return (
        <View style={styles.center}>
          <View style={styles.emptyRing}>
            <MaterialIcons name="chat-bubble-outline" size={38} color={colors.gold} />
          </View>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.muted}>Your past astrology chats will appear here.</Text>
          <TouchableOpacity style={styles.startBtn} onPress={() => router.push('/chat')}>
            <Text style={styles.startBtnText}>Start a chat</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <ScrollView
        style={styles.body}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {sessions.map((s) => (
          <View key={s._key} style={styles.sessionCard}>
            <TouchableOpacity onPress={() => toggle(s._key)} activeOpacity={0.8}>
              <View style={styles.sessionRow}>
                <Text style={styles.sessionTitle} numberOfLines={1}>{getConversationTitle(s.conversation)}</Text>
                <Text style={styles.sessionDate}>{formatSessionDate(s.createdAt)}</Text>
                <TouchableOpacity
                  style={styles.deleteIconBtn}
                  onPress={() => openDeleteConfirm(s.sessionId)}
                  disabled={deletingId === s.sessionId}
                  hitSlop={8}
                >
                  <MaterialIcons name="delete-outline" size={20} color={deletingId === s.sessionId ? colors.textSubtle : colors.textMuted} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {expanded === s._key && (
              <View style={styles.convWrap}>
                {renderConversation(s.conversation || [])}
                <TouchableOpacity style={styles.resumeBtn} onPress={() => handleResumeChat(s)}>
                  <Text style={styles.resumeBtnText}>Resume Chat</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <GradientScreen>
      <ScreenHeader
        title="Chat History"
        subtitle={!loading && !error ? `Total Conversations: ${sessions.length}` : undefined}
      />

      <View style={styles.bodyWrap}>
        {renderBody()}

        {toast ? (
          <View style={styles.toastWrapper}>
            <Snackbar message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </View>
        ) : null}

        <Modal visible={!!confirmId} transparent animationType="fade" onRequestClose={() => setConfirmId(null)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Delete chat?</Text>
              <Text style={styles.modalDesc}>Are you sure you want to delete this chat history?</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={() => setConfirmId(null)}>
                  <Text style={styles.modalCancelText}>No</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.modalConfirm]} onPress={handleDeleteConfirm} disabled={!!deletingId}>
                  <Text style={styles.modalConfirmText}>Yes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </GradientScreen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  bodyWrap: { flex: 1 },
  body: { flex: 1, paddingHorizontal: spacing.gutter },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingBottom: 60 },
  emptyRing: {
    width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.goldRing, backgroundColor: 'rgba(228,173,13,0.06)', marginBottom: 16,
  },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  muted: { marginTop: 4, color: colors.textMuted, textAlign: 'center' },
  errorCentered: { color: colors.danger, marginTop: 8, textAlign: 'center' },
  retryBtn: {
    marginTop: 16, backgroundColor: colors.goldSoftBg, borderColor: colors.goldSoftBorder, borderWidth: 1,
    paddingHorizontal: 24, paddingVertical: 11, borderRadius: radius.sm,
  },
  retryText: { color: colors.goldText, fontWeight: '700' },
  startBtn: {
    marginTop: 18, backgroundColor: colors.goldSoftBg, borderColor: colors.goldSoftBorder, borderWidth: 1,
    paddingHorizontal: 24, paddingVertical: 11, borderRadius: radius.sm,
  },
  startBtnText: { color: colors.goldText, fontWeight: '700' },

  sessionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md, padding: 14, marginBottom: 10,
  },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deleteIconBtn: { paddingHorizontal: 4, paddingVertical: 4 },
  sessionTitle: { fontWeight: '700', flex: 1, color: colors.text, fontSize: 14.5 },
  sessionDate: { color: colors.textMuted, fontSize: 12 },

  convWrap: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: 12 },
  resumeBtn: {
    marginTop: 12, alignSelf: 'flex-end', backgroundColor: colors.goldSoftBg,
    borderColor: colors.goldSoftBorder, borderWidth: 1,
    borderRadius: radius.sm, paddingVertical: 9, paddingHorizontal: 16,
  },
  resumeBtnText: { color: colors.goldText, fontWeight: '700' },

  convRow: { flexDirection: 'row', marginBottom: 8 },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 12, padding: 11 },
  astroBubble: { backgroundColor: colors.surfaceStrong, borderWidth: 1, borderColor: colors.surfaceBorder },
  userBubble: { backgroundColor: colors.primarySolid },
  bubbleText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: colors.onPrimary, fontWeight: '500' },

  toastWrapper: { position: 'absolute', top: 10, left: 0, right: 0, zIndex: 999, alignItems: 'center' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  modalCard: {
    width: '85%', backgroundColor: colors.elevated, borderRadius: radius.md, padding: 20, marginHorizontal: 20,
    borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 6 },
  modalDesc: { fontSize: 14, color: colors.textMuted, marginBottom: 18, lineHeight: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: radius.sm, marginLeft: 12 },
  modalCancel: { borderWidth: 1, borderColor: colors.surfaceBorder, backgroundColor: colors.surface },
  modalConfirm: { backgroundColor: colors.danger },
  modalCancelText: { color: colors.text, fontWeight: '600' },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
});

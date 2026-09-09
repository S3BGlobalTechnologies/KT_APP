import { logMetaEvent } from '@/utils/metaEvents';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { ThemedView } from '@/components/themed-view';
import AscendantInfo from '@/components/ui/ascendant-info';
import AstrologerStatusIndicator from '@/components/ui/AstrologerSelector';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DynamicQuestions from '@/components/ui/dynamic-questions';
import FeedbackPopup from '@/components/ui/FeedbackPopup';
import PaymentPage from '@/components/ui/PaymentPage';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';
import { createOrGetKkAgentProfile } from '@/lib/kkAgentProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

export default function Chat() {
  const { t, language } = useLanguage();

  const RESUME_CHAT_KEY = 'RESUME_CHAT_PAYLOAD';
  // Rotating loading messages while analyzer is visible
  const loadingMessages = useMemo(
    () => [
      t('chatLoadingAnalyzingData'),
      t('chatLoadingAligningEnergies'),
      t('chatLoadingTracingPlanets'),
      t('chatLoadingUnfoldingInsights'),
      t('chatLoadingFindingGuidance'),
      t('chatLoadingBalancingCosmos'),
      t('chatLoadingPreparingResult'),
    ],
    [t]
  );
  const [loadingIndex, setLoadingIndex] = useState(0);
  const loadingIntervalRef = useRef(null);

  const router = useRouter();
  const navigation = useNavigation();
  const analyzingOpacity = useRef(new Animated.Value(0)).current;
  const timerPulse = useRef(new Animated.Value(1)).current;
  // Read astrologer selection from both expo-router and react-navigation
  const paramsExpo = useLocalSearchParams();
  const route = useRoute();
  const astrologerNameParam = paramsExpo?.astrologerName || route?.params?.astrologerName || null;
  const astrologerImageParam = paramsExpo?.astrologerImage || route?.params?.astrologerImage || null;
  const resumeSessionIdParam = paramsExpo?.resumeSessionId || route?.params?.resumeSessionId || null;
  const [heights, setHeight] = useState(44); // initial height

  const languageMap = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  te: "Telugu",
  kn: "Kannada",
  bn: "Bengali",
  gu: "Gujarati",
  ta: "Tamil",
  ml: "Malayalam",
  pa: "Punjabi",
  ur: "Urdu",
};
  const ASTRO_IMAGE_MAP = {
    'AIAacharyaRaghavSharma.png': require('../../assets/images/AIAacharyaRaghavSharma.png'),
    'AIGuruAnilJoshi.png': require('../../assets/images/AIGuruAnilJoshi.png'),
    'AIAstroMeeraDesai.png': require('../../assets/images/AIAstroMeeraDesai.png'),
    'AIPanditSureshIyyer.jpeg': require('../../assets/images/AIPanditSureshIyyer.jpeg'),
    'AIJyotishKavitaVerma.jpeg': require('../../assets/images/AIJyotishKavitaVerma.jpeg'),
  };
  const ASTROLOGER_NAME_MAP = {
    'AIAacharyaRaghavSharma.png': {
      en: 'Acharya Raghav',
      hi: 'आचार्य राघव',
      mr: 'आचार्य राघव',
      gu: 'આચાર્ય રાઘવ',
      te: 'ఆచార్య రాఘవ్',
      bn: 'আচার্য রাঘব',
      kn: 'ಆಚಾರ್ಯ ರಾಘವ್',
    },
    'AIGuruAnilJoshi.png': {
      en: 'Guru Anil',
      hi: 'गुरु अनिल',
      mr: 'गुरु अनिल',
      gu: 'ગુરુ અનિલ',
      te: 'గురు అనಿಲ್',
      bn: 'গুরু অনিল',
      kn: 'ಗುರು ಅನಿಲ್',
    },
    'AIAstroMeeraDesai.png': {
      en: 'Astro Meera',
      hi: 'एस्ट्रो मीरा',
      mr: 'अॅस्ट्रो मीरा',
      gu: 'એસ્ટ્રો મીરા',
      te: 'ఆస్ట్రో మీరా',
      bn: 'অ্যাস্ট্রো মীরা',
      kn: 'ಆಸ್ಟ್ರೋ ಮೀರಾ',
    },
    'AIPanditSureshIyyer.jpeg': {
      en: 'Pandit Suresh',
      hi: 'पंडित सुरेश',
      mr: 'पंडित सुरेश',
      gu: 'પંડિત સુરેશ',
      te: 'పండిత్ సురేశ్',
      bn: 'পণ্ডিত সুরেশ',
      kn: 'ಪಂಡಿತ್ ಸುರೇಶ್',
    },
    'AIJyotishKavitaVerma.jpeg': {
      en: 'Jyotishi Kavita',
      hi: 'ज्योतिषी कविता',
      mr: 'ज्योतिषी कविता',
      gu: 'જ્યોતિષી કવિતા',
      te: 'జ్యోతిషి కవిత',
      bn: 'জ্যোতিষী কবিতা',
      kn: 'ಜ್ಯೋತಿಷಿ ಕವಿತಾ',
    },
  };
  const normalizedAstrologerImageParam = astrologerImageParam
    ? String(astrologerImageParam).replace(/^.*[\\/]/, '')
    : null;
  const astroHeaderImg = normalizedAstrologerImageParam
    ? ASTRO_IMAGE_MAP[normalizedAstrologerImageParam]
    : undefined;
  const displayAstrologerName = useMemo(() => {
    if (!astrologerNameParam) return null;

    const localizedNames = normalizedAstrologerImageParam
      ? ASTROLOGER_NAME_MAP[normalizedAstrologerImageParam]
      : null;

    if (localizedNames) {
      return localizedNames[language] || localizedNames.en || String(astrologerNameParam);
    }

    return String(astrologerNameParam);
  }, [astrologerNameParam, normalizedAstrologerImageParam, language]);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [inlineFeedbackVisible, setInlineFeedbackVisible] = useState(false);
  const [inlineFeedbackPositive, setInlineFeedbackPositive] = useState(false);
  const [inlineFeedbackText, setInlineFeedbackText] = useState('');
  const [inlineFeedbackOption, setInlineFeedbackOption] = useState(null);
  const [inlineSubmitting, setInlineSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState(null);
  const [inlineTargetMessageId, setInlineTargetMessageId] = useState(null);
  const [inlineAgentResponse, setInlineAgentResponse] = useState('');
  const [ratedMessageIds, setRatedMessageIds] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [showFeedbackSuccessModal, setShowFeedbackSuccessModal] = useState(false);
  useEffect(() => {
    if (showFeedbackSuccessModal) {
      const id = setTimeout(() => setShowFeedbackSuccessModal(false), 3000);
      return () => clearTimeout(id);
    }
  }, [showFeedbackSuccessModal]);

  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [message, setMessage] = useState('');
  const [showBackModal, setShowBackModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [queryText, setQueryText] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [sending, setSending] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(profileData?.language);
  const languageOptions = [
    { value: "English", label: "English" },
    { value: "Hindi", label: "हिंदी" },
    { value: "Bengali", label: "বাংলা" },
    { value: "Telugu", label: "తెలుగు" },
    { value: "Marathi", label: "मराठी" },
    { value: "Tamil", label: "தமிழ்" },
    { value: "Gujarati", label: "ગુજરાતી" },
    { value: "Kannada", label: "ಕನ್ನಡ" },
    { value: "Malayalam", label: "മലയാളം" },
    { value: "Punjabi", label: "ਪੰਜਾਬੀ" },
    { value: "Odia", label: "ଓଡ଼ିଆ" },
    { value: "Assamese", label: "অসমীয়া" },
  ];
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [privateMode, setPrivateMode] = useState(false);
  const [privateModeLocked, setPrivateModeLocked] = useState(false);
  const privateModeSessionRef = useRef(null);
  const privateModeEnabledForSession = privateMode === true && privateModeLocked === true;
  // Map selected language to its UI label for display
  const selectedLanguageLabel = useMemo(() => {
    const found = languageOptions.find((l) => l.value === selectedLanguage);
    return found ? found.label : selectedLanguage;
  }, [selectedLanguage, languageOptions]);
  const { colors, isDark } = useTheme();
  const chatTheme = useMemo(
    () =>
      !isDark
        ? {
            // Light ("Daylight Almanac") chat theme
            screenBg: colors.bg,
            headerBg: colors.bg,
            inputBarBg: colors.bg,
            headerIconBg: colors.ctrlBg,
            headerText: colors.text,
            subText: colors.textMuted,
            timerBg: colors.goldSoftBg,
            timerBorder: colors.goldSoftBorder,
            timerText: colors.goldText,
            selectBg: colors.surface,
            selectBorder: colors.surfaceBorder,
            selectText: colors.text,
            selectIcon: colors.gold,
            toggleBg: colors.goldSoftBg,
            toggleBorder: colors.goldSoftBorder,
            toggleText: colors.goldText,
            bodyBg: colors.bg,
            astroBubbleBg: colors.surfaceStrong,
            astroText: colors.text,
            userBubbleBg: colors.primarySolid,
            userText: colors.onPrimary,
            noticeBg: colors.goldSoftBg,
            noticeBorder: colors.goldSoftBorder,
            noticeText: colors.goldText,
            inputBg: colors.surface,
            inputBorder: colors.goldSoftBorder,
            inputText: colors.text,
            inputPlaceholder: colors.textSubtle,
            sendBg: colors.primarySolid,
            stickyBg: colors.bg,
            stickyBorder: colors.surfaceBorder,
            overlayBg: 'rgba(255,248,240,0.96)',
            unlockBg: colors.primarySolid,
            thumbBorder: colors.surfaceBorder,
            thumbText: colors.textMuted,
            modalBg: colors.elevated,
            modalText: colors.text,
            modalSubText: colors.textMuted,
            modalBorder: colors.surfaceBorder,
            bottomBar: colors.bg,
          }
        : privateMode
        ? {
            // Private mode: a deeper, near-black cosmic variant
            screenBg: '#060518',
            headerBg: '#060518',
            inputBarBg: '#0C0A24',
            headerIconBg: 'rgba(255,255,255,0.06)',
            headerText: '#FFFFFF',
            subText: '#B9B4D6',
            timerBg: 'rgba(228,173,13,0.14)',
            timerBorder: 'rgba(228,173,13,0.35)',
            timerText: '#E4AD0D',
            selectBg: 'rgba(255,255,255,0.05)',
            selectBorder: 'rgba(255,255,255,0.10)',
            selectText: '#FFFFFF',
            selectIcon: '#E4AD0D',
            toggleBg: 'rgba(228,173,13,0.14)',
            toggleBorder: 'rgba(228,173,13,0.35)',
            toggleText: '#E4AD0D',
            bodyBg: '#060518',
            astroBubbleBg: 'rgba(255,255,255,0.07)',
            astroText: '#EDEBFB',
            userBubbleBg: '#E4AD0D',
            userText: '#231A05',
            noticeBg: 'rgba(228,173,13,0.10)',
            noticeBorder: 'rgba(228,173,13,0.35)',
            noticeText: '#F0D68A',
            inputBg: 'rgba(255,255,255,0.05)',
            inputBorder: 'rgba(228,173,13,0.35)',
            inputText: '#FFFFFF',
            inputPlaceholder: '#9C97BE',
            sendBg: '#E4AD0D',
            stickyBg: '#060518',
            stickyBorder: 'rgba(255,255,255,0.10)',
            overlayBg: 'rgba(6,5,24,0.96)',
            unlockBg: '#E4AD0D',
            thumbBorder: 'rgba(255,255,255,0.10)',
            thumbText: '#B9B4D6',
            modalBg: '#120F30',
            modalText: '#FFFFFF',
            modalSubText: '#B9B4D6',
            modalBorder: 'rgba(255,255,255,0.10)',
            bottomBar: '#060518',
          }
        : {
            // Default: standard cosmic
            screenBg: '#0B0A2E',
            headerBg: '#0B0A2E',
            inputBarBg: '#0B0A2E',
            headerIconBg: 'rgba(255,255,255,0.06)',
            headerText: '#FFFFFF',
            subText: '#B9B4D6',
            timerBg: 'rgba(228,173,13,0.14)',
            timerBorder: 'rgba(228,173,13,0.35)',
            timerText: '#E4AD0D',
            selectBg: 'rgba(255,255,255,0.045)',
            selectBorder: 'rgba(255,255,255,0.09)',
            selectText: '#FFFFFF',
            selectIcon: '#E4AD0D',
            toggleBg: 'rgba(228,173,13,0.14)',
            toggleBorder: 'rgba(228,173,13,0.35)',
            toggleText: '#E4AD0D',
            bodyBg: '#0B0A2E',
            astroBubbleBg: 'rgba(255,255,255,0.07)',
            astroText: '#EDEBFB',
            userBubbleBg: '#E4AD0D',
            userText: '#231A05',
            noticeBg: 'rgba(228,173,13,0.10)',
            noticeBorder: 'rgba(228,173,13,0.35)',
            noticeText: '#F0D68A',
            inputBg: 'rgba(255,255,255,0.045)',
            inputBorder: 'rgba(228,173,13,0.35)',
            inputText: '#FFFFFF',
            inputPlaceholder: '#9C97BE',
            sendBg: '#E4AD0D',
            stickyBg: '#0B0A2E',
            stickyBorder: 'rgba(255,255,255,0.09)',
            overlayBg: 'rgba(11,10,46,0.96)',
            unlockBg: '#E4AD0D',
            thumbBorder: 'rgba(255,255,255,0.09)',
            thumbText: '#B9B4D6',
            modalBg: '#171436',
            modalText: '#FFFFFF',
            modalSubText: '#B9B4D6',
            modalBorder: 'rgba(255,255,255,0.09)',
            bottomBar: '#0B0A2E',
          },
    [privateMode, isDark, colors]
  );

  const scrollRef = useRef(null);

  const { width, height } = useWindowDimensions();
  const is1280x800 = width >= 1280 && height >= 800;
  const horizontalPadding = is1280x800 ? 40 : 0;
  const fontSize = is1280x800 ? 16 : 11;


  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);


  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages]);

  /* ================= INIT ================= */
  const resetChatToInitial = async () => {
    const rawProfile = await AsyncStorage.getItem('USER_PROFILE');
    const profile = rawProfile ? JSON.parse(rawProfile) : {};
    setProfileData(profile);
    setSelectedLanguage(profile.language || 'English');
    setFirstMessageSent(false); // Reset this for new session

    const dummyUserInfoMessage = {
      id: 'dummy-user-info',
      from: 'user',
      type: 'info',
      data: {
        name: profile.fullName || profile.name || 'Anonymous',
        date: `${profile.day}-${profile.month}-${profile.year}`,
        time: `${profile.hour}:${profile.min}`,
        gender: profile.gender || 'Female',
        location: `${profile.city}, ${profile.state}`,
        language: profile.language || 'English',
      },
    };

    const nextMessages = [
      dummyUserInfoMessage,
      {
        id: 'dummy-astro',
        from: 'astro',
        text: t('guideMessage'),
      },
    ];

    setMessages(nextMessages);
  };

  const mapHistoryMessageToChatMessage = useCallback((item, index) => {
    const role = item?.role === 'user' ? 'user' : 'astro';
    let text = '';

    if (role === 'user') {
      if (typeof item?.userQuestion === 'string') {
        text = item.userQuestion;
      } else if (
        typeof item?.content === 'object' &&
        typeof item?.content?.userQuestion === 'string'
      ) {
        text = item.content.userQuestion;
      } else if (typeof item?.content === 'string') {
        const raw = item.content.trim();
        if (raw.startsWith('{')) {
          try {
            const parsed = JSON.parse(raw);
            text = typeof parsed?.userQuestion === 'string' ? parsed.userQuestion : raw;
          } catch {
            text = raw;
          }
        } else {
          text = raw;
        }
      }
    } else if (typeof item?.content === 'string') {
      text = item.content;
    } else if (typeof item?.output === 'string') {
      text = item.output;
    }

    return {
      id: `${role}-${item?._key || item?.createdAt || index}`,
      from: role,
      text: text || t('noResponse'),
    };
  }, [t]);

  const loadCurrentSessionHistory = useCallback(async (currentSessionId) => {
    if (!currentSessionId) {
      return false;
    }

    try {
      const token = (await AsyncStorage.getItem('AUTH_TOKEN')) || authToken || '';
      if (!token) {
        return false;
      }

      const chatHistoryUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL}/kundlikonnect/get-all-chat-history`;

      console.log('📚 Loading history for sessionId:', String(currentSessionId));
      console.log('📚 Calling API:', chatHistoryUrl);

      const response = await fetch(chatHistoryUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          token,
        },
      });

      console.log('📚 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📚 API Error Response:', errorText);

        if (errorText.includes('Invalid Token')) {
          console.error('❌ Authentication token is invalid or expired');
        }
        return false;
      }

      const chatHistory = await response.json();
      console.log('📚 Chat history response:', chatHistory);
      console.log('📚 Current messages length:', messages.length);

      let sessions = [];

      if (
        Array.isArray(chatHistory) &&
        chatHistory.length > 0 &&
        Array.isArray(chatHistory[0]?.result)
      ) {
        sessions = chatHistory[0].result;
      } else if (Array.isArray(chatHistory?.result)) {
        sessions = chatHistory.result;
      } else if (Array.isArray(chatHistory)) {
        sessions = chatHistory;
      }

      console.log(
        '📚 Returned session IDs:',
        sessions.map((item) => String(item?.sessionId)).filter(Boolean)
      );

      const matchedSession = sessions.find(
        (item) => String(item?.sessionId) === String(currentSessionId)
      );

      console.log('📚 Matched session:', matchedSession);

      const conversation = Array.isArray(matchedSession?.conversation)
        ? matchedSession.conversation
        : [];

      console.log('📚 Matched conversation length:', conversation.length);

      if (!conversation.length) {
        return false;
      }

      const historyMessages = conversation
        .map((item, index) => mapHistoryMessageToChatMessage(item, index))
        .filter((item) => item?.text);

      if (!historyMessages.length) {
        return false;
      }

      setMessages(historyMessages);
      setFirstMessageSent(historyMessages.some((item) => item.from === 'user'));
      return true;
    } catch (error) {
      console.warn('load current session history error', error);
      return false;
    }
  }, [authToken, mapHistoryMessageToChatMessage]);

  const loadResumedChat = useCallback(async () => {
    try {
      const rawPayload = await AsyncStorage.getItem(RESUME_CHAT_KEY);
      if (!rawPayload) {
        return false;
      }

      const payload = JSON.parse(rawPayload);
      if (
        !payload?.sessionId ||
        !resumeSessionIdParam ||
        String(payload.sessionId) !== String(resumeSessionIdParam)
      ) {
        await AsyncStorage.removeItem(RESUME_CHAT_KEY);
        return false;
      }

      const rawProfile = await AsyncStorage.getItem('USER_PROFILE');
      const profile = rawProfile ? JSON.parse(rawProfile) : {};
      const historyMessages = Array.isArray(payload?.conversation)
        ? payload.conversation
            .map((item, index) => mapHistoryMessageToChatMessage(item, index))
            .filter((item) => item?.text)
        : [];

      setProfileData(profile);
      setSelectedLanguage(profile.language || 'English');
      setSessionId(String(payload.sessionId));
      setFirstMessageSent(historyMessages.some((item) => item.from === 'user'));
      setMessages(historyMessages);
      await AsyncStorage.setItem('CHAT_SESSION_ID', String(payload.sessionId));
      await AsyncStorage.removeItem(RESUME_CHAT_KEY);
      return true;
    } catch (e) {
      console.warn('load resumed chat error', e);
      await AsyncStorage.removeItem(RESUME_CHAT_KEY);
      return false;
    }
  }, [mapHistoryMessageToChatMessage, resumeSessionIdParam]);

  useFocusEffect(
    useCallback(() => {
      const initSession = async () => {
        const resumed = await loadResumedChat();
        if (resumed) {
          return;
        }

        // Check if there is an active timer ticking
        const storedRemaining = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_REMAINING);
        const existingSessionId = await AsyncStorage.getItem('CHAT_SESSION_ID');
        const paidPendingStored =
          (await AsyncStorage.getItem(STORAGE_KEYS.PAID_PENDING)) === 'true';

        if (
          (storedRemaining && Number(storedRemaining) > 0 && existingSessionId) ||
          (paidPendingStored && existingSessionId)
        ) {
          // Reuse existing session if timer is still ticking OR paid purchase is pending
          setSessionId(existingSessionId);
          if (paidPendingStored) {
            console.log('PAID_PENDING_SESSION_REUSE:', {
              sessionId: existingSessionId,
            });
          }
        } else {
          // Create new session only if no active timer and no paid pending state
          const sid = Date.now().toString();
          setSessionId(sid);
          await AsyncStorage.setItem('CHAT_SESSION_ID', sid);
          // NEW: Refresh/Reset page for new session
          await resetChatToInitial();
        }
      };

      initSession();
    }, [loadResumedChat, t])
  );

  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem('AUTH_TOKEN');
      setAuthToken(token);
      logMetaEvent('fb_mobile_chat');
      
      // We only want to set initial messages if sessionId is not null
      // to avoid double initialization or race conditions with initSession
      if (sessionId && !resumeSessionIdParam) {
        await resetChatToInitial();
        await loadCurrentSessionHistory(sessionId);
      }
    };

    init();
  }, [language, loadCurrentSessionHistory, resumeSessionIdParam, sessionId]);

  useEffect(() => {
    if (sessionId) {
      console.log('CHAT_SESSION_ID:', sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const nextSessionId = String(sessionId);

    if (
      privateModeSessionRef.current &&
      privateModeSessionRef.current !== nextSessionId
    ) {
      setPrivateMode(false);
      setPrivateModeLocked(false);
    }

    privateModeSessionRef.current = nextSessionId;
  }, [sessionId]);

  /* ================= Animated message loader ================= */
  useEffect(() => {
    const hasAnalyzer = messages.some(m => m.from === 'analyzer');

    if (hasAnalyzer) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(analyzingOpacity, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(analyzingOpacity, {
            toValue: 0.3,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = setInterval(() => {
        setLoadingIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
    } else {
      analyzingOpacity.setValue(0);
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
        setLoadingIndex(0);
      }
    }
  }, [messages, loadingMessages.length]);

  // timer logic 
  const [chatLocked, setChatLocked] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [chatSessionStarted, setChatSessionStarted] = useState(false);
  const [firstMessageSent, setFirstMessageSent] = useState(false);
  const [paidPendingStart, setPaidPendingStart] = useState(false);
  const [questionTrigger, setQuestionTrigger] = useState(0);
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const sendLockRef = useRef(false);
  const PAID_SECONDS = 5 * 60;           // 5 minutes
  const CHAT_TYPE = {
    PAID: 'PAID',
  };
  const STORAGE_KEYS = {
    CHAT_START: 'CHAT_START_TIME',
    CHAT_DURATION: 'CHAT_DURATION',
    CHAT_TYPE: 'CHAT_TYPE', // ✅ NEW
    CHAT_REMAINING: 'CHAT_REMAINING_SECONDS', // ✅ NEW
    PAID_PENDING: 'PAID_PENDING_START',
  };

  useFocusEffect(
    useCallback(() => {
      const handler = (e) => {
        const type = e?.data?.action?.type;
        if (type === 'GO_BACK' || type === 'POP' || type === 'POP_TO_TOP') {
          e.preventDefault();
          setShowBackModal(true);
        }
      };
      const unsub = navigation?.addListener?.('beforeRemove', handler);
      return () => {
        if (typeof unsub === 'function') {
          unsub();
        }
      };
    }, [navigation])
  );

  useFocusEffect(
    useCallback(() => {
      const onHardwareBack = () => {
        setShowBackModal(true);
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      return () => {
        if (sub && typeof sub.remove === 'function') {
          sub.remove();
        }
      };
    }, [])
  );

  const startChatTimer = async (durationInSeconds, type) => {
    const startTime = Date.now();

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.CHAT_START, startTime.toString()],
      [STORAGE_KEYS.CHAT_DURATION, durationInSeconds.toString()],
      [STORAGE_KEYS.CHAT_TYPE, type], // ✅ SAVE TYPE
    ]);

    // Seed remaining immediately so other screens can read it right away
    await AsyncStorage.setItem(
      STORAGE_KEYS.CHAT_REMAINING,
      durationInSeconds.toString()
    );

    setRemainingSeconds(durationInSeconds);
    setChatLocked(false);
    setFirstMessageSent(false);

    if (timerRef.current) clearInterval(timerRef.current);

   timerRef.current = setInterval(async () => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const remaining = durationInSeconds - elapsed;

  if (remaining <= 0) {
    clearInterval(timerRef.current);
    timerRef.current = null;

    await AsyncStorage.setItem(STORAGE_KEYS.CHAT_REMAINING, "0");

    onChatExpired();
  } else {
    setRemainingSeconds(remaining);

    // ✅ Save remaining time globally
    await AsyncStorage.setItem(
      STORAGE_KEYS.CHAT_REMAINING,
      remaining.toString()
    );
  }
}, 1000);
  };

  const onChatExpired = async () => {
    setChatLocked(true);
    setRemainingSeconds(0);
  setChatSessionStarted(false); 
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.CHAT_START,
      STORAGE_KEYS.CHAT_DURATION,
      STORAGE_KEYS.CHAT_TYPE, // ✅ NEW
      STORAGE_KEYS.PAID_PENDING,
      'CHAT_SESSION_ID', // ✅ Clear session ID on expiry
    ]);

    await checkFeedbackStatus();
  };



 const restoreTimerIfExists = async () => {
  const start = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_START);
  const duration = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_DURATION);
  const storedRemaining = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_REMAINING);
  const paidPendingStored =
    (await AsyncStorage.getItem(STORAGE_KEYS.PAID_PENDING)) === 'true';

  if (!start || !duration) {
    if (paidPendingStored) {
      setRemainingSeconds(PAID_SECONDS);
      setChatLocked(false);
      setChatSessionStarted(false);
      setPaidPendingStart(true);
      console.log('PAID_PENDING_RESTORED:', {
        remainingSeconds: PAID_SECONDS,
      });
      return;
    }
    setRemainingSeconds(0);
    setChatLocked(true);
    setChatSessionStarted(false);
    return;
  }

  let remaining;

  if (storedRemaining && Number(storedRemaining) > 0) {
    remaining = Number(storedRemaining);
  } else {
    const elapsed = Math.floor((Date.now() - Number(start)) / 1000);
    remaining = Number(duration) - elapsed;
  }

  if (remaining <= 0) {
    await onChatExpired();
  } else {
    setRemainingSeconds(remaining);
    setChatLocked(false);
    setChatSessionStarted(true);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(async () => {
      setRemainingSeconds((prev) => {
        const updated = prev - 1;

        AsyncStorage.setItem(
          STORAGE_KEYS.CHAT_REMAINING,
          updated.toString()
        );

        if (updated <= 0) {
          clearInterval(timerRef.current);
          onChatExpired();
          return 0;
        }

        return updated;
      });
    }, 1000);
  }
};


  useFocusEffect(
    useCallback(() => {
      restoreTimerIfExists();
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [])
  );

  const checkFeedbackStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('AUTH_TOKEN');

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/kundlikonnect/check-feedback`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            token,
          },
        }
      );

      const json = await res.json();

      const item =
        Array.isArray(json) &&
          Array.isArray(json[0]?.result)
          ? json[0].result[0]
          : null;

      // ✅ SHOW ONLY IF FEEDBACK DOES NOT EXIST
      if (item?.feedbackExists === false) {
        setShowFeedbackPopup(true);
      } else {
        setShowFeedbackPopup(false);
      }
    } catch (e) {
      setShowFeedbackPopup(false);
    }
  };



  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    let animation;

    if (!chatLocked && remainingSeconds > 0) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(timerPulse, {
            toValue: 1.05,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(timerPulse, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      timerPulse.setValue(1);
    }

    return () => animation?.stop();
  }, [chatLocked, remainingSeconds]);


  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const [dynamicQuestion, setDynamicQuestion] = useState('');

  // Save one question/answer turn to the server-side chat history so it shows
  // up in the Chat History screen (get-all-chat-history reads the same store).
  // kk-agent produces the answer; this call only records what was said. Skipped
  // in private mode by the caller. Best-effort — a failure never affects chat.
  const persistChatTurn = useCallback(async (sid, question, answer) => {
    try {
      const token = (await AsyncStorage.getItem('AUTH_TOKEN')) || authToken || '';
      if (!token || !sid || !question) return;
      await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/kundlikonnect/save-chat-history`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', token },
          body: JSON.stringify({
            sessionId: String(sid),
            userQuestion: String(question),
            agentResponse: String(answer || ''),
          }),
        }
      );
    } catch (e) {
      console.warn('SAVE_CHAT_HISTORY_ERROR:', e?.message || e);
    }
  }, [authToken]);

   const sendMessage = async () => {
    if (
      !message.trim() ||
      sending ||
      sendLockRef.current ||
      (chatLocked && profileData?.phone !== '9898989898')
    ) {
      return;
    }
    sendLockRef.current = true;
    Keyboard.dismiss();       // backup


    setDynamicQuestion(message);
    const userMsg = {
      id: `u-${Date.now()}`,
      from: 'user',
      text: message,
    };

    setMessages((p) => [...p, userMsg]);
    setMessage('');
    setSending(true);

    // Show analyzer message
    setMessages((p) => [
      ...p,
      {
        id: `analyzer-${Date.now()}`,
        from: 'analyzer',
        text: t('analyzingMessage'),
      },
    ]);
    try {
      let chatInput;
      const langToSend = selectedLanguage || profileData?.language || 'English';
      if (!firstMessageSent && profileData && typeof profileData === 'object') {
        // First message: send all profile fields at top level, except session fields
        const { sessions, _key, createdAt, _id, _rev, email, fullName, ...profileDataWithoutSession } = profileData;
        chatInput = {
          ...profileDataWithoutSession,
          ...(fullName ? { full_name: fullName } : {}),
          userQuestion: userMsg.text,
          language: langToSend,
        };
      } else {
        // Subsequent messages: only userQuestion and language
        chatInput = {
          userQuestion: userMsg.text,
          language: langToSend,
        };
      }

      // One webhook call. Returns the raw Response + parsed body so the caller
      // can branch on HTTP status (an error body has no `text` field).
      const invokeAgent = async (profileId) => {
        const requestPayload = {
          question: userMsg.text,
          params: profileId ? { profile_id: profileId } : {},
        };
        console.log('CHAT_QUESTION_PAYLOAD:', requestPayload);
        const r = await fetch(
          `${process.env.EXPO_PUBLIC_KK_AGENT_BASE_URL}/v1/webhooks/${process.env.EXPO_PUBLIC_KK_AGENT_WEBHOOK_ID}/invoke`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.EXPO_PUBLIC_KK_AGENT_WEBHOOK_SECRET}`,
            },
            body: JSON.stringify(requestPayload),
          }
        );
        const j = await r.json().catch(() => ({}));
        return { r, j };
      };

      // Mint a kk-agent birth profile from the stored birth details and cache
      // its id. Returns null only when there are no birth details to send.
      const mintProfileId = async () => {
        try {
          const rawProfile = await AsyncStorage.getItem('USER_PROFILE');
          const stored = rawProfile ? JSON.parse(rawProfile) : profileData || {};
          const hasBirthData = stored?.day && stored?.month && stored?.year && stored?.city;
          if (!hasBirthData) return null;
          const minted = await createOrGetKkAgentProfile(stored);
          if (minted) {
            const merged = { ...stored, kkAgentProfileId: minted };
            await AsyncStorage.setItem('USER_PROFILE', JSON.stringify(merged));
            setProfileData(merged);
          }
          return minted || null;
        } catch (err) {
          console.warn('KK_PROFILE_MINT_ERROR:', err?.message || err);
          return null;
        }
      };

      // Fix A: guarantee a valid profile id BEFORE the call. Without it the
      // webhook returns 403 no_birth_data_consent, which the app used to render
      // as a silent "no response" for every question. The id lives only on the
      // device, so it can be missing after a reinstall / cleared storage / new
      // device, or if the Home-screen backfill silently failed. Mint on demand.
      let kkProfileId = profileData?.kkAgentProfileId;
      if (!kkProfileId) {
        try {
          const rawProfile = await AsyncStorage.getItem('USER_PROFILE');
          kkProfileId = rawProfile ? JSON.parse(rawProfile)?.kkAgentProfileId : null;
        } catch {}
      }
      if (!kkProfileId) {
        kkProfileId = await mintProfileId();
      }

      let { r: res, j: json } = await invokeAgent(kkProfileId);

      // Fix B: self-heal a stale/unknown profile id. The server has no such
      // profile (its DB was reset, or the cached id is from another
      // environment) → re-mint from birth details once and retry.
      if (!res.ok && res.status === 404 && json?.detail?.code === 'profile_not_found') {
        const reminted = await mintProfileId();
        if (reminted) {
          ({ r: res, j: json } = await invokeAgent(reminted));
        }
      }

      if (!firstMessageSent) setFirstMessageSent(true);

      // Fix B: honour the HTTP status. Previously ANY error body (which carries
      // no `text` field) collapsed into "No response", hiding the real cause.
      let answerText;
      if (res.ok && json?.text) {
        answerText = json.text;
      } else {
        console.warn('CHAT_INVOKE_FAILED:', res.status, json?.detail || json);
        answerText = t('networkError');
      }

      // Remove analyzer message before adding astro response
      setMessages((p) => [
        ...p.filter((m) => m.from !== 'analyzer'),
        {
          id: `a-${Date.now()}`,
          from: 'astro',
          text: answerText,
        },
      ]);

      // Record this turn in server-side history so it appears in Chat History.
      // Never saved in private mode. Best-effort; does not block the chat.
      if (!privateModeEnabledForSession) {
        persistChatTurn(sessionId, userMsg.text, answerText);
      }

      if (paidPendingStart && !chatSessionStarted) {
        setChatSessionStarted(true);
        setPaidPendingStart(false);
        await AsyncStorage.removeItem(STORAGE_KEYS.PAID_PENDING);
        await startChatTimer(PAID_SECONDS, CHAT_TYPE.PAID);
        setFirstMessageSent(true);
      }

    } catch (e) {
      // Remove analyzer if error
      setMessages((p) => p.filter((m) => m.from !== 'analyzer'));
      console.warn('sendMessage error', e);
    } finally {
      sendLockRef.current = false;
      setSending(false);
    }
  };

  const predefinedOptions = [
    'Hate Speech & Harassment',
    'Sexually Explicit Content',
    'Dangerous or Harmful',
    'Deceptive or Misleading',
    'Inaccurate or Hallucinated',

  ];
  const ignoredFeedbackTexts = [
    'I am here to guide you. Ask me anything when you are ready.',
  ];
  const isIgnoredFeedbackText = (txt) => {
    return ignoredFeedbackTexts.includes(String(txt || '').trim());
  };

  const openInlineFeedback = (messageId, agentText, positive) => {
    setInlineTargetMessageId(messageId);
    setInlineAgentResponse(agentText);
    setInlineFeedbackPositive(positive);
    if (positive) {
      submitInlineFeedback(true);
    } else {
      setInlineFeedbackVisible(true);
      setInlineFeedbackText('');
      setInlineFeedbackOption(null);
      setInlineError(null);
    }
  };

  const submitInlineFeedback = async (directPositive) => {
    if (inlineSubmitting) return;
    try {
      setInlineSubmitting(true);
      setInlineError(null);
      const token = await AsyncStorage.getItem('AUTH_TOKEN');
      const uid = profileData?._key || profileData?.userId || '';
      const body = {
        sessionId: sessionId,
        userId: String(uid || ''),
        positive: directPositive === true ? true : inlineFeedbackPositive === true,
        agentResponse: String(inlineAgentResponse || ''),
        feedback: String(
          (inlineFeedbackOption ? inlineFeedbackOption + (inlineFeedbackText ? ' - ' : '') : '') +
          (inlineFeedbackText || '')
        ),
      };
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/response-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || 'Failed to submit feedback');
      }
      setInlineFeedbackVisible(false);
      setInlineFeedbackText('');
      setInlineFeedbackOption(null);
      setRatedMessageIds((prev) => new Set([...prev, inlineTargetMessageId]));
      setShowFeedbackSuccessModal(true);
    } catch (e) {
      setInlineError(e?.message || 'Something went wrong');
    } finally {
      setInlineSubmitting(false);
    }
  };



  const paymentProps = {
    amount: 29, // ₹29
    fullName: profileData?.fullName || profileData?.name || 'Anonymous',
    userId: profileData?._key || '17389471',
    sessionId: sessionId || Date.now().toString(),
    phone: profileData?.phone || '9301088667',
    requestedTimeInMinutes: 5,

    onPaymentSuccess: async () => {
      setShowPaymentPage(false);
      const storedSessionId = await AsyncStorage.getItem('CHAT_SESSION_ID');
      const finalSessionId = sessionId ? String(sessionId) : storedSessionId;
      if (finalSessionId) {
        await AsyncStorage.setItem('CHAT_SESSION_ID', finalSessionId);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.PAID_PENDING, 'true');
      setPaidPendingStart(true);
      setRemainingSeconds(PAID_SECONDS);
      setChatLocked(false);

      // ✅ SYSTEM MESSAGE
      setMessages((prev) => [
        ...prev,
        {
          id: `payment-success-${Date.now()}`,
          from: 'astro',
          type: 'payment-success',
          text: t('paymentSuccess'),
        },
      ]);
    },

    onPaymentFail: () => {
      setShowPaymentPage(false);
      AsyncStorage.removeItem(STORAGE_KEYS.PAID_PENDING);
      alert(t('paymentFailedOrCancelled'));
    },
  };



  const handleUnlockPress = () => {
    setShowPaymentPage(true);
  };

  // back button confirmation modal
  const handleBackPress = () => {
    setShowBackModal(true);
  };

  const handleBackConfirm = async () => {
    setShowBackModal(false);
    
    // Check if timer is expired before clearing everything
    const storedRemaining = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_REMAINING);
    const paidPendingStored =
      (await AsyncStorage.getItem(STORAGE_KEYS.PAID_PENDING)) === 'true';
    if ((!storedRemaining || Number(storedRemaining) <= 0) && !paidPendingStored) {
      await AsyncStorage.removeItem('CHAT_SESSION_ID');
    }
    router.push('/home');
  };


  // App Review account: this number gets unrestricted chat (no lock overlay, no
  // paywall) so reviewers can test full chat end to end without payment.
  const isUnlimitedReviewer = profileData?.phone === '9898989898';
  // Visual lock: never locked for the reviewer account.
  const uiChatLocked = chatLocked && !isUnlimitedReviewer;

  const showTimerPill =
    !isUnlimitedReviewer &&
    (remainingSeconds > 0 || paidPendingStart);
  const displaySeconds = remainingSeconds > 0 ? remainingSeconds : PAID_SECONDS;


  return (
    <ThemedView style={[styles.container, { backgroundColor: chatTheme.screenBg }]}>
      {chatLocked && showFeedbackPopup && (
        <FeedbackPopup
          visible={showFeedbackPopup}
          onClose={() => setShowFeedbackPopup(false)}
        />
      )}
      <View style={[styles.headerBar, { backgroundColor: chatTheme.headerBg }]}>
        <View style={[styles.headerRow, { paddingHorizontal: horizontalPadding }]}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[styles.headerIcon, { backgroundColor: chatTheme.headerIconBg }]} onPress={handleBackPress}>
              {/* Back Confirmation Modal */}
              <MaterialIcons name="arrow-back" size={20} color={chatTheme.headerText} />
            </TouchableOpacity>
            {astrologerNameParam ? null : (
              <AstrologerStatusIndicator sessionId={sessionId} />
            )}
            <View style={{ display: 'flex', flexDirection: 'row', marginLeft: 6 }}>
              {astrologerNameParam ? (
                <View style={styles.astroHeaderRow}>
                  {astroHeaderImg ? (
                    <Image source={astroHeaderImg} style={styles.astroHeaderAvatar} resizeMode="cover" />
                  ) : null}
                  <Text style={[styles.astroHeaderName, { color: chatTheme.headerText }]} >
                    {displayAstrologerName}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* <TouchableOpacity style={styles.headerIcon} onPress={() => router.push('/chat-history')}>
              <MaterialIcons name="history" size={20} color="#fff" />
            </TouchableOpacity> */}
            <TouchableOpacity style={[styles.headerIcon, { backgroundColor: chatTheme.headerIconBg }]} onPress={() => router.push('/profile')}>
              <Ionicons name="person-circle-outline" size={22} color={chatTheme.headerText} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Toolbar inside header */}
       
        
        <View style={[styles.toolbar, { paddingHorizontal: horizontalPadding }]}>
           <View style={styles.langRow}>
          {showTimerPill && (
          <Animated.View
            style={[
              styles.timerPill,
              {
                backgroundColor: chatTheme.timerBg,
                borderColor: chatTheme.timerBorder,
              },
              chatLocked && { backgroundColor: '#00000000' },
              { transform: [{ scale: timerPulse }] },
            ]}
          >
            <Text
              style={[
                styles.timerText,
                { color: chatTheme.timerText },
                chatLocked && { color: '#FF0000' },
              ]}
            >
              {formatTime(displaySeconds)}
            </Text>
          </Animated.View>
 )}
            </View>


          <View style={styles.langRow}>
            <TouchableOpacity
              style={[
                styles.privateToggle,
                {
                  backgroundColor: chatTheme.toggleBg,
                  borderColor: chatTheme.toggleBorder,
                  opacity: privateModeLocked ? 0.6 : 1,
                },
              ]}
              onPress={() => {
                if (privateModeLocked) return;
                setPrivateMode(true);
                setPrivateModeLocked(true);
              }}
              activeOpacity={0.8}
              disabled={privateModeLocked}
            >
              <Ionicons
                name={privateMode ? 'eye-off-outline' : 'eye-outline'}
                size={14}
                color={chatTheme.toggleText}
              />
              <Text style={[styles.privateToggleText, { color: chatTheme.toggleText }]}>
                {t('privateMode')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langSelect,
                {
                  marginLeft: 8,
                  backgroundColor: chatTheme.selectBg,
                  borderColor: chatTheme.selectBorder,
                },
              ]}
              onPress={() => setShowLangDropdown((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={[styles.langValue, { color: chatTheme.selectText }]}>{selectedLanguageLabel}</Text>
              <Ionicons name="chevron-down" size={14} color={chatTheme.selectIcon} />
            </TouchableOpacity>
            {/* Use Modal for dropdown to ensure it appears above all */}
            {showLangDropdown && (
              <Modal
                transparent
                animationType="fade"
                visible={showLangDropdown}
                onRequestClose={() => setShowLangDropdown(false)}
              >
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.15)' }}
                  activeOpacity={1}
                  onPress={() => setShowLangDropdown(false)}
                >
                  <View
                    style={{
                      position: 'absolute',
                      width: '30%',
                      top: 100,
                      height: '40%',
                      right: 10,
                      backgroundColor: chatTheme.modalBg,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: chatTheme.modalBorder,
                      elevation: 20,
                      shadowColor: '#000',
                      shadowRadius: 8,
                      overflow: 'hidden',
                    }}
                  >
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
                      {languageOptions.map((lang) => (
                        <TouchableOpacity
                          key={lang.value}
                          style={{
                            padding: 10,
                            borderBottomWidth: 1,
                            borderBottomColor: chatTheme.modalBorder,
                          }}
                          onPress={() => {
                            setSelectedLanguage(lang.value || profileData?.language); // ✅ STORE VALUE
                            setShowLangDropdown(false);
                          }}
                        >
                          <Text
                            style={{
                              color:
                                lang.value === selectedLanguage ? chatTheme.selectIcon : chatTheme.modalText,
                              fontWeight:
                                lang.value === selectedLanguage ? 'bold' : 'normal',
                            }}
                          >
                            {lang.label} {/* ✅ SHOW LABEL */}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </TouchableOpacity>
              </Modal>
            )}

          </View>
        </View>
       
      </View>

      <View style={[styles.bodyView, { paddingHorizontal: horizontalPadding, backgroundColor: chatTheme.bodyBg }]}>
        <Text style={[styles.motto, { fontSize: fontSize, color: chatTheme.subText }]}>{t('motto')}</Text>
        {privateMode ? (
          <Text style={styles.privateModeNotice}>
            {t('privateModeHistoryNotice')}
          </Text>
        ) : null}
        {/* Unlock button above chat messages */}

        {/* Chat messages and sticky panel */}
        <ScrollView ref={scrollRef}
          showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 12, paddingHorizontal: 12 }}>
          <View style={styles.messages}>
            {messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.msgRow,
                  m.from === 'user' ? styles.rowRight : styles.rowLeft
                ]}
              >
                {m.type === 'info' ? (
                  <View style={[styles.bubble, styles.userBubble, { backgroundColor: chatTheme.userBubbleBg }]}>
                    <Text style={[styles.infoLine, { color: chatTheme.userText }]}>{t('infoName')}: {m.data.name}</Text>
                    <Text style={[styles.infoLine, { color: chatTheme.userText }]}>{t('infoDate')}: {m.data.date}</Text>
                    <Text style={[styles.infoLine, { color: chatTheme.userText }]}>{t('infoTime')}: {m.data.time}</Text>
                    <Text style={[styles.infoLine, { color: chatTheme.userText }]}>{t('infoGender')}: {m.data.gender}</Text>
                    <Text style={[styles.infoLine, { color: chatTheme.userText }]}>{t('infoLocation')}: {m.data.location}</Text>
                    <Text style={[styles.infoLine, { color: chatTheme.userText }]}>{t('infoLanguage')}: {m.data.language}</Text>
                  </View>
                ) : m.type === 'payment-success' ? (
                  <View style={[styles.bubble, styles.paymentSuccessBubble]}>
                    <Text style={[styles.bubbleText, { color: '#fff', fontWeight: 'bold' }]}>{m.text}</Text>
                  </View>
                ) : m.from === 'analyzer' ? (
                  <Animated.View
                    style={[
                      styles.bubble,
                      styles.astroBubble,
                      { backgroundColor: chatTheme.astroBubbleBg },
                      { flexDirection: 'row', alignItems: 'center', opacity: analyzingOpacity },
                    ]}
                  >
                    <Text style={[styles.bubbleText, { color: chatTheme.selectIcon, fontStyle: 'italic' }]}>
                      {loadingMessages[loadingIndex] || t('analyzingMessage')}
                    </Text>
                  </Animated.View>
                ) : (
                  <View
                    style={[
                      styles.bubble,
                      m.from === 'user'
                        ? [styles.userBubble, { backgroundColor: chatTheme.userBubbleBg }]
                        : [styles.astroBubble, { backgroundColor: chatTheme.astroBubbleBg }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        { color: m.from === 'user' ? chatTheme.userText : chatTheme.astroText },
                        m.from === 'user' && styles.bubbleTextUser,
                      ]}
                    >
                      {m.text}
                    </Text>
                    {m.from !== 'user' && !ratedMessageIds.has(m.id) && !isIgnoredFeedbackText(m.text) ? (
                      <View style={styles.feedbackRow}>
                        <TouchableOpacity
                          style={[styles.thumbBtn, { borderColor: chatTheme.thumbBorder }]}
                          onPress={() => openInlineFeedback(m.id, m.text, true)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="thumbs-up" size={18} color="#16A34A" />
                          <Text style={[styles.thumbText, { color: chatTheme.thumbText }]}>Like</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.thumbBtn, { borderColor: chatTheme.thumbBorder }]}
                          onPress={() => openInlineFeedback(m.id, m.text, false)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="thumbs-down" size={18} color="#DC2626" />
                          <Text style={[styles.thumbText, { color: chatTheme.thumbText }]}>Dislike</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={[styles.stickyPanel, { backgroundColor: chatTheme.stickyBg, borderTopColor: chatTheme.stickyBorder }]}>
          <AscendantInfo
            profile={profileData}
            token={authToken}
            endpoint={process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL}
            privateMode={privateMode}
          />
          <DynamicQuestions
            onPick={(q) => setMessage(q)}
            userQuestion={dynamicQuestion}
language={
  languageMap[language] ||
  languageMap[selectedLanguage] ||
  languageMap[profileData?.language] 
  
}
            sessionId={sessionId}
            token={authToken}
          /> 
        </View>
        {/* Show PaymentPage as a modal/page when unlock is pressed */}
        <Modal
          visible={showPaymentPage}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPaymentPage(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 340, maxWidth: '95%', backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 8 }}>
              <PaymentPage {...paymentProps} onRequestClose={() => setShowPaymentPage(false)} />
            </View>
          </View>
        </Modal>
      </View>

      <Modal
        visible={inlineFeedbackVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInlineFeedbackVisible(false)}
      >
        <View style={styles.inlineOverlay}>
          <View style={styles.inlineBox}>
            <Text style={styles.inlineTitle}>Share why you disliked</Text>
            <View style={styles.inlineOptionsRow}>
              {predefinedOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.inlineChip,
                    inlineFeedbackOption === opt && styles.inlineChipActive,
                  ]}
                  onPress={() => setInlineFeedbackOption(opt)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.inlineChipText,
                      inlineFeedbackOption === opt && styles.inlineChipTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.inlineInput}
              placeholder="Add details (optional)"
              value={inlineFeedbackText}
              onChangeText={setInlineFeedbackText}
              multiline
              numberOfLines={1}
              placeholderTextColor="#9CA3AF"
            />
            {inlineError ? <Text style={styles.inlineError}>{inlineError}</Text> : null}
            <View style={styles.inlineBtnRow}>
              <TouchableOpacity
                style={styles.inlineCancelBtn}
                onPress={() => setInlineFeedbackVisible(false)}
              >
                <Text style={styles.inlineCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inlineSubmitBtn, { backgroundColor: chatTheme.sendBg }, inlineSubmitting && { opacity: 0.7 }]}
                onPress={() => submitInlineFeedback(false)}
                disabled={inlineSubmitting}
              >
                {inlineSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.inlineSubmitText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFeedbackSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFeedbackSuccessModal(false)}
      >
        <TouchableOpacity style={styles.successOverlay} activeOpacity={1} onPress={() => setShowFeedbackSuccessModal(false)}>
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>Feedback Submitted</Text>
            <Text style={styles.successDesc}>Your feedback was submitted successfully.</Text>
            <TouchableOpacity
              style={[styles.successBtn, { backgroundColor: chatTheme.sendBg }]}
              onPress={() => setShowFeedbackSuccessModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.successBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
         </Modal>

         <View style={{ position: 'relative', paddingHorizontal: horizontalPadding }}>
        {uiChatLocked && (
          <View style={[styles.inputOverlay, { backgroundColor: chatTheme.overlayBg }]}>
            <TouchableOpacity
              style={[styles.unlockBtn, { backgroundColor: chatTheme.unlockBg }]}
              onPress={handleUnlockPress}
            >
              <Ionicons name="lock-open" size={18} color={chatTheme.userText} />
              <Text style={[styles.unlockText, { color: chatTheme.userText }]}>{t('unlockChat')}</Text>
            </TouchableOpacity>
          </View>
        )}
        <View  style={{ backgroundColor: chatTheme.inputBarBg }}>

          <KeyboardAvoidingView
            style={styles.keyboardAvoiding}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
          >
            {/* Show Unlock Chat button if freeTimerExpired or Restore_free_chat is false, but hide if chat is unlocked */}
            <KeyboardAwareScrollView
              enableOnAndroid
              enableAutomaticScroll={Platform.OS !== 'ios'}
              keyboardShouldPersistTaps="handled"
              extraScrollHeight={Platform.OS === 'ios' ? 160 : 80}
              keyboardOpeningTime={0}
              contentContainerStyle={{
                paddingBottom: keyboardOpen ? (Platform.OS === 'ios' ? 280 : 135) : 0,
              }}
            >
              <View
                style={[
                  styles.inputRow,
                  uiChatLocked && styles.inputRowLocked,
                  { backgroundColor: chatTheme.inputBg, borderColor: chatTheme.inputBorder },
                ]}
              >


                <TextInput
                  multiline

                  value={message}
                  onChangeText={setMessage}
                  placeholder={t('writeYourMessage')}
                  onSubmitEditing={() => {
                    sendMessage();
                    Keyboard.dismiss(); // extra safety
                  }}
                  onContentSizeChange={(e) => {
                    const newHeight = e.nativeEvent.contentSize.height;
                    setHeight(Math.min(120, Math.max(44, newHeight)));
                  }}
                  style={[
                    styles.textArea,
                    uiChatLocked && styles.textAreaLocked,
                    { height: uiChatLocked ? 35 : heights, color: chatTheme.inputText },
                  ]}
                  textAlignVertical="top"   // 🔴 REQUIRED for Android
                  blurOnSubmit={false}
                  returnKeyType="send"
                  placeholderTextColor={chatTheme.inputPlaceholder}
                  selectionColor={chatTheme.sendBg}
                  scrollEnabled={false}
                  placeholderStyle={{ alignItems: 'center', fontSize: 16 }}
                />

                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    uiChatLocked && styles.sendBtnLocked,
                    { backgroundColor: chatTheme.sendBg },
                  ]}
                  onPress={sendMessage}
                  disabled={sending}   // ✅ block send
                >
                  {sending
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="send" size={18} color="#fff" />
                  }
                </TouchableOpacity>

              </View>
            </KeyboardAwareScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
      <TouchableOpacity style={[styles.bottomBlue, { backgroundColor: chatTheme.bottomBar }]} activeOpacity={0.8}>
        <Text style={styles.bottomBlueText}> </Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={showBackModal}
        onRequestClose={() => setShowBackModal(false)}
        icon="home-outline"
        title={t('goBackTitle')}
        description={t('goBackDesc')}
        cancelLabel={t('cancel')}
        confirmLabel={t('yesGoBack')}
        onCancel={() => setShowBackModal(false)}
        onConfirm={handleBackConfirm}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Blue header bar styles
  headerBar: {
    backgroundColor: '#073A8C',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 16,
  },
  textArea: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 0,
    paddingTop: Platform.OS === 'ios' ? 10 : 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
    fontSize: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // Make body take remaining space so ScrollView can expand
  bodyView: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 10,
  },

  inputOverlay: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    

    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  headerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { alignItems: 'center' },
  astroHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  astroHeaderAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8 },
  astroHeaderName: { color: '#fff', fontWeight: '700' },
  headerTitle: { color: '#fff', fontWeight: '800' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 6 },
  onlineText: { color: '#C6F6D5', fontSize: 12 },
  paymentSuccessBubble: { backgroundColor: '#10B981', borderWidth: 1, borderColor: '#059669' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  timerPill: { backgroundColor: '#073A8C', borderWidth: 1, borderColor: '#FFC000', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  timerText: { color: '#FFC000', fontWeight: '700' },
  langRow: { flexDirection: 'row', alignItems: 'center' },
  langLabel: { color: '#D3E5FF', marginRight: 8 },
  langSelect: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  langValue: { color: '#073A8C', marginRight: 6,textTransform: 'capitalize' },
  privateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  privateToggleText: {
    fontWeight: '600',
    fontSize: 12,
  },

  motto: { color: '#7A869A', textAlign: 'center', marginTop: 3, fontSize: 11, marginBottom: 3 },
  privateModeNotice: { textAlign: 'center', fontSize: 11, marginBottom: 6, color: '#DC2626' },

  infoCard: { position: 'absolute', right: 12, top: 140, backgroundColor: '#3B82F6', borderRadius: 12, padding: 12, width: 200 },
  infoLine: { marginBottom: 4, color: '#fff', textTransform: "capitalize" },

  messages: { flex: 1, marginTop: 20 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  avatarSmall: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#222', marginRight: 8 },
  bubble: { maxWidth: '80%', borderRadius: 12, padding: 12 },
  astroBubble: { backgroundColor: '#F3F4F6' },
  userBubble: { backgroundColor: '#3B82F6', alignSelf: 'flex-end', color: '#fff' },
  bubbleText: { color: '#111' },
  bubbleTextUser: { color: '#fff' },

  footerChips: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  chip: { color: '#4B5563' },
  chipStrong: { fontWeight: '700', color: '#073A8C' },
  chipDot: { color: '#073A8C' },

  keyboardAvoiding: { width: '100%' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 22, borderWidth: 1.5, borderColor: '#e4ad0d', paddingHorizontal: 7, paddingVertical: 0, marginBottom: 10, marginHorizontal: 10 },
  inputRowLocked: {
    // marginBottom: 2,
    // marginTop: 10,
    // paddingVertical: 0,
    // minHeight: 44,
    // borderWidth: 0,
  
  },
  input: { flex: 1, },
  micBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 30, height: 30, borderRadius: 18, backgroundColor: '#073A8C', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  sendBtnLocked: { width: 28, height: 28 },
  textAreaLocked: { paddingTop: 4, paddingBottom: 4, marginVertical: 0 },

  bottomBlue: {
    backgroundColor: '#073A8C', height: 25, borderRadius: 6, borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    alignItems: 'center', justifyContent: 'center'
  },
  bottomBlueText: { color: '#fff' },
  stickyPanel: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  unlockContainer: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 6 },
  unlockBtn: { backgroundColor: '#0A58A6', borderRadius: 12, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', width: '100%' },
  unlockText: { color: '#231A05', fontWeight: '800' },
  feedbackRow: { flexDirection: 'row', marginTop: 8, gap: 10 },
  thumbBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  thumbText: { color: '#374151', fontSize: 12 },
  inlineOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  inlineBox: { backgroundColor: '#fff', borderRadius: 16, padding: 18, width: 360, maxWidth: '92%' },
  inlineTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 10, textAlign: 'center' },
  inlineOptionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 10 },
  inlineChip: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  inlineChipActive: { borderColor: '#073A8C', backgroundColor: '#EFF6FF' },
  inlineChipText: { color: '#374151', fontSize: 12 },
  inlineChipTextActive: { color: '#073A8C', fontWeight: '600' },
  inlineInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, minHeight: 20, textAlignVertical: 'top', marginBottom: 8 },
  inlineError: { color: '#DC2626', fontSize: 13, marginBottom: 6, textAlign: 'center' },
  inlineBtnRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 6 },
  inlineCancelBtn: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  inlineCancelText: { color: '#1E293B', fontWeight: '600' },
  inlineSubmitBtn: { backgroundColor: '#073A8C', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  inlineSubmitText: { color: '#fff', fontWeight: '700' },
  toastWrapper: { position: 'absolute', top: 10, left: 0, right: 0, zIndex: 999, alignItems: 'center' },
  successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  successBox: { width: '85%', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginHorizontal: 20, alignItems: 'center' },
  successTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  successDesc: { fontSize: 14, color: '#334155', marginBottom: 16, textAlign: 'center' },
  successBtn: { backgroundColor: '#073A8C', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 },
  successBtnText: { color: '#fff', fontWeight: '700' },
});

import GradientScreen from '@/components/ui/GradientScreen';
import { useTheme } from '@/contexts/ThemeContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { radius } from '@/lib/theme';
import { logMetaEvent } from '@/utils/metaEvents';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Root route hosts the entire starting flow: identifier (phone or email) -> otp -> success.
 */
export default function Index() {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'success'
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [showSplash, setShowSplash] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [identifier, setIdentifier] = useState(''); // phone ya email, jo bhi user daale
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otp, setOtp] = useState('');
  const otpRef = useRef(null);

  const [timer, setTimer] = useState(60);
  const [loadingSendOtp, setLoadingSendOtp] = useState(false);
  const [loadingVerifyOtp, setLoadingVerifyOtp] = useState(false);
  const [apiError, setApiError] = useState('');
  const [redirectTo, setRedirectTo] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  const { expoPushToken, notification } = usePushNotifications();

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('AUTH_TOKEN');
        if (!token) { setAuthChecked(true); return; }
        setShowSplash(true);
        const base = process.env.EXPO_PUBLIC_API_BASE_URL;
        if (!base) {
          await AsyncStorage.multiRemove(['AUTH_TOKEN', 'USER_PROFILE', 'MIND_ANALYSIS_LAST_RUN_AT']);
          setShowSplash(false); setAuthChecked(true); return;
        }
        const res = await fetch(`${base}/user-info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const raw = await res.text();
        let json = null;
        try { json = JSON.parse(raw); } catch { json = null; }
        if (!res.ok || !json || typeof json !== 'object') {
          await AsyncStorage.multiRemove(['AUTH_TOKEN', 'USER_PROFILE', 'MIND_ANALYSIS_LAST_RUN_AT']);
          setShowSplash(false); setAuthChecked(true); return;
        }
        const user = json?.data;
        const profileComplete =
          user?.fullName && user?.gender && user?.hour && user?.city && user?.day && user?.language;
        setIsProfileComplete(profileComplete);
        if (user && typeof user === 'object') {
          await AsyncStorage.setItem('USER_PROFILE', JSON.stringify(user));
        } else {
          await AsyncStorage.removeItem('USER_PROFILE');
        }
        setTimeout(() => {
          if (profileComplete) router.replace('/home');
          else router.replace('/profile');
        }, 1500);
      } catch (e) {
        console.log('Auth check failed', e);
        await AsyncStorage.multiRemove(['AUTH_TOKEN', 'USER_PROFILE', 'MIND_ANALYSIS_LAST_RUN_AT']);
        setShowSplash(false); setAuthChecked(true);
      }
    })();
  }, []);

  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvt, () => setKeyboardOpen(true));
    const hide = Keyboard.addListener(hideEvt, () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Auto-focus the OTP field when the OTP step becomes active
  useEffect(() => {
    if (step !== 'otp') return;
    const id = setTimeout(() => otpRef.current?.focus(), 350);
    return () => clearTimeout(id);
  }, [step]);

  const clearOtp = () => {
    setOtp('');
    setApiError('');
    otpRef.current?.focus();
  };

  const isValidPhone = (num) => /^[6-9]\d{9}$/.test(num);
  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  // Kya user ne phone daala ya email, khud pehchano
  const detectMethod = (val) => {
    const trimmed = val.trim();
    if (/^\d+$/.test(trimmed)) return 'phone'; // sirf digits hain
    if (trimmed.includes('@')) return 'email';
    return null; // abhi tak pata nahi chal raha (user type kar raha hai)
  };


  const autoOtpLock = useRef(false);
  const handleIdentifierChange = (val) => {
    setIdentifier(val);
    if (apiError) setApiError('');

    const trimmed = val.trim();

    // 10 digit ka valid Indian phone number complete hote hi auto-trigger
    if (/^\d{10}$/.test(trimmed) && isValidPhone(trimmed)) {
      if (!autoOtpLock.current) {
        autoOtpLock.current = true;
        Keyboard.dismiss();
        startOtp(trimmed);
      }
    } else {
      autoOtpLock.current = false; // agar digit delete kiya toh dobara trigger ho sake
    }
  };


  const startOtp = (overrideValue) => {
    const trimmed = (overrideValue ?? identifier).trim();
    const method = detectMethod(trimmed);

    if (method === 'phone') {
      if (!isValidPhone(trimmed)) {
        setApiError('Enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9');
        return;
      }
    } else if (method === 'email') {
      if (!isValidEmail(trimmed)) {
        setApiError('Enter a valid email address');
        return;
      }
    } else {
      setApiError('Enter a valid phone number or email address');
      return;
    }

    setApiError('');
    setLoadingSendOtp(true);

    if (method === 'phone') {
      fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmed }),
      })
        .then(async (res) => {
          const json = await res.json().catch(() => ({}));
          if (!res.ok) { setApiError(json?.message || 'Failed to send OTP'); return; }
          let otpId = null;
          if (Array.isArray(json) && json.length > 0 && json[0]?.Details) otpId = json[0].Details;
          else if (json && typeof json === 'object' && json?.Details) otpId = json.Details;
          if (!otpId) throw new Error('OTP ID not found in response');
          await AsyncStorage.setItem('details', otpId);
          if (json?.otp) setGeneratedOtp(String(json.otp));
          else setGeneratedOtp(String(Math.floor(1000 + Math.random() * 9000)));
          setOtp('');
          setTimer(60);
          setStep('otp');
        })
        .catch((err) => {
          console.log('Send OTP Error:', err.message);
          setApiError('Network error while sending OTP');
        })
        .finally(() => setLoadingSendOtp(false));
      return;
    }

    // method === 'email' (n8n webhook)
    fetch(process.env.EXPO_PUBLIC_EMAIL_AUTH_SEND_OTP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmed.toLowerCase() }),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json?.success === false) {
          setApiError(json?.message || 'Failed to send OTP');
          return;
        }
        setOtp('');
        setTimer(60);
        setStep('otp');
      })
      .catch((err) => {
        console.log('Send Email OTP Error:', err.message);
        setApiError('Network error while sending OTP');
      })
      .finally(() => setLoadingSendOtp(false));
  };

  const verifyOtpLock = useRef(false);
  const verifyOtp = async () => {
    if (verifyOtpLock.current) return;
    verifyOtpLock.current = true;
    setApiError('');
    const entered = otp;
    if (!/^\d{6}$/.test(entered)) {
      setApiError('Enter valid 6-digit OTP');
      verifyOtpLock.current = false;
      return;
    }
    setLoadingVerifyOtp(true);
    const trimmed = identifier.trim();
    const method = detectMethod(trimmed);
    try {
      if (method === 'phone') {
        const storedOtpId = await AsyncStorage.getItem('details');
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: trimmed, otp: entered, id: storedOtpId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || 'OTP failed');

        let token = null;
        let nextRoute = null;
        if (json?.token) {
          token = json.token;
          await AsyncStorage.setItem('Restore_free_chat', 'true');
          await AsyncStorage.setItem('FREE_CHAT_ACTIVE', 'true');
          await AsyncStorage.setItem('FIRST_TIME_USER', 'true');
          await AsyncStorage.setItem('FREE_QUESTION_NOTICE_ELIGIBLE', 'true');
          nextRoute = '/onboarding';
        } else if (json?.data?.token) {
          token = json.data.token;
          await AsyncStorage.setItem('FIRST_TIME_USER', 'false');
          await AsyncStorage.setItem('FREE_QUESTION_NOTICE_ELIGIBLE', 'false');
          nextRoute = '/home';
        }
        if (!token || !nextRoute) throw new Error('Invalid login response');

        await AsyncStorage.setItem('AUTH_TOKEN', token);
        await AsyncStorage.removeItem('details');
        logMetaEvent('fb_mobile_login');
        setRedirectTo(nextRoute);
      } else if (method === 'email') {
        const res = await fetch(process.env.EXPO_PUBLIC_EMAIL_AUTH_VERIFY_OTP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed.toLowerCase(), otp: entered }),
        });
        const json = await res.json();
        if (!res.ok || json?.success === false) {
          throw new Error(json?.message || 'OTP failed');
        }

        const token = json?.token;
        const isNewUser = !!json?.data?.isNewUser;
        if (!token) throw new Error('Invalid login response');

        if (isNewUser) {
          await AsyncStorage.setItem('Restore_free_chat', 'true');
          await AsyncStorage.setItem('FREE_CHAT_ACTIVE', 'true');
          await AsyncStorage.setItem('FIRST_TIME_USER', 'true');
          await AsyncStorage.setItem('FREE_QUESTION_NOTICE_ELIGIBLE', 'true');
        } else {
          await AsyncStorage.setItem('FIRST_TIME_USER', 'false');
          await AsyncStorage.setItem('FREE_QUESTION_NOTICE_ELIGIBLE', 'false');
        }

        await AsyncStorage.setItem('AUTH_TOKEN', token);
        logMetaEvent('fb_mobile_login');
        setRedirectTo(isNewUser ? '/onboarding' : '/home');
      } else {
        throw new Error('Invalid phone number or email');
      }
    } catch (e) {
      setApiError(e?.message || 'Network error while verifying OTP');
    } finally {
      setLoadingVerifyOtp(false);
      verifyOtpLock.current = false;
    }
  };

  useEffect(() => {
    if (step !== 'otp') return;
    const id = setInterval(() => setTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [step]);

  if (redirectTo) return <Redirect href={redirectTo} />;

  // Splash logo when user is already logged in
  if (showSplash) {
    return (
      <GradientScreen>
        <View style={styles.splashWrap}>
          <View style={styles.logoGlow} />
          <Image source={require('../assets/images/applogo.png')} style={styles.splashLogo} resizeMode="contain" />
        </View>
      </GradientScreen>
    );
  }

  if (!authChecked) return <GradientScreen />;

  return (
    <GradientScreen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Ambient decorative glow */}
        <View style={styles.ambientRing} pointerEvents="none">
          <View style={styles.ambientRingInner} />
        </View>

        {/* Brand */}
        <View style={[styles.brandArea, { paddingTop: insets.top + (keyboardOpen ? 12 : 40) }]}>
          <View style={[styles.logoTile, keyboardOpen && styles.logoTileCompact]}>
            <Image
              source={require('../assets/images/applogo.png')}
              style={[styles.logo, keyboardOpen && styles.logoCompact]}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Panel */}
        <View style={[styles.panel, { paddingBottom: insets.bottom + 28 }]}>
          {step === 'phone' && (
            <>
              <Text style={styles.panelTitle}>Hi Welcome!</Text>
              <Text style={styles.panelSubtitle}>Enter your mobile number or email to continue</Text>
              <View style={styles.divider} />

              <View>
                <View style={styles.phoneField}>
                  <View style={styles.phonePrefix}>
                    <Ionicons
                      name={detectMethod(identifier) === 'email' ? 'mail' : 'call'}
                      size={16}
                      color={colors.gold}
                    />
                  </View>
                  <TextInput
                    value={identifier}
                    onChangeText={handleIdentifierChange}
                    placeholder="Mobile number or email"
                    placeholderTextColor={colors.textSubtle}
                    style={styles.phoneInputInner}
                    keyboardType="default"
                    autoCapitalize="none"
                    autoCorrect={false}
                    underlineColorAndroid="transparent"
                  />
                </View>

                <TouchableOpacity style={styles.ctaBtn} onPress={() => startOtp()} disabled={loadingSendOtp} activeOpacity={0.9}>
                  <LinearGradient colors={colors.goldGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaInner}>
                    <Text style={styles.ctaBtnText}>{loadingSendOtp ? 'Sending...' : 'Continue Securely'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}
                <Text style={styles.smallNote}>🔒 100% secure OTP login</Text>
                <Text style={styles.footerText}>
                  By signing up, you agree to our
                  <Text style={styles.linkText} onPress={() => router.push('/TermsConditions')}> Terms of Use</Text> and
                  <Text style={styles.linkText} onPress={() => router.push('/PrivacyPolicy')}> Privacy Policy</Text>
                </Text>
              </View>
            </>
          )}

          {step === 'otp' && (
            <>
              <Text style={styles.panelTitle}>OTP Verification</Text>
              <Text style={styles.panelSubtitle}>Enter the OTP to begin your cosmic journey</Text>

              <Pressable onPress={() => otpRef.current?.focus()}>
                <View style={styles.otpBoxesRow} pointerEvents="none">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.otpBox,
                        otp[i] ? styles.otpBoxFilled : null,
                        i === otp.length ? styles.otpBoxActive : null,
                      ]}
                    >
                      <Text style={styles.otpBoxText}>{otp[i] || ''}</Text>
                    </View>
                  ))}
                </View>

                <TextInput
                  ref={otpRef}
                  value={otp}
                  onChangeText={(v) => {
                    const digits = v.replace(/\D/g, '').slice(0, 6);
                    setOtp(digits);
                    if (apiError) setApiError('');
                    if (digits.length === 6) otpRef.current?.blur();
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  textContentType="oneTimeCode"
                  autoComplete={Platform.OS === 'ios' ? 'one-time-code' : 'sms-otp'}
                  caretHidden
                  contextMenuHidden
                  style={styles.otpHiddenInput}
                />
              </Pressable>

              {otp.length > 0 && (
                <TouchableOpacity style={{ alignSelf: 'center', marginTop: 10 }} onPress={clearOtp}>
                  <Text style={[styles.linkText, { fontSize: 13, fontWeight: '700' }]}>Clear</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.ctaBtn} onPress={verifyOtp} disabled={loadingVerifyOtp} activeOpacity={0.9}>
                <LinearGradient colors={colors.goldGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaInner}>
                  <Text style={styles.ctaBtnText}>{loadingVerifyOtp ? 'Verifying...' : 'Verify OTP'}</Text>
                </LinearGradient>
              </TouchableOpacity>

              {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}
              <Text style={[styles.resendRow, { alignSelf: 'center', marginTop: 12 }]}>
                If you did not receive the OTP!{timer > 0 ? ` (${timer}s)` : ''}
              </Text>
              {timer === 0 && (
                <TouchableOpacity style={{ alignSelf: 'center', marginTop: 4 }} onPress={() => { setTimer(60); startOtp(); }}>
                  <Text style={[styles.linkText, { fontSize: 14, fontWeight: '700' }]}>Resend OTP</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.changeBtn} onPress={() => setStep('phone')}>
                <Text style={styles.changeBtnText}>Change Number / Email</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </GradientScreen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  flex: { flex: 1 },

  splashWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashLogo: { width: 220, height: 110 },
  logoGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(228,173,13,0.10)' },

  ambientRing: { position: 'absolute', top: -120, right: -120, width: 320, height: 320, borderRadius: 160, alignItems: 'center', justifyContent: 'center' },
  ambientRingInner: {
    width: 320, height: 320, borderRadius: 160,
    borderWidth: 1, borderColor: 'rgba(228,173,13,0.16)',
    backgroundColor: 'rgba(228,173,13,0.05)',
  },

  brandArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  logoTile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 16,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20,
    elevation: 8,
  },
  logo: { width: 210, height: 96 },
  logoTileCompact: { paddingHorizontal: 14, paddingVertical: 8 },
  logoCompact: { width: 110, height: 50 },

  panel: {
    backgroundColor: colors.surfaceStrong,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingTop: 34,
    paddingHorizontal: 28,
  },
  panelTitle: { color: colors.text, fontSize: 25, fontWeight: '800' },
  panelSubtitle: { color: colors.textMuted, marginTop: 5, fontSize: 14 },
  divider: { height: 1, backgroundColor: colors.hairline, marginVertical: 22 },

  phoneField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  phonePrefix: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingRight: 12, marginRight: 10, borderRightWidth: 1, borderRightColor: colors.hairline },
  phonePrefixText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  phoneInputInner: { flex: 1, height: 52, color: colors.text, fontSize: 15 },

  ctaBtn: { marginTop: 16, borderRadius: radius.md, overflow: 'hidden' },
  ctaInner: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  ctaBtnText: { color: colors.onGold, fontSize: 16, fontWeight: '800', textAlign: 'center' },

  otpBoxesRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 24, gap: 8 },
  otpBox: {
    flex: 1, height: 54,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.surfaceBorder,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxText: { fontSize: 20, fontWeight: '700', color: colors.text },
  otpBoxFilled: { borderColor: colors.goldSoftBorder, backgroundColor: colors.goldSoftBg },
  otpBoxActive: { borderColor: colors.goldText },
  otpHiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },

  linkText: { color: colors.goldText },
  errorText: { color: '#FF9B8A', textAlign: 'center', marginTop: 10 },
  footerText: { color: colors.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  smallNote: { color: colors.textMuted, textAlign: 'center', fontSize: 12.5, marginBottom: 16, marginTop: 12 },
  resendRow: { color: colors.textMuted, textAlign: 'center', fontSize: 12 },
  changeBtn: { borderWidth: 1, borderColor: colors.ctrlBorder, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center', marginTop: 22 },
  changeBtnText: { color: colors.text, fontSize: 15, fontWeight: '600' },
});
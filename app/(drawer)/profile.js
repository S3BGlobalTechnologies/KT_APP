import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import PersonalInfo from '@/app/profile/PersonalInfo';

import GradientScreen from '@/components/ui/GradientScreen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Snackbar from '@/components/ui/snackbar';
import WheelPickerModal from '@/components/ui/WheelPickerModal';
import { useTheme } from '@/contexts/ThemeContext';
import { normalizeLanguageCode, useLanguage } from '@/lib/i18n';
import { radius, spacing } from '@/lib/theme';
import { useMemo } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Profile() {
  const router = useRouter();
  const { t, setLanguage: setAppLanguage } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTab, setSelectedTab] = useState('personal');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [time, setTime] = useState('');
  const [gender, setGender] = useState('');
  const [language, setLanguage] = useState('English');
  const [location, setLocation] = useState('');
  const [zip, setZip] = useState('');
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [toast, setToast] = useState(null);

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const initialDobForPicker = (() => {
    try {
      if (dob && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dob)) {
        const [dStr, mStr, yStr] = dob.split('/');
        const mIdx = Math.max(0, Math.min(11, Number(mStr) - 1));
        return { day: String(dStr).padStart(2, '0'), month: monthNames[mIdx], year: yStr };
      }
    } catch {}
    return undefined;
  })();

  const { expoPushToken } = usePushNotifications();

  /* 🔐 AUTH + PREFILL */
  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem('AUTH_TOKEN');
      if (!token) { router.replace('/'); return; }
      try {
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/user-info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) return;
        const response = await res.json();
        const user = response?.data;
        if (!user) return;

        setName(user.fullName || '');
        setPhone(user.phone || '');
        setEmail(user.email || '');
        setGender(user.gender || '');
        const nextProfileLanguage = user.language || 'English';
        setLanguage(nextProfileLanguage);
        setAppLanguage(normalizeLanguageCode(nextProfileLanguage));

        if (user.day && user.month && user.year) {
          const d = String(user.day).padStart(2, '0');
          const m = String(user.month).padStart(2, '0');
          setDob(`${d}/${m}/${user.year}`);
        } else {
          setDob('');
        }

        const hour = Number(user.hour);
        const min = Number(user.min);
        if (!Number.isNaN(hour) && !Number.isNaN(min)) {
          setTime(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
        } else {
          setTime('');
        }

        const loc = [user.city, user.state, user.country].filter(Boolean).join(', ');
        setLocation(loc);

        await AsyncStorage.setItem('USER_PROFILE', JSON.stringify(user));
      } catch (e) {
        console.warn('Failed to fetch user info', e);
      }
    };
    init();
  }, []);

  const [showBackButton, setShowBackButton] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const profileStr = await AsyncStorage.getItem('USER_PROFILE');
          if (!active) return;
          if (!profileStr) { setShowBackButton(false); return; }
          const profile = JSON.parse(profileStr);
          const hasFullName =
            typeof profile?.fullName === 'string' && profile.fullName.trim().length > 0;
          setShowBackButton(hasFullName);
        } catch (e) {
          setShowBackButton(false);
        }
      })();
      return () => { active = false; };
    }, [])
  );

  useEffect(() => {
    if (!isFirstTimeUser) return;
    const onBackPress = () => true;
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [isFirstTimeUser]);

  /* 🚀 SUBMIT */
  const submitDetails = async () => {
    setValidationError('');
    if (!name.trim()) { setValidationError(t('pleaseEnterFullName')); return; }
    if (!dob?.trim()) { setValidationError(t('pleaseEnterDateOfBirth')); return; }
    if (!time?.trim()) { setValidationError(t('pleaseEnterTimeOfBirth')); return; }
    if (!location?.trim()) { setValidationError(t('pleaseSelectLocation')); return; }
    if (!gender?.trim()) { setValidationError(t('pleaseSelectGender')); return; }
    if (dob && !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dob)) { setValidationError(t('dobInvalid')); return; }
    if (time && !/^([01]?\d|2[0-3]):[0-5]\d$/.test(time)) { setValidationError(t('timeInvalid')); return; }

    const token = await AsyncStorage.getItem('AUTH_TOKEN');
    if (!token) {
      setToast({ message: t('sessionExpiredLoginAgain'), type: 'error' });
      router.replace('/');
      return;
    }

    let day = null, month = null, year = null;
    if (dob) {
      const parts = dob.split('/');
      day = String(parts[0]).padStart(2, '0');
      month = String(parts[1]).padStart(2, '0');
      year = String(parts[2]);
    }
    let hour = null, min = null, sec = '00';
    if (time) {
      const parts = time.split(':');
      hour = String(parts[0]).padStart(2, '0');
      min = String(parts[1]).padStart(2, '0');
    }

    let city = '', state = '', country = '';
    if (location.includes(',')) {
      const parts = location.split(',').map((p) => p.trim());
      city = parts[0] || '';
      state = parts[1] || '';
      country = parts[2] || '';
    } else {
      city = location;
    }

    const payload = {
      fullName: name, email, day, month, year, hour, min, sec, gender,
      city, state, country, userCreatedBy: 'app', language,
      expoPushTokens: expoPushToken ? [expoPushToken] : [],
    };

    setLoading(true);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', token: token },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Update failed');

      try {
        const serverUser = json?.data;
        if (serverUser && typeof serverUser === 'object') {
          await AsyncStorage.setItem('USER_PROFILE', JSON.stringify(serverUser));
        } else {
          const existingRaw = await AsyncStorage.getItem('USER_PROFILE');
          const existing = existingRaw ? JSON.parse(existingRaw) : {};
          await AsyncStorage.setItem('USER_PROFILE', JSON.stringify({ ...existing, ...payload }));
        }
      } catch (e) {
        console.warn('Failed to persist USER_PROFILE after update', e);
      }

      try {
        await AsyncStorage.setItem('FIRST_TIME_USER', 'false');
        setIsFirstTimeUser(false);
      } catch {}

      // t() never returns falsy — a missing key falls back to the key name — so
      // the old `t(<English sentence>) || t(<realKey>)` form always took the
      // first branch and showed that sentence verbatim, untranslated.
      setToast({ message: t('profileUpdatedSuccessfully'), type: 'success' });
      setTimeout(() => router.replace('/home'), 1200);
    } catch (err) {
      setToast({ message: err?.message || t('networkError'), type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleBack = () => router.back();

  return (
    <GradientScreen>
      <ScreenHeader title={t('myProfile')} showBack={showBackButton} onBack={handleBack} />

      {/* Profile identity card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar} accessible accessibilityLabel="User avatar">
          <Ionicons name="person" size={26} color={colors.gold} />
        </View>
        <Text style={styles.profileTitle}>{name || t('profile')}</Text>
        {phone ? <Text style={styles.profilePhone}>{phone}</Text> : null}
        <View style={styles.profileTabs}>
          <TouchableOpacity onPress={() => setSelectedTab('personal')}>
            <View style={[styles.tabWrap, selectedTab === 'personal' && styles.tabWrapActive]}>
              <Text style={selectedTab === 'personal' ? styles.tabActive : styles.tab}>
                {t('personalInfo')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 34 : 0}
      >
        <ScrollView
          style={styles.tabContent}
          contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 120 : 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {selectedTab === 'personal' ? (
            <PersonalInfo
              name={name} setName={setName}
              phone={phone} setPhone={setPhone}
              email={email} setEmail={setEmail}
              dob={dob} setDob={setDob}
              time={time} setTime={setTime}
              gender={gender} setGender={setGender}
              language={language} setLanguage={setLanguage}
              location={location} setLocation={setLocation}
              zip={zip} setZip={setZip}
              validationError={validationError}
              loading={loading}
              submitDetails={submitDetails}
              setShowDatePicker={setShowDatePicker}
              setShowTimePicker={setShowTimePicker}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {toast && (
        <Snackbar message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <WheelPickerModal
        visible={showDatePicker}
        mode="date"
        initial={initialDobForPicker}
        onClose={() => setShowDatePicker(false)}
        onOk={(value) => {
          let day, month, year;
          if (Array.isArray(value)) { [day, month, year] = value; }
          else { ({ day, month, year } = value); }
          const d = String(Number(day)).padStart(2, '0');
          let mNum = Number(month);
          if (Number.isNaN(mNum)) {
            const map = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
            mNum = map[String(month).toLowerCase().slice(0, 3)];
          }
          const m = String(mNum).padStart(2, '0');
          setDob(`${d}/${m}/${year}`);
          setShowDatePicker(false);
        }}
      />

      <WheelPickerModal
        visible={showTimePicker}
        mode="time"
        initial={(() => {
          if (time && /^(\d{1,2}):(\d{1,2})$/.test(time)) {
            const [h, m] = time.split(':');
            let hNum = parseInt(h, 10);
            const ampm = hNum >= 12 ? 'PM' : 'AM';
            hNum = hNum % 12 || 12;
            return { hour: String(hNum).padStart(2, '0'), minute: m, ampm };
          }
          return undefined;
        })()}
        onClose={() => setShowTimePicker(false)}
        onOk={(value) => {
          let hour, minute, ampm;
          if (Array.isArray(value)) { [hour, minute, ampm] = value; }
          else { hour = value.hour; minute = value.minute; ampm = value.ampm; }
          if (
            hour === undefined || hour === null || hour === '' ||
            minute === undefined || minute === null || minute === '' ||
            ampm === undefined || ampm === null || ampm === ''
          ) {
            setTime('');
          } else {
            let hNum = parseInt(hour, 10);
            if (Number.isNaN(hNum)) hNum = 0;
            const isPM = String(ampm).toUpperCase() === 'PM';
            const isAM = String(ampm).toUpperCase() === 'AM';
            if (isPM && hNum !== 12) hNum += 12;
            if (isAM && hNum === 12) hNum = 0;
            const mNum = parseInt(minute, 10);
            setTime(`${String(hNum).padStart(2, '0')}:${String(Number.isNaN(mNum) ? 0 : mNum).padStart(2, '0')}`);
          }
          setShowTimePicker(false);
        }}
      />
    </GradientScreen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  profileCard: {
    marginHorizontal: spacing.gutter,
    marginTop: 26,
    marginBottom: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.lg,
    paddingTop: 34,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  avatar: {
    position: 'absolute',
    top: -28,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.avatarBg,
    borderWidth: 1.5, borderColor: colors.goldRing,
    alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center',
  },
  profileTitle: { textAlign: 'center', fontWeight: '800', color: colors.text, fontSize: 17 },
  profilePhone: { textAlign: 'center', color: colors.textMuted, marginTop: 3, fontSize: 13.5 },
  profileTabs: { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },
  tabWrap: { paddingBottom: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabWrapActive: { borderBottomColor: colors.gold },
  tabActive: { color: colors.goldText, fontWeight: '700' },
  tab: { color: colors.textMuted },

  formWrapper: { flex: 1 },
  tabContent: { flex: 1, marginTop: 10 },
});

import CityStateDropdown from '@/components/ui/CityStateDropdown';
import LanguageDropdown from '@/components/ui/LanguageDropdown';
import { useTheme } from '@/contexts/ThemeContext';
import { radius } from '@/lib/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useRef, useState } from 'react';
import {
  Keyboard, Modal, Platform, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { normalizeLanguageCode, useLanguage } from '../../lib/i18n';

export default function PersonalInfo({
  name, setName,
  phone, setPhone,
  email, setEmail,
  dob, setDob,
  time, setTime,
  gender, setGender,
  language, setLanguage,
  location, setLocation,

  loading,
  submitDetails,
  setShowDatePicker,
  setShowTimePicker,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const scrollRef = useRef(null);
  const nameInputRef = useRef(null);
  const dobInputRef = useRef(null);
  const [dobY, setDobY] = useState(0);
  const emailInputRef = useRef(null);
  const [emailY, setEmailY] = useState(0);
  const { t, setLanguage: setAppLanguage } = useLanguage();

  const [error, setError] = useState({ field: null, message: '' });
  const [showLocationModal, setShowLocationModal] = useState(false);

  /* -------- Sequential validation -------- */
  const validateSequential = () => {
    if (!name?.trim()) {
      setError({ field: 'name', message: t('nameRequired') });
      nameInputRef.current?.focus?.();
      if (scrollRef.current?.scrollToFocusedInput) {
        scrollRef.current.scrollToFocusedInput(nameInputRef.current, 120);
      } else {
        scrollRef.current?.scrollToPosition?.(0, 120, true);
      }
      return false;
    }

   

    const trimmedEmail = (email || '').trim();
    if (trimmedEmail && !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError({ field: 'email', message: 'Please enter a valid email' });
      emailInputRef.current?.focus?.();
      if (scrollRef.current?.scrollToFocusedInput) {
        scrollRef.current.scrollToFocusedInput(emailInputRef.current, 120);
      } else {
        const y = Math.max(0, emailY - 120);
        scrollRef.current?.scrollToPosition?.(0, y, true);
      }
      return false;
    }

    if (!dob) {
      setError({ field: 'dob', message: t('dobRequired') });
      if (scrollRef.current?.scrollToFocusedInput) {
        scrollRef.current.scrollToFocusedInput(dobInputRef.current, 120);
      } else {
        const y = Math.max(0, dobY - 120);
        scrollRef.current?.scrollToPosition?.(0, y, true);
      }
      return false;
    } 
    {
      const s = String(dob).trim();
      const m1 = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
      const m2 = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
      let d, mo, y;
      if (m1) {
        d = Number(m1[1]);
        mo = Number(m1[2]);
        y = Number(m1[3]);
      } else if (m2) {
        y = Number(m2[1]);
        mo = Number(m2[2]);
        d = Number(m2[3]);
      } else {
        setError({ field: 'dob', message: t('dobInvalid') || 'DOB must be DD/MM/YYYY' });
        if (scrollRef.current?.scrollToFocusedInput) {
          scrollRef.current.scrollToFocusedInput(dobInputRef.current, 120);
        } else {
          const yPos = Math.max(0, dobY - 120);
          scrollRef.current?.scrollToPosition?.(0, yPos, true);
        }
        return false;
      }
      const dt = new Date(y, mo - 1, d);
      if (
        dt.getFullYear() !== y ||
        dt.getMonth() !== mo - 1 ||
        dt.getDate() !== d
      ) {
        setError({ field: 'dob', message: t('dobInvalid') || 'DOB must be DD/MM/YYYY' });
        if (scrollRef.current?.scrollToFocusedInput) {
          scrollRef.current.scrollToFocusedInput(dobInputRef.current, 120);
        } else {
          const yy = Math.max(0, dobY - 120);
          scrollRef.current?.scrollToPosition?.(0, yy, true);
        }
        return false;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dt > today) {
        setError({ field: 'dob', message: "The date of birth cannot be later than today's date." });
        if (scrollRef.current?.scrollToFocusedInput) {
          scrollRef.current.scrollToFocusedInput(dobInputRef.current, 120);
        } else {
          const yy = Math.max(0, dobY - 120);
          scrollRef.current?.scrollToPosition?.(0, yy, true);
        }
        return false;
      }
    }

    if (!time) {
      setError({ field: 'time', message: t('timeRequired') });
      return false;
    }

    if (!gender) {
      setError({ field: 'gender', message: t('genderRequired') });
      return false;
    }

    if (!language) {
      setError({ field: 'language', message: t('languageRequired') });
      return false;
    }

    if (!location) {
      setError({ field: 'location', message: t('locationRequired') });
      return false;
    }

    setError({ field: null, message: '' });
    return true;
  };

  const onSubmit = () => {
    if (!validateSequential()) return;
    submitDetails();
  };

  

  return (
    <KeyboardAwareScrollView
      ref={scrollRef}
      enableOnAndroid
      enableAutomaticScroll={Platform.OS !== 'ios'}
      extraScrollHeight={Platform.OS === 'ios' ? 24 : 100}
      extraHeight={Platform.OS === 'ios' ? 120 : 0}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.container,
        { paddingBottom: Platform.OS === 'ios' ? 120 : 16 },
      ]}
    >
      {/* Name */}
      <Text style={styles.inputLabel}>
        {t('name')} <Text style={styles.asterisk}>*</Text>
      </Text>
      <TextInput
        ref={nameInputRef}
        value={name}
        onChangeText={(v) => {
          setName(v);
          if (error.field === 'name' && v.trim()) {
            setError({ field: null, message: '' });
          }
        }}
        style={[styles.detailsInput, styles.nameInput]}
        placeholder={t('enterYourName')}
        placeholderTextColor="#9CA3AF"
      />
      {error.field === 'name' && (
        <Text style={styles.error}>{error.message}</Text>
      )}

      {/* Phone */}
      <Text style={styles.inputLabel}>
        {t('phone')} <Text style={styles.asterisk}>*</Text>
      </Text>
      <TextInput
        value={phone}
        onChangeText={(v) => {
          setPhone(v);
          if (error.field === 'phone' && v.trim()) {
            setError({ field: null, message: '' });
          }
        }}
        keyboardType="phone-pad"
        style={styles.detailsInput}
        placeholder={t('enterPhoneNumber')}
        placeholderTextColor="#9CA3AF"
        readOnly
        
      />
      {error.field === 'phone' && (
        <Text style={styles.error}>{error.message}</Text>
      )}

      {/* Email */}
      <Text style={styles.inputLabel}>{t('email')}</Text>
      <TextInput
        ref={emailInputRef}
        value={email}
        onLayout={(e) => {
          const y = e?.nativeEvent?.layout?.y || 0;
          setEmailY(y);
        }}
        onChangeText={(v) => {
          setEmail(v);
          if (error.field === 'email') {
            const trimmed = v.trim();
            if (!trimmed || /^\S+@\S+\.\S+$/.test(trimmed)) {
              setError({ field: null, message: '' });
            }
          }
        }}
        keyboardType="email-address"
        style={styles.detailsInput}
        placeholder={t('enterEmail')}
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
      />
      {error.field === 'email' && (
        <Text style={styles.error}>{error.message}</Text>
      )}
     
      {/* DOB */}
      <Text style={styles.inputLabel}>
        {t('dateOfBirth')} <Text style={styles.asterisk}>*</Text>
      </Text>
      <TouchableOpacity
        onLayout={(e) => {
          const y = e?.nativeEvent?.layout?.y || 0;
          setDobY(y);
        }}
        onPress={() => {
          setShowDatePicker(true);
          if (error.field === 'dob') {
            setError({ field: null, message: '' });
          }
        }}
      >
        <View style={styles.inputRow}>
          <TextInput
            ref={dobInputRef}
            value={dob}
            placeholder={t('ddmmyyyy')}
            placeholderTextColor="#9CA3AF"
            editable={false}
            style={styles.inputRowTextInput}
          />
          <Ionicons name="calendar-outline" size={20} color="#6B7280" />
        </View>
      </TouchableOpacity>
      {error.field === 'dob' && (
        <Text style={styles.error}>{error.message}</Text>
      )}

      {/* Time */}
      <Text style={styles.inputLabel}>
        {t('timeOfBirth')} <Text style={styles.asterisk}>*</Text>
      </Text>
      <TouchableOpacity
        onPress={() => {
          setShowTimePicker(true);
          if (error.field === 'time') {
            setError({ field: null, message: '' });
          }
        }}
      >
        <View style={styles.inputRow}>
          <TextInput
            value={time}
            placeholder="HH : MM"
            placeholderTextColor="#9CA3AF"
            editable={false}
            style={styles.inputRowTextInput}
          />
          <Ionicons name="time-outline" size={20} color="#6B7280" />
        </View>
      </TouchableOpacity>
      {error.field === 'time' && (
        <Text style={styles.error}>{error.message}</Text>
      )}

      {/* Language */}
      <Text style={styles.inputLabel}>
        {t('language')} <Text style={styles.asterisk}>*</Text>
      </Text>
      <LanguageDropdown
        value={language}
        onChange={(v) => {
          setLanguage(v);
          setAppLanguage(normalizeLanguageCode(v));
          if (error.field === 'language') {
            setError({ field: null, message: '' });
          }
        }}
      />
      {error.field === 'language' && (
        <Text style={styles.error}>{error.message}</Text>
      )}

      {/* Gender */}
      <Text style={styles.inputLabel}>
        {t('gender')} <Text style={styles.asterisk}>*</Text>
      </Text>
      <View style={styles.genderRow}>
        {['male', 'female'].map((g) => (
          <TouchableOpacity
            key={g}
            style={[
              styles.genderPill,
              gender === g && styles.genderPillActive,
            ]}
            onPress={() => {
              setGender(g);
              if (error.field === 'gender') {
                setError({ field: null, message: '' });
              }
            }}
          >
            <Text
              style={[
                styles.genderText,
                gender === g && styles.genderTextActive,
              ]}
            >
              {t(g)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error.field === 'gender' && (
        <Text style={styles.error}>{error.message}</Text>
      )}

      {/* Location */}
      <Text style={styles.inputLabel}>
        {t('location')} <Text style={styles.asterisk}>*</Text>
      </Text>
      <TouchableOpacity
        onPress={() => {
          Keyboard.dismiss();
          setShowLocationModal(true);
        }}
      >
        <View style={styles.inputRow}>
          <TextInput
            value={location}
            placeholder={t('pleaseSelectLocation')}
            placeholderTextColor="#9CA3AF"
            editable={false}
            style={styles.inputRowTextInput}
          />
          <Ionicons name="location-outline" size={20} color="#6B7280" />
        </View>
      </TouchableOpacity>
      {error.field === 'location' && (
        <Text style={styles.error}>{error.message}</Text>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.ctaBtn, loading && styles.ctaDisabled]}
        onPress={onSubmit}
        disabled={loading}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={colors.goldGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaInner}
        >
          <Text style={styles.ctaBtnText}>
            {loading ? t('updating') : t('submit')}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Location Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLocationModal(false)}
        >
         
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalCard}
          >
                 <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('pleaseSelectLocation')}</Text>
              </View>
              <View style={styles.modalContent}>
            <CityStateDropdown
              city=""
              state=""
              
              onChange={(val) => {
                if (!val) return;
                setLocation(
                  `${val.city || ''}, ${val.state || ''}, ${val.country || ''}`
                );
                if (error.field === 'location') {
                  setError({ field: null, message: '' });
                }
                setShowLocationModal(false);
              }}
            />
              </View> 
          </TouchableOpacity>
     
        </TouchableOpacity>
      </Modal>
    </KeyboardAwareScrollView>
  );
}


/* ---------------- Styles ---------------- */

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: 'transparent',
  },

  inputLabel: {
    marginTop: 14,
    marginBottom: 6,
    color: colors.textMuted,
    fontWeight: '600',
  },
  asterisk: {
    color: colors.goldText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCard: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: colors.elevated,
    borderRadius: 16,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  modalClose: {
    fontSize: 20,
    color: colors.textMuted,
  },

  detailsInput: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.sm,
    padding: 14,
    fontSize: 14,
    backgroundColor: colors.surface,
    color: colors.text,
  },

  nameInput: {
    textTransform: 'capitalize',
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    minHeight: 48,
  },

  inputRowTextInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.text,
  },

  dropdownWrapper: {
    marginTop: 4,
    zIndex: 10,
  },

  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  genderPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },

  genderPillActive: {
    backgroundColor: colors.goldSoftBg,
    borderColor: colors.goldSoftBorder,
  },

  genderText: {
    color: colors.textMuted,
    fontWeight: '600',
  },

  genderTextActive: {
    color: colors.goldText,
  },

  ctaBtn: {
    borderRadius: radius.md,
    marginTop: 32,
    overflow: 'hidden',
  },
  ctaInner: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ctaDisabled: {
    opacity: 0.6,
  },

  ctaBtnText: {
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 16,
    color: colors.onGold,
  },

  error: {
    color: '#FF9B8A',
    marginTop: 12,
    fontWeight: '600',
  },
  // Add styles for app language pills
  appLangRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  appLangPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  appLangPillActive: {
    borderColor: '#4a90e2',
    backgroundColor: '#e8f2ff',
  },
  appLangText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  appLangTextActive: {
    color: '#1a73e8',
  },
});

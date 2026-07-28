import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/lib/i18n';
import { radius } from '@/lib/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

const POST_EXIT_FEEDBACK_URL =
  `${process.env.EXPO_PUBLIC_API_BASE_URL}/kundlikonnect/post-exit-feedback`;

export default function CustomDrawerContent({ navigation, state }) {

const [user, setUser] = useState(null);
const [deleting, setDeleting] = useState(false);
const [confirmVisible, setConfirmVisible] = useState(false);
const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
const [feedbackDropdownOpen, setFeedbackDropdownOpen] = useState(false);
const [selectedDeleteFeedback, setSelectedDeleteFeedback] = useState('deleteReasonInaccurate');
const [customDeleteFeedback, setCustomDeleteFeedback] = useState('');
 const drawerUser =
  state?.routes?.[state.index]?.params?.drawerUser;

const clearUserSessionData = async () => {
  await AsyncStorage.multiRemove([
    'AUTH_TOKEN',
    'USER_PROFILE',
    'APP_LANGUAGE',
    'Restore_free_chat',
    'FIRST_TIME_USER',
    'FREE_QUESTION_NOTICE_ELIGIBLE',
    'FREE_CHAT_ACTIVE',
    'CHAT_START_TIME',
    'CHAT_DURATION',
    'CHAT_TYPE',
    'ORDER_DATA',
    'FREE_CHAT_GRANTED',
    'CHAT_SESSION_ID',
    'CHAT_REMAINING_SECONDS',
    'paymentStatus',
  ]);
};

// const loadUser = useCallback(async () => {
//   try {
//     const raw = await AsyncStorage.getItem('USER_PROFILE');
//     if (raw) {
//       setUser(JSON.parse(raw));
//       return;
//     }
//     // Fallback: fetch user-info if profile not cached yet
//     const token = await AsyncStorage.getItem('AUTH_TOKEN');
//     const base = process.env.EXPO_PUBLIC_API_BASE_URL;
//     if (token && base) {
//       const res = await fetch(`${base}/user-info`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ token }),
//       });
//       if (res.ok) {
//         const json = await res.json();
//         const fetchedUser = json?.data;
//         if (fetchedUser) {
//           setUser(fetchedUser);
//           await AsyncStorage.setItem('USER_PROFILE', JSON.stringify(fetchedUser));
//         }
//       }
//     }
//   } catch (e) {
//     console.log('USER_PROFILE error', e);
//   }
// }, []);

const loadUser = useCallback(async () => {
  try {
    // 1️⃣ Load cached data FIRST (fast UI)
    const raw = await AsyncStorage.getItem('USER_PROFILE');
    if (raw) {
      setUser(JSON.parse(raw));
    }

    // 2️⃣ ALWAYS refresh from API
    const token = await AsyncStorage.getItem('AUTH_TOKEN');
    const base = process.env.EXPO_PUBLIC_API_BASE_URL;

    if (token && base) {
      const res = await fetch(`${base}/user-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        const json = await res.json();
        const fetchedUser = json?.data;

        if (fetchedUser?.fullName) {
          const normalizedUser = {
            ...fetchedUser,
            fullName: fetchedUser.fullName.trim(),
          };

          setUser(normalizedUser); // 🔥 immediate UI update
          await AsyncStorage.setItem(
            'USER_PROFILE',
            JSON.stringify(normalizedUser)
          );
        }
      }
    }
  } catch (e) {
    console.log('USER_PROFILE error', e);
  }
}, []);


useFocusEffect(
  useCallback(() => {
    loadUser();
  }, [loadUser])
);






  const router = useRouter();
  const [toast, setToast] = useState(null);
  const { t } = useLanguage();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const DrawerItem = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <MaterialIcons name={icon} size={22} color={colors.gold} style={styles.itemIcon} />
      <Text style={styles.itemText}>{label}</Text>
    </TouchableOpacity>
  );

  const deleteFeedbackOptions = useMemo(
    () => [
      'deleteReasonInaccurate',
      'deleteReasonExpensive',
      'deleteReasonBuggy',
      'deleteReasonPrivacy',
      'otherLabel',
    ],
    []
  );

  const signOutHandler = async () => {
    try {
      await clearUserSessionData();

      setToast({ message: t('logoutSuccess'), type: 'success' });

      
        router.replace('/'); // redirect to root page
    
    } catch (err) {
      setToast({ message: t('logoutFailed'), type: 'error' });
      setTimeout(() => setToast(null), 2000);
    }
  };

 const { width, height } = useWindowDimensions();
   const is1280x800 = width >= 1280 && height >= 800;
  const horizontalPadding = is1280x800 ? 40 : 12;



  const deleteAccountHandler = async () => {
    try {
      setDeleting(true);
      const token = await AsyncStorage.getItem('AUTH_TOKEN');
      const base = process.env.EXPO_PUBLIC_API_BASE_URL;
      if (!token) {
        setToast({ message: t('logoutFailed'), type: 'error' });
        setTimeout(() => setToast(null), 2000);
        return;
      }
      if (!base) {
        setToast({ message: t('logoutFailed'), type: 'error' });
        setTimeout(() => setToast(null), 2000);
        return;
      }

      try {
        const finalFeedback = customDeleteFeedback.trim() || t(selectedDeleteFeedback);
        await fetch(POST_EXIT_FEEDBACK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token: token,
          },
          body: JSON.stringify({
            response: finalFeedback,
          }),
        });
      } catch (feedbackError) {
        console.log('post-exit-feedback error', feedbackError);
      }

      const res = await fetch(`${base}/delete-user`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          token,
        },
      });

      if (res.ok) {
        await clearUserSessionData();
        setCustomDeleteFeedback('');
        setSelectedDeleteFeedback('deleteReasonInaccurate');
        router.replace('/');
      } else {
        setToast({ message: t('logoutFailed'), type: 'error' });
        setTimeout(() => setToast(null), 2000);
      }
    } catch (e) {
      setToast({ message: t('logoutFailed'), type: 'error' });
      setTimeout(() => setToast(null), 2000);
    } finally {
      setDeleting(false);
    }
  };
  const handleDelete = () => {
    setFeedbackDropdownOpen(false);
    setConfirmVisible(false);
    deleteAccountHandler();
  };


  
  return (
    <DrawerContentScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: 15, paddingBottom: 15, paddingHorizontal: horizontalPadding, backgroundColor: colors.bg }}
    >
      {/* HEADER */}
      <View style={styles.header}>
        {/* User Avatar and Edit */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.avatarCircle}>
            <MaterialIcons name="person" size={30} color={colors.gold} />
          </View>
          <View style={{ display: 'flex', flexDirection: 'column', textTransform: 'capitalize' }}>
            <Text style={styles.name}>{drawerUser?.fullName || 'User'}</Text>
            <Text style={styles.phone}>{drawerUser?.phone || 'Phone'}</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('profile')}
          >
            <MaterialIcons name="edit" size={18} color={colors.gold} />
          </TouchableOpacity>
        </View>
        {/* Name */}


        {/* Phone */}

      </View>


      {/* MENU */}
      <View style={styles.menu}>
        <DrawerItem icon="home" label={t('home')} onPress={() => navigation.navigate('home')} />
        <DrawerItem icon="chat" label={t('mySessions')} onPress={() => navigation.navigate('chat-history')} />
        <DrawerItem icon="account-balance-wallet" label={t('walletTransactions')} onPress={() => navigation.navigate('payment-transaction')} />
        {/* <DrawerItem icon="event" label={t('myAppointment')} onPress={() => setToast({ message: t('comingSoon'), type: 'info' })} /> */}
        <DrawerItem icon="support-agent" label={t('helpSupport')} onPress={() => navigation.navigate('HelpSupport')} />
        <DrawerItem icon="rate-review" label={t('shareFeedback')} onPress={() => navigation.navigate('ShareFeedback')} />
        <DrawerItem icon="info" label={t('aboutUs')} onPress={() => navigation.navigate('AboutUs')} />
        <DrawerItem icon="help-outline" label={t('faq')} onPress={() => navigation.navigate('FAQ')} />
        <DrawerItem icon="description" label={t('termsConditions')} onPress={() => navigation.navigate('TermsConditions')} />
        <DrawerItem icon="privacy-tip" label={t('privacyPolicy')} onPress={() => navigation.navigate('PrivacyPolicy')} />
        {/* <DrawerItem icon="share" label={t('share')} onPress={() => setToast({ message: t('comingSoon'), type: 'info' })} /> */}
        <DrawerItem icon="policy" label={t('refundCancelationPolicy')} onPress={() => navigation.navigate('refund&cancelation-policy')} />
        <DrawerItem icon="cookie" label={t('cookiesPolicy')} onPress={() => navigation.navigate('cookies-policy')} />

        {/* THEME TOGGLE */}
        <TouchableOpacity
          style={styles.item}
          onPress={toggleTheme}
          activeOpacity={0.7}
          accessibilityRole="switch"
          accessibilityState={{ checked: !isDark }}
        >
          <MaterialIcons
            name={isDark ? 'dark-mode' : 'light-mode'}
            size={22}
            color={colors.gold}
            style={styles.itemIcon}
          />
          <Text style={styles.itemText}>{isDark ? t('darkMode') : t('lightMode')}</Text>
          <View style={[styles.themeSwitch, !isDark && styles.themeSwitchOn]}>
            <View style={[styles.themeKnob, !isDark && styles.themeKnobOn]} />
          </View>
        </TouchableOpacity>

      </View>

      {/* LOGOUT */}
      <TouchableOpacity
  style={styles.logoutBtn}
  onPress={() => setLogoutConfirmVisible(true)}
>
        <MaterialIcons name="logout" size={20} color={colors.danger} />
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
  style={styles.deleteBtn}
 onPress={() => setConfirmVisible(true)}
>
  <MaterialIcons name="delete-outline" size={20} color={colors.textMuted} />
  <Text  style={styles.deleteText}>{t('deleteAccount')}</Text>
</TouchableOpacity>

    


      <Text style={styles.version}>{t('appVersion')} 1.0.0</Text>
      <Modal
  visible={logoutConfirmVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setLogoutConfirmVisible(false)}
>
  <View style={styles.modalBackdrop}>
    <View style={styles.modalCard}>
      <Text style={styles.modalTitle}>{t('confirmTitle')}</Text>
      <Text style={styles.modalDesc}>
{t('logoutConfirmDesc')}</Text>

      <View style={styles.modalActions}>
        <TouchableOpacity
          style={[styles.modalBtn, styles.modalCancel]}
          onPress={() => setLogoutConfirmVisible(false)}
        >
          <Text style={styles.modalCancelText}>{t('noLabel')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modalBtn, styles.modalConfirm]}
          onPress={() => {
            setLogoutConfirmVisible(false);
            signOutHandler();
          }}
        >
          <Text style={styles.modalConfirmText}>{t('yesLabel')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalKeyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 32 : 0}
        >
          <View style={styles.modalBackdrop}>
            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>{t('confirmTitle')}</Text>
                <Text style={styles.modalDesc}>{t('deleteAccountConfirmDesc')}</Text>
                <Text style={styles.inputLabel}>{t('deleteReasonLabel')}</Text>
                <TouchableOpacity
                  style={styles.selectBox}
                  activeOpacity={0.8}
                  onPress={() => setFeedbackDropdownOpen((prev) => !prev)}
                >
                  <Text style={styles.selectBoxText}>{t(selectedDeleteFeedback)}</Text>
                  <MaterialIcons
                    name={feedbackDropdownOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={20}
                    color={colors.textSubtle}
                  />
                </TouchableOpacity>
                {feedbackDropdownOpen ? (
                  <View style={styles.dropdownMenu}>
                    {deleteFeedbackOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedDeleteFeedback(option);
                          setFeedbackDropdownOpen(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{t(option)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
                <TextInput
                  style={styles.feedbackInput}
                  value={customDeleteFeedback}
                  onChangeText={setCustomDeleteFeedback}
                  placeholder={t('feedbackPlaceholder')}
                  placeholderTextColor={colors.textSubtle}
                  
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={() => setConfirmVisible(false)}>
                    <Text style={styles.modalCancelText}>{t('noLabel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, styles.modalConfirm]} onPress={handleDelete} disabled={deleting}>
                    <Text style={styles.modalConfirmText}>{t('yesLabel')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </DrawerContentScrollView>
  );
}

/* ================= STYLES ================= */

const makeStyles = (colors) => StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginTop: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
  },
  editBtn: {
    position: 'absolute',
    right: 12,
    top: 8,
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.goldSoftBorder,
    backgroundColor: colors.goldSoftBg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 17,
    color: colors.text,
    marginLeft: 10,
    textTransform: 'capitalize',
  },
  toastWrapper: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
  },
  phone: {
    color: colors.textMuted,
    fontSize: 13.5,
    marginLeft: 10,
    marginTop: 2,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: colors.goldRing,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: radius.sm,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  deleteText: {
    color: colors.textMuted,
    fontSize: 16,
    marginLeft: 8,
  },
  menu: {
    flex: 1,
    paddingVertical: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
  },
  itemIcon: {
    marginRight: 16,
  },
  itemText: {
    fontSize: 15.5,
    color: colors.text,
    fontWeight: '500',
  },
  themeSwitch: {
    marginLeft: 'auto',
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 3,
    backgroundColor: colors.ctrlBg,
    borderWidth: 1,
    borderColor: colors.ctrlBorder,
    justifyContent: 'center',
  },
  themeSwitchOn: {
    backgroundColor: colors.goldSoftBg,
    borderColor: colors.goldSoftBorder,
  },
  themeKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.textMuted,
  },
  themeKnobOn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.gold,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 14,
    marginTop: 6,
    borderRadius: radius.sm,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.45)',
    backgroundColor: 'rgba(255,107,107,0.08)',
  },
  logoutText: {
    color: colors.danger,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  version: {
    textAlign: 'center',
    color: colors.textSubtle,
    fontSize: 12,
    marginBottom: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalKeyboardAvoiding: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  modalCard: {
    width: '80%',
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.md,
    padding: 18,
    marginHorizontal: 32,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputLabel: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  selectBox: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    width: '100%',
  },
  selectBoxText: {
    color: colors.text,
    fontSize: 14,
  },
  dropdownMenu: {
    borderWidth: 1,
    width: '100%',
    borderColor: colors.surfaceBorder,
    borderRadius: radius.sm,
    marginBottom: 10,
    overflow: 'hidden',
    backgroundColor: colors.sunken,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  dropdownItemText: {
    color: colors.textMuted,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.sm,
    marginLeft: 12,
  },
  modalCancel: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  modalConfirm: {
    backgroundColor: colors.primarySolid,
  },
  modalCancelText: {
    color: colors.text,
    fontWeight: '600',
  },
  modalConfirmText: {
    color: colors.onPrimary,
    fontWeight: '800',
  },
});

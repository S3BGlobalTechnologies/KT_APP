import { Fonts } from '@/constants/theme';
import { ChatTimerProvider } from "@/contexts/chatTimerContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { registerForPushNotificationsAsync } from '@/hooks/usePushNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from "expo-notifications";
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useRef } from 'react';
import { Alert, Linking, Platform, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import IAPProvider from "../components/ui/IAPProvider";



const DISMISSED_UPDATE_KEY = 'dismissed_remote_update_build';
const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.kundlitime.kundliapp';
const REMOTE_CONFIG_DEFAULTS = {
  android_latest_build: '0',
  android_min_build: '0',
  android_store_url: ANDROID_STORE_URL,
  update_message: 'A new update is available. Please update the app.',
};
const APP_VARIANT = process.env.EXPO_PUBLIC_APP_VARIANT ?? 'development';
const SHOULD_CHECK_STORE_UPDATES = APP_VARIANT === 'production';

export default function RootLayout() {
  const checkedRef = useRef(false);

  if (Platform.OS === 'web') {
    Text.defaultProps = {
      ...(Text.defaultProps || {}),
      style: [{ fontFamily: Fonts.roboto }, Text.defaultProps?.style].filter(Boolean),
    };
  }

// ✅ GLOBAL STORE UPDATE CHECK
 
  useEffect(() => {
    if (
      checkedRef.current ||
      Platform.OS !== 'android' ||
      !SHOULD_CHECK_STORE_UPDATES
    ) {
      if (Platform.OS === 'android' && !SHOULD_CHECK_STORE_UPDATES) {
        console.log('SKIPPING_STORE_UPDATE_CHECK_FOR_VARIANT:', APP_VARIANT);
      }
      return;
    }
    checkedRef.current = true;

    const checkRemoteConfigUpdate = async () => {
      try {
        const [{ default: remoteConfig }, Application] = await Promise.all([
          import('@react-native-firebase/remote-config'),
          import('expo-application'),
        ]);

        const config = remoteConfig();
        await config.setConfigSettings({
          minimumFetchIntervalMillis: __DEV__ ? 0 : 60 * 60 * 1000,
        });
        await config.setDefaults(REMOTE_CONFIG_DEFAULTS);
        await config.fetchAndActivate();

        const currentBuild = Number(Application.nativeBuildVersion || 0);
        const latestBuild = Number(
          config.getValue('android_latest_build').asString() || 0
        );
        const minBuild = Number(
          config.getValue('android_min_build').asString() || 0
        );
        const storeUrl =
          config.getValue('android_store_url').asString() || ANDROID_STORE_URL;
        const updateMessage =
          config.getValue('update_message').asString() ||
          REMOTE_CONFIG_DEFAULTS.update_message;
        const dismissedBuild = await AsyncStorage.getItem(DISMISSED_UPDATE_KEY);

        console.log('REMOTE_UPDATE_CHECK:', {
          currentBuild,
          latestBuild,
          minBuild,
          storeUrl,
          dismissedBuild,
        });

        if (!currentBuild || !latestBuild || currentBuild >= latestBuild) {
          return;
        }

        const isForceUpdate = minBuild > 0 && currentBuild < minBuild;

        if (!isForceUpdate && dismissedBuild === String(latestBuild)) {
          console.log('SKIPPING_DISMISSED_REMOTE_UPDATE:', latestBuild);
          return;
        }

        console.log('SHOWING_REMOTE_UPDATE_POPUP:', {
          currentBuild,
          latestBuild,
          minBuild,
          isForceUpdate,
        });

        Alert.alert(
          'Update App',
          updateMessage,
          isForceUpdate
            ? [
                {
                  text: 'Update',
                  onPress: () => Linking.openURL(storeUrl),
                },
              ]
            : [
                {
                  text: 'Later',
                  style: 'cancel',
                  onPress: async () => {
                    await AsyncStorage.setItem(
                      DISMISSED_UPDATE_KEY,
                      String(latestBuild)
                    );
                    console.log(
                      'SAVED_DISMISSED_REMOTE_UPDATE:',
                      latestBuild
                    );
                  },
                },
                {
                  text: 'Update',
                  onPress: () => Linking.openURL(storeUrl),
                },
              ],
          { cancelable: !isForceUpdate }
        );
      } catch (e) {
        console.log('REMOTE_CONFIG_UPDATE_CHECK_FAILED:', e);
      }
    };

    checkRemoteConfigUpdate();
  }, []);


// 🔔 GLOBAL NOTIFICATION HANDLER

   useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }
  }, []);

 useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(notification => {
      console.log("📩 Notification received in foreground:", notification);
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        console.log('Expo push token:', token);
      }
    })();
    const receivedSub = Notifications.addNotificationReceivedListener(notification => {
      console.log("📩 Notification received in foreground:", notification);
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('🖱️ Notification tapped:', response);
    });
    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

// 🔔 GLOBAL FACEBOOK TRACKING HANDLER 

 useEffect(() => {
  (async () => {
    try {
      const { Settings, AppEventsLogger } =
        await import('react-native-fbsdk-next');

      Settings.initializeSDK();

      // iOS permission
      if (Platform.OS === 'ios') {
        const { requestTrackingPermissionsAsync } =
          await import('expo-tracking-transparency');

        const { status } = await requestTrackingPermissionsAsync();

        if (typeof Settings.setAdvertiserTrackingEnabled === 'function') {
          await Settings.setAdvertiserTrackingEnabled(status === 'granted');
        }
      }

      // ✅ Track app open (for BOTH Android & iOS)
      AppEventsLogger.logEvent('fb_mobile_activate_app');

      console.log('✅ Meta tracking working');

    } catch (e) {
      console.log('❌ Meta tracking error:', e);
    }
  })();
}, []);

 
   


  

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SafeAreaProvider>
          <ThemedShell />
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function ThemedShell() {
  const { colors, isDark } = useTheme();
  // Dark keeps its original blue safe-area chrome; light uses the cream page.
  const safeAreaBg = isDark ? '#073a8c' : colors.bg;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: safeAreaBg }} edges={['top', 'bottom']}>
      {Platform.OS === 'web' ? (
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link
            href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
            rel="stylesheet"
          />
        </Head>
      ) : null}
      <IAPProvider>
        <ChatTimerProvider>
          {/* No LanguageProvider here: one mounted at this level does not reach
              the screens, so it silently left every label showing its raw key
              name. Each consumer mounts its own — (drawer)/_layout.js for the
              drawer, app/onboarding.js for onboarding. */}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
          </Stack>
        </ChatTimerProvider>
      </IAPProvider>
    </SafeAreaView>
  );
}

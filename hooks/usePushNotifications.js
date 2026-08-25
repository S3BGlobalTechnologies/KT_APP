import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import Constants from "expo-constants";

// ✅ CONDITIONAL IMPORT
let Notifications;
try {
  Notifications = require("expo-notifications");
  
  // Agar available hai tab hi handler set kar
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (error) {
  console.log("⚠️ Notifications not available in this build");
  Notifications = null;
}

export async function registerForPushNotificationsAsync() {
  try {
    if (!Notifications) {
      console.log("⚠️ Notifications unavailable");
      return null;
    }

    if (!Device.isDevice) {
      console.log("❌ Must use a physical device");
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("❌ Notification permission denied");
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.log("❌ EAS Project ID not found");
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log("✅ Expo Push Token:", tokenResponse.data);
    return tokenResponse.data;
  } catch (error) {
    console.log("Push token unavailable:", error?.message || error);
    return null;
  }
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [lastNotification, setLastNotification] = useState(null);

  const receivedListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    if (!Notifications) return; // ✅ Early return agar unavailable

    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
    });

    receivedListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("📩 Foreground notification:", notification);
        setLastNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("🖱️ Notification tapped:", response);
      });

    return () => {
      receivedListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return {
    expoPushToken,
    lastNotification,
  };
}
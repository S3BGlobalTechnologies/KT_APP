// import { useEffect, useRef, useState } from "react";
// import { Platform } from "react-native";
// import * as Notifications from "expo-notifications";
// import * as Device from "expo-device";
// import Constants from "expo-constants";

// /**
//  * 🔔 GLOBAL NOTIFICATION HANDLER
//  * This decides whether notifications show while app is foregrounded
//  */
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: false,
//   }),
// });

// export async function registerForPushNotificationsAsync() {
//   try {
//     // ❌ Physical device required
//     if (!Device.isDevice) {
//       console.log("❌ Must use a physical device");
//       return null;
//     }

//     // ✅ ANDROID: channel MUST exist before push arrives
//     if (Platform.OS === "android") {
//       await Notifications.setNotificationChannelAsync("default", {
//         name: "Default",
//         importance: Notifications.AndroidImportance.MAX,
//         sound: "default",
//         vibrationPattern: [0, 250, 250, 250],
//         lockscreenVisibility:
//           Notifications.AndroidNotificationVisibility.PUBLIC,
//       });
//     }

//     // 🔐 Permissions
//     const { status: existingStatus } =
//       await Notifications.getPermissionsAsync();

//     let finalStatus = existingStatus;

//     if (existingStatus !== "granted") {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }

//     if (finalStatus !== "granted") {
//       console.log("❌ Notification permission denied");
//       return null;
//     }

//     // 🆔 Get EAS Project ID
//     const projectId =
//       Constants?.expoConfig?.extra?.eas?.projectId ??
//       Constants?.easConfig?.projectId;

//     if (!projectId) {
//       console.log("❌ EAS Project ID not found");
//       return null;
//     }

//     // 🎯 Get Expo Push Token
//     const tokenResponse = await Notifications.getExpoPushTokenAsync({
//       projectId,
//     });

//     console.log("✅ Expo Push Token:", tokenResponse.data);

//     return tokenResponse.data;
//   } catch (error) {
//     console.error("❌ Error getting push token:", error);
//     return null;
//   }
// }

// /**
//  * ✅ React Hook
//  */
// export function usePushNotifications() {
//   const [expoPushToken, setExpoPushToken] = useState(null);
//   const [lastNotification, setLastNotification] = useState(null);

//   const receivedListener = useRef(null);
//   const responseListener = useRef(null);

//   useEffect(() => {
//     // Get token
//     registerForPushNotificationsAsync().then(token => {
//       setExpoPushToken(token);
//     });

//     // App in foreground
//     receivedListener.current =
//       Notifications.addNotificationReceivedListener(notification => {
//         console.log("📩 Foreground notification:", notification);
//         setLastNotification(notification);
//       });

//     // User tapped notification
//     responseListener.current =
//       Notifications.addNotificationResponseReceivedListener(response => {
//         console.log("🖱️ Notification tapped:", response);
//       });

//     return () => {
//       receivedListener.current?.remove();
//       responseListener.current?.remove();
//     };
//   }, []);

//   return {
//     expoPushToken,
//     lastNotification,
//   };
// }

import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

/**
 * 🔔 GLOBAL NOTIFICATION HANDLER
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  try {
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
    // Non-fatal: push token can be unavailable (e.g. Firebase/FCM not configured
    // on this build). Log quietly so it never surfaces as a user-facing error banner.
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect } from "react";
import { AppState, Platform } from "react-native";

// ✅ CONDITIONAL IMPORT
let RNIap;
let useIAP, ErrorCode, finishTransaction, getAvailablePurchases;

try {
  const iap = require("react-native-iap");
  RNIap = iap;
  useIAP = iap.useIAP;
  ErrorCode = iap.ErrorCode;
  finishTransaction = iap.finishTransaction;
  getAvailablePurchases = iap.getAvailablePurchases;
} catch (e) {
  console.log("⚠️ react-native-iap not available in Expo Go");
  // Dummy exports
  useIAP = () => ({
    connected: false,
    products: [],
    subscriptions: [],
    getProducts: async () => [],
    requestPurchase: async () => null,
  });
  ErrorCode = {};
  finishTransaction = async () => null;
  getAvailablePurchases = async () => [];
}

const ORDER_DATA_KEY = "ORDER_DATA";
const PAYMENT_STATUS_KEY = "paymentStatus";
const ANDROID_CHAT_PRODUCT_ID = "kundli_29";
const IOS_CHAT_PRODUCT_ID = "com.kundlitime.kundliapp.5minchat";
const ANDROID_CREATE_ORDER_URL =
  `${process.env.EXPO_PUBLIC_API_BASE_URL}/create-order-google-billing-play`;
const ANDROID_VERIFY_ORDER_URL =
  `${process.env.EXPO_PUBLIC_API_BASE_URL}/verify-order-google-play-billing`;
const IOS_CREATE_ORDER_URL =
  `${process.env.EXPO_PUBLIC_API_BASE_URL}/create-order-ios`;
const IOS_VERIFY_ORDER_URL =
  `${process.env.EXPO_PUBLIC_API_BASE_URL}/verify-order-ios`;

const getBackendOrderId = (createJson) =>
  createJson?.data?.order?._key ||
  createJson?.data?.orderId ||
  createJson?.data?._key ||
  createJson?.orderId ||
  createJson?._key ||
  null;

const getIosEnvironment = (purchase) => {
  const value = purchase?.environmentIOS;

  if (typeof value === "string" && value.trim()) {
    return value.toLowerCase();
  }

  return __DEV__ ? "sandbox" : "production";
};

export default function IAPProvider({ children }) {

  const verifyPurchase = useCallback(async (purchase) => {
    try {
      const orderDataString = await AsyncStorage.getItem(ORDER_DATA_KEY);
      console.log("🧾 VERIFY PURCHASE START:", {
        platform: Platform.OS,
        productId: purchase?.productId,
        transactionId: purchase?.transactionId || purchase?.id,
        hasOrderData: Boolean(orderDataString),
      });

      if (!orderDataString) {
        console.log("ℹ️ ORDER DATA NOT FOUND FOR PURCHASE VERIFICATION");
        return;
      }

      const orderData = JSON.parse(orderDataString);
      const isIOS = Platform.OS === "ios";
      const createOrderUrl = isIOS
        ? IOS_CREATE_ORDER_URL
        : ANDROID_CREATE_ORDER_URL;
      const verifyOrderUrl = isIOS
        ? IOS_VERIFY_ORDER_URL
        : ANDROID_VERIFY_ORDER_URL;

      console.log("🧾 VERIFY PURCHASE ORDER DATA:", {
        productId: orderData?.productId,
        sessionId: orderData?.sessionId,
        userId: orderData?.userId,
      });

      const createPayload = isIOS
        ? {
            amount: orderData.amount,
            fullName: orderData.fullName,
            userId: orderData.userId,
            phone: orderData.phone,
            sessionId: orderData.sessionId,
            requestedTimeInMinutes: orderData.requestedTimeInMinutes,
            productId: orderData.productId || purchase?.productId,
            couponInfo: orderData.couponInfo ?? null,
          }
        : {
            ...orderData,
          };

      console.log("🚀 CALLING CREATE ORDER API:", createOrderUrl);

      const createResponse = await fetch(createOrderUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      });

      const createJson = await createResponse.json().catch(() => ({}));
      const backendOrderId = getBackendOrderId(createJson);

      console.log("📥 CREATE ORDER RESPONSE:", createJson);
      console.log("🔥 BACKEND ORDER ID:", backendOrderId);

      if (!createResponse.ok || !backendOrderId) {
        throw new Error("Create order failed");
      }

      const verifyPayload = isIOS
        ? {
            orderId: backendOrderId,
            transactionId: purchase?.transactionId || purchase?.id,
            productId: purchase?.productId,
            environment: getIosEnvironment(purchase),
            userId: orderData.userId,
          }
        : {
            purchaseToken:
              purchase?.purchaseToken || purchase?.purchaseTokenAndroid,
            productId: purchase?.productId,
            packageName: purchase?.packageNameAndroid,
            orderId: backendOrderId,
            googlePayOrderId: purchase?.id || purchase?.transactionId,
            userId: orderData.userId,
          };

      if (isIOS && !verifyPayload.transactionId) {
        throw new Error("Missing iOS transactionId");
      }

      if (!isIOS && !verifyPayload.purchaseToken) {
        throw new Error("Missing Android purchase token");
      }

      console.log("🧾 VERIFY PURCHASE PAYLOAD:", {
        platform: Platform.OS,
        productId: verifyPayload?.productId,
        orderId: verifyPayload?.orderId,
        googlePayOrderId: verifyPayload?.googlePayOrderId,
        hasPurchaseToken: Boolean(verifyPayload?.purchaseToken),
        packageName: verifyPayload?.packageName,
      });

      console.log("🚀 CALLING VERIFY API:", verifyOrderUrl);

      const verifyResponse = await fetch(verifyOrderUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verifyPayload),
      });

      const verifyJson = await verifyResponse.json().catch(() => ({}));

      console.log("📥 VERIFY RESPONSE STATUS:", verifyResponse.status);
      console.log("📥 VERIFY RESPONSE BODY:", verifyJson);

      if (!verifyResponse.ok) {
        throw new Error("Verify purchase failed");
      }

      await finishTransaction({
        purchase,
        isConsumable: true,
      });

      console.log("✅ TRANSACTION FINISHED");
      console.log("✅ PAYMENT FLOW SUCCESS:", {
        platform: Platform.OS,
        productId: purchase?.productId,
        transactionId: purchase?.transactionId || purchase?.id,
      });

      await AsyncStorage.setItem(PAYMENT_STATUS_KEY, "SUCCESS");
      await AsyncStorage.removeItem(ORDER_DATA_KEY);
    } catch (e) {
      console.log("❌ VERIFY ERROR:", e?.message || e);
      const orderDataString = await AsyncStorage.getItem(ORDER_DATA_KEY);
      if (orderDataString) {
        await AsyncStorage.setItem(PAYMENT_STATUS_KEY, "FAILED");
        await AsyncStorage.removeItem(ORDER_DATA_KEY);
      }
    }
  }, []);

  const checkPendingPurchase = useCallback(async ({ skipConnectionCheck = false, source = "default" } = {}) => {
    const orderDataString = await AsyncStorage.getItem(ORDER_DATA_KEY);
    console.log("🔎 CHECK PENDING PURCHASE START:", {
      platform: Platform.OS,
      hasOrderData: Boolean(orderDataString),
      skipConnectionCheck,
      source,
    });

    if (!orderDataString) {
      console.log("🔎 CHECK PENDING PURCHASE SKIPPED: NO ORDER DATA");
      return;
    }

    if (!connected && !skipConnectionCheck) {
      console.log("🔎 CHECK PENDING PURCHASE SKIPPED: IAP NOT CONNECTED");
      return;
    }

    try {
      const orderData = JSON.parse(orderDataString);
      const targetProductId =
        orderData?.productId ||
        (Platform.OS === "ios" ? IOS_CHAT_PRODUCT_ID : ANDROID_CHAT_PRODUCT_ID);
      console.log("🔎 CHECK PENDING PURCHASE TARGET:", {
        targetProductId,
        sessionId: orderData?.sessionId,
        userId: orderData?.userId,
      });
      const purchases = await getAvailablePurchases();

      console.log("📦 PURCHASES FROM STORE:", purchases);

      const matchingPurchase =
        purchases
          ?.slice()
          .reverse()
          .find(
            (purchase) =>
              purchase?.productId === targetProductId
          ) || null;

      if (matchingPurchase) {
        console.log("🔥 FOUND PENDING PURCHASE:", matchingPurchase.productId);
        await verifyPurchase(matchingPurchase);
      } else {
        console.log("⚠️ NO PURCHASE FOUND FOR ACTIVE FLOW");
        await AsyncStorage.setItem(PAYMENT_STATUS_KEY, "CANCELLED");
        await AsyncStorage.removeItem(ORDER_DATA_KEY);
      }
    } catch (e) {
      console.log("❌ ERROR:", e?.message || e);
      const orderDataString = await AsyncStorage.getItem(ORDER_DATA_KEY);
      if (orderDataString) {
        await AsyncStorage.setItem(PAYMENT_STATUS_KEY, "FAILED");
        await AsyncStorage.removeItem(ORDER_DATA_KEY);
      }
    }
  }, [connected, verifyPurchase]);

  const handlePurchaseError = useCallback(async (error) => {
    console.log("❌ PURCHASE ERROR:", error?.code, error?.message);
    const orderDataString = await AsyncStorage.getItem(ORDER_DATA_KEY);
    if (!orderDataString) {
      console.log("❌ PURCHASE ERROR WITH NO ORDER DATA");
      return;
    }

    if (error?.code === ErrorCode.AlreadyOwned) {
      console.log("♻️ ITEM ALREADY OWNED - TRYING PENDING PURCHASE RECOVERY");
      await new Promise((resolve) => setTimeout(resolve, 800));
      await checkPendingPurchase({
        skipConnectionCheck: true,
        source: "already-owned-error",
      });
      return;
    }

    const nextStatus =
      error?.code === ErrorCode.UserCancelled ? "CANCELLED" : "FAILED";

    await AsyncStorage.setItem(PAYMENT_STATUS_KEY, nextStatus);
    await AsyncStorage.removeItem(ORDER_DATA_KEY);
  }, [checkPendingPurchase]);

  const {
    connected,
    products,
    subscriptions,
    getProducts,
    requestPurchase,
  } = useIAP({
    onPurchaseSuccess: verifyPurchase,
    onPurchaseError: handlePurchaseError,
  });

  useEffect(() => {
    const loadProducts = async () => {
      try {
        if (!connected) {
          return;
        }

        const result = await getProducts({
          skus: [Platform.OS === "ios" ? IOS_CHAT_PRODUCT_ID : ANDROID_CHAT_PRODUCT_ID],
        });

        console.log("🔥 FETCHED PRODUCTS:", result);
      } catch (e) {
        console.log("❌ PRODUCT FETCH ERROR:", e);
      }
    };

    loadProducts();
  }, [connected, getProducts]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setTimeout(() => {
          checkPendingPurchase();
        }, 2000);
      }
    });

    return () => sub.remove();
  }, [checkPendingPurchase]);

  useEffect(() => {
    if (!connected) return;

    checkPendingPurchase();
  }, [connected, checkPendingPurchase]);

  return children;
}
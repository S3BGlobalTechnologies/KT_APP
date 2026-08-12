import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useRef, useState } from "react";

// A default matters: createContext() with no argument defaults to undefined, so
// any read from outside the provider destructures undefined and crashes the
// screen. Degrade to "no timer running" instead.
const DEFAULT_CHAT_TIMER = { remainingSeconds: 0 };

const ChatTimerContext = createContext(DEFAULT_CHAT_TIMER);

export const CHAT_REMAINING_KEY = "CHAT_REMAINING_SECONDS";

const STORAGE_KEYS = {
    FREE_ACTIVE: 'FREE_CHAT_ACTIVE',
    CHAT_START: 'CHAT_START_TIME',
    CHAT_DURATION: 'CHAT_DURATION',
    CHAT_TYPE: 'CHAT_TYPE', // ✅ NEW
    CHAT_REMAINING: 'CHAT_REMAINING_SECONDS', // ✅ NEW
  };

export const ChatTimerProvider = ({ children }) => {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    startGlobalTimer();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startGlobalTimer = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(async () => {
      const stored = await AsyncStorage.getItem(CHAT_REMAINING_KEY);

      if (!stored) return;

      const seconds = parseInt(stored);

      if (seconds <= 0) {
        setRemainingSeconds(0);
        await AsyncStorage.removeItem(CHAT_REMAINING_KEY);
         await AsyncStorage.multiRemove([
      STORAGE_KEYS.CHAT_START,
      STORAGE_KEYS.CHAT_DURATION,
      STORAGE_KEYS.FREE_ACTIVE,
      STORAGE_KEYS.CHAT_TYPE, // ✅ NEW
      'FREE_CHAT_GRANTED',
    ]);

        return;
      }

      const updated = seconds - 1;

      await AsyncStorage.setItem(CHAT_REMAINING_KEY, updated.toString());

      setRemainingSeconds(updated);
    }, 1000);
  };

  return (
    <ChatTimerContext.Provider value={{ remainingSeconds }}>
      {children}
    </ChatTimerContext.Provider>
  );
};

export const useChatTimer = () => {
  const value = useContext(ChatTimerContext);
  if (!value) {
    // Reachable on a stale Fast Refresh tree, or if a screen ever renders
    // outside ChatTimerProvider. Warn rather than fail silently — the symptom
    // is the live timer band simply never appearing.
    console.warn('useChatTimer: no ChatTimerProvider above this component');
    return DEFAULT_CHAT_TIMER;
  }
  return value;
};
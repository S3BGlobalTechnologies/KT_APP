import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useRef, useState } from "react";

const ChatTimerContext = createContext();

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

export const useChatTimer = () => useContext(ChatTimerContext);
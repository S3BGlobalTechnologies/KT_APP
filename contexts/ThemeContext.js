/**
 * ThemeContext — app-wide light/dark theming.
 *
 * - `mode` is 'dark' (default) or 'light'.
 * - The choice is persisted in AsyncStorage and restored on launch.
 * - Rendering is gated until the stored choice is read, so the app paints
 *   the correct theme on the first frame (no flash / no theme flicker).
 *
 * Usage in a component:
 *   const { colors, isDark, toggleTheme } = useTheme();
 *   const styles = useMemo(() => makeStyles(colors), [colors]);
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getColors } from '@/lib/theme';

const THEME_KEY = 'APP_THEME_MODE';

const ThemeContext = createContext({
  mode: 'light',
  colors: getColors('light'),
  isDark: false,
  ready: true,
  toggleTheme: () => {},
  setMode: () => {},
});

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState('light');
  const [ready, setReady] = useState(false);

  // Restore persisted choice before first paint.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (active && (saved === 'light' || saved === 'dark')) {
          setModeState(saved);
        }
      } catch (e) {
        console.log('THEME_RESTORE_FAILED:', e);
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback((next) => {
    const value = next === 'light' ? 'light' : 'dark';
    setModeState(value);
    AsyncStorage.setItem(THEME_KEY, value).catch((e) =>
      console.log('THEME_SAVE_FAILED:', e)
    );
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const value = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(THEME_KEY, value).catch((e) =>
        console.log('THEME_SAVE_FAILED:', e)
      );
      return value;
    });
  }, []);

  const value = useMemo(
    () => ({
      mode,
      colors: getColors(mode),
      isDark: mode !== 'light',
      ready,
      toggleTheme,
      setMode,
    }),
    [mode, ready, toggleTheme, setMode]
  );

  // Children are ALWAYS rendered.
  //
  // This used to `return null` until the stored theme had been read, to avoid a
  // theme flash. But this provider sits above the root layout's navigator, so
  // returning null meant app/_layout.js rendered no navigator on its first
  // frame — and Expo Router then mounts the screens outside the layout tree.
  // Every context provided at the root was silently cut off from the screens:
  // the theme toggle did nothing, t() returned raw key names, and useChatTimer()
  // came back undefined.
  //
  // A one-frame theme flash is the far smaller problem. `ready` is exposed on
  // the context so a screen that genuinely needs to defer its own paint can,
  // without unmounting the navigator.
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;

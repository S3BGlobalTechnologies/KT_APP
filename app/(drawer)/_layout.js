import CustomDrawerContent from '@/components/ui/CustomDrawerContent';
import { LanguageProvider } from '@/lib/i18n';
import { Drawer } from 'expo-router/drawer';

/**
 * This LanguageProvider is deliberately kept here even though app/_layout.js
 * also mounts one.
 *
 * Hoisting it to the root alone broke every drawer screen: useLanguage() fell
 * back to the default context, whose t() returns the key name and whose
 * setLanguage() is a no-op — so the UI showed raw key names and the language
 * dropdown did nothing. The root provider is what onboarding and the login
 * screen use; this one is what the drawer uses.
 *
 * Nesting is safe: both read and write the same APP_LANGUAGE key in
 * AsyncStorage, so a language picked on either side of the boundary is what
 * the other loads on mount.
 */
export default function DrawerLayout() {
  return (
    <LanguageProvider>
      <Drawer
        screenOptions={{
          headerShown: false,
          drawerStyle: { backgroundColor: '#0B0A2E', width: 300 },
        }}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
      >
        <Drawer.Screen name="home" />
        <Drawer.Screen name="chat-history" />
        <Drawer.Screen name="payment-transaction" />
        <Drawer.Screen name="chat" />
        <Drawer.Screen name="HelpSupport" />
        <Drawer.Screen name="AboutUs" />
        <Drawer.Screen name="FAQ" />
        <Drawer.Screen name="TermsConditions" />
        <Drawer.Screen name="PrivacyPolicy" />
        <Drawer.Screen name="ShareFeedback" />
        <Drawer.Screen name="Share" />
        <Drawer.Screen name="refund&cancelation-policy" />
        <Drawer.Screen name="cookies-policy" />
      </Drawer>
    </LanguageProvider>
  );
}

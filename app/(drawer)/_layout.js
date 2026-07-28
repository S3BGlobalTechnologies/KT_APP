import CustomDrawerContent from '@/components/ui/CustomDrawerContent';
import { LanguageProvider } from '@/lib/i18n';
import { Drawer } from 'expo-router/drawer';



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
      <Drawer.Screen name="home"/>
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





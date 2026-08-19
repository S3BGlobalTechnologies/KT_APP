export const logMetaEvent = async (eventName, params = {}) => {
  try {
    const { AppEventsLogger } = await import('react-native-fbsdk-next');
    AppEventsLogger.logEvent(eventName, params);
  } catch (e) {
    console.log('Meta event error:', e);
  }
};
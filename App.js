import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/database/db';
import { setupNotificationChannels } from './src/services/NotificationService';
import { LanguageProvider } from './src/context/LanguageContext';

export default function App() {
  useEffect(() => {
    initDatabase();
    setupNotificationChannels();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <LanguageProvider>
        <AppNavigator />
      </LanguageProvider>
    </SafeAreaProvider>

    
  );
  
}
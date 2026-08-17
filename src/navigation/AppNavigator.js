import React, { useContext } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LanguageContext } from '../context/LanguageContext';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import AddMedicineScreen from '../screens/AddMedicineScreen';
import AlarmRingScreen from '../screens/AlarmRingScreen';

export const navigationRef = createNavigationContainerRef();
const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { lang } = useContext(LanguageContext);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        key={lang} 
        initialRouteName="Splash" 
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AddMedicine" component={AddMedicineScreen} />
        <Stack.Screen name="AlarmRing" component={AlarmRingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
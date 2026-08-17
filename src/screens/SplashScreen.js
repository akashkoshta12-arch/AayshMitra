import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen({ navigation }) {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    // Fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    // Check login state
    const checkLogin = async () => {
      try {
        const userPhone = await AsyncStorage.getItem('user_phone');
        setTimeout(() => {
          if (userPhone) {
            navigation.replace('Home');
          } else {
            navigation.replace('Login');
          }
        }, 2000);
      } catch (e) {
        navigation.replace('Login');
      }
    };

    checkLogin();
  }, [fadeAnim, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>💊</Text>
        </View>
        <Text style={styles.appName}>AayushMitra</Text>
        <Text style={styles.tagline}>Aapka Swasthya, Hamara Saath</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // High contrast dark blue background
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E293B',
    borderWidth: 3,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
  },
  icon: {
    fontSize: 54,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 18,
    color: '#94A3B8',
    marginTop: 8,
    fontWeight: '500',
  },
});
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen({ navigation }) {

  useEffect(() => {

    const timer = setTimeout(async () => {

      try {

        const profile =
          await AsyncStorage.getItem('patient_profile');

        if (profile) {

          navigation.replace('Home');

        } else {

          // ProfileSetup screen nahi hai.
          // Tumhara profile setup LoginScreen me hai.
          navigation.replace('Login');

        }

      } catch (e) {

        console.log(
          '[SPLASH ERROR]',
          e
        );

        navigation.replace('Login');
      }

    }, 2200);


    return () => clearTimeout(timer);

  }, [navigation]);


  return (
    <View style={styles.container}>

      <View style={styles.logoContainer}>

        <View style={styles.iconCircle}>

          <Text style={styles.logoIcon}>
            💊
          </Text>

        </View>

        <Text style={styles.appName}>
          AayushMitra
        </Text>

        <Text style={styles.tagline}>
          आपकी सेहत, आपका साथी
        </Text>

      </View>

      <ActivityIndicator
        size="large"
        color="#38BDF8"
        style={styles.loader}
      />

    </View>
  );
}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoContainer: {
    alignItems: 'center',
  },

  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#38BDF8',
  },

  logoIcon: {
    fontSize: 50,
  },

  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  tagline: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
    fontWeight: '600',
  },

  loader: {
    position: 'absolute',
    bottom: 50,
  },

});
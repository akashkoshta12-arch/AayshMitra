import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageContext } from '../context/LanguageContext';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const { lang, changeLanguage, t } = useContext(LanguageContext);

  const handleLogin = async () => {
    if (phone.trim().length < 10) {
      Alert.alert('!', t.invalidPhoneAlert);
      return;
    }

    await AsyncStorage.setItem('user_phone', phone);
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      {/* Language Toggle */}
      <View style={styles.langContainer}>
        <Text style={styles.langLabel}>{t.selectLanguage}:</Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, lang === 'hi' && styles.activeLangBtn]}
            onPress={() => changeLanguage('hi')}
          >
            <Text style={[styles.langBtnText, lang === 'hi' && styles.activeLangText]}>
              🇮🇳 हिंदी
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.langBtn, lang === 'en' && styles.activeLangBtn]}
            onPress={() => changeLanguage('en')}
          >
            <Text style={[styles.langBtnText, lang === 'en' && styles.activeLangText]}>
              🇬🇧 English
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.heading}>{t.loginHeader}</Text>
      <Text style={styles.subHeading}>{t.loginSub}</Text>

      <View style={styles.inputCard}>
        <Text style={styles.label}>{t.mobileLabel}</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder={t.mobilePlaceholder}
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          maxLength={10}
        />
      </View>

      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
        <Text style={styles.btnText}>{t.continueBtn}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 24,
    justifyContent: 'center',
  },
  langContainer: {
    marginBottom: 25,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textAlign: 'center',
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    alignItems: 'center',
  },
  activeLangBtn: {
    backgroundColor: '#0284C7',
  },
  langBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  activeLangText: {
    color: '#FFFFFF',
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  subHeading: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 25,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 16,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    letterSpacing: 2,
  },
  loginBtn: {
    backgroundColor: '#16A34A',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    elevation: 4,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
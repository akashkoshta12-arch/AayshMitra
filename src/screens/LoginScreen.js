import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenContainer from '../components/ScreenContainer';
import { LanguageContext } from '../context/LanguageContext';

export default function LoginScreen({ navigation }) {
  const { lang, changeLanguage, t } = useContext(LanguageContext);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('MALE');
  const [phone, setPhone] = useState('');

  const handleSaveAndLogin = async () => {
    if (!name.trim() || !age.trim() || phone.trim().length < 10) {
      Alert.alert('!', t.fillAllAlert);
      return;
    }

    const patientProfile = {
      name: name.trim(),
      age: age.trim(),
      gender,
      phone: phone.trim(),
    };

    await AsyncStorage.setItem('patient_profile', JSON.stringify(patientProfile));
    await AsyncStorage.setItem('user_phone', phone.trim());

    navigation.replace('Dashboard');
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Language Switch */}
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

        <View style={styles.card}>
          {/* Patient Name */}
          <Text style={styles.label}>{t.nameLabel}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t.namePlaceholder}
            placeholderTextColor="#94A3B8"
          />

          {/* Patient Age */}
          <Text style={styles.label}>{t.ageLabel}</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder={t.agePlaceholder}
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={3}
          />

          {/* Patient Gender */}
          <Text style={styles.label}>{t.genderLabel}</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'MALE' && styles.activeGenderBtn]}
              onPress={() => setGender('MALE')}
            >
              <Text style={[styles.genderText, gender === 'MALE' && styles.activeGenderText]}>
                👨 {t.male}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.genderBtn, gender === 'FEMALE' && styles.activeGenderBtn]}
              onPress={() => setGender('FEMALE')}
            >
              <Text style={[styles.genderText, gender === 'FEMALE' && styles.activeGenderText]}>
                👩 {t.female}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.genderBtn, gender === 'OTHER' && styles.activeGenderBtn]}
              onPress={() => setGender('OTHER')}
            >
              <Text style={[styles.genderText, gender === 'OTHER' && styles.activeGenderText]}>
                🧑 {t.other}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mobile Number */}
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

        <TouchableOpacity style={styles.submitBtn} onPress={handleSaveAndLogin}>
          <Text style={styles.submitBtnText}>{t.continueBtn}</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  langContainer: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langLabel: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 6, textAlign: 'center' },
  langRow: { flexDirection: 'row', gap: 8 },
  langBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#F1F5F9', borderRadius: 8, alignItems: 'center' },
  activeLangBtn: { backgroundColor: '#0284C7' },
  langBtnText: { fontSize: 15, fontWeight: '700', color: '#334155' },
  activeLangText: { color: '#FFFFFF' },
  heading: { fontSize: 28, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
  subHeading: { fontSize: 15, color: '#475569', marginBottom: 18 },
  card: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#CBD5E1', elevation: 2 },
  label: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1.2, borderColor: '#CBD5E1', borderRadius: 10, padding: 12, fontSize: 16, fontWeight: '600', color: '#0F172A' },
  genderRow: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 4 },
  genderBtn: { flex: 1, paddingVertical: 12, backgroundColor: '#F1F5F9', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1' },
  activeGenderBtn: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  genderText: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  activeGenderText: { color: '#FFFFFF' },
  submitBtn: { backgroundColor: '#16A34A', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 22, elevation: 3 },
  submitBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});
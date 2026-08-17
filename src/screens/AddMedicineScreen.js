import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { insertMedicine } from '../database/db';
import { scheduleDailyMedicineAlarm } from '../services/NotificationService';
import { LanguageContext } from '../context/LanguageContext';

export default function AddMedicineScreen({ navigation }) {
  const { t } = useContext(LanguageContext);
  const [photoUri, setPhotoUri] = useState(null);
  const [medicineName, setMedicineName] = useState('');
  const [mealType, setMealType] = useState('AFTER_MEAL');
  const [totalStock, setTotalStock] = useState('30');
  const [courseDays, setCourseDays] = useState('30');
  const [timeText, setTimeText] = useState('08:00');

 const handleCapture = async () => {
  const res = await launchCamera({ mediaType: 'photo', saveToPhotos: false });
  if (res.assets && res.assets.length > 0) {
    const uri = res.assets[0].uri;
    setPhotoUri(uri);

    try {
      const ocrResult = await TextRecognition.recognize(uri);
      
      // FIX: Puri text string show karein, kyunki strip par naam kahi bhi ho sakta hai
      if (ocrResult.text) {
        // Hum text ko cleaned up version me set karenge
        const allText = ocrResult.text.replace(/\n/g, ' '); 
        setMedicineName(allText.substring(0, 50)); // Senior edit kar sake isliye dikha rahe hain
      }
    } catch (err) {
      Alert.alert('Scan Error', 'Text read nahi ho paya, manually type karein.');
    }
  }
};

  const handleSave = async () => {
    if (!medicineName.trim()) {
      Alert.alert('!', t.medNameLabel);
      return;
    }

    const [hourStr, minStr] = timeText.split(':');
    const hour = parseInt(hourStr || '8', 10);
    const minute = parseInt(minStr || '0', 10);

    const medData = {
      name: medicineName.trim(),
      imageUri: photoUri || '',
      totalStock: parseInt(totalStock, 10) || 30,
      courseDays: parseInt(courseDays, 10) || 30,
      mealType,
      alarmTime: timeText,
    };

    const res = insertMedicine(medData);
    const insertedId = res.insertId || Date.now();

    await scheduleDailyMedicineAlarm(insertedId, medData.name, medData.imageUri, mealType, hour, minute);

    Alert.alert('✓', t.saveSuccess);
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{t.addHeader}</Text>

      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.preview} />
      ) : null}

      <TouchableOpacity style={styles.cameraBtn} onPress={handleCapture}>
        <Text style={styles.btnText}>{t.cameraBtn}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>{t.medNameLabel}</Text>
      <TextInput
        style={styles.input}
        value={medicineName}
        onChangeText={setMedicineName}
        placeholder="e.g. Paracetamol"
        placeholderTextColor="#94A3B8"
      />

      <Text style={styles.label}>{t.mealTypeLabel}</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.toggleBtn, mealType === 'BEFORE_MEAL' && styles.activeToggle]}
          onPress={() => setMealType('BEFORE_MEAL')}
        >
          <Text style={[styles.toggleText, mealType === 'BEFORE_MEAL' && styles.activeToggleText]}>
            {t.before}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, mealType === 'AFTER_MEAL' && styles.activeToggle]}
          onPress={() => setMealType('AFTER_MEAL')}
        >
          <Text style={[styles.toggleText, mealType === 'AFTER_MEAL' && styles.activeToggleText]}>
            {t.after}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{t.timeLabel}</Text>
      <TextInput
        style={styles.input}
        value={timeText}
        onChangeText={setTimeText}
        placeholder="08:00"
        placeholderTextColor="#94A3B8"
        keyboardType="numbers-and-punctuation"
      />

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>{t.stockLabel}</Text>
          <TextInput
            style={styles.input}
            value={totalStock}
            onChangeText={setTotalStock}
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.label}>{t.courseLabel}</Text>
          <TextInput
            style={styles.input}
            value={courseDays}
            onChangeText={setCourseDays}
            keyboardType="numeric"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{t.saveBtn}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F8FAFC' },
  header: { fontSize: 26, fontWeight: 'bold', color: '#0F172A', marginBottom: 15 },
  preview: { width: '100%', height: 200, borderRadius: 14, marginBottom: 12 },
  cameraBtn: { backgroundColor: '#0284C7', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  label: { fontSize: 16, fontWeight: '700', color: '#334155', marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, padding: 14, fontSize: 18, color: '#0F172A' },
  row: { flexDirection: 'row' },
  toggleBtn: { flex: 1, padding: 14, backgroundColor: '#E2E8F0', borderRadius: 10, alignItems: 'center', marginHorizontal: 4 },
  activeToggle: { backgroundColor: '#059669' },
  toggleText: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  activeToggleText: { color: '#FFF' },
  saveBtn: { backgroundColor: '#16A34A', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 28 },
  saveBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
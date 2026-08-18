import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchCamera } from 'react-native-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { insertMedicine } from '../database/db';
import { scheduleDailyMedicineAlarm } from '../services/NotificationService';
import { LanguageContext } from '../context/LanguageContext';

export default function AddMedicineScreen({ navigation }) {
  const { t } = useContext(LanguageContext);
  const [photoUri, setPhotoUri] = useState(null);
  const [medicineName, setMedicineName] = useState('');
  const [suggestedNames, setSuggestedNames] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [mealType, setMealType] = useState('AFTER_MEAL');
  const [totalStock, setTotalStock] = useState('30');
  const [courseDays, setCourseDays] = useState('30');
  const [timeText, setTimeText] = useState('08:00');

  // Smart OCR Multi-Level Suggestion Parser
  const parseMedicineSuggestions = (result) => {
    if (!result || !result.text) return [];

    const fullRaw = result.text;
    const ignoreWords = [
      'mfg', 'exp', 'batch', 'lic', 'regd', 'trade', 'mark', 'scan', 'qr', 'code',
      'store', 'keep', 'warning', 'schedule', 'prescription', 'marketed', 'manufactured',
      'dosage', 'physician', 'india', 'pvt', 'ltd', 'ranipu', 'sidcul', 'haridwar',
      'contains', 'uncoated', 'flavour', 'pkg', 'abbott', 'mrp', 'incl', 'taxes'
    ];

    const rawList = [];

    // 1. Extract blocks & lines
    if (result.blocks && result.blocks.length > 0) {
      result.blocks.forEach(b => {
        const text = b.text.trim();
        if (text) {
          rawList.push(text.replace(/\n/g, ' '));
          rawList.push(...text.split('\n'));
        }
      });
    } else {
      rawList.push(...fullRaw.split('\n'));
    }

    // 2. Individual words / short phrases (e.g., Limcee, 500mg)
    const singleWords = fullRaw.split(/[\s,\n]+/).map(w => w.trim());
    rawList.push(...singleWords);

    // 3. Clean & Filter items
    const cleaned = [];
    rawList.forEach(item => {
      let str = item.trim().replace(/[^a-zA-Z0-9\s.-]/g, ' ');
      str = str.replace(/\s+/g, ' ').trim();
      const lower = str.toLowerCase();

      if (str.length < 3) return;
      if (ignoreWords.some(iw => lower === iw || lower.startsWith(iw + ' '))) return;

      const alphaRatio = (str.match(/[a-zA-Z]/g) || []).length / str.length;
      if (alphaRatio < 0.5) return;

      cleaned.push(str);
    });

    // 4. Score & Rank
    const scored = [...new Set(cleaned)].map(item => {
      let score = 0;
      const lower = item.toLowerCase();

      if (/tablet|chewable|capsule|syrup|ointment/i.test(lower)) score += 15;
      if (/vitamin|limcee|paracetamol|crocin|calcium|zinc|acid/i.test(lower)) score += 20;
      if (/\d+\s*(mg|ml|gm)/i.test(lower)) score += 10;
      if (item.length > 6 && item.length < 35) score += 5;

      return { text: item, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.text).slice(0, 8); // Top 8 best suggestions
  };

  const handleCapture = async () => {
    const res = await launchCamera({
      mediaType: 'photo',
      saveToPhotos: false,
      quality: 0.9,
    });

    if (res.assets && res.assets.length > 0) {
      const uri = res.assets[0].uri;
      setPhotoUri(uri);
      setIsScanning(true);

      try {
        const ocrResult = await TextRecognition.recognize(uri);
        const suggestions = parseMedicineSuggestions(ocrResult);
        setSuggestedNames(suggestions);
        if (suggestions.length > 0) {
          setMedicineName(suggestions[0]);
        }
      } catch (err) {
        console.log('OCR Error:', err);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleChipPress = (item) => {
    if (!medicineName) {
      setMedicineName(item);
    } else if (medicineName === item) {
      setMedicineName('');
    } else {
      // Append if selecting additional word (e.g. "Limcee" + "500 mg")
      setMedicineName(item);
    }
  };

  const handleSave = async () => {
    if (!medicineName.trim()) {
      Alert.alert('!', t.medNameLabel || 'कृपया दवा का नाम दर्ज करें');
      return;
    }

    // Time validation (Default 08:00 if invalid)
    const formattedTime = timeText.trim().includes(':') ? timeText.trim() : '08:00';

    const medData = {
      name: medicineName.trim(),
      imageUri: photoUri || '',
      totalStock: parseInt(totalStock, 10) || 30,
      courseDays: parseInt(courseDays, 10) || 30,
      mealType,
      alarmTime: formattedTime,
    };

    // 1. Insert into SQLite Database
    const res = await insertMedicine(medData);
    const alarmId = (res && res.insertId) ? res.insertId : Date.now();

    // 2. Schedule Daily Alarm with Exact Trigger
    try {
      await scheduleDailyMedicineAlarm(
        alarmId,
        medData.name,
        medData.imageUri,
        mealType,
        formattedTime
      );
    } catch (e) {
      console.log('Alarm scheduling error:', e);
    }

    // 3. Show Success Alert and Navigate Back
    Alert.alert('✓', t.saveSuccess || 'दवा और अलार्म सफलतापूर्वक सेट हो गया!', [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>{t.addHeader}</Text>

        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.preview} />
        ) : null}

        <TouchableOpacity style={styles.cameraBtn} onPress={handleCapture} disabled={isScanning}>
          {isScanning ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnText}>{t.cameraBtn}</Text>
          )}
        </TouchableOpacity>

        {/* Suggestion Section */}
        {suggestedNames.length > 0 && (
          <View style={styles.suggestionsCard}>
            <View style={styles.suggestHeaderRow}>
              <Text style={styles.suggestTitle}>✨ Photo Suggestions (Tap karke select karein):</Text>
              <TouchableOpacity onPress={() => setMedicineName('')}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.chipGrid}>
              {suggestedNames.map((item, index) => {
                const isSelected = medicineName.includes(item);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.chip, isSelected && styles.activeChip]}
                    onPress={() => handleChipPress(item)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <Text style={styles.label}>{t.medNameLabel}</Text>
        <TextInput
          style={styles.input}
          value={medicineName}
          onChangeText={setMedicineName}
          placeholder="दवा का नाम टाइप या टैप करें..."
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 110 },
  header: { fontSize: 26, fontWeight: 'bold', color: '#0F172A', marginBottom: 14 },
  preview: { width: '100%', height: 180, borderRadius: 14, marginBottom: 12 },
  cameraBtn: { backgroundColor: '#0284C7', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  // Suggestion UI Styles
  suggestionsCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  suggestHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  suggestTitle: { fontSize: 13, fontWeight: '800', color: '#1E40AF' },
  clearText: { fontSize: 12, fontWeight: 'bold', color: '#DC2626' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
  },
  activeChip: { backgroundColor: '#2563EB', borderColor: '#1D4ED8' },
  chipText: { fontSize: 14, fontWeight: '700', color: '#1E40AF' },
  activeChipText: { color: '#FFFFFF' },

  label: { fontSize: 15, fontWeight: '700', color: '#334155', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, padding: 14, fontSize: 17, color: '#0F172A' },
  row: { flexDirection: 'row' },
  toggleBtn: { flex: 1, padding: 14, backgroundColor: '#E2E8F0', borderRadius: 10, alignItems: 'center', marginHorizontal: 4 },
  activeToggle: { backgroundColor: '#059669' },
  toggleText: { fontSize: 15, fontWeight: 'bold', color: '#334155' },
  activeToggleText: { color: '#FFF' },
  saveBtn: { backgroundColor: '#16A34A', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 24, elevation: 4 },
  saveBtnText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
});



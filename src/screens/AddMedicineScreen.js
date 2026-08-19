import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchCamera } from 'react-native-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { insertMedicine } from '../database/db';
import { scheduleMultipleDoses } from '../services/NotificationService';
import { LanguageContext } from '../context/LanguageContext';

export default function AddMedicineScreen({ navigation }) {
  const { t, lang } = useContext(LanguageContext);

  const [photoUri, setPhotoUri] = useState(null);
  const [medicineName, setMedicineName] = useState('');
  const [suggestedNames, setSuggestedNames] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [mealType, setMealType] = useState('AFTER_MEAL');

  const [totalStock, setTotalStock] = useState('30');
  const [courseDays, setCourseDays] = useState('30');

  // 4 Slot Doses Configuration with Keys
  const [doses, setDoses] = useState([
    { id: 'morning', key: 'morning', time: '08:00', selected: true },
    { id: 'afternoon', key: 'afternoon', time: '13:30', selected: false },
    { id: 'evening', key: 'evening', time: '18:00', selected: false },
    { id: 'night', key: 'night', time: '21:00', selected: true },
  ]);

  const toggleDoseSlot = (id) => {
    setDoses((prev) =>
      prev.map((d) => (d.id === id ? { ...d, selected: !d.selected } : d))
    );
  };

  const updateDoseTime = (id, newTime) => {
    setDoses((prev) =>
      prev.map((d) => (d.id === id ? { ...d, time: newTime } : d))
    );
  };

  // OCR Suggester
  const parseMedicineSuggestions = (result) => {
    if (!result || !result.text) return [];
    const fullRaw = result.text;
    const ignoreList = [
      'mfg', 'exp', 'batch', 'lic', 'regd', 'trade', 'mark', 'scan', 'qr', 'code',
      'store', 'keep', 'warning', 'schedule', 'prescription', 'marketed', 'manufactured',
      'dosage', 'physician', 'india', 'pvt', 'ltd', 'ranipu', 'sidcul', 'haridwar',
      'contains', 'uncoated', 'flavour', 'pkg', 'abbott', 'mrp', 'incl', 'taxes',
      'tablets', 'capsules', 'suspension', 'ip', 'bp', 'usp', 'caution', 'reach', 'children'
    ];

    const rawSegments = [];
    if (result.blocks && result.blocks.length > 0) {
      result.blocks.forEach((b) => {
        if (b.text) {
          rawSegments.push(b.text.replace(/\n/g, ' '));
          rawSegments.push(...b.text.split('\n'));
        }
      });
    } else {
      rawSegments.push(...fullRaw.split('\n'));
    }

    rawSegments.push(...fullRaw.split(/[\s,\n/\\|-]+/));

    const cleanList = [];
    rawSegments.forEach((item) => {
      let str = item.trim().replace(/[^a-zA-Z0-9\s.-]/g, ' ');
      str = str.replace(/\s+/g, ' ').trim();
      const lower = str.toLowerCase();

      if (str.length < 3) return;
      if (ignoreList.some((word) => lower === word || lower.startsWith(word + ' '))) return;

      const alphaCount = (str.match(/[a-zA-Z]/g) || []).length;
      if (alphaCount / str.length < 0.5) return;

      cleanList.push(str);
    });

    const scoredList = [...new Set(cleanList)].map((item) => {
      let score = 0;
      const lower = item.toLowerCase();
      if (/vitamin|limcee|paracetamol|crocin|calcium|zinc|ascorbic|pantop|amoxy|azithro|cetirizine|omeprazole|telmi|atorva/i.test(lower)) score += 30;
      if (/tablet|chewable|capsule|syrup|drop|gel|ointment/i.test(lower)) score += 15;
      if (/\d+\s*(mg|ml|gm|mcg)/i.test(lower)) score += 20;
      if (item.length >= 5 && item.length <= 25) score += 10;
      return { text: item, score };
    });

    scoredList.sort((a, b) => b.score - a.score);
    return scoredList.map((s) => s.text).slice(0, 8);
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
        console.log('OCR Scanning Error:', err);
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
      setMedicineName(item);
    }
  };

  const handleSave = async () => {
    if (!medicineName.trim()) {
      Alert.alert(
        '!',
        t.medNameRequired || 'Please enter medicine name'
      );
      return;
    }

    const selectedDoseList = doses
      .filter((d) => d.selected)
      .map((d) => d.time.trim());

    if (selectedDoseList.length === 0) {
      Alert.alert(
        '!',
        t.doseRequired || 'Please select at least one dose time'
      );
      return;
    }

    try {
      const medData = {
        name: medicineName.trim(),
        imageUri: photoUri || '',
        totalStock: parseInt(totalStock, 10) || 30,
        courseDays: parseInt(courseDays, 10) || 30,
        mealType,
        alarmTime: selectedDoseList[0],
        doses: selectedDoseList,
      };

      console.log('[SAVE] Medicine data:', medData);

      // ---------------------------------------------
      // 1. Medicine SQLite me save
      // ---------------------------------------------
      const res = await insertMedicine(medData);

      console.log('[SAVE] Database response:', res);

      // ---------------------------------------------
      // IMPORTANT:
      // Real SQLite ID ke bina alarm schedule mat karo.
      // Date.now() ko medicine ID ke fallback ke roop
      // me use nahi karna hai.
      // ---------------------------------------------
      const medicineId = res?.insertId;

      if (!medicineId) {
        console.log(
          '[SAVE ERROR] Real medicine ID nahi mila'
        );

        Alert.alert(
          'Error',
          'Medicine save nahi ho saki. Please try again.'
        );

        return;
      }

      console.log(
        '[SAVE] Real Medicine ID:',
        medicineId
      );

      // ---------------------------------------------
      // 2. Alarm schedule
      // Actual DB medicine ID pass hoga
      // ---------------------------------------------
      const alarmResult = await scheduleMultipleDoses(
        medicineId,
        medData.name,
        medData.imageUri,
        medData.mealType,
        selectedDoseList
      );

      console.log(
        '[SAVE] Alarm result:',
        alarmResult
      );

      // ---------------------------------------------
      // 3. Exact alarm permission problem
      // ---------------------------------------------
      if (
        alarmResult &&
        !alarmResult.success &&
        alarmResult.reason ===
        'EXACT_ALARM_PERMISSION_REQUIRED'
      ) {
        Alert.alert(
          t.permRequiredTitle ||
          'Permission Required',
          t.permRequiredMsg ||
          'Please allow Alarm permission.'
        );

        navigation.goBack();
        return;
      }

      // ---------------------------------------------
      // 4. Alarm scheduling failed
      // ---------------------------------------------
      if (
        alarmResult &&
        alarmResult.success === false
      ) {
        Alert.alert(
          'Error',
          'Medicine save ho gayi, lekin reminder schedule nahi ho saka.'
        );

        return;
      }

      // ---------------------------------------------
      // 5. Everything successful
      // ---------------------------------------------
      console.log(
        `[SAVE SUCCESS] Medicine ${medicineId} saved with alarms`
      );

      Alert.alert(
        '✓',
        t.saveSuccess ||
        'Medicine & Alarms Saved!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );

    } catch (error) {
      console.log(
        '[SAVE ERROR]',
        error
      );

      Alert.alert(
        'Error',
        'Medicine save karte waqt problem hui.'
      );
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>{t.addHeader}</Text>

        {photoUri ? <Image source={{ uri: photoUri }} style={styles.preview} /> : null}

        <TouchableOpacity style={styles.cameraBtn} onPress={handleCapture} disabled={isScanning}>
          {isScanning ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnText}>{t.cameraBtn}</Text>
          )}
        </TouchableOpacity>

        {suggestedNames.length > 0 && (
          <View style={styles.suggestionsCard}>
            <View style={styles.suggestHeaderRow}>
              <Text style={styles.suggestTitle}>{t.suggestTitle}</Text>
              <TouchableOpacity onPress={() => setMedicineName('')}>
                <Text style={styles.clearText}>{t.clear}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.chipGrid}>
              {suggestedNames.map((item, index) => {
                const isSelected = medicineName === item;
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
          placeholder={t.medNamePlaceholder}
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

        <Text style={styles.label}>{t.doseTitleLabel}</Text>
        <View style={styles.doseGrid}>
          {doses.map((item) => (
            <View
              key={item.id}
              style={[styles.doseCard, item.selected && styles.activeDoseCard]}
            >
              <TouchableOpacity
                style={styles.doseHeader}
                onPress={() => toggleDoseSlot(item.id)}
              >
                <Text style={[styles.doseTitle, item.selected && styles.activeDoseTitle]}>
                  {t[item.key] || item.key}
                </Text>
                <Text style={styles.doseCheck}>{item.selected ? '✅' : '⚪'}</Text>
              </TouchableOpacity>

              {item.selected && (
                <TextInput
                  style={styles.timeInput}
                  value={item.time}
                  onChangeText={(txt) => updateDoseTime(item.id, txt)}
                  placeholder="00:00"
                  placeholderTextColor="#64748B"
                  keyboardType="numbers-and-punctuation"
                />
              )}
            </View>
          ))}
        </View>

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
  container: { padding: 18, paddingBottom: 60 },
  header: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 14 },
  preview: { width: '100%', height: 180, borderRadius: 14, marginBottom: 12 },
  cameraBtn: {
    backgroundColor: '#0284C7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
  },
  activeChip: { backgroundColor: '#2563EB', borderColor: '#1D4ED8' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#1E40AF' },
  activeChipText: { color: '#FFFFFF' },

  label: { fontSize: 15, fontWeight: '700', color: '#334155', marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#0F172A',
  },
  row: { flexDirection: 'row' },
  toggleBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeToggle: { backgroundColor: '#059669' },
  toggleText: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  activeToggleText: { color: '#FFF' },

  doseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  doseCard: {
    width: '48%',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  activeDoseCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  doseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doseTitle: { fontSize: 14, fontWeight: 'bold', color: '#475569' },
  activeDoseTitle: { color: '#15803D' },
  doseCheck: { fontSize: 14 },
  timeInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
  },

  saveBtn: {
    backgroundColor: '#16A34A',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 22,
    elevation: 3,
  },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
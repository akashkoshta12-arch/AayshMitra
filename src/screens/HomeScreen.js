import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllMedicines, deleteMedicine } from '../database/db';
import { LanguageContext } from '../context/LanguageContext';

export default function HomeScreen({ navigation }) {
  const [medicines, setMedicines] = useState([]);
  const [patient, setPatient] = useState({ name: '', age: '', gender: '' });
  const { lang, changeLanguage, t } = useContext(LanguageContext);

  const loadData = async () => {
    const list = await getAllMedicines();
    setMedicines(list || []);

    try {
      const profileStr = await AsyncStorage.getItem('patient_profile');
      if (profileStr) {
        setPatient(JSON.parse(profileStr));
      }
    } catch (e) {
      console.log('Error reading profile:', e);
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert(
      lang === 'hi' ? 'दवा हटाएं?' : 'Delete Medicine?',
      lang === 'hi'
        ? `क्या आप "${name}" को लिस्ट से हटाना चाहते हैं?`
        : `Are you sure you want to delete "${name}"?`,
      [
        { text: lang === 'hi' ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'hi' ? 'हटाएं' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMedicine(id);
            await loadData(); // Table refresh
          },
        },
      ]
    );
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        {/* Patient Header */}
        <View style={styles.headerCard}>
          <View style={styles.profileInfo}>
            <Text style={styles.welcomeText}>{t.welcomePatient},</Text>
            <Text style={styles.patientName}>{patient.name || 'Akash'} 👋</Text>
            {patient.age ? (
              <Text style={styles.patientMeta}>
                {patient.gender === 'MALE' ? '👨' : patient.gender === 'FEMALE' ? '👩' : '🧑'}{' '}
                {patient.age} {lang === 'hi' ? 'वर्ष' : 'Yrs'}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.langBadge}
            onPress={() => changeLanguage(lang === 'hi' ? 'en' : 'hi')}
          >
            <Text style={styles.langBadgeText}>
              {lang === 'hi' ? '🇬🇧 EN' : '🇮🇳 हिंदी'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section Heading */}
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>{t.homeTitle}</Text>
          <Text style={styles.countBadge}>{medicines.length} {lang === 'hi' ? 'दवा' : 'Meds'}</Text>
        </View>

        {/* Table Header */}
        {medicines.length > 0 && (
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.thText, { width: 65 }]}>फोटो</Text>
            <Text style={[styles.thText, { flex: 1 }]}>दवा का विवरण</Text>
            <Text style={[styles.thText, { width: 70, textAlign: 'center' }]}>स्टॉक</Text>
            <Text style={[styles.thText, { width: 45, textAlign: 'center' }]}>हटाएं</Text>
          </View>
        )}

        {/* Medicine Table / List */}
        <FlatList
          data={medicines}
          keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💊</Text>
              <Text style={styles.emptyText}>{t.emptyMed}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isLowStock = item.remaining_stock <= 5;
            return (
              <View style={[styles.tableRow, isLowStock && styles.lowStockRow]}>
                {/* 1. Medicine Photo */}
                <View style={styles.imageCol}>
                  {item.image_uri ? (
                    <Image source={{ uri: item.image_uri }} style={styles.tableThumb} />
                  ) : (
                    <View style={styles.placeholderBox}>
                      <Text style={{ fontSize: 20 }}>💊</Text>
                    </View>
                  )}
                </View>

                {/* 2. Name, Timing & Meal Badge */}
                <View style={styles.nameCol}>
                  <Text style={styles.tableName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.timeTag}>⏰ {item.alarm_time || '--:--'}</Text>
                    <View
                      style={[
                        styles.mealBadge,
                        item.meal_type === 'BEFORE_MEAL' ? styles.beforeMealBg : styles.afterMealBg,
                      ]}
                    >
                      <Text style={styles.mealBadgeText}>
                        {item.meal_type === 'BEFORE_MEAL'
                          ? lang === 'hi' ? 'पहले' : 'Before'
                          : lang === 'hi' ? 'बाद' : 'After'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 3. Stock */}
                <View style={styles.stockCol}>
                  <Text style={[styles.stockNum, isLowStock && { color: '#DC2626' }]}>
                    {item.remaining_stock}
                  </Text>
                  <Text style={styles.stockLabel}>goli</Text>
                </View>

                {/* 4. Delete Action Button */}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id, item.name)}
                >
                  <Text style={styles.deleteIconText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />

        {/* Add Medicine Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddMedicine')}
        >
          <Text style={styles.fabText}>{t.addMedBtn}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  headerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    elevation: 3,
  },
  profileInfo: { flex: 1 },
  welcomeText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  patientName: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', marginTop: 2 },
  patientMeta: { fontSize: 13, color: '#38BDF8', fontWeight: 'bold', marginTop: 4 },
  langBadge: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  langBadgeText: { fontSize: 13, fontWeight: 'bold', color: '#38BDF8' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  countBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 13, fontWeight: '700', color: '#334155' },

  tableHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  thText: { fontSize: 12, fontWeight: '800', color: '#475569' },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  lowStockRow: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  imageCol: { width: 55, marginRight: 10 },
  tableThumb: { width: 52, height: 52, borderRadius: 8 },
  placeholderBox: { width: 52, height: 52, borderRadius: 8, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  nameCol: { flex: 1, paddingRight: 6 },
  tableName: { fontSize: 15, fontWeight: 'bold', color: '#0F172A', marginBottom: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeTag: { fontSize: 12, fontWeight: '700', color: '#0284C7' },
  mealBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  beforeMealBg: { backgroundColor: '#FEF3C7' },
  afterMealBg: { backgroundColor: '#DCFCE7' },
  mealBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#1E293B' },
  stockCol: { width: 50, alignItems: 'center' },
  stockNum: { fontSize: 16, fontWeight: '900', color: '#16A34A' },
  stockLabel: { fontSize: 10, color: '#64748B' },
  deleteBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  deleteIconText: { fontSize: 16 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 50, marginBottom: 10 },
  emptyText: { fontSize: 16, color: '#64748B', fontWeight: '600' },
  fab: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 8,
    elevation: 4,
  },
  fabText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});
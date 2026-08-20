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
      if (profileStr) setPatient(JSON.parse(profileStr));
    } catch (e) {
      console.log('Error reading profile:', e);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);


  const getDoseTimes = (item) => {
    try {
      if (item.doses) {
        const parsed = JSON.parse(item.doses);

        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }

      // Backward compatibility
      if (item.alarm_time) {
        return [item.alarm_time];
      }

      return [];
    } catch (error) {
      console.log('[DOSE DISPLAY ERROR]', error);

      return item.alarm_time
        ? [item.alarm_time]
        : [];
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
            await loadData();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        {/* Header: Patient Info, History Button & Language */}
        <View style={styles.headerCard}>
          <View style={styles.profileInfo}>
            <Text style={styles.welcomeText}>{t.welcomePatient},</Text>
            <Text style={styles.patientName}>{patient.name || 'आकाश'} 👋</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => navigation.navigate('History')}
            >
              <Text style={styles.historyBtnText}>📋</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.langBadge}
              onPress={() => changeLanguage(lang === 'hi' ? 'en' : 'hi')}
            >
              <Text style={styles.langBadgeText}>{lang === 'hi' ? 'EN' : 'HI'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Heading */}
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>{t.homeTitle}</Text>
          <Text style={styles.countBadge}>{medicines.length}</Text>
        </View>

        {/* Medicine List */}
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
                <View style={styles.imageCol}>
                  {item.image_uri ? (
                    <Image source={{ uri: item.image_uri }} style={styles.tableThumb} />
                  ) : (
                    <View style={styles.placeholderBox}><Text>💊</Text></View>
                  )}
                </View>

                <View style={styles.nameCol}>
                  <Text style={styles.tableName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.metaRow}>

                    <View style={styles.doseTimesContainer}>
                      <Text style={styles.clockIcon}>⏰</Text>

                      {getDoseTimes(item).map((time, index) => (
                        <View
                          key={`${item.id}-dose-${index}`}
                          style={styles.doseTimeBadge}
                        >
                          <Text style={styles.doseTimeText}>
                            {time}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {isLowStock && (
                      <Text style={styles.lowStockWarning}>
                        ⚠️ Low Stock
                      </Text>
                    )}

                  </View>
                </View>

                <View style={styles.stockCol}>
                  <Text style={[styles.stockNum, isLowStock && { color: '#DC2626' }]}>
                    {item.remaining_stock}
                  </Text>
                  <Text style={styles.stockLabel}>goli</Text>
                </View>

                {/* Edit & Delete Action Column */}
                <View style={styles.actionCol}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('AddMedicine', { medicineId: item.id })}
                  >
                    <Text style={styles.editIconText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id, item.name)}
                  >
                    <Text style={styles.deleteIconText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />

        {/* Floating Add Button */}
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddMedicine')}>
          <Text style={styles.fabText}>{t.addMedBtn}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  doseTimesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    flex: 1,
  },

  clockIcon: {
    fontSize: 13,
  },

  doseTimeBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },

  doseTimeText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '800',
  },

  container: { flex: 1, padding: 16 },
  headerCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0F172A', padding: 16, borderRadius: 16, marginBottom: 14 },
  profileInfo: { flex: 1 },
  welcomeText: { fontSize: 13, color: '#94A3B8' },
  patientName: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  historyBtn: { backgroundColor: '#1E293B', padding: 10, borderRadius: 12 },
  historyBtnText: { fontSize: 18 },
  langBadge: { backgroundColor: '#1E293B', padding: 12, borderRadius: 12 },
  langBadgeText: { fontWeight: 'bold', color: '#38BDF8' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  countBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 10, borderRadius: 12, fontWeight: 'bold' },

  tableRow: { flexDirection: 'row', backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  lowStockRow: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  imageCol: { width: 50, marginRight: 10 },
  tableThumb: { width: 50, height: 50, borderRadius: 8 },
  placeholderBox: { width: 50, height: 50, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  nameCol: { flex: 1, justifyContent: 'center' },
  tableName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  timeTag: { fontSize: 12, color: '#0284C7', fontWeight: 'bold' },
  lowStockWarning: { fontSize: 10, color: '#DC2626', fontWeight: 'bold', backgroundColor: '#FEE2E2', paddingHorizontal: 4, borderRadius: 4 },
  stockCol: { width: 45, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  stockNum: { fontSize: 18, fontWeight: 'bold', color: '#16A34A' },
  stockLabel: { fontSize: 10, color: '#64748B' },

  actionCol: { justifyContent: 'space-between', gap: 6 },
  editBtn: { backgroundColor: '#FEF3C7', padding: 8, borderRadius: 8 },
  editIconText: { fontSize: 14 },
  deleteBtn: { backgroundColor: '#FEE2E2', padding: 8, borderRadius: 8 },
  deleteIconText: { fontSize: 14 },

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: '#64748B', fontWeight: 'bold' },
  fab: { backgroundColor: '#2563EB', padding: 16, borderRadius: 30, alignItems: 'center', marginTop: 8 },
  fabText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
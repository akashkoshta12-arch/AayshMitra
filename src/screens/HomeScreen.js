import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { getAllMedicines } from '../database/db';
import { LanguageContext } from '../context/LanguageContext';

export default function HomeScreen({ navigation }) {
  const [medicines, setMedicines] = useState([]);
  const { lang, changeLanguage, t } = useContext(LanguageContext);

  const loadData = () => {
    const list = getAllMedicines();
    setMedicines(list);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Top Header with Language Switch */}
      <View style={styles.topBar}>
        <Text style={styles.title}>{t.homeTitle}</Text>
        <TouchableOpacity
          style={styles.langBadge}
          onPress={() => changeLanguage(lang === 'hi' ? 'en' : 'hi')}
        >
          <Text style={styles.langBadgeText}>
            {lang === 'hi' ? '🇬🇧 English' : '🇮🇳 हिंदी'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={medicines}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.empty}>{t.emptyMed}</Text>}
        renderItem={({ item }) => {
          const isLowStock = item.remaining_stock <= 5;
          return (
            <View style={[styles.card, isLowStock && styles.lowStockCard]}>
              {item.image_uri ? (
                <Image source={{ uri: item.image_uri }} style={styles.thumb} />
              ) : (
                <View style={styles.placeholderThumb}>
                  <Text style={{ fontSize: 28 }}>💊</Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.medName}>{item.name}</Text>
                <Text style={styles.medSub}>⏰ {item.alarm_time}</Text>
                <Text style={styles.medSub}>
                  {item.meal_type === 'BEFORE_MEAL' ? t.beforeMeal : t.afterMeal}
                </Text>
                <Text style={[styles.stockText, isLowStock && { color: '#DC2626' }]}>
                  {t.tabletsLeft} {item.remaining_stock} / {item.total_stock}
                </Text>
                {isLowStock && <Text style={styles.alertText}>{t.lowStockAlert}</Text>}
              </View>
            </View>
          );
        }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddMedicine')}
      >
        <Text style={styles.fabText}>{t.addMedBtn}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9', padding: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
  langBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  langBadgeText: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 18, color: '#64748B' },
  card: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 12, elevation: 2 },
  lowStockCard: { borderColor: '#EF4444', borderWidth: 2 },
  thumb: { width: 75, height: 75, borderRadius: 12, marginRight: 12 },
  placeholderThumb: { width: 75, height: 75, borderRadius: 12, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info: { flex: 1 },
  medName: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  medSub: { fontSize: 15, color: '#475569', marginTop: 2 },
  stockText: { fontSize: 15, fontWeight: '600', color: '#059669', marginTop: 4 },
  alertText: { fontSize: 13, fontWeight: 'bold', color: '#DC2626', marginTop: 2 },
  fab: { backgroundColor: '#2563EB', padding: 18, borderRadius: 30, alignItems: 'center', marginTop: 10 },
  fabText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
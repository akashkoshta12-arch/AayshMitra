import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMedicineHistory } from '../database/db';

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    const list = await getMedicineHistory();
    setHistory(list);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadHistory);
    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← वापस</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>दवा का इतिहास (History)</Text>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 40 }}>📋</Text>
            <Text style={styles.emptyText}>अभी तक कोई दवा का रिकॉर्ड नहीं है।</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isTaken = item.status === 'TAKEN';
          return (
            <View style={[styles.card, isTaken ? styles.takenBorder : styles.missedBorder]}>
              <View style={styles.infoCol}>
                <Text style={styles.medName}>{item.medicine_name}</Text>
                <Text style={styles.timeMeta}>
                  अलार्म: {item.dose_time || '--:--'} | समय: {item.action_time} ({item.date})
                </Text>
              </View>
              <View style={[styles.badge, isTaken ? styles.takenBg : styles.missedBg]}>
                <Text style={[styles.badgeText, isTaken ? styles.takenColor : styles.missedColor]}>
                  {isTaken ? '✓ ले ली' : '✕ छूट गई'}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { padding: 8, backgroundColor: '#E2E8F0', borderRadius: 8, marginRight: 12 },
  backText: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  emptyBox: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 10, fontSize: 15, color: '#64748B' },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
    elevation: 2,
  },
  takenBorder: { borderLeftColor: '#16A34A' },
  missedBorder: { borderLeftColor: '#DC2626' },
  infoCol: { flex: 1 },
  medName: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  timeMeta: { fontSize: 12, color: '#64748B', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  takenBg: { backgroundColor: '#DCFCE7' },
  missedBg: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  takenColor: { color: '#16A34A' },
  missedColor: { color: '#DC2626' },
});
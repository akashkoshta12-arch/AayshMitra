import React, { useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { reduceStockAndTakeMedicine } from '../database/db';
import { LanguageContext } from '../context/LanguageContext';

export default function AlarmRingScreen({ route, navigation }) {
  const { t } = useContext(LanguageContext);
  const { id, name, imageUri, mealType } = route.params || {};

  const handleTakeMedicine = () => {
    if (id) {
      reduceStockAndTakeMedicine(parseInt(id, 10));
    }
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.alertHeader}>{t.alarmHeader}</Text>

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : (
        <View style={styles.placeholderBox}>
          <Text style={{ fontSize: 80 }}>💊</Text>
        </View>
      )}

      <Text style={styles.name}>{name || 'Medicine'}</Text>
      <Text style={styles.instruction}>
        {mealType === 'BEFORE_MEAL' ? t.beforeMeal : t.afterMeal}
      </Text>

      <TouchableOpacity style={styles.doneBtn} onPress={handleTakeMedicine}>
        <Text style={styles.btnText}>{t.takeDoneBtn}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: 24 },
  alertHeader: { fontSize: 24, fontWeight: '900', color: '#FACC15', textAlign: 'center', marginBottom: 24 },
  image: { width: 240, height: 240, borderRadius: 20, borderWidth: 3, borderColor: '#FFF', marginBottom: 20 },
  placeholderBox: { width: 200, height: 200, borderRadius: 20, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  name: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  instruction: { fontSize: 22, color: '#38BDF8', fontWeight: 'bold', marginTop: 10, marginBottom: 40 },
  doneBtn: { backgroundColor: '#16A34A', width: '100%', padding: 20, borderRadius: 16, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
});
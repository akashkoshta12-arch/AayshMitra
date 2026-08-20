import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

import ScreenContainer from '../components/ScreenContainer';
import { LanguageContext } from '../context/LanguageContext';

export default function DashboardScreen({ navigation }) {
  const { lang } = useContext(LanguageContext);

  const isHindi = lang === 'hi';

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>
            AayushMitra
          </Text>

          <Text style={styles.subtitle}>
            {isHindi
              ? 'आपकी सेहत, आपका साथी'
              : 'Your Health, Our Support'}
          </Text>
        </View>


        {/* Page Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>
            {isHindi
              ? 'आप क्या देखना चाहते हैं?'
              : 'What would you like to check?'}
          </Text>

          <Text style={styles.description}>
            {isHindi
              ? 'अपनी दवा और स्वास्थ्य रिकॉर्ड यहां से देखें'
              : 'Access your medicines and health records'}
          </Text>
        </View>


        {/* Daily Medicine */}
        <TouchableOpacity
          style={[
            styles.menuCard,
            styles.medicineCard,
          ]}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('Home')
          }
        >

          <View style={styles.iconBox}>
            <Text style={styles.icon}>
              💊
            </Text>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              {isHindi
                ? 'दैनिक दवाइयां'
                : 'Daily Medicine'}
            </Text>

            <Text style={styles.cardDescription}>
              {isHindi
                ? 'दवाइयां, समय, स्टॉक और इतिहास'
                : 'Medicines, reminders, stock and history'}
            </Text>
          </View>

          <Text style={styles.arrow}>
            →
          </Text>

        </TouchableOpacity>


        {/* Patient Reports */}
        <TouchableOpacity
          style={[
            styles.menuCard,
            styles.reportCard,
          ]}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('Reports')
          }
        >

          <View style={styles.iconBox}>
            <Text style={styles.icon}>
              🧪
            </Text>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              {isHindi
                ? 'मरीज की रिपोर्ट'
                : 'Patient Reports'}
            </Text>

            <Text style={styles.cardDescription}>
              {isHindi
                ? 'BP, Sugar और अन्य मेडिकल रिपोर्ट'
                : 'BP, Sugar and other medical reports'}
            </Text>
          </View>

          <Text style={styles.arrow}>
            →
          </Text>

        </TouchableOpacity>


        {/* Daily BP / Sugar */}
        <TouchableOpacity
          style={[
            styles.menuCard,
            styles.healthCard,
          ]}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('HealthTracking')
          }
        >

          <View style={styles.iconBox}>
            <Text style={styles.icon}>
              🩺
            </Text>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              {isHindi
                ? 'दैनिक BP / Sugar'
                : 'Daily BP / Sugar'}
            </Text>

            <Text style={styles.cardDescription}>
              {isHindi
                ? 'आज की रीडिंग और स्वास्थ्य इतिहास'
                : 'Today’s readings and health history'}
            </Text>
          </View>

          <Text style={styles.arrow}>
            →
          </Text>

        </TouchableOpacity>


        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isHindi
              ? 'आपका स्वास्थ्य रिकॉर्ड सुरक्षित रूप से आपके फोन में रहेगा।'
              : 'Your health records stay safely on your phone.'}
          </Text>
        </View>

      </ScrollView>
    </ScreenContainer>
  );
}


const styles = StyleSheet.create({

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
  },

  appName: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
  },

  titleSection: {
    marginBottom: 18,
  },

  title: {
    fontSize: 23,
    fontWeight: '900',
    color: '#0F172A',
  },

  description: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },

  menuCard: {
    minHeight: 115,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },

  medicineCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },

  reportCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },

  healthCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },

  iconBox: {
    width: 62,
    height: 62,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  icon: {
    fontSize: 34,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
  },

  cardDescription: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
  },

  arrow: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#334155',
    marginLeft: 8,
  },

  footer: {
    marginTop: 14,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  footerText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: '#64748B',
    fontWeight: '600',
  },

});
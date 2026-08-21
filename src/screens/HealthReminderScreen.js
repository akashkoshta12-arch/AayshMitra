import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';

import ScreenContainer from '../components/ScreenContainer';

import {
  insertHealthReminder,
  getHealthReminders,
  deleteHealthReminder,
} from '../database/db';

import {
  scheduleHealthReminder,
  cancelHealthReminder,
} from '../services/NotificationService';

export default function HealthReminderScreen({ navigation }) {
  const [reminders, setReminders] = useState([]);

  const [type, setType] = useState('BP');

  // Selected date
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Selected time
  const [selectedTime, setSelectedTime] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const loadReminders = async () => {
    const list = await getHealthReminders();
    setReminders(list || []);
  };

  useEffect(() => {
    loadReminders();
  }, []);

  // Format Date
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  // Format Time
  const formatTime = (date) => {
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${hour}:${minute}`;
  };

  // Date Picker
  const handleDateChange = (event, date) => {
    setShowDatePicker(false);

    if (date) {
      setSelectedDate(date);
    }
  };

  // Time Picker
  const handleTimeChange = (event, date) => {
    setShowTimePicker(false);

    if (date) {
      setSelectedTime(date);
    }
  };

  // Save Reminder
  const handleSaveReminder = async () => {
    try {
      const reminderDate = formatDate(selectedDate);
      const reminderTime = formatTime(selectedTime);

      console.log('[HEALTH REMINDER] Date:', reminderDate);
      console.log('[HEALTH REMINDER] Time:', reminderTime);
      console.log('[HEALTH REMINDER] Type:', type);

      // 1. Save in SQLite
      const result = await insertHealthReminder({
        type,
        reminderDate,
        reminderTime,
      });

      if (!result?.success) {
        Alert.alert(
          'Error',
          'Reminder save नहीं हो सका।'
        );
        return;
      }

      // 2. Schedule Notification
      const notificationResult =
        await scheduleHealthReminder(
          result.insertId,
          type,
          reminderDate,
          reminderTime
        );

      if (!notificationResult?.success) {
        Alert.alert(
          'Reminder Error',
          'Reminder save हो गया लेकिन notification schedule नहीं हो सका।'
        );

        return;
      }

      // 3. Refresh list
      await loadReminders();

      Alert.alert(
        'सफल',
        `${
          type === 'BP'
            ? 'BP'
            : 'Sugar'
        } reminder ${reminderDate} को ${reminderTime} पर सेट हो गया।`
      );

    } catch (error) {
      console.log(
        '[HEALTH REMINDER SAVE ERROR]',
        error
      );

      Alert.alert(
        'Error',
        'Reminder set करते समय समस्या हुई।'
      );
    }
  };

  // Delete Reminder
  const handleDeleteReminder = (
    id,
    reminderType,
    date,
    time
  ) => {
    Alert.alert(
      'Reminder हटाएं?',
      `${
        reminderType === 'BP'
          ? 'Blood Pressure'
          : 'Blood Sugar'
      } का ${date} ${time} reminder हटाना है?`,
      [
        {
          text: 'रद्द करें',
          style: 'cancel',
        },

        {
          text: 'हटाएं',
          style: 'destructive',

          onPress: async () => {
            try {
              console.log(
                '[DELETE HEALTH REMINDER]',
                id
              );

              await cancelHealthReminder(id);

              const deleted =
                await deleteHealthReminder(id);

              if (deleted) {
                await loadReminders();
              }

            } catch (error) {
              console.log(
                '[DELETE REMINDER ERROR]',
                error
              );
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>
              ← वापस
            </Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Health Reminder
          </Text>

        </View>

        {/* Reminder Type */}

        <Text style={styles.label}>
          किसकी जांच का reminder?
        </Text>

        <View style={styles.typeRow}>

          <TouchableOpacity
            style={[
              styles.typeBtn,
              type === 'BP' &&
                styles.activeTypeBtn,
            ]}
            onPress={() => setType('BP')}
          >
            <Text
              style={[
                styles.typeText,
                type === 'BP' &&
                  styles.activeTypeText,
              ]}
            >
              🩺 BP
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeBtn,
              type === 'SUGAR' &&
                styles.activeTypeBtn,
            ]}
            onPress={() => setType('SUGAR')}
          >
            <Text
              style={[
                styles.typeText,
                type === 'SUGAR' &&
                  styles.activeTypeText,
              ]}
            >
              🩸 Sugar
            </Text>
          </TouchableOpacity>

        </View>

        {/* DATE */}

        <Text style={styles.label}>
          📅 Reminder Date
        </Text>

        <TouchableOpacity
          style={styles.dateTimeBtn}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateTimeText}>
            📅 {formatDate(selectedDate)}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* TIME */}

        <Text style={styles.label}>
          ⏰ Reminder Time
        </Text>

        <TouchableOpacity
          style={styles.dateTimeBtn}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.dateTimeText}>
            ⏰ {formatTime(selectedTime)}
          </Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}

        {/* SAVE */}

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveReminder}
        >
          <Text style={styles.saveBtnText}>
            ✓ Reminder सेव करें
          </Text>
        </TouchableOpacity>

        {/* EXISTING REMINDERS */}

        <Text style={styles.listTitle}>
          मेरे Reminders
        </Text>

        <FlatList
          data={reminders}
          keyExtractor={(item) =>
            item.id.toString()
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              अभी कोई health reminder नहीं है।
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.reminderCard}>

              <Text style={styles.reminderIcon}>
                {item.type === 'BP'
                  ? '🩺'
                  : '🩸'}
              </Text>

              <View style={styles.reminderInfo}>

                <Text style={styles.reminderName}>
                  {item.type === 'BP'
                    ? 'Blood Pressure'
                    : 'Blood Sugar'}
                </Text>

                <Text style={styles.reminderTime}>
                  📅 {item.reminder_date}
                </Text>

                <Text style={styles.reminderTime}>
                  ⏰ {item.reminder_time}
                </Text>

              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() =>
                  handleDeleteReminder(
                    item.id,
                    item.type,
                    item.reminder_date,
                    item.reminder_time
                  )
                }
              >
                <Text style={styles.deleteIcon}>
                  🗑️
                </Text>
              </TouchableOpacity>

            </View>
          )}
        />

      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  backBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
    marginRight: 12,
  },

  backText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },

  label: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 8,
  },

  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },

  typeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },

  activeTypeBtn: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },

  typeText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#334155',
  },

  activeTypeText: {
    color: '#FFFFFF',
  },

  dateTimeBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 15,
  },

  dateTimeText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },

  saveBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 22,
  },

  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },

  listTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 25,
    marginBottom: 10,
  },

  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  reminderIcon: {
    fontSize: 30,
    marginRight: 12,
  },

  reminderInfo: {
    flex: 1,
  },

  reminderName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },

  reminderTime: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },

  deleteBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  deleteIcon: {
    fontSize: 18,
  },

  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 20,
  },

});
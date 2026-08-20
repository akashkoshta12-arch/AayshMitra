import React, {
  useState,
  useEffect,
} from 'react';

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  getMedicineHistoryGroupedByDate,
} from '../database/db';


export default function HistoryScreen({
  navigation,
}) {

  const [history, setHistory] =
    useState([]);


  // =====================================================
  // Load History
  // =====================================================

  const loadHistory = async () => {

    const list =
      await getMedicineHistoryGroupedByDate();

    setHistory(
      list || []
    );

  };


  // =====================================================
  // Reload when screen gets focus
  // =====================================================

  useEffect(() => {

    const unsubscribe =
      navigation.addListener(
        'focus',
        loadHistory
      );

    return unsubscribe;

  }, [navigation]);


  // =====================================================
  // Date Label
  // =====================================================

  const getDateLabel = (
    dateString
  ) => {

    if (
      !dateString ||
      dateString === 'UNKNOWN'
    ) {
      return 'अनजान तारीख';
    }


    const [
      year,
      month,
      day,
    ] = dateString
      .split('-')
      .map(Number);


    const targetDate =
      new Date(
        year,
        month - 1,
        day
      );


    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );


    const yesterday =
      new Date(today);

    yesterday.setDate(
      yesterday.getDate() - 1
    );


    if (
      targetDate.getTime() ===
      today.getTime()
    ) {

      return 'आज';

    }


    if (
      targetDate.getTime() ===
      yesterday.getTime()
    ) {

      return 'कल';

    }


    return targetDate.toLocaleDateString(
      'hi-IN',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    );

  };


  // =====================================================
  // Dose Label
  // =====================================================

  const getDoseLabel = (
    time
  ) => {

    if (!time) {
      return '--:--';
    }


    const [
      hourString,
      minuteString,
    ] = time.split(':');


    const hour =
      Number(hourString);


    if (
      Number.isNaN(hour)
    ) {
      return time;
    }


    let period =
      'सुबह';


    if (
      hour >= 12 &&
      hour < 17
    ) {

      period = 'दोपहर';

    } else if (
      hour >= 17 &&
      hour < 21
    ) {

      period = 'शाम';

    } else if (
      hour >= 21 ||
      hour < 5
    ) {

      period = 'रात';

    }


    return `${period} • ${time}`;

  };


  // =====================================================
  // Render individual history record
  // =====================================================

  const renderRecord = ({
    item,
  }) => {

    const isTaken =
      item.status === 'TAKEN';


    return (

      <View
        style={[
          styles.card,
          isTaken
            ? styles.takenBorder
            : styles.missedBorder,
        ]}
      >

        <View
          style={styles.infoCol}
        >

          <Text
            style={styles.medName}
          >
            {item.medicine_name}
          </Text>


          <Text
            style={styles.doseTime}
          >
            ⏰ {getDoseLabel(
              item.dose_time
            )}
          </Text>


          <Text
            style={styles.actionTime}
          >
            {item.action_time
              ? `रिकॉर्ड समय: ${item.action_time}`
              : ''}
          </Text>

        </View>


        <View
          style={[
            styles.badge,
            isTaken
              ? styles.takenBg
              : styles.missedBg,
          ]}
        >

          <Text
            style={[
              styles.badgeText,
              isTaken
                ? styles.takenColor
                : styles.missedColor,
            ]}
          >
            {isTaken
              ? '✓ ले ली'
              : '✕ छूट गई'}
          </Text>

        </View>

      </View>

    );

  };


  // =====================================================
  // Empty State
  // =====================================================

  if (
    history.length === 0
  ) {

    return (

      <SafeAreaView
        style={styles.container}
        edges={[
          'top',
          'left',
          'right',
          'bottom',
        ]}
      >

        <View
          style={styles.headerRow}
        >

          <TouchableOpacity
            onPress={() =>
              navigation.goBack()
            }
            style={styles.backBtn}
          >

            <Text
              style={styles.backText}
            >
              ← वापस
            </Text>

          </TouchableOpacity>


          <Text
            style={styles.headerTitle}
          >
            दवा का इतिहास
          </Text>

        </View>


        <View
          style={styles.emptyBox}
        >

          <Text
            style={styles.emptyIcon}
          >
            📋
          </Text>

          <Text
            style={styles.emptyText}
          >
            अभी तक कोई दवा का रिकॉर्ड नहीं है।
          </Text>

        </View>

      </SafeAreaView>

    );

  }


  // =====================================================
  // Main History
  // =====================================================

  return (

    <SafeAreaView
      style={styles.container}
      edges={[
        'top',
        'left',
        'right',
        'bottom',
      ]}
    >

      <View
        style={styles.headerRow}
      >

        <TouchableOpacity
          onPress={() =>
            navigation.goBack()
          }
          style={styles.backBtn}
        >

          <Text
            style={styles.backText}
          >
            ← वापस
          </Text>

        </TouchableOpacity>


        <Text
          style={styles.headerTitle}
        >
          दवा का इतिहास
        </Text>

      </View>


      <FlatList

        data={history}

        keyExtractor={(
          item
        ) =>
          item.date
        }

        showsVerticalScrollIndicator={
          false
        }

        renderItem={({
          item,
        }) => (

          <View
            style={styles.dateSection}
          >

            {/* Date Header */}

            <View
              style={styles.dateHeader}
            >

              <Text
                style={styles.dateTitle}
              >
                {getDateLabel(
                  item.date
                )}
              </Text>


              <Text
                style={styles.dateCount}
              >
                {item.records.length}{' '}
                dose
                {item.records.length !== 1
                  ? 's'
                  : ''}
              </Text>

            </View>


            {/* Records */}

            {item.records.map(
              (record) => (

                <View
                  key={String(
                    record.id
                  )}
                >

                  {renderRecord({
                    item: record,
                  })}

                </View>

              )
            )}

          </View>

        )}

      />

    </SafeAreaView>

  );

}


// =====================================================
// Styles
// =====================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  backBtn: {
    padding: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    marginRight: 12,
  },

  backText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#0F172A',
  },

  dateSection: {
    marginBottom: 18,
  },

  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },

  dateTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },

  dateCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
    elevation: 2,
  },

  takenBorder: {
    borderLeftColor: '#16A34A',
  },

  missedBorder: {
    borderLeftColor: '#DC2626',
  },

  infoCol: {
    flex: 1,
  },

  medName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },

  doseTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 5,
  },

  actionTime: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },

  badge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    marginLeft: 8,
  },

  takenBg: {
    backgroundColor: '#DCFCE7',
  },

  missedBg: {
    backgroundColor: '#FEE2E2',
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '900',
  },

  takenColor: {
    color: '#16A34A',
  },

  missedColor: {
    color: '#DC2626',
  },

  emptyBox: {
    alignItems: 'center',
    marginTop: 80,
  },

  emptyIcon: {
    fontSize: 45,
  },

  emptyText: {
    marginTop: 10,
    fontSize: 15,
    color: '#64748B',
  },

});
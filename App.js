

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import notifee, { EventType } from '@notifee/react-native';

import AppNavigator from './src/navigation/AppNavigator';

import {
  initDatabase,
  recordMedicineAction,
} from './src/database/db';

import {
  setupNotificationChannels,
  triggerLowStockAlert,
} from './src/services/NotificationService';

import { LanguageProvider } from './src/context/LanguageContext';


export default function App() {

  useEffect(() => {

    // ---------------------------------------------
    // Initialize database
    // ---------------------------------------------
    initDatabase();

    // ---------------------------------------------
    // Notification channel
    // ---------------------------------------------
    setupNotificationChannels();


    // ---------------------------------------------
    // FOREGROUND NOTIFICATION EVENTS
    // ---------------------------------------------
    const unsubscribe = notifee.onForegroundEvent(
      async ({ type, detail }) => {

      
        const { notification, pressAction } = detail;

        const rawMedId =
          notification?.data?.medicineId;

        const medName =
          notification?.data?.medicineName ||
          'Medicine';

        const doseTime =
          notification?.data?.doseTime ||
          '';


        // -----------------------------------------
        // Only notification action
        // -----------------------------------------
        if (
          type !== EventType.ACTION_PRESS ||
          !rawMedId
        ) {
          return;
        }


        // -----------------------------------------
        // Medicine ID
        // -----------------------------------------
        const medicineId =
          Number(rawMedId);


        if (!Number.isInteger(medicineId)) {

          console.log(
            '[FOREGROUND] Invalid medicine ID:',
            rawMedId
          );

          return;
        }


        // =========================================
        // TAKEN
        // =========================================
        if (
          pressAction?.id ===
          'take_medicine_action'
        ) {

          console.log(
            `[FOREGROUND] TAKEN → Medicine ${medicineId}`
          );


          const result =
            await recordMedicineAction(
              medicineId,
              medName,
              doseTime,
              'TAKEN'
            );


          if (!result?.success) {

            console.log(
              '[FOREGROUND] Failed to record TAKEN'
            );

            return;
          }


          // ---------------------------------------
          // Low stock warning
          // ---------------------------------------
          if (
            result.remainingStock <= 5 &&
            result.remainingStock > 0
          ) {

            await triggerLowStockAlert(
              result.name || medName,
              result.remainingStock
            );
          }


          console.log(
            '[FOREGROUND] Stock:',
            result.remainingStock
          );
        }


        // =========================================
        // MISSED
        // =========================================
        else if (
          pressAction?.id ===
          'miss_medicine_action'
        ) {

          console.log(
            `[FOREGROUND] MISSED → Medicine ${medicineId}`
          );


          const result =
            await recordMedicineAction(
              medicineId,
              medName,
              doseTime,
              'MISSED'
            );


          console.log(
            '[FOREGROUND] Missed result:',
            result
          );
        }


        // -----------------------------------------
        // IMPORTANT:
        // Only remove displayed notification.
        //
        // DO NOT cancel the trigger.
        // Daily reminder should continue tomorrow.
        // -----------------------------------------
        if (notification?.id) {

          try {

            await notifee.cancelDisplayedNotification(
              notification.id
            );

          } catch (error) {

            console.log(
              '[FOREGROUND] Displayed notification cancel error:',
              error
            );
          }
        }

      }
    );


    // Cleanup
    return () => {
      unsubscribe();
    };

  }, []);


  return (
    <SafeAreaProvider>

      <StatusBar
        barStyle="light-content"
        backgroundColor="#0F172A"
      />

      <LanguageProvider>

        <AppNavigator />

      </LanguageProvider>

    </SafeAreaProvider>
  );
}

import { AppRegistry } from 'react-native';

import notifee, {
  EventType,
} from '@notifee/react-native';

import App from './App';

import {
  recordMedicineAction,
} from './src/database/db';

import {
  triggerLowStockAlert,
} from './src/services/NotificationService';

import {
  name as appName,
} from './app.json';


// =====================================================
// BACKGROUND NOTIFICATION ACTION HANDLER
// =====================================================

notifee.onBackgroundEvent(
  async ({ type, detail }) => {

    const {
      notification,
      pressAction,
    } = detail;


    const rawMedId =
      notification?.data?.medicineId;

    const medName =
      notification?.data?.medicineName ||
      'Medicine';

    const doseTime =
      notification?.data?.doseTime ||
      '';


    // -----------------------------------------------
    // Only ACTION_PRESS
    // -----------------------------------------------
    if (
      type !== EventType.ACTION_PRESS ||
      !rawMedId
    ) {
      return;
    }


    // -----------------------------------------------
    // Medicine ID
    // -----------------------------------------------
    const medicineId =
      Number(rawMedId);


    if (!Number.isInteger(medicineId)) {

      console.log(
        '[BACKGROUND] Invalid medicine ID:',
        rawMedId
      );

      return;
    }


    // ===============================================
    // TAKEN
    // ===============================================

    if (
      pressAction?.id ===
      'take_medicine_action'
    ) {

      console.log(
        `[BACKGROUND] TAKEN → Medicine ${medicineId}`
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
          '[BACKGROUND] Failed to record TAKEN'
        );

        return;
      }


      // ---------------------------------------------
      // Low stock
      // ---------------------------------------------
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
        '[BACKGROUND] Remaining stock:',
        result.remainingStock
      );
    }


    // ===============================================
    // MISSED
    // ===============================================

    else if (
      pressAction?.id ===
      'miss_medicine_action'
    ) {

      console.log(
        `[BACKGROUND] MISSED → Medicine ${medicineId}`
      );


      const result =
        await recordMedicineAction(
          medicineId,
          medName,
          doseTime,
          'MISSED'
        );


      console.log(
        '[BACKGROUND] Missed result:',
        result
      );
    }


    // -----------------------------------------------
    // IMPORTANT
    //
    // Do NOT cancelTriggerNotification here.
    //
    // We want tomorrow's daily reminder.
    // -----------------------------------------------
  }
);


// =====================================================
// REGISTER APP
// =====================================================

AppRegistry.registerComponent(
  appName,
  () => App
);
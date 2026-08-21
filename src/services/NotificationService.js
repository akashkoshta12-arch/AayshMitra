import notifee, {
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
  AndroidCategory,
  AndroidVisibility,
} from '@notifee/react-native';

const CHANNEL_ID = 'medicine_alarm_channel_v3';

/*
 * IMPORTANT:
 * Notification ID aur SQLite Medicine ID alag hain.
 *
 * Example:
 * Medicine ID = 7
 *
 * Notification IDs:
 * medicine_7_dose_0
 * medicine_7_dose_1
 */
const getNotificationId = (medicineId, doseIndex = 0) => {
  return `medicine_${medicineId}_dose_${doseIndex}`;
};


// =====================================================
// Notification Channel
// =====================================================
export const setupNotificationChannels = async () => {
  try {
    const permission = await notifee.requestPermission();

    console.log(
      '[NOTIFICATION PERMISSION]',
      permission
    );

    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Medicine Reminders',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 500, 300, 500],
      visibility: AndroidVisibility.PUBLIC,
    });

    console.log(
      '[CHANNEL] Medicine alarm channel ready'
    );

    return true;

  } catch (error) {
    console.log(
      '[CHANNEL ERROR]',
      error
    );

    return false;
  }
};


// =====================================================
// Exact Alarm Permission
// =====================================================
export const checkExactAlarmPermission = async () => {
  try {
    const settings =
      await notifee.getNotificationSettings();

    console.log(
      '[NOTIFICATION SETTINGS]',
      settings
    );

    console.log(
      '[EXACT ALARM]',
      settings.android?.alarm
    );

    return settings.android?.alarm;

  } catch (error) {

    console.log(
      '[EXACT ALARM CHECK ERROR]',
      error
    );

    return null;
  }
};


// =====================================================
// Open Android Alarm Permission Settings
// =====================================================
export const openExactAlarmSettings = async () => {
  try {

    await notifee.openAlarmPermissionSettings();

  } catch (error) {

    console.log(
      '[OPEN ALARM SETTINGS ERROR]',
      error
    );
  }
};


// =====================================================
// Schedule Single Daily Medicine Alarm
//
// medicineId = REAL SQLite ID
// doseIndex  = 0,1,2,3...
// =====================================================
export const scheduleDailyMedicineAlarm = async (
  medicineId,
  medName,
  imageUri,
  mealType,
  timeString,
  doseIndex = 0
) => {

  try {

    console.log('=================================');

    console.log(
      '[ALARM] Starting alarm scheduling'
    );

    console.log(
      '[ALARM] Medicine:',
      medName
    );

    console.log(
      '[ALARM] Medicine ID:',
      medicineId
    );

    console.log(
      '[ALARM] Dose Index:',
      doseIndex
    );

    console.log(
      '[ALARM] Time:',
      timeString
    );


    // -------------------------------------------------
    // IMPORTANT
    // Medicine ID must be a real numeric SQLite ID
    // -------------------------------------------------
    if (
      !medicineId ||
      !Number.isInteger(Number(medicineId))
    ) {

      throw new Error(
        `Invalid medicine ID: ${medicineId}`
      );
    }


    const numericMedicineId =
      Number(medicineId);


    // -------------------------------------------------
    // Notification ID
    // -------------------------------------------------
    const notificationId =
      getNotificationId(
        numericMedicineId,
        doseIndex
      );


    console.log(
      '[ALARM] Notification ID:',
      notificationId
    );


    // -------------------------------------------------
    // Notification Channel
    // -------------------------------------------------
    await setupNotificationChannels();


    // -------------------------------------------------
    // Exact Alarm Permission
    // -------------------------------------------------
    const alarmPermission =
      await checkExactAlarmPermission();


    console.log(
      '[ALARM] Permission:',
      alarmPermission
    );


    if (alarmPermission !== 1) {

      console.log(
        '[ALARM] Exact alarm permission NOT enabled'
      );

      await openExactAlarmSettings();

      return {
        success: false,
        reason:
          'EXACT_ALARM_PERMISSION_REQUIRED',
      };
    }


    // -------------------------------------------------
    // Validate Time
    // -------------------------------------------------
    if (
      !timeString ||
      !timeString.includes(':')
    ) {

      throw new Error(
        `Invalid timeString: ${timeString}`
      );
    }


    const [
      hourString,
      minuteString,
    ] = timeString.split(':');


    const hour =
      Number(hourString);

    const minute =
      Number(minuteString);


    if (
      Number.isNaN(hour) ||
      Number.isNaN(minute) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {

      throw new Error(
        `Invalid time: ${timeString}`
      );
    }


    // -------------------------------------------------
    // Calculate next trigger
    // -------------------------------------------------
    const now = new Date();

    const triggerDate = new Date();


    triggerDate.setHours(hour);
    triggerDate.setMinutes(minute);
    triggerDate.setSeconds(0);
    triggerDate.setMilliseconds(0);


    if (
      triggerDate.getTime() <=
      now.getTime()
    ) {

      triggerDate.setDate(
        triggerDate.getDate() + 1
      );
    }


    console.log(
      '[ALARM] Current time:',
      now.toLocaleString()
    );

    console.log(
      '[ALARM] Trigger time:',
      triggerDate.toLocaleString()
    );

    console.log(
      '[ALARM] Timestamp:',
      triggerDate.getTime()
    );


    // -------------------------------------------------
    // Meal Text
    // -------------------------------------------------
    const mealText =
      mealType === 'BEFORE_MEAL'
        ? 'खाने से पहले'
        : 'खाने के बाद';


    // -------------------------------------------------
    // Daily Trigger
    // -------------------------------------------------
    const trigger = {

      type: TriggerType.TIMESTAMP,

      timestamp:
        triggerDate.getTime(),

      repeatFrequency:
        RepeatFrequency.DAILY,

      alarmManager: {
        allowWhileIdle: true,
      },
    };


    // -------------------------------------------------
    // Create Notification
    // -------------------------------------------------
    await notifee.createTriggerNotification(

      {
        id: notificationId,

        title:
          `🔔 दवा का समय: ${medName}`,

        body:
          `कृपया अपनी दवा लें (${mealText})`,

        // ---------------------------------------------
        // VERY IMPORTANT
        //
        // medicineId = REAL SQLite ID
        //
        // notificationId alag hai.
        // ---------------------------------------------
        data: {

          medicineId:
            String(numericMedicineId),

          medicineName:
            medName,

          doseTime:
            timeString,

          doseIndex:
            String(doseIndex),
        },

        android: {

          channelId:
            CHANNEL_ID,

          importance:
            AndroidImportance.HIGH,

          category:
            AndroidCategory.ALARM,

          sound:
            'default',

          vibrationPattern:
            [300, 500, 300, 500],

          pressAction: {
            id: 'default',
          },

          actions: [

            {
              title:
                '✓ दवा ले ली',

              pressAction: {
                id:
                  'take_medicine_action',
              },
            },

            {
              title:
                '✕ छोड़ दी',

              pressAction: {
                id:
                  'miss_medicine_action',
              },
            },

          ],
        },
      },

      trigger

    );


    console.log(
      '[ALARM] SUCCESS'
    );

    console.log(
      '[ALARM] Medicine ID:',
      numericMedicineId
    );

    console.log(
      '[ALARM] Notification ID:',
      notificationId
    );

    console.log(
      '[ALARM] Dose:',
      doseIndex
    );

    console.log(
      '[ALARM] Next trigger:',
      triggerDate.toLocaleString()
    );

    console.log('=================================');


    return {

      success: true,

      medicineId:
        numericMedicineId,

      notificationId,

      doseIndex,

      triggerDate,
    };


  } catch (error) {

    console.log(
      '================================='
    );

    console.log(
      '[ALARM ERROR]',
      error
    );

    console.log(
      '================================='
    );


    return {

      success: false,

      reason:
        'SCHEDULING_FAILED',

      error,
    };
  }
};


// =====================================================
// Schedule Multiple Daily Doses
// =====================================================
export const scheduleMultipleDoses = async (
  medicineId,
  medName,
  imageUri,
  mealType,
  doseTimes = []
) => {

  try {

    const timesArray =
      Array.isArray(doseTimes)
        ? doseTimes
        : [doseTimes];


    if (!medicineId) {

      return {

        success: false,

        reason:
          'INVALID_MEDICINE_ID',
      };
    }


    console.log(
      '[MULTI ALARM] Medicine ID:',
      medicineId
    );

    console.log(
      '[MULTI ALARM] Doses:',
      timesArray
    );


    for (
      let i = 0;
      i < timesArray.length;
      i++
    ) {

      const timeStr =
        timesArray[i];


      // IMPORTANT:
      // Same REAL medicine ID pass hoga.
      // Dose index alag pass hoga.
      const result =
        await scheduleDailyMedicineAlarm(

          medicineId,

          medName,

          imageUri,

          mealType,

          timeStr,

          i

        );


      if (
        result &&
        !result.success
      ) {

        return result;
      }
    }


    return {
      success: true,
    };


  } catch (error) {

    console.log(
      '[MULTIPLE ALARM ERROR]',
      error
    );


    return {

      success: false,

      reason:
        'SCHEDULING_FAILED',

      error,
    };
  }
};


export const cancelAllNotificationsForMedicine = async (
  medicineId
) => {
  try {

    const baseId = String(medicineId);

    // Single-dose notification ID
    try {
      await notifee.cancelTriggerNotification(
        baseId
      );
    } catch (e) {
      console.log(
        '[ALARM] Single notification not found:',
        baseId
      );
    }


    // Multiple-dose notification IDs
    for (let i = 0; i < 10; i++) {

      const notificationId =
        `${baseId}_${i}`;

      try {

        await notifee.cancelTriggerNotification(
          notificationId
        );

        console.log(
          '[ALARM] Cancelled:',
          notificationId
        );

      } catch (e) {

        // Notification exist nahi karti to ignore
        console.log(
          '[ALARM] Notification not found:',
          notificationId
        );

      }
    }

    console.log(
      `[ALARM] All reminders cancelled for Medicine ID: ${baseId}`
    );

    return true;

  } catch (err) {

    console.log(
      '[ALARM CANCEL ERROR]',
      err
    );

    return false;
  }
};

// =====================================================
// Low Stock Alert
// =====================================================
export const triggerLowStockAlert = async (
  medName,
  remainingStock
) => {

  try {

    await notifee.displayNotification({

      title:
        `⚠️ दवा का स्टॉक कम है: ${medName}`,

      body:
        `सिर्फ ${remainingStock} गोलियां बची हैं! कृपया मेडिकल स्टोर से नई दवा ले आएं।`,

      android: {

        channelId:
          CHANNEL_ID,

        importance:
          AndroidImportance.HIGH,

        sound:
          'default',

      },
    });

  } catch (error) {

    console.log(
      '[LOW STOCK ERROR]',
      error
    );
  }
};

// =====================================================
// Health Reminder Notification
// =====================================================

export const scheduleHealthReminder = async (
  id,
  type,
  reminderDate,
  timeString
) => {
  try {
    await setupNotificationChannels();

    if (
      !reminderDate ||
      !timeString ||
      !timeString.includes(':')
    ) {
      throw new Error(
        `Invalid date/time: ${reminderDate} ${timeString}`
      );
    }

    // Date format: DD-MM-YYYY
    const [day, month, year] = reminderDate
      .split('-')
      .map(Number);

    // Time format: HH:MM
    const [hour, minute] = timeString
      .split(':')
      .map(Number);

    if (
      !day ||
      !month ||
      !year ||
      Number.isNaN(hour) ||
      Number.isNaN(minute) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      throw new Error(
        `Invalid date/time: ${reminderDate} ${timeString}`
      );
    }

    // Exact future date + time
    const triggerDate = new Date(
      year,
      month - 1,
      day,
      hour,
      minute,
      0,
      0
    );

    const now = new Date();

    console.log(
      '[HEALTH REMINDER] Current:',
      now.toLocaleString()
    );

    console.log(
      '[HEALTH REMINDER] Scheduled:',
      triggerDate.toLocaleString()
    );

    // Past date/time allow nahi karna
    if (triggerDate.getTime() <= now.getTime()) {
      throw new Error(
        'Reminder date/time must be in the future'
      );
    }

    const isBP = type === 'BP';

    await notifee.createTriggerNotification(
      {
        id: `health_${id}`,

        title: isBP
          ? '🩺 BP चेक करने का समय'
          : '🩸 Sugar चेक करने का समय',

        body: isBP
          ? 'कृपया अपना Blood Pressure check करके AayushMitra में reading दर्ज करें।'
          : 'कृपया अपना Blood Sugar check करके AayushMitra में reading दर्ज करें।',

        data: {
          healthReminderId: String(id),
          healthType: type,
          reminderDate,
          reminderTime: timeString,
        },

        android: {
          channelId: CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.ALARM,
          sound: 'default',

          vibrationPattern: [
            300,
            500,
            300,
            500,
          ],

          pressAction: {
            id: 'default',
          },
        },
      },

      {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),

        alarmManager: {
          allowWhileIdle: true,
        },
      }
    );

    console.log(
      '[HEALTH REMINDER] SUCCESS',
      {
        id,
        type,
        reminderDate,
        timeString,
      }
    );

    return {
      success: true,
      triggerDate,
    };

  } catch (error) {
    console.log(
      '[HEALTH REMINDER ERROR]',
      error
    );

    return {
      success: false,
      error,
    };
  }
};

// =====================================================
// Cancel Health Reminder Notification
// =====================================================

export const cancelHealthReminder = async (id) => {
  try {
    await notifee.cancelTriggerNotification(
      `health_${id}`
    );

    console.log(
      '[HEALTH REMINDER] Notification cancelled:',
      id
    );

    return true;

  } catch (error) {
    console.log(
      '[HEALTH REMINDER CANCEL ERROR]',
      error
    );

    return false;
  }
};

// Backward compatibility
export const triggerLowStockNotification =
  triggerLowStockAlert;

export const createNotificationChannels =
  setupNotificationChannels;
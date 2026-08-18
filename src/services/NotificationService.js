import notifee, {
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
  AndroidCategory,
  AndroidVisibility,
  AndroidAlarmMode,
} from '@notifee/react-native';

export const setupNotificationChannels = async () => {
  try {
    // 1. Android 13+ Notification Request
    await notifee.requestPermission();

    // 2. Android 12+ Exact Alarm Permission Dialog Check
    const settings = await notifee.getNotificationSettings();
    if (settings.android && settings.android.alarm === 0) {
      await notifee.openAlarmPermissionSettings();
    }

    // 3. High Priority Sound & Vibration Alarm Channel
    await notifee.createChannel({
      id: 'medicine_alarm_channel',
      name: 'Medicine Reminders',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 500, 300, 500],
      visibility: AndroidVisibility.PUBLIC,
      bypassDnd: true,
    });
    console.log('Notification channel ready');
  } catch (e) {
    console.log('Channel creation error:', e);
  }
};

export const createNotificationChannels = setupNotificationChannels;

export const scheduleDailyMedicineAlarm = async (id, medName, imageUri, mealType, timeString) => {
  try {
    await setupNotificationChannels();

    // Parse Hour and Minute accurately
    const [hourStr, minStr] = timeString.split(':');
    const targetHour = parseInt(hourStr, 10);
    const targetMin = parseInt(minStr, 10);

    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(targetHour, targetMin, 0, 0);

    // Agar set time pichhle 5 second se pehle ka hai tabhi kal ke liye set karein
    if (triggerDate.getTime() < now.getTime() - 5000) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    const mealText = mealType === 'BEFORE_MEAL' ? 'खाने से पहले' : 'खाने के बाद';

    // Exact Alarm Trigger
    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
      alarmManager: {
        type: AndroidAlarmMode.SET_ALARM_CLOCK,
        allowWhileIdle: true,
      },
    };

    await notifee.createTriggerNotification(
      {
        id: String(id),
        title: `🔔 दवा का समय: ${medName}`,
        body: `कृपया अपनी दवा लें (${mealText})`,
        android: {
          channelId: 'medicine_alarm_channel',
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.ALARM,
          sound: 'default',
          vibrationPattern: [300, 500, 300, 500],
          pressAction: {
            id: 'default',
          },
          fullScreenAction: {
            id: 'default',
          },
        },
      },
      trigger
    );

    console.log(`[ALARM SCHEDULED] Time: ${triggerDate.toLocaleTimeString()} | ID: ${id}`);
  } catch (err) {
    console.log('Alarm scheduling failed:', err);
  }
};
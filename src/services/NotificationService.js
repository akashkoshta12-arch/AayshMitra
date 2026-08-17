import notifee, { TriggerType, RepeatFrequency, AndroidImportance, AndroidVisibility } from '@notifee/react-native';

export const setupNotificationChannels = async () => {
  await notifee.createChannel({
    id: 'medicine_alarms',
    name: 'Dawa Reminders',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
};

export const scheduleDailyMedicineAlarm = async (id, name, imageUri, mealType, hour, minute) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  if (date.getTime() <= Date.now()) {
    date.setDate(date.getDate() + 1);
  }

  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: date.getTime(),
    repeatFrequency: RepeatFrequency.DAILY,
    alarmManager: { allowWhileIdle: true },
  };

  await notifee.createTriggerNotification(
    {
      id: `med_${id}`,
      title: `🔔 Dawa Lene Ka Time: ${name}`,
      body: mealType === 'BEFORE_MEAL' ? '⚠️ Khane Se Pehle Lein' : '✅ Khane Ke Baad Lein',
      android: {
        channelId: 'medicine_alarms',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        fullScreenAction: { id: 'default' },
        pressAction: { id: 'default', launchActivity: 'default' },
      },
      data: { id: id.toString(), name, imageUri, mealType },
    },
    trigger
  );
};
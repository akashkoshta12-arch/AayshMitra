import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import notifee, { EventType } from '@notifee/react-native';

// Handle background notifications
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;

  if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
    if (pressAction?.id === 'default') {
      // Background press handled automatically via navigation
      await notifee.cancelNotification(notification.id);
    }
  }
});

AppRegistry.registerComponent(appName, () => App);
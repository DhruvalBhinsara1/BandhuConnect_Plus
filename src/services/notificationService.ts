import { Platform, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Conditionally import notifications only if available
let Notifications: any = null;
let Device: any = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
} catch (error) {
  console.log('Expo notifications not available in this environment');
}

// Configure notification behavior only if available
if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.log('Notification handler setup failed - using fallback mode');
  }
}

export class NotificationService {
  static async registerForPushNotifications(): Promise<string | null> {
    // Check if notifications are available
    if (!Notifications || !Device) {
      console.log('Notifications not available - running in Expo Go fallback mode');
      return null;
    }

    let token = null;

    if (Device.isDevice) {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return null;
        }
        
        // Try to get push token, but handle Expo Go limitations
        try {
          token = (await Notifications.getExpoPushTokenAsync()).data;
          console.log('Push notification token:', token);
          
          // Store token locally
          await SecureStore.setItemAsync('pushToken', token);
        } catch (error) {
          console.log('Push notifications not supported in Expo Go. Using local notifications only.');
          console.log('For full push notification support, create a development build.');
        }
      } catch (error) {
        console.log('Error setting up notifications:', error);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    // Configure platform-specific notification channels
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'BandhuConnect+ Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
      });
      
      // Create separate channels for different notification types
      await Notifications.setNotificationChannelAsync('task_assignments', {
        name: 'Task Assignments',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#FF6B35',
        sound: 'default',
      });
      
      await Notifications.setNotificationChannelAsync('task_updates', {
        name: 'Task Updates',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
        sound: 'default',
      });
    }

    return token;
  }

  static async sendTaskAssignmentNotification(taskTitle: string, taskType: string) {
    if (!Notifications) {
      // Fallback to Alert for Expo Go
      Alert.alert(
        'New Task Assigned! 🚨',
        `You have been assigned: ${taskTitle} (${taskType})`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'New Task Assigned! 🚨',
          body: `You have been assigned: ${taskTitle} (${taskType})`,
          data: { 
            type: 'task_assignment',
            taskTitle,
            taskType 
          },
          sound: 'default',
          categoryIdentifier: 'task_assignment',
        },
        trigger: null, // Send immediately
        identifier: `task_assignment_${Date.now()}`,
      });
    } catch (error) {
      console.log('Notification failed, using alert fallback');
      Alert.alert(
        'New Task Assigned! 🚨',
        `You have been assigned: ${taskTitle} (${taskType})`,
        [{ text: 'OK' }]
      );
    }
  }

  static async sendTaskReminderNotification(taskTitle: string) {
    if (!Notifications) {
      Alert.alert(
        'Task Reminder ⏰',
        `Don't forget to complete: ${taskTitle}`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Task Reminder ⏰',
          body: `Don't forget to complete: ${taskTitle}`,
          data: { 
            type: 'task_reminder',
            taskTitle 
          },
          sound: 'default',
          categoryIdentifier: 'task_reminder',
        },
        trigger: null,
        identifier: `task_reminder_${Date.now()}`,
      });
    } catch (error) {
      Alert.alert(
        'Task Reminder ⏰',
        `Don't forget to complete: ${taskTitle}`,
        [{ text: 'OK' }]
      );
    }
  }

  static async sendTaskCompletionNotification(taskTitle: string) {
    if (!Notifications) {
      Alert.alert(
        'Task Completed! ✅',
        `Great job completing: ${taskTitle}`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Task Completed! ✅',
          body: `Great job completing: ${taskTitle}`,
          data: { 
            type: 'task_completion',
            taskTitle 
          },
          sound: 'default',
          categoryIdentifier: 'task_completion',
        },
        trigger: null,
        identifier: `task_completion_${Date.now()}`,
      });
    } catch (error) {
      Alert.alert(
        'Task Completed! ✅',
        `Great job completing: ${taskTitle}`,
        [{ text: 'OK' }]
      );
    }
  }

  static setupNotificationListeners(navigation?: any) {
    if (!Notifications) {
      console.log('Notification listeners not available in Expo Go');
      return {
        foregroundSubscription: { remove: () => {} },
        responseSubscription: { remove: () => {} },
      };
    }

    try {
      // Handle notification received while app is in foreground
      const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received in foreground:', notification);
      });

      // Handle notification response (user tapped notification)
      const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
        const data = response.notification.request.content.data;
        
        if (data.type === 'task_assignment' && navigation) {
          // Navigate to tasks list when user taps notification
          navigation.navigate('Tasks');
        } else if (data.type === 'task_reminder' && navigation) {
          // Navigate to tasks list for reminders
          navigation.navigate('Tasks');
        }
      });

      return {
        foregroundSubscription,
        responseSubscription,
      };
    } catch (error) {
      console.log('Failed to setup notification listeners');
      return {
        foregroundSubscription: { remove: () => {} },
        responseSubscription: { remove: () => {} },
      };
    }
  }

  static async clearAllNotifications() {
    if (!Notifications) return;
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.log('Clear notifications not available');
    }
  }

  static async getBadgeCount(): Promise<number> {
    if (!Notifications) return 0;
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      return 0;
    }
  }

  static async setBadgeCount(count: number) {
    if (!Notifications) return;
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.log('Badge count not available');
    }
  }
}

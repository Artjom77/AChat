import messaging from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

export class NotificationService {
  /**
   * Initialize push notifications
   */
  static async initialize(): Promise<void> {
    try {
      // Request permission
      const hasPermission = await this.requestPermission();

      if (!hasPermission) {
        console.log('Push notification permission denied');
        return;
      }

      // Get FCM token
      const token = await messaging().getToken();
      console.log('FCM Token:', token);

      // Save token locally
      await AsyncStorage.setItem('fcmToken', token);

      // Send token to backend
      await this.sendTokenToServer(token);

      // Setup message handlers
      this.setupMessageHandlers();

      // Handle token refresh
      messaging().onTokenRefresh(async newToken => {
        await AsyncStorage.setItem('fcmToken', newToken);
        await this.sendTokenToServer(newToken);
      });

    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();

      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      return enabled;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  /**
   * Setup message handlers
   */
  static setupMessageHandlers(): void {
    // Foreground messages
    messaging().onMessage(async remoteMessage => {
      console.log('Foreground message:', remoteMessage);

      // Show local notification
      if (remoteMessage.notification) {
        this.showLocalNotification(
          remoteMessage.notification.title || 'AChat',
          remoteMessage.notification.body || ''
        );
      }
    });

    // Background/Quit messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background message:', remoteMessage);
      // Process message in background
    });

    // Notification opened app
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app:', remoteMessage);

      // Navigate to chat if message notification
      if (remoteMessage.data?.conversationId) {
        // TODO: Navigate to chat screen
      }
    });

    // Check if app was opened by notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('App opened by notification:', remoteMessage);
        }
      });
  }

  /**
   * Send FCM token to backend
   */
  static async sendTokenToServer(token: string): Promise<void> {
    try {
      await apiClient.post('/push/register', {
        token,
        platform: Platform.OS,
        device: {
          os: Platform.OS,
          version: Platform.Version,
        },
      });

      console.log('Token registered on server');
    } catch (error) {
      console.error('Failed to register token:', error);
    }
  }

  /**
   * Show local notification (for foreground messages)
   */
  static showLocalNotification(title: string, body: string): void {
    Alert.alert(title, body, [
      { text: 'OK', onPress: () => console.log('Notification dismissed') },
    ]);

    // TODO: Use react-native-push-notification for better local notifications
  }

  /**
   * Get current FCM token
   */
  static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('fcmToken');
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }

  /**
   * Check if notifications are enabled
   */
  static async isEnabled(): Promise<boolean> {
    try {
      const authStatus = await messaging().hasPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Unregister from push notifications
   */
  static async unregister(): Promise<void> {
    try {
      const token = await this.getToken();

      if (token) {
        await apiClient.post('/push/unregister', { token });
        await messaging().deleteToken();
        await AsyncStorage.removeItem('fcmToken');
      }
    } catch (error) {
      console.error('Failed to unregister:', error);
    }
  }
}

export default NotificationService;

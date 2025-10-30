import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { StatusBar } from 'react-native';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { getWebSocketService } from './src/services/WebSocketService';
import NotificationService from './src/services/NotificationService';

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize services
    initializeServices();

    return () => {
      // Cleanup on unmount
      const wsService = getWebSocketService();
      wsService.disconnect();
    };
  }, []);

  const initializeServices = async () => {
    try {
      // Initialize push notifications
      await NotificationService.initialize();
      console.log('✅ Notifications initialized');

      // Connect WebSocket
      const wsService = getWebSocketService();
      await wsService.connect();
      console.log('✅ WebSocket connected');

    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  };

  return (
    <Provider store={store}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AppNavigator />
    </Provider>
  );
}

export default App;

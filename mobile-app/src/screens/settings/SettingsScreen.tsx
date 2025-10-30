import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Avatar from '../../components/Avatar';
import NotificationService from '../../services/NotificationService';
import BluetoothService from '../../services/BluetoothService';
import EncryptionService from '../../services/EncryptionService';

export default function SettingsScreen({ navigation }: any) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [bluetoothStatus, setBluetoothStatus] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const userStr = await AsyncStorage.getItem('currentUser');
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }

      const notifEnabled = await NotificationService.isEnabled();
      setNotificationsEnabled(notifEnabled);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);

    if (value) {
      await NotificationService.initialize();
    } else {
      await NotificationService.unregister();
    }
  };

  const toggleBluetooth = async (value: boolean) => {
    setBluetoothEnabled(value);

    if (value) {
      try {
        const bluetooth = new BluetoothService();
        await bluetooth.initialize();
        await bluetooth.startScanning();

        const status = bluetooth.getStatus();
        setBluetoothStatus(status);

        Alert.alert('Bluetooth Mesh', 'Сканирование устройств запущено');
      } catch (error: any) {
        Alert.alert('Ошибка', error.message);
        setBluetoothEnabled(false);
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Выход',
      'Точно хочешь выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('currentUser');
            await EncryptionService.deleteKeys();
            // TODO: Navigate to Login
          },
        },
      ]
    );
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle: string,
    onPress?: () => void,
    value?: boolean,
    onValueChange?: (value: boolean) => void
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress && !onValueChange}
    >
      <View style={styles.settingIcon}>
        <Icon name={icon} size={24} color="#667eea" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      {onValueChange ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#ccc', true: '#667eea' }}
        />
      ) : (
        <Icon name="chevron-right" size={24} color="#ccc" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <TouchableOpacity
        style={styles.profileSection}
        onPress={() => navigation.navigate('Profile')}
      >
        <Avatar
          username={currentUser?.username || 'User'}
          size={70}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {currentUser?.username || 'User'}
          </Text>
          <Text style={styles.profileEmail}>
            {currentUser?.email || 'email@example.com'}
          </Text>
        </View>
        <Icon name="chevron-right" size={24} color="#ccc" />
      </TouchableOpacity>

      {/* General Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Основные</Text>
        {renderSettingItem(
          'bell',
          'Push уведомления',
          'Получать уведомления о новых сообщениях',
          undefined,
          notificationsEnabled,
          toggleNotifications
        )}
        {renderSettingItem(
          'bluetooth',
          'Bluetooth Mesh',
          bluetoothEnabled
            ? `Активно • ${bluetoothStatus?.connectedDevices || 0} устройств`
            : 'Сообщения без интернета',
          undefined,
          bluetoothEnabled,
          toggleBluetooth
        )}
        {renderSettingItem(
          'theme-light-dark',
          'Тёмная тема',
          'Включить тёмный режим интерфейса',
          undefined,
          false,
          () => Alert.alert('Coming Soon', 'Скоро!')
        )}
      </View>

      {/* Privacy Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Приватность</Text>
        {renderSettingItem(
          'lock',
          'E2E шифрование',
          'Все сообщения зашифрованы',
          () => Alert.alert(
            'E2E Шифрование',
            'Все твои сообщения защищены сквозным шифрованием. Даже мы не можем их прочитать.'
          )
        )}
        {renderSettingItem(
          'shield-check',
          'Блокировка приложения',
          'PIN-код или биометрия при запуске',
          () => Alert.alert('Coming Soon', 'Скоро!')
        )}
        {renderSettingItem(
          'eye-off',
          'Режим невидимки',
          'Скрыть статус онлайн',
          () => Alert.alert('Coming Soon', 'Скоро!')
        )}
      </View>

      {/* Chat Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Чаты</Text>
        {renderSettingItem(
          'backup-restore',
          'Резервное копирование',
          'Сохранить чаты в облако',
          () => Alert.alert('Coming Soon', 'Скоро!')
        )}
        {renderSettingItem(
          'download',
          'Автозагрузка медиа',
          'Автоматически загружать фото и видео',
          undefined,
          true,
          () => {}
        )}
        {renderSettingItem(
          'archive',
          'Архив чатов',
          'Посмотреть архивированные чаты',
          () => Alert.alert('Coming Soon', 'Скоро!')
        )}
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>О приложении</Text>
        {renderSettingItem(
          'information',
          'О AChat',
          'Версия 1.0.0',
          () => Alert.alert(
            'AChat',
            'Защищённый мессенджер с AI-модерацией и Bluetooth mesh networking.\n\nВерсия: 1.0.0\n\n© 2024 AChat'
          )
        )}
        {renderSettingItem(
          'file-document',
          'Условия использования',
          'Политика конфиденциальности',
          () => Alert.alert('Coming Soon', 'Скоро!')
        )}
        {renderSettingItem(
          'help-circle',
          'Помощь и поддержка',
          'FAQ и связь с поддержкой',
          () => Alert.alert('Coming Soon', 'Скоро!')
        )}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" size={20} color="#fa709a" />
        <Text style={styles.logoutText}>Выйти из аккаунта</Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 10,
    paddingVertical: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 20,
    paddingVertical: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: 'white',
    marginTop: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fa709a',
    marginLeft: 10,
  },
  bottomPadding: {
    height: 40,
  },
});

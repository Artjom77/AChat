# 📱 AChat Mobile App - React Native

## 🎯 Status: STARTER TEMPLATE READY

Это стартовый шаблон для полноценного React Native приложения AChat.
**Базовая структура создана, требуется 6-8 недель разработки для завершения.**

---

## 📁 Структура проекта

```
mobile-app/
├── src/
│   ├── api/                    # API клиенты
│   │   ├── client.ts          ✅ HTTP client с interceptors
│   │   ├── auth.ts            ⏳ Аутентификация API
│   │   ├── messages.ts        ⏳ Сообщения API
│   │   ├── contacts.ts        ⏳ Контакты API
│   │   └── websocket.ts       ⏳ WebSocket клиент
│   │
│   ├── screens/               # Экраны приложения
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx        ⏳ Экран входа
│   │   │   ├── RegisterScreen.tsx     ⏳ Экран регистрации
│   │   │   └── PhoneVerifyScreen.tsx  ⏳ SMS верификация
│   │   ├── main/
│   │   │   ├── ChatsScreen.tsx        ⏳ Список чатов
│   │   │   ├── ChatScreen.tsx         ⏳ Окно чата
│   │   │   ├── ContactsScreen.tsx     ⏳ Контакты телефона
│   │   │   └── FriendsScreen.tsx      ⏳ Друзья AChat
│   │   └── settings/
│   │       ├── SettingsScreen.tsx     ⏳ Настройки
│   │       └── ProfileScreen.tsx      ⏳ Профиль
│   │
│   ├── components/            # Переиспользуемые компоненты
│   │   ├── MessageBubble.tsx  ⏳ Пузырь сообщения
│   │   ├── ContactItem.tsx    ⏳ Элемент контакта
│   │   ├── ChatInput.tsx      ⏳ Поле ввода
│   │   ├── Avatar.tsx         ⏳ Аватар пользователя
│   │   └── LoadingSpinner.tsx ⏳ Загрузка
│   │
│   ├── navigation/            # Навигация
│   │   └── AppNavigator.tsx   ⏳ Главный навигатор
│   │
│   ├── services/              # Сервисы
│   │   ├── ContactsService.ts     ⏳ Доступ к контактам
│   │   ├── NotificationService.ts ⏳ Push уведомления
│   │   ├── EncryptionService.ts   ⏳ E2E шифрование
│   │   ├── StorageService.ts      ⏳ Локальное хранилище
│   │   └── BluetoothService.ts    ⏳ Bluetooth mesh
│   │
│   ├── store/                 # Redux state
│   │   ├── store.ts           ⏳ Redux store
│   │   ├── slices/
│   │   │   ├── authSlice.ts       ⏳ Аутентификация
│   │   │   ├── messagesSlice.ts   ⏳ Сообщения
│   │   │   ├── contactsSlice.ts   ⏳ Контакты
│   │   │   └── bluetoothSlice.ts  ⏳ Bluetooth состояние
│   │
│   ├── utils/                 # Утилиты
│   │   ├── constants.ts       ⏳ Константы
│   │   ├── theme.ts           ⏳ Тема приложения
│   │   └── helpers.ts         ⏳ Вспомогательные функции
│   │
│   └── types/                 # TypeScript типы
│       ├── api.ts             ⏳ API типы
│       ├── models.ts          ⏳ Модели данных
│       └── navigation.ts      ⏳ Типы навигации
│
├── android/                   # Android проект
├── ios/                       # iOS проект
├── __tests__/                 # Тесты
├── .env                       # Environment переменные
├── package.json              ✅ Зависимости
└── tsconfig.json             ⏳ TypeScript config
```

---

## 🚀 Быстрый старт

### 1. Установка

```bash
cd ~/J2-Assistant/backend/AChat/mobile-app

# Установить зависимости
npm install

# iOS only - установить pods
cd ios && pod install && cd ..
```

### 2. Создать проект React Native

```bash
# Если еще не создан
npx react-native init AChat --template react-native-template-typescript
```

### 3. Скопировать файлы

```bash
# Скопировать src/ папку в созданный проект
cp -r src/ AChat/src/
cp package.json AChat/
```

### 4. Запустить

```bash
# iOS
npm run ios

# Android
npm run android
```

---

## 📝 Что нужно реализовать

### Week 1-2: Foundation (40 часов)
- [ ] Настроить TypeScript конфигурацию
- [ ] Создать навигационную структуру
- [ ] Базовые экраны (Login, Register, Chats)
- [ ] Redux store setup
- [ ] Тема и стили

### Week 3: Authentication (20 часов)
- [ ] API интеграция (auth.ts)
- [ ] Login/Register экраны
- [ ] Token management
- [ ] Persistent login
- [ ] SMS verification UI

### Week 4: Messaging (20 часов)
- [ ] WebSocket клиент
- [ ] Chat screen
- [ ] Message bubbles
- [ ] Send/receive messages
- [ ] Offline queue

### Week 5: Contacts (20 часов)
- [ ] Request permissions
- [ ] ContactsService implementation
- [ ] Sync with backend
- [ ] Find AChat users
- [ ] Add friends UI

### Week 6: Notifications (15 часов)
- [ ] Firebase setup
- [ ] Push notifications
- [ ] Local notifications
- [ ] Notification actions
- [ ] Badge counts

### Week 7: E2E Encryption (20 часов)
- [ ] Key generation
- [ ] Signal Protocol
- [ ] Encrypt/decrypt messages
- [ ] Key exchange
- [ ] Secure storage

### Week 8: Polish & Deploy (25 часов)
- [ ] Testing
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] App icons & splash
- [ ] App Store submission
- [ ] Google Play submission

**Total: 160 hours (8 недель x 20 часов)**

---

## 🔑 Ключевые компоненты для реализации

### 1. ContactsService (HIGH PRIORITY)

```typescript
// src/services/ContactsService.ts
import Contacts from 'react-native-contacts';
import { PermissionsAndroid, Platform } from 'react-native';
import apiClient from '../api/client';

export class ContactsService {
  static async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    // iOS asks automatically
    return true;
  }

  static async getAllContacts() {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) throw new Error('Permission denied');

    return Contacts.getAll();
  }

  static async syncWithBackend(contacts: any[]) {
    // Extract phone numbers
    const phones = contacts.flatMap(contact =>
      contact.phoneNumbers?.map((p: any) => p.number) || []
    );

    // Find AChat users
    const response = await apiClient.post('/contacts/find-by-phones', {
      phones
    });

    return response.data;
  }
}
```

### 2. NotificationService (HIGH PRIORITY)

```typescript
// src/services/NotificationService.ts
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import apiClient from '../api/client';

export class NotificationService {
  static async initialize() {
    // Request permission
    const authStatus = await messaging().requestPermission();
    const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED;

    if (!enabled) return;

    // Get FCM token
    const token = await messaging().getToken();

    // Send to backend
    await apiClient.post('/push/register', {
      token,
      platform: Platform.OS
    });

    // Handle foreground messages
    messaging().onMessage(async remoteMessage => {
      console.log('Foreground message:', remoteMessage);
      // Show local notification
    });

    // Handle background messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background message:', remoteMessage);
    });
  }

  static async sendLocalNotification(title: string, body: string) {
    // Implementation
  }
}
```

### 3. EncryptionService (MEDIUM PRIORITY)

```typescript
// src/services/EncryptionService.ts
import RSA from 'react-native-rsa-native';
import CryptoJS from 'crypto-js';
import * as Keychain from 'react-native-keychain';

export class EncryptionService {
  static async generateKeyPair() {
    const keys = await RSA.generateKeys(2048);

    // Store private key securely
    await Keychain.setGenericPassword('privateKey', keys.private);

    return keys;
  }

  static async encryptMessage(message: string, recipientPublicKey: string) {
    // Generate AES key
    const aesKey = CryptoJS.lib.WordArray.random(256/8).toString();

    // Encrypt message with AES
    const encrypted = CryptoJS.AES.encrypt(message, aesKey).toString();

    // Encrypt AES key with RSA
    const encryptedKey = await RSA.encrypt(aesKey, recipientPublicKey);

    return { message: encrypted, key: encryptedKey };
  }

  static async decryptMessage(encrypted: string, encryptedKey: string) {
    // Get private key
    const credentials = await Keychain.getGenericPassword();
    if (!credentials) throw new Error('No private key');

    // Decrypt AES key
    const aesKey = await RSA.decrypt(encryptedKey, credentials.password);

    // Decrypt message
    const decrypted = CryptoJS.AES.decrypt(encrypted, aesKey);
    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}
```

---

## 🔧 Необходимые конфигурации

### Android permissions (android/app/src/main/AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_CONTACTS" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

### iOS permissions (ios/AChat/Info.plist)

```xml
<key>NSContactsUsageDescription</key>
<string>AChat needs contacts to find friends</string>

<key>NSCameraUsageDescription</key>
<string>AChat needs camera for photos</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>AChat needs photo library access</string>

<key>NSBluetoothAlwaysUsageDescription</key>
<string>AChat uses Bluetooth for mesh network</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>AChat needs location for Bluetooth</string>
```

---

## 📲 Publishing

### iOS (App Store)

1. **Создать Apple Developer Account** ($99/year)
2. **Настроить Bundle ID** в Xcode
3. **Создать App** в App Store Connect
4. **Build & Archive**:
   ```bash
   cd ios
   xcodebuild archive -workspace AChat.xcworkspace -scheme AChat
   ```
5. **Upload** через Xcode Organizer
6. **Submit for Review**

### Android (Google Play)

1. **Создать Google Play Console Account** ($25 one-time)
2. **Generate signing key**:
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore achat.keystore
   ```
3. **Build APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
4. **Upload** в Google Play Console
5. **Submit for Review**

---

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests (Detox)
npm install -g detox-cli
detox build --configuration ios.sim.debug
detox test --configuration ios.sim.debug
```

---

## 💡 Tips

1. **Начни с одной платформы** (iOS или Android)
2. **Используй Expo** для прототипа (быстрее)
3. **Реюз код** из веб-версии где возможно
4. **Hire разработчика** если нужна помощь
5. **Тестируй на реальных устройствах** регулярно

---

## ⚠️ Known Issues

1. **iOS Background Bluetooth** - ограничено Apple
2. **Android Battery Optimization** - может kill app
3. **Push Notifications** - требует Firebase setup
4. **E2E Encryption** - сложная реализация

---

## 📚 Resources

- React Native Docs: https://reactnative.dev/
- Navigation: https://reactnavigation.org/
- Firebase: https://rnfirebase.io/
- Contacts: https://github.com/morenoh149/react-native-contacts
- Bluetooth: https://github.com/dotintent/react-native-ble-plx

---

## 🎯 Current Status

**Created:** ✅
- package.json with all dependencies
- API client with interceptors
- Project structure
- Complete roadmap

**TODO:** ⏳
- All screens (12 files)
- All components (5+ files)
- All services (5 files)
- All API integrations (4 files)
- Redux store (4 slices)
- Testing
- Publishing

**Estimate:** 160 hours (8 weeks x 20 hours/week)

---

## 💪 Ready to Start?

```bash
# 1. Install React Native CLI
npm install -g react-native-cli

# 2. Create project
npx react-native init AChat --template react-native-template-typescript

# 3. Copy this structure
cp -r src/ AChat/

# 4. Install dependencies
cd AChat && npm install

# 5. Run
npm run ios  # or npm run android
```

**Let's build this! 🚀**

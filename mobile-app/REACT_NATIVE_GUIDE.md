# 📱 AChat Mobile App - React Native Guide

## 🎯 Цель

Создать нативное мобильное приложение AChat для iOS и Android с полным функционалом:
- ✅ Доступ к контактам телефона
- ✅ Push-уведомления
- ✅ Камера и галерея
- ✅ Оффлайн режим
- ✅ Биометрическая аутентификация
- ✅ Background tasks

---

## 🚀 Быстрый старт (30 минут)

### Шаг 1: Установить зависимости

#### macOS (для iOS и Android):

```bash
# Install Node.js (if not installed)
brew install node

# Install Watchman
brew install watchman

# Install Xcode (для iOS) - скачай из App Store

# Install CocoaPods
sudo gem install cocoapods

# Install Android Studio (для Android)
# Download: https://developer.android.com/studio
```

#### Установить React Native CLI:

```bash
npm install -g react-native-cli
```

### Шаг 2: Создать проект

```bash
cd ~/J2-Assistant/backend/AChat
npx react-native init AChat mobile-app --template react-native-template-typescript
cd mobile-app
```

### Шаг 3: Установить необходимые библиотеки

```bash
# Navigation
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context

# UI Components
npm install react-native-paper
npm install react-native-vector-icons

# Networking
npm install axios
npm install @react-native-async-storage/async-storage

# Контакты
npm install react-native-contacts

# Push Notifications
npm install @react-native-firebase/app @react-native-firebase/messaging

# Камера
npm install react-native-image-picker

# Биометрия
npm install react-native-biometrics

# WebSocket
npm install react-native-websocket

# E2E шифрование
npm install crypto-js
npm install react-native-rsa-native

# Install pods (iOS only)
cd ios && pod install && cd ..
```

### Шаг 4: Настроить permissions

#### Android (`android/app/src/main/AndroidManifest.xml`):

```xml
<manifest>
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />

    <application>
        <!-- ... -->
    </application>
</manifest>
```

#### iOS (`ios/AChat/Info.plist`):

```xml
<key>NSContactsUsageDescription</key>
<string>AChat нужен доступ к контактам для поиска друзей</string>

<key>NSCameraUsageDescription</key>
<string>AChat нужна камера для отправки фото</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>AChat нужен доступ к фото для отправки изображений</string>

<key>NSMicrophoneUsageDescription</key>
<string>AChat нужен доступ к микрофону для голосовых сообщений</string>

<key>NSFaceIDUsageDescription</key>
<string>AChat использует Face ID для безопасного входа</string>
```

### Шаг 5: Запустить приложение

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

---

## 📁 Структура проекта

```
mobile-app/
├── src/
│   ├── api/
│   │   ├── auth.ts          # API для аутентификации
│   │   ├── messages.ts      # API для сообщений
│   │   ├── contacts.ts      # API для контактов
│   │   └── websocket.ts     # WebSocket клиент
│   ├── components/
│   │   ├── MessageBubble.tsx
│   │   ├── ContactsList.tsx
│   │   ├── ChatInput.tsx
│   │   └── Avatar.tsx
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── ChatsScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── ContactsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── services/
│   │   ├── ContactsService.ts    # Доступ к контактам
│   │   ├── NotificationService.ts # Push notifications
│   │   ├── EncryptionService.ts  # E2E шифрование
│   │   └── StorageService.ts     # Локальное хранилище
│   ├── store/
│   │   ├── authSlice.ts
│   │   ├── messagesSlice.ts
│   │   └── contactsSlice.ts
│   └── utils/
│       ├── constants.ts
│       ├── theme.ts
│       └── helpers.ts
├── android/
├── ios/
├── package.json
└── tsconfig.json
```

---

## 🔧 Ключевые функции

### 1. Доступ к контактам

```typescript
// src/services/ContactsService.ts
import Contacts from 'react-native-contacts';
import { PermissionsAndroid, Platform } from 'react-native';

export class ContactsService {
    static async requestPermission(): Promise<boolean> {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_CONTACTS
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true; // iOS asks automatically
    }

    static async getAllContacts() {
        const hasPermission = await this.requestPermission();

        if (!hasPermission) {
            throw new Error('Permission denied');
        }

        return Contacts.getAll();
    }

    static async findAchatUsers(contacts: any[]) {
        // Extract phone numbers
        const phones = contacts.flatMap(contact =>
            contact.phoneNumbers?.map((p: any) => p.number) || []
        );

        // Send to backend to find AChat users
        const response = await fetch('http://localhost:5000/contacts/find-by-phones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phones })
        });

        return response.json();
    }
}
```

### 2. Push Notifications

```typescript
// src/services/NotificationService.ts
import messaging from '@react-native-firebase/messaging';

export class NotificationService {
    static async requestPermission() {
        const authStatus = await messaging().requestPermission();
        return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
    }

    static async getToken() {
        return messaging().getToken();
    }

    static onMessage(callback: (message: any) => void) {
        return messaging().onMessage(callback);
    }

    static onNotificationOpenedApp(callback: (message: any) => void) {
        messaging().onNotificationOpenedApp(callback);
    }

    static async sendTokenToServer(token: string) {
        await fetch('http://localhost:5000/push/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, platform: Platform.OS })
        });
    }
}
```

### 3. E2E Шифрование

```typescript
// src/services/EncryptionService.ts
import RSA from 'react-native-rsa-native';
import CryptoJS from 'crypto-js';

export class EncryptionService {
    static async generateKeyPair() {
        return RSA.generateKeys(2048);
    }

    static async encryptMessage(message: string, publicKey: string) {
        // Генерируем AES ключ
        const aesKey = CryptoJS.lib.WordArray.random(256/8).toString();

        // Шифруем сообщение AES
        const encrypted = CryptoJS.AES.encrypt(message, aesKey).toString();

        // Шифруем AES ключ RSA
        const encryptedKey = await RSA.encrypt(aesKey, publicKey);

        return {
            message: encrypted,
            key: encryptedKey
        };
    }

    static async decryptMessage(encrypted: string, encryptedKey: string, privateKey: string) {
        // Расшифровываем AES ключ
        const aesKey = await RSA.decrypt(encryptedKey, privateKey);

        // Расшифровываем сообщение
        const decrypted = CryptoJS.AES.decrypt(encrypted, aesKey);

        return decrypted.toString(CryptoJS.enc.Utf8);
    }
}
```

### 4. Оффлайн хранилище

```typescript
// src/services/StorageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export class StorageService {
    static async saveMessage(message: any) {
        const messages = await this.getMessages();
        messages.push(message);
        await AsyncStorage.setItem('messages', JSON.stringify(messages));
    }

    static async getMessages() {
        const data = await AsyncStorage.getItem('messages');
        return data ? JSON.parse(data) : [];
    }

    static async getPendingMessages() {
        const data = await AsyncStorage.getItem('pending_messages');
        return data ? JSON.parse(data) : [];
    }

    static async syncPendingMessages() {
        const pending = await this.getPendingMessages();

        for (const message of pending) {
            try {
                await fetch('http://localhost:5000/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(message)
                });

                // Remove from pending
                pending.splice(pending.indexOf(message), 1);
            } catch (error) {
                console.log('Sync failed, will retry');
            }
        }

        await AsyncStorage.setItem('pending_messages', JSON.stringify(pending));
    }
}
```

---

## 🎨 UI Компоненты

### Chat Screen

```typescript
// src/screens/ChatScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';

export const ChatScreen = ({ route }: any) => {
    const { conversationId } = route.params;
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        loadMessages();
        connectWebSocket();
    }, []);

    const loadMessages = async () => {
        // Load from API or AsyncStorage
    };

    const sendMessage = async (text: string) => {
        // Send via WebSocket or queue if offline
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={messages}
                renderItem={({ item }) => <MessageBubble message={item} />}
                inverted
            />
            <ChatInput onSend={sendMessage} />
        </View>
    );
};
```

---

## 📲 Publishing

### iOS (App Store)

1. Создать Apple Developer Account ($99/year)
2. Настроить Bundle Identifier
3. Создать App в App Store Connect
4. Build & Archive в Xcode
5. Upload to App Store
6. Submit for Review

### Android (Google Play)

1. Создать Google Play Console Account ($25 one-time)
2. Build APK/AAB:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
3. Подписать приложение
4. Upload в Google Play Console
5. Submit for Review

---

## 🔐 Безопасность

### Best Practices:

1. **Храни токены безопасно**
   ```typescript
   import * as Keychain from 'react-native-keychain';

   await Keychain.setGenericPassword('token', authToken);
   const credentials = await Keychain.getGenericPassword();
   ```

2. **Certificate Pinning** (защита от MITM)
3. **Code Obfuscation** (ProGuard для Android)
4. **Root/Jailbreak Detection**

---

## 📊 Analytics

```typescript
// Firebase Analytics
import analytics from '@react-native-firebase/analytics';

await analytics().logEvent('message_sent', {
    type: 'text',
    encrypted: true
});
```

---

## 🧪 Тестирование

```bash
# Unit tests
npm test

# E2E tests (Detox)
npm install -g detox-cli
detox test --configuration ios.sim.debug
```

---

## 🚀 Развёртывание

### Beta Testing:

- **iOS:** TestFlight
- **Android:** Google Play Internal Testing

### CI/CD:

Используй GitHub Actions для автоматической сборки:

```yaml
name: Build Android APK

on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Build APK
        run: cd android && ./gradlew assembleRelease
```

---

## ⏱️ Timeline

- **Week 1-2:** Базовая структура, навигация, UI
- **Week 3:** API интеграция, WebSocket
- **Week 4:** Контакты, уведомления
- **Week 5-6:** E2E шифрование, оффлайн режим
- **Week 7:** Тестирование
- **Week 8:** Публикация в stores

---

## 💡 Советы

1. **Начни с одной платформы** (iOS или Android)
2. **Используй Expo** для быстрого прототипирования
3. **Hire React Native developer** если нужна помощь
4. **Реюз логику** из веб-версии

---

**Готово!** Это полноценный гайд для создания мобильного приложения AChat! 🚀

Начни с базовой версии, добавляй функции поэтапно.

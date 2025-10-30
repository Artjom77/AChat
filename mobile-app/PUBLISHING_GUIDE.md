# 🚀 AChat - Complete Publishing Guide

## 📱 Google Play Store Publishing

### Prerequisites
- ✅ Google Play Developer Account ($25 one-time fee)
- ✅ Signed APK or AAB (Android App Bundle)
- ✅ App screenshots (phone + tablet)
- ✅ Feature graphic (1024 x 500)
- ✅ App icon (512 x 512)
- ✅ Privacy Policy URL

### Step 1: Build Release APK/AAB

```bash
cd mobile-app

# Generate keystore (first time only)
keytool -genkeypair -v -storetype PKCS12 \
  -keystore achat-release.keystore \
  -alias achat-key \
  -keyalg RSA -keysize 2048 -validity 10000

# Build AAB (recommended)
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab

# Or build APK
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Step 2: Configure Gradle Signing

Edit `android/gradle.properties`:
```properties
ACHAT_UPLOAD_STORE_FILE=achat-release.keystore
ACHAT_UPLOAD_KEY_ALIAS=achat-key
ACHAT_UPLOAD_STORE_PASSWORD=your_keystore_password
ACHAT_UPLOAD_KEY_PASSWORD=your_key_password
```

Edit `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('ACHAT_UPLOAD_STORE_FILE')) {
                storeFile file(ACHAT_UPLOAD_STORE_FILE)
                storePassword ACHAT_UPLOAD_STORE_PASSWORD
                keyAlias ACHAT_UPLOAD_KEY_ALIAS
                keyPassword ACHAT_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 3: Google Play Console Setup

1. **Go to**: https://play.google.com/console
2. **Create App**:
   - Name: AChat
   - Default language: Russian / English
   - App type: Free
   - Category: Communication

3. **Store Listing**:
   - Short description (80 chars):
     "Защищённый мессенджер с AI-модерацией и Bluetooth mesh"

   - Full description (4000 chars):
```
🔒 AChat - Защищённый Мессенджер

AChat - это современный мессенджер с передовыми технологиями безопасности:

✨ КЛЮЧЕВЫЕ ФИЧИ:
• 🔐 E2E шифрование всех сообщений (RSA-2048 + AES-256)
• 🤖 AI-модерация контента (защита от спама и небезопасного контента)
• 📱 Синхронизация с контактами телефона
• 🔔 Push-уведомления о новых сообщениях
• 📞 SMS-верификация номера телефона
• 👥 Система друзей и запросов
• 🎯 Инвайт-коды для приглашения друзей

🌐 УНИКАЛЬНАЯ ФИЧА - BLUETOOTH MESH:
• Отправка сообщений БЕЗ интернета
• Mesh-сеть между устройствами
• Автоматическая маршрутизация через промежуточные узлы
• Работает в экстренных ситуациях

🔒 ПРИВАТНОСТЬ:
• Сквозное шифрование (E2E)
• Локальное хранение ключей в Keychain
• Нет доступа к твоим сообщениям даже у нас
• Open source код для проверки

💬 СОВРЕМЕННЫЙ МЕССЕНДЖЕР:
• Быстрые и надёжные чаты
• WebSocket для real-time общения
• Статусы прочтения сообщений
• Индикаторы набора текста

🚀 ПРОИЗВОДИТЕЛЬНОСТЬ:
• Быстрая работа
• Низкий расход батареи
• Оптимизация для Bluetooth mesh

Присоединяйся к AChat - защищённому общению!
```

4. **Screenshots** (минимум 2 для phone, 2 для tablet):
   - Phone: 1080 x 1920 или 1080 x 2340
   - 7-inch tablet: 1200 x 1920
   - 10-inch tablet: 1600 x 2560

5. **Feature Graphic**: 1024 x 500 (JPG or PNG)

6. **App Icon**: 512 x 512 (PNG, 32-bit)

### Step 4: Content Rating

Complete questionnaire:
- Category: Communication
- Privacy Policy: https://achat.app/privacy
- Target age: 13+

### Step 5: App Content

1. **Privacy Policy**: Required!
   Create at: https://app-privacy-policy-generator.nisrulz.com/

2. **Data Safety**:
   - Collects: Phone number, user profile
   - Shares: Nothing
   - Encryption: In transit and at rest

3. **Target Audience**:
   - Age: 13 and up
   - Appeals to children: No

### Step 6: Release

1. **Upload AAB**:
   - Go to "Release" → "Production"
   - Upload app-release.aab

2. **Release Notes**:
```
🎉 Первый релиз AChat!

✅ E2E шифрование
✅ AI-модерация
✅ Bluetooth mesh для offline сообщений
✅ Синхронизация контактов
✅ Push-уведомления

Безопасное общение начинается здесь!
```

3. **Countries**: All countries or specific

4. **Review**: Submit for review (7-14 days)

---

## 🍎 Apple App Store Publishing

### Prerequisites
- ✅ Apple Developer Account ($99/year)
- ✅ Xcode 15+
- ✅ macOS Sonoma or later
- ✅ Valid signing certificate
- ✅ App Store Connect access

### Step 1: Xcode Configuration

```bash
cd mobile-app/ios

# Open workspace
open AChat.xcworkspace
```

In Xcode:
1. Select target "AChat"
2. **Signing & Capabilities**:
   - Team: Your Apple Developer Team
   - Bundle Identifier: com.achat
   - Signing Certificate: Distribution

3. **General**:
   - Version: 1.0
   - Build: 1
   - Deployment Target: iOS 14.0+

### Step 2: Build Archive

```bash
# Archive for App Store
xcodebuild -workspace AChat.xcworkspace \
  -scheme AChat \
  -configuration Release \
  -archivePath build/AChat.xcarchive \
  archive

# Or use Xcode GUI:
# Product → Archive
```

### Step 3: App Store Connect Setup

1. **Go to**: https://appstoreconnect.apple.com/

2. **Create App**:
   - Platform: iOS
   - Name: AChat
   - Primary Language: Russian / English
   - Bundle ID: com.achat
   - SKU: achat-ios

3. **App Information**:
   - Privacy Policy URL: https://achat.app/privacy
   - Category: Social Networking
   - Content Rights: Your content

4. **Pricing**: Free

5. **App Privacy**:
   - Collects Data: Contact Info, Identifiers
   - Tracking: No
   - Data Linked to User: Yes (phone number, user ID)

### Step 4: Prepare Metadata

**Screenshots** (Required):
- 6.7" (iPhone 14 Pro Max): 1290 x 2796
- 6.5" (iPhone 14 Plus): 1284 x 2778
- 5.5" (iPhone 8 Plus): 1242 x 2208
- 12.9" iPad Pro: 2048 x 2732

**App Preview** (Optional but recommended):
- 15-30 second video
- Show key features

**Description** (4000 chars max):
```
🔒 AChat - Защищённый Мессенджер с AI

Современный мессенджер с максимальной защитой приватности и уникальными технологиями.

✨ ОСНОВНЫЕ ВОЗМОЖНОСТИ:

🔐 БЕЗОПАСНОСТЬ
• Сквозное шифрование всех сообщений (E2E)
• RSA-2048 + AES-256 шифрование
• Локальное хранение ключей в Keychain
• Никто не может прочитать твои сообщения, даже мы

🤖 AI-МОДЕРАЦИЯ
• Защита от спама и нежелательного контента
• Автоматическая блокировка опасного контента
• Создание безопасной среды общения

🌐 BLUETOOTH MESH (УНИКАЛЬНО!)
• Отправка сообщений БЕЗ интернета
• Mesh-сеть между устройствами поблизости
• Автоматическая маршрутизация сообщений
• Работает в чрезвычайных ситуациях

💬 МЕССЕНДЖЕР
• Быстрые и надёжные чаты
• WebSocket для мгновенной доставки
• Статусы прочтения
• Typing indicators
• Push-уведомления

👥 КОНТАКТЫ И ДРУЗЬЯ
• Автоматическая синхронизация с телефоном
• Поиск друзей по username
• Система запросов в друзья
• Инвайт-коды для приглашений

📱 SMS-ВЕРИФИКАЦИЯ
• Подтверждение номера телефона
• Дополнительная безопасность
• Защита от фейковых аккаунтов

🚀 ПРОИЗВОДИТЕЛЬНОСТЬ
• Оптимизированная работа
• Низкий расход батареи (даже с Bluetooth)
• Быстрая отправка сообщений

🔓 OPEN SOURCE
• Код открыт для проверки
• Прозрачность безопасности
• Сообщество разработчиков

Присоединяйся к революции в безопасном общении!

ТРЕБОВАНИЯ:
• iOS 14.0 или новее
• Разрешение на доступ к контактам (опционально)
• Разрешение на уведомления (опционально)
• Bluetooth для mesh-режима (опционально)

ПРИВАТНОСТЬ:
Мы не собираем данные о твоих сообщениях. Все переписки зашифрованы сквозным шифрованием и хранятся только на твоём устройстве.

ПОДДЕРЖКА:
support@achat.app
https://achat.app
```

**Keywords** (100 chars):
```
messenger,chat,encryption,secure,privacy,bluetooth,mesh,ai,moderation
```

**Promotional Text** (170 chars):
```
🔒 Самый защищённый мессенджер с E2E шифрованием, AI-модерацией и уникальной Bluetooth mesh-сетью для общения без интернета!
```

### Step 5: Submit for Review

1. **Upload Build**:
   - Xcode → Window → Organizer
   - Select archive → Distribute App
   - App Store Connect → Upload

2. **Select Build** in App Store Connect

3. **Export Compliance**:
   - Does your app use encryption? → Yes
   - Is it exempt from regulations? → No (register with BIS)

4. **Advertising Identifier**: No

5. **Version Release**: Automatic or Manual

6. **Submit**: Send for review

**Review Time**: 24-48 hours typically

---

## 🎯 Post-Launch Checklist

### Monitoring
- [ ] Set up Crashlytics
- [ ] Configure Analytics
- [ ] Monitor reviews
- [ ] Track installs

### Marketing
- [ ] Create landing page
- [ ] Social media announcement
- [ ] Press release
- [ ] App Store Optimization (ASO)

### Updates
- [ ] Plan update schedule (monthly/bi-weekly)
- [ ] Collect user feedback
- [ ] Fix critical bugs ASAP
- [ ] Add requested features

---

## 📊 App Store Optimization (ASO)

### Keywords Research
Use tools:
- App Annie
- Sensor Tower
- Mobile Action

**Target Keywords:**
- Primary: "secure messenger", "encrypted chat"
- Secondary: "privacy messenger", "bluetooth chat"
- Long-tail: "offline messenger bluetooth", "ai moderated chat"

### A/B Testing
Test:
- Icon variants
- Screenshots order
- Description text
- Video preview

### Localization
Translate to:
- English
- Russian
- Spanish
- Portuguese
- Chinese

---

## 🔧 Troubleshooting

### Google Play: "App not optimized for Android"
**Solution**: Upload AAB instead of APK

### App Store: "Missing Compliance"
**Solution**: Complete export compliance information

### Rejected: "Privacy Policy Missing"
**Solution**: Add valid privacy policy URL

### Rejected: "Crash on Launch"
**Solution**: Test on real devices before submission

---

## 📞 Support

**Questions?**
- Email: support@achat.app
- Docs: https://docs.achat.app
- GitHub: https://github.com/achat

---

**Good luck with your launch! 🚀**

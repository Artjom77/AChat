import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import apiClient from '../../api/client';

const SMS_SERVICE_URL = 'http://localhost:5002'; // Change to your SMS service URL

export default function PhoneVerifyScreen({ route, navigation }: any) {
  const { userId } = route.params;
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const codeInputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 1) return digits;
    if (digits.length <= 4) return `+${digits}`;
    if (digits.length <= 7) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  };

  const normalizePhone = (value: string): string => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('8')) {
      digits = '7' + digits.slice(1);
    }
    return '+' + digits;
  };

  const handleSendCode = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Ошибка', 'Введи корректный номер телефона');
      return;
    }

    setLoading(true);

    try {
      const normalizedPhone = normalizePhone(phone);

      const response = await fetch(`${SMS_SERVICE_URL}/sms/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('code');
        setTimer(60);

        if (data.test_mode && data.code) {
          Alert.alert(
            'TEST MODE',
            `Код для тестирования: ${data.code}`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Успех', `Код отправлен на ${normalizedPhone}`);
        }
      } else {
        Alert.alert('Ошибка', data.message || 'Не удалось отправить код');
      }
    } catch (error) {
      console.error('Failed to send code:', error);
      Alert.alert('Ошибка', 'Не удалось отправить код');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const codeString = code.join('');

    if (codeString.length !== 6) {
      Alert.alert('Ошибка', 'Введи полный код');
      return;
    }

    setLoading(true);

    try {
      const normalizedPhone = normalizePhone(phone);

      const response = await fetch(`${SMS_SERVICE_URL}/sms/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          code: codeString,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update user with verified phone
        await apiClient.patch('/users/me', {
          phone: normalizedPhone,
          phoneVerified: true,
        });

        Alert.alert(
          'Успех!',
          'Телефон верифицирован',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert('Ошибка', data.message || 'Неверный код');
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Ошибка верификации';
      Alert.alert('Ошибка', message);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      codeInputs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (index === 5 && value) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerifyCode();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => step === 'code' ? setStep('phone') : navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Верификация</Text>
      </View>

      {step === 'phone' ? (
        <View style={styles.content}>
          <Icon name="phone-check" size={80} color="#667eea" style={styles.bigIcon} />
          <Text style={styles.subtitle}>
            Введи номер телефона для верификации
          </Text>

          <TextInput
            style={styles.phoneInput}
            placeholder="+7 (___) ___-____"
            value={phone}
            onChangeText={value => setPhone(formatPhone(value))}
            keyboardType="phone-pad"
            maxLength={18}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendCode}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Отправка...' : 'Отправить код'}
            </Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Icon name="information" size={20} color="#667eea" />
            <Text style={styles.infoText}>
              Мы отправим SMS с кодом подтверждения
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          <Icon name="message-text" size={80} color="#667eea" style={styles.bigIcon} />
          <Text style={styles.subtitle}>
            Введи 6-значный код из SMS
          </Text>
          <Text style={styles.phoneText}>{phone}</Text>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => (codeInputs.current[index] = ref)}
                style={styles.codeInput}
                value={digit}
                onChangeText={value => handleCodeChange(value, index)}
                onKeyPress={e => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {timer > 0 ? (
            <Text style={styles.timerText}>
              Повторная отправка через {timer} сек
            </Text>
          ) : (
            <TouchableOpacity onPress={handleSendCode}>
              <Text style={styles.resendText}>Отправить код повторно</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyCode}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Проверка...' : 'Подтвердить'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  bigIcon: {
    marginVertical: 30,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  phoneInput: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    fontSize: 20,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '100%',
    marginBottom: 20,
  },
  phoneText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 30,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  codeInput: {
    backgroundColor: 'white',
    width: 50,
    height: 60,
    margin: 5,
    borderRadius: 10,
    fontSize: 24,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  timerText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 30,
  },
  resendText: {
    fontSize: 14,
    color: '#667eea',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 10,
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f0f4ff',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    color: '#667eea',
    fontSize: 14,
  },
});

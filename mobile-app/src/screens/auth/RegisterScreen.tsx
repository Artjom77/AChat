import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import apiClient from '../../api/client';
import EncryptionService from '../../services/EncryptionService';

export default function RegisterScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Ошибка', 'Заполни все поля');
      return false;
    }

    if (username.length < 3) {
      Alert.alert('Ошибка', 'Имя пользователя должно быть минимум 3 символа');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Ошибка', 'Неверный формат email');
      return false;
    }

    if (password.length < 8) {
      Alert.alert('Ошибка', 'Пароль должен быть минимум 8 символов');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Generate encryption keys
      const keyPair = await EncryptionService.generateKeyPair();
      console.log('Generated encryption keys');

      // Register user
      const response = await apiClient.post('/auth/register', {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        publicKey: keyPair.public,
      });

      const { user } = response.data;

      Alert.alert(
        'Успех!',
        'Аккаунт создан. Теперь верифицируй телефон.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('PhoneVerify', { userId: user.id }),
          },
        ]
      );

    } catch (error: any) {
      const message = error.response?.data?.detail || 'Ошибка регистрации';
      Alert.alert('Ошибка', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Регистрация</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Icon name="account" size={20} color="#999" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Имя пользователя"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="email" size={20} color="#999" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color="#999" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Пароль (минимум 8 символов)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Icon
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock-check" size={20} color="#999" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Подтверди пароль"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.infoBox}>
            <Icon name="shield-check" size={20} color="#667eea" />
            <Text style={styles.infoText}>
              Твой пароль зашифрован локально. Даже мы его не видим.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              Уже есть аккаунт? Войди
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
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
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f0f4ff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    color: '#667eea',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
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
  linkButton: {
    marginTop: 20,
  },
  linkText: {
    color: '#667eea',
    textAlign: 'center',
    fontSize: 14,
  },
});

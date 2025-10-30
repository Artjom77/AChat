import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Avatar from '../../components/Avatar';
import apiClient from '../../api/client';

export default function ProfileScreen({ navigation }: any) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userStr = await AsyncStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        setUsername(user.username || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setBio(user.bio || '');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSave = async () => {
    if (!username || !email) {
      Alert.alert('Ошибка', 'Заполни обязательные поля');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.patch('/users/me', {
        username: username.trim(),
        email: email.trim(),
        bio: bio.trim(),
      });

      const updatedUser = response.data.user;

      // Update local storage
      await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));

      setCurrentUser(updatedUser);
      setEditing(false);

      Alert.alert('Успех', 'Профиль обновлён');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Ошибка обновления';
      Alert.alert('Ошибка', message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    Alert.alert('Coming Soon', 'Смена пароля скоро будет доступна');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Удалить аккаунт',
      'Это действие нельзя отменить. Все твои данные будут удалены.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete('/users/me');
              await AsyncStorage.clear();
              // TODO: Navigate to Login
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить аккаунт');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Профиль</Text>
        {!editing ? (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Icon name="pencil" size={24} color="#667eea" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Icon name="check" size={24} color="#43e97b" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.avatarSection}>
        <Avatar
          username={currentUser?.username || 'User'}
          size={100}
        />
        {editing && (
          <TouchableOpacity style={styles.changeAvatarButton}>
            <Icon name="camera" size={20} color="#667eea" />
            <Text style={styles.changeAvatarText}>Изменить фото</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Имя пользователя *</Text>
        <TextInput
          style={[styles.input, !editing && styles.inputDisabled]}
          value={username}
          onChangeText={setUsername}
          editable={editing}
          autoCapitalize="none"
          placeholder="Введи username"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={[styles.input, !editing && styles.inputDisabled]}
          value={email}
          onChangeText={setEmail}
          editable={editing}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Введи email"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Телефон</Text>
        <View style={styles.phoneContainer}>
          <TextInput
            style={[styles.input, styles.phoneInput]}
            value={phone}
            editable={false}
            placeholder="+7 (___) ___-____"
          />
          {currentUser?.phoneVerified && (
            <Icon name="check-decagram" size={20} color="#43e97b" />
          )}
        </View>
        {!currentUser?.phoneVerified && (
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => Alert.alert('Coming Soon', 'Скоро!')}
          >
            <Text style={styles.verifyButtonText}>Верифицировать</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>О себе</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            !editing && styles.inputDisabled
          ]}
          value={bio}
          onChangeText={setBio}
          editable={editing}
          multiline
          numberOfLines={4}
          placeholder="Расскажи о себе..."
        />
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {currentUser?.friendsCount || 0}
          </Text>
          <Text style={styles.statLabel}>Друзей</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {currentUser?.chatsCount || 0}
          </Text>
          <Text style={styles.statLabel}>Чатов</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {currentUser?.messagesCount || 0}
          </Text>
          <Text style={styles.statLabel}>Сообщений</Text>
        </View>
      </View>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerZoneTitle}>Опасная зона</Text>

        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleChangePassword}
        >
          <Icon name="lock-reset" size={20} color="#fa709a" />
          <Text style={styles.dangerButtonText}>Сменить пароль</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleDeleteAccount}
        >
          <Icon name="delete-forever" size={20} color="#fa709a" />
          <Text style={styles.dangerButtonText}>Удалить аккаунт</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  avatarSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  changeAvatarText: {
    color: '#667eea',
    marginLeft: 5,
    fontSize: 14,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    color: '#333',
  },
  inputDisabled: {
    backgroundColor: '#f9f9f9',
    color: '#999',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneInput: {
    flex: 1,
    marginRight: 10,
  },
  verifyButton: {
    backgroundColor: '#667eea',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  dangerZone: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 10,
  },
  dangerZoneTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fa709a',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff5f7',
    borderRadius: 10,
    marginBottom: 10,
  },
  dangerButtonText: {
    color: '#fa709a',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  bottomPadding: {
    height: 40,
  },
});

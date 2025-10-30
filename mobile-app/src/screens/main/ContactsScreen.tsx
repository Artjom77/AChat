import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ContactsService from '../../services/ContactsService';
import Avatar from '../../components/Avatar';
import apiClient from '../../api/client';

interface AchatUser {
  id: string;
  username: string;
  phone: string;
  phoneVerified: boolean;
  isFriend: boolean;
}

export default function ContactsScreen({ navigation }: any) {
  const [contacts, setContacts] = useState<AchatUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/contacts/achat-users');
      setContacts(response.data.users || []);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncPhoneContacts = async () => {
    setSyncing(true);

    try {
      // Request permission
      const hasPermission = await ContactsService.requestPermission();

      if (!hasPermission) {
        Alert.alert(
          'Доступ запрещён',
          'Разреши доступ к контактам в настройках'
        );
        return;
      }

      // Get phone contacts
      const phoneContacts = await ContactsService.getAllContacts();
      console.log(`Found ${phoneContacts.length} phone contacts`);

      // Sync with backend
      const result = await ContactsService.syncWithBackend(phoneContacts);

      setContacts(result.achatUsers);

      Alert.alert(
        'Синхронизация завершена',
        `Найдено ${result.achatUsers.length} пользователей AChat из ${result.totalContacts} контактов`
      );

    } catch (error: any) {
      console.error('Sync failed:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось синхронизировать');
    } finally {
      setSyncing(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      const response = await apiClient.post('/friends/request', {
        targetUserId: userId,
      });

      if (response.data.success) {
        Alert.alert('Успех', 'Запрос в друзья отправлен');
        loadContacts();
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Ошибка отправки запроса';
      Alert.alert('Ошибка', message);
    }
  };

  const startChat = async (userId: string) => {
    try {
      const response = await apiClient.post('/conversations', {
        participantId: userId,
      });

      navigation.navigate('Chat', {
        conversationId: response.data.conversation.id,
      });
    } catch (error) {
      console.error('Failed to start chat:', error);
      Alert.alert('Ошибка', 'Не удалось создать чат');
    }
  };

  const renderContact = ({ item }: { item: AchatUser }) => (
    <View style={styles.contactItem}>
      <Avatar username={item.username} size={50} />

      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.username}</Text>
        <View style={styles.phoneRow}>
          <Text style={styles.contactPhone}>{item.phone}</Text>
          {item.phoneVerified && (
            <Icon name="check-decagram" size={16} color="#667eea" />
          )}
        </View>
      </View>

      <View style={styles.actions}>
        {item.isFriend ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.chatButton]}
            onPress={() => startChat(item.id)}
          >
            <Icon name="chat" size={20} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.addButton]}
            onPress={() => sendFriendRequest(item.id)}
          >
            <Icon name="account-plus" size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="contacts-outline" size={80} color="#ccc" />
      <Text style={styles.emptyText}>Нет контактов из AChat</Text>
      <Text style={styles.emptySubtext}>
        Синхронизируй контакты телефона, чтобы найти друзей
      </Text>
      <TouchableOpacity
        style={styles.syncButton}
        onPress={syncPhoneContacts}
      >
        <Icon name="sync" size={20} color="white" />
        <Text style={styles.syncButtonText}>Синхронизировать</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Контакты</Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={syncPhoneContacts}
          disabled={syncing}
        >
          <Icon
            name={syncing ? 'sync' : 'sync'}
            size={24}
            color={syncing ? '#ccc' : '#333'}
          />
        </TouchableOpacity>
      </View>

      {contacts.length > 0 && (
        <View style={styles.stats}>
          <Text style={styles.statsText}>
            {contacts.length} {contacts.length === 1 ? 'контакт' : 'контактов'} использует AChat
          </Text>
        </View>
      )}

      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadContacts} />
        }
        contentContainerStyle={
          contacts.length === 0 ? styles.emptyContainer : null
        }
      />
    </View>
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  iconButton: {
    padding: 8,
  },
  stats: {
    padding: 15,
    backgroundColor: '#f0f4ff',
  },
  statsText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  contactItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 15,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  chatButton: {
    backgroundColor: '#667eea',
  },
  addButton: {
    backgroundColor: '#43e97b',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 10,
    textAlign: 'center',
  },
  syncButton: {
    flexDirection: 'row',
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
    alignItems: 'center',
  },
  syncButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

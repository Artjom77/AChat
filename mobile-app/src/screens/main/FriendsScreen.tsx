import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Avatar from '../../components/Avatar';
import apiClient from '../../api/client';

interface Friend {
  id: string;
  username: string;
  email: string;
  status: 'online' | 'offline';
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  createdAt: string;
}

export default function FriendsScreen({ navigation }: any) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        apiClient.get('/friends'),
        apiClient.get('/friends/requests'),
      ]);

      setFriends(friendsRes.data.friends || []);
      setRequests(requestsRes.data.requests || []);
    } catch (error) {
      console.error('Failed to load friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (searchQuery.length < 2) {
      Alert.alert('Ошибка', 'Введи минимум 2 символа');
      return;
    }

    try {
      const response = await apiClient.get(`/users/search?q=${searchQuery}`);
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('Search failed:', error);
      Alert.alert('Ошибка', 'Не удалось найти пользователей');
    }
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      const response = await apiClient.post('/friends/request', {
        targetUserId: userId,
      });

      if (response.data.success) {
        Alert.alert('Успех', 'Запрос в друзья отправлен');
        setShowSearchModal(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Ошибка отправки запроса';
      Alert.alert('Ошибка', message);
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      const response = await apiClient.post('/friends/accept', { requestId });

      if (response.data.success) {
        Alert.alert('Успех', 'Запрос принят');
        loadData();
      }
    } catch (error) {
      console.error('Failed to accept:', error);
      Alert.alert('Ошибка', 'Не удалось принять запрос');
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const response = await apiClient.post('/friends/reject', { requestId });

      if (response.data.success) {
        loadData();
      }
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  const createInviteCode = async () => {
    try {
      const response = await apiClient.post('/invite/create');
      setInviteCode(response.data.code);
      setShowInviteModal(true);
    } catch (error) {
      console.error('Failed to create invite:', error);
      Alert.alert('Ошибка', 'Не удалось создать инвайт-код');
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
    }
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={styles.friendItem}
      onPress={() => startChat(item.id)}
    >
      <Avatar username={item.username} size={50} />

      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.username}</Text>
        <Text style={styles.friendEmail}>{item.email}</Text>
      </View>

      <View style={[
        styles.statusDot,
        item.status === 'online' ? styles.statusOnline : styles.statusOffline
      ]} />
    </TouchableOpacity>
  );

  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestItem}>
      <Avatar username={item.fromUsername} size={50} />

      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>{item.fromUsername}</Text>
        <Text style={styles.requestDate}>
          {new Date(item.createdAt).toLocaleDateString('ru-RU')}
        </Text>
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => acceptRequest(item.id)}
        >
          <Icon name="check" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => rejectRequest(item.id)}
        >
          <Icon name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchResult = ({ item }: any) => (
    <View style={styles.searchResultItem}>
      <Avatar username={item.username} size={40} />
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{item.username}</Text>
        <Text style={styles.searchResultEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => sendFriendRequest(item.id)}
      >
        <Icon name="account-plus" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Друзья</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowSearchModal(true)}
          >
            <Icon name="account-search" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={createInviteCode}
          >
            <Icon name="gift" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {requests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Запросы в друзья ({requests.length})
          </Text>
          <FlatList
            data={requests}
            renderItem={renderRequest}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.requestsList}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Мои друзья ({friends.length})
        </Text>
      </View>

      <FlatList
        data={friends}
        renderItem={renderFriend}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="account-heart-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>Нет друзей</Text>
            <Text style={styles.emptySubtext}>
              Найди друзей через поиск или инвайт-код
            </Text>
          </View>
        }
      />

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Найти друзей</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Введи username или email"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={searchUsers}
            >
              <Icon name="magnify" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={item => item.id}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Icon name="account-search-outline" size={60} color="#ccc" />
                <Text style={styles.emptySubtext}>
                  Введи username или email для поиска
                </Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.inviteModalOverlay}>
          <View style={styles.inviteModalContent}>
            <Text style={styles.inviteModalTitle}>Инвайт-код</Text>
            <Text style={styles.inviteCode}>{inviteCode}</Text>
            <Text style={styles.inviteModalText}>
              Отправь этот код друзьям, чтобы они могли добавить тебя
            </Text>
            <TouchableOpacity
              style={styles.inviteModalButton}
              onPress={() => setShowInviteModal(false)}
            >
              <Text style={styles.inviteModalButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 10,
  },
  section: {
    backgroundColor: 'white',
    paddingVertical: 10,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  requestsList: {
    paddingHorizontal: 15,
  },
  requestItem: {
    width: 160,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  requestInfo: {
    alignItems: 'center',
    marginVertical: 10,
  },
  requestName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  acceptButton: {
    backgroundColor: '#43e97b',
  },
  rejectButton: {
    backgroundColor: '#fa709a',
  },
  friendItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 15,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  friendEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  statusOnline: {
    backgroundColor: '#43e97b',
  },
  statusOffline: {
    backgroundColor: '#ccc',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#667eea',
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  searchResultItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 15,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  searchResultEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#667eea',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '80%',
    alignItems: 'center',
  },
  inviteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inviteCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#667eea',
    letterSpacing: 4,
    marginBottom: 20,
  },
  inviteModalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inviteModalButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 10,
  },
  inviteModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import apiClient from '../../api/client';
import MessageBubble from '../../components/MessageBubble';
import ChatInput from '../../components/ChatInput';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export default function ChatScreen({ route, navigation }: any) {
  const { conversationId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    // TODO: Connect WebSocket for real-time messages
    // connectWebSocket(conversationId);
  }, [conversationId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/messages/${conversationId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      text: text.trim(),
      senderId: 'me', // TODO: Get from auth state
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    setMessages(prev => [tempMessage, ...prev]);

    try {
      const response = await apiClient.post('/messages', {
        conversationId,
        content: text.trim(),
        encrypted: true, // TODO: Encrypt message
      });

      // Replace temp message with real one
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempMessage.id
            ? { ...response.data.message, status: 'sent' }
            : msg
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);

      // Mark as failed
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempMessage.id
            ? { ...msg, status: 'sending' }
            : msg
        )
      );
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      isMe={item.senderId === 'me'} // TODO: Compare with actual user ID
    />
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        inverted
        onContentSizeChange={() => flatListRef.current?.scrollToOffset({ offset: 0 })}
        style={styles.messagesList}
      />

      <ChatInput onSend={sendMessage} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesList: {
    flex: 1,
  },
});

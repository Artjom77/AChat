import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../api/client';
import EncryptionService from '../../services/EncryptionService';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  encrypted: boolean;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: Message | null;
  unreadCount: number;
}

interface MessagesState {
  conversations: Record<string, Conversation>;
  messages: Record<string, Message[]>; // conversationId -> messages
  loading: boolean;
  sending: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  conversations: {},
  messages: {},
  loading: false,
  sending: false,
  error: null,
};

// Async thunks
export const loadConversations = createAsyncThunk(
  'messages/loadConversations',
  async () => {
    const response = await apiClient.get('/conversations');
    return response.data.conversations || [];
  }
);

export const loadMessages = createAsyncThunk(
  'messages/loadMessages',
  async (conversationId: string) => {
    const response = await apiClient.get(`/messages/${conversationId}`);
    return {
      conversationId,
      messages: response.data.messages || [],
    };
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({
    conversationId,
    content,
    recipientPublicKey,
  }: {
    conversationId: string;
    content: string;
    recipientPublicKey?: string;
  }) => {
    let encrypted = content;

    // Encrypt if public key available
    if (recipientPublicKey) {
      const encryptedData = await EncryptionService.encryptMessage(
        content,
        recipientPublicKey
      );
      encrypted = JSON.stringify(encryptedData);
    }

    const response = await apiClient.post('/messages', {
      conversationId,
      content: encrypted,
      encrypted: !!recipientPublicKey,
    });

    return response.data.message;
  }
);

export const markAsRead = createAsyncThunk(
  'messages/markAsRead',
  async ({
    conversationId,
    messageIds,
  }: {
    conversationId: string;
    messageIds: string[];
  }) => {
    await apiClient.post('/messages/mark-read', {
      conversationId,
      messageIds,
    });

    return { conversationId, messageIds };
  }
);

// Slice
const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const { conversationId } = message;

      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }

      // Add if not exists
      const exists = state.messages[conversationId].find(
        (m) => m.id === message.id
      );

      if (!exists) {
        state.messages[conversationId].unshift(message);
      }

      // Update conversation last message
      if (state.conversations[conversationId]) {
        state.conversations[conversationId].lastMessage = message;
        if (message.senderId !== 'me') {
          state.conversations[conversationId].unreadCount++;
        }
      }
    },
    updateMessageStatus: (
      state,
      action: PayloadAction<{
        messageId: string;
        status: Message['status'];
      }>
    ) => {
      const { messageId, status } = action.payload;

      // Find and update message across all conversations
      for (const conversationId in state.messages) {
        const message = state.messages[conversationId].find(
          (m) => m.id === messageId
        );
        if (message) {
          message.status = status;
          break;
        }
      }
    },
    clearMessages: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      delete state.messages[conversationId];
    },
  },
  extraReducers: (builder) => {
    // Load Conversations
    builder.addCase(loadConversations.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(loadConversations.fulfilled, (state, action) => {
      state.loading = false;
      action.payload.forEach((conv: Conversation) => {
        state.conversations[conv.id] = conv;
      });
    });
    builder.addCase(loadConversations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to load conversations';
    });

    // Load Messages
    builder.addCase(loadMessages.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(loadMessages.fulfilled, (state, action) => {
      state.loading = false;
      const { conversationId, messages } = action.payload;
      state.messages[conversationId] = messages;
    });
    builder.addCase(loadMessages.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to load messages';
    });

    // Send Message
    builder.addCase(sendMessage.pending, (state) => {
      state.sending = true;
    });
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      state.sending = false;
      // Message is added via addMessage action from WebSocket
    });
    builder.addCase(sendMessage.rejected, (state, action) => {
      state.sending = false;
      state.error = action.error.message || 'Failed to send message';
    });

    // Mark as Read
    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const { conversationId } = action.payload;
      if (state.conversations[conversationId]) {
        state.conversations[conversationId].unreadCount = 0;
      }
    });
  },
});

export const { addMessage, updateMessageStatus, clearMessages } =
  messagesSlice.actions;
export default messagesSlice.reducer;

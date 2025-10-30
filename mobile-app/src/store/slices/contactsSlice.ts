import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../api/client';
import ContactsService from '../../services/ContactsService';

interface Friend {
  id: string;
  username: string;
  email: string;
  phone?: string;
  publicKey: string;
  status: 'online' | 'offline';
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface ContactsState {
  friends: Friend[];
  friendRequests: FriendRequest[];
  achatUsers: any[];
  loading: boolean;
  syncing: boolean;
  error: string | null;
}

const initialState: ContactsState = {
  friends: [],
  friendRequests: [],
  achatUsers: [],
  loading: false,
  syncing: false,
  error: null,
};

// Async thunks
export const loadFriends = createAsyncThunk('contacts/loadFriends', async () => {
  const response = await apiClient.get('/friends');
  return response.data.friends || [];
});

export const loadFriendRequests = createAsyncThunk(
  'contacts/loadFriendRequests',
  async () => {
    const response = await apiClient.get('/friends/requests');
    return response.data.requests || [];
  }
);

export const sendFriendRequest = createAsyncThunk(
  'contacts/sendFriendRequest',
  async (userId: string) => {
    const response = await apiClient.post('/friends/request', {
      targetUserId: userId,
    });
    return response.data.request;
  }
);

export const acceptFriendRequest = createAsyncThunk(
  'contacts/acceptFriendRequest',
  async (requestId: string) => {
    const response = await apiClient.post('/friends/accept', { requestId });
    return { requestId, friend: response.data.friend };
  }
);

export const rejectFriendRequest = createAsyncThunk(
  'contacts/rejectFriendRequest',
  async (requestId: string) => {
    await apiClient.post('/friends/reject', { requestId });
    return requestId;
  }
);

export const syncPhoneContacts = createAsyncThunk(
  'contacts/syncPhoneContacts',
  async () => {
    // Get phone contacts
    const phoneContacts = await ContactsService.getAllContacts();

    // Sync with backend
    const result = await ContactsService.syncWithBackend(phoneContacts);

    return result.achatUsers;
  }
);

export const searchUsers = createAsyncThunk(
  'contacts/searchUsers',
  async (query: string) => {
    const response = await apiClient.get(`/users/search?q=${query}`);
    return response.data.users || [];
  }
);

// Slice
const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    updateFriendStatus: (
      state,
      action: PayloadAction<{ userId: string; status: 'online' | 'offline' }>
    ) => {
      const { userId, status } = action.payload;
      const friend = state.friends.find((f) => f.id === userId);
      if (friend) {
        friend.status = status;
      }
    },
    clearSearchResults: (state) => {
      state.achatUsers = [];
    },
  },
  extraReducers: (builder) => {
    // Load Friends
    builder.addCase(loadFriends.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(loadFriends.fulfilled, (state, action) => {
      state.loading = false;
      state.friends = action.payload;
    });
    builder.addCase(loadFriends.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to load friends';
    });

    // Load Friend Requests
    builder.addCase(loadFriendRequests.fulfilled, (state, action) => {
      state.friendRequests = action.payload;
    });

    // Send Friend Request
    builder.addCase(sendFriendRequest.fulfilled, (state, action) => {
      // Request sent successfully
    });

    // Accept Friend Request
    builder.addCase(acceptFriendRequest.fulfilled, (state, action) => {
      const { requestId, friend } = action.payload;

      // Remove from requests
      state.friendRequests = state.friendRequests.filter(
        (req) => req.id !== requestId
      );

      // Add to friends
      state.friends.push(friend);
    });

    // Reject Friend Request
    builder.addCase(rejectFriendRequest.fulfilled, (state, action) => {
      state.friendRequests = state.friendRequests.filter(
        (req) => req.id !== action.payload
      );
    });

    // Sync Phone Contacts
    builder.addCase(syncPhoneContacts.pending, (state) => {
      state.syncing = true;
    });
    builder.addCase(syncPhoneContacts.fulfilled, (state, action) => {
      state.syncing = false;
      state.achatUsers = action.payload;
    });
    builder.addCase(syncPhoneContacts.rejected, (state, action) => {
      state.syncing = false;
      state.error = action.error.message || 'Failed to sync contacts';
    });

    // Search Users
    builder.addCase(searchUsers.fulfilled, (state, action) => {
      state.achatUsers = action.payload;
    });
  },
});

export const { updateFriendStatus, clearSearchResults } = contactsSlice.actions;
export default contactsSlice.reducer;

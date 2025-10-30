import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../api/client';
import EncryptionService from '../../services/EncryptionService';

interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  phoneVerified: boolean;
  publicKey: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }) => {
    const response = await apiClient.post('/auth/login', {
      username,
      password,
    });

    const { token, user } = response.data;

    // Save to AsyncStorage
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('currentUser', JSON.stringify(user));

    return { token, user };
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({
    username,
    email,
    password,
  }: {
    username: string;
    email: string;
    password: string;
  }) => {
    // Generate encryption keys
    const keyPair = await EncryptionService.generateKeyPair();

    const response = await apiClient.post('/auth/register', {
      username,
      email,
      password,
      publicKey: keyPair.public,
    });

    return response.data.user;
  }
);

export const checkAuth = createAsyncThunk('auth/checkAuth', async () => {
  const token = await AsyncStorage.getItem('authToken');
  const userStr = await AsyncStorage.getItem('currentUser');

  if (!token || !userStr) {
    throw new Error('Not authenticated');
  }

  const user = JSON.parse(userStr);

  // Verify token is still valid
  try {
    const response = await apiClient.get('/users/me');
    return { token, user: response.data.user };
  } catch (error) {
    // Token invalid, clear storage
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('currentUser');
    throw error;
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await AsyncStorage.removeItem('authToken');
  await AsyncStorage.removeItem('currentUser');
  await EncryptionService.deleteKeys();
});

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data: Partial<User>) => {
    const response = await apiClient.patch('/users/me', data);
    const updatedUser = response.data.user;

    await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));

    return updatedUser;
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Login failed';
    });

    // Register
    builder.addCase(register.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Registration failed';
    });

    // Check Auth
    builder.addCase(checkAuth.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(checkAuth.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    });
    builder.addCase(checkAuth.rejected, (state) => {
      state.loading = false;
      state.isAuthenticated = false;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    });

    // Update Profile
    builder.addCase(updateProfile.fulfilled, (state, action) => {
      state.user = action.payload;
    });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import messagesReducer from './slices/messagesSlice';
import contactsReducer from './slices/contactsSlice';
import bluetoothReducer from './slices/bluetoothSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    messages: messagesReducer,
    contacts: contactsReducer,
    bluetooth: bluetoothReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['bluetooth/deviceConnected'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.device'],
        // Ignore these paths in the state
        ignoredPaths: ['bluetooth.devices'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import { authSlice, login, register, logout } from '../authSlice';
import { configureStore } from '@reduxjs/toolkit';

describe('authSlice', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authSlice.reducer,
      },
    });
  });

  it('should have initial state', () => {
    const state = store.getState().auth;

    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.loading).toBe(false);
  });

  it('should handle login.pending', () => {
    store.dispatch(login.pending('', { username: 'test', password: 'test' }));
    const state = store.getState().auth;

    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle logout', async () => {
    // First login
    store.dispatch(login.fulfilled(
      { user: { id: '1', username: 'test' }, token: 'token123' },
      '',
      { username: 'test', password: 'test' }
    ));

    // Then logout
    await store.dispatch(logout());
    const state = store.getState().auth;

    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});

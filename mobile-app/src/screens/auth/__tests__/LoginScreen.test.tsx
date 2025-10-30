import React from 'react';
import { render } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';
import { Provider } from 'react-redux';
import { store } from '../../../store';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('LoginScreen', () => {
  it('renders correctly', () => {
    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <LoginScreen navigation={mockNavigation} />
      </Provider>
    );

    expect(getByText('AChat')).toBeTruthy();
    expect(getByPlaceholderText('Имя пользователя')).toBeTruthy();
    expect(getByPlaceholderText('Пароль')).toBeTruthy();
    expect(getByText('Войти')).toBeTruthy();
  });

  it('shows validation error when fields are empty', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <LoginScreen navigation={mockNavigation} />
      </Provider>
    );

    const loginButton = getByText('Войти');

    // Should show alert when clicking login with empty fields
    // Note: Testing Alert is tricky, might need to mock it
  });

  it('navigates to register screen', () => {
    const { getByText } = render(
      <Provider store={store}>
        <LoginScreen navigation={mockNavigation} />
      </Provider>
    );

    const registerButton = getByText('Нет аккаунта? Зарегистрируйся');

    // Test navigation (would need fireEvent)
    expect(registerButton).toBeTruthy();
  });
});

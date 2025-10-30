import Contacts from 'react-native-contacts';
import { PermissionsAndroid, Platform } from 'react-native';
import apiClient from '../api/client';

export interface Contact {
  recordID: string;
  givenName: string;
  familyName: string;
  phoneNumbers: Array<{
    label: string;
    number: string;
  }>;
}

export interface AchatUser {
  id: string;
  username: string;
  phone: string;
  phoneVerified: boolean;
}

export class ContactsService {
  /**
   * Request permission to access contacts
   */
  static async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Доступ к контактам',
            message: 'AChat нужен доступ к контактам для поиска друзей',
            buttonPositive: 'Разрешить',
            buttonNegative: 'Отмена',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        console.error('Permission error:', error);
        return false;
      }
    }

    // iOS asks automatically on first getAll() call
    return true;
  }

  /**
   * Get all contacts from phone
   */
  static async getAllContacts(): Promise<Contact[]> {
    const hasPermission = await this.requestPermission();

    if (!hasPermission) {
      throw new Error('Permission denied');
    }

    try {
      const contacts = await Contacts.getAll();
      return contacts;
    } catch (error) {
      console.error('Failed to get contacts:', error);
      throw error;
    }
  }

  /**
   * Extract phone numbers from contacts
   */
  static extractPhoneNumbers(contacts: Contact[]): string[] {
    const phones: string[] = [];

    for (const contact of contacts) {
      if (contact.phoneNumbers) {
        for (const phoneEntry of contact.phoneNumbers) {
          const normalized = this.normalizePhone(phoneEntry.number);
          if (normalized) {
            phones.push(normalized);
          }
        }
      }
    }

    return [...new Set(phones)]; // Remove duplicates
  }

  /**
   * Normalize phone number to international format
   */
  static normalizePhone(phone: string): string | null {
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');

    // If starts with 8, replace with 7 (Russia)
    if (digits.startsWith('8')) {
      digits = '7' + digits.slice(1);
    }

    // Add + if not present
    if (!digits.startsWith('+')) {
      digits = '+' + digits;
    }

    // Basic validation: must be 10-15 digits
    if (digits.length < 10 || digits.length > 15) {
      return null;
    }

    return digits;
  }

  /**
   * Find AChat users by phone numbers
   */
  static async findAchatUsers(contacts: Contact[]): Promise<AchatUser[]> {
    const phones = this.extractPhoneNumbers(contacts);

    if (phones.length === 0) {
      return [];
    }

    try {
      const response = await apiClient.post('/contacts/find-by-phones', {
        phones,
      });

      return response.data.users || [];
    } catch (error) {
      console.error('Failed to find AChat users:', error);
      throw error;
    }
  }

  /**
   * Sync contacts with backend
   */
  static async syncWithBackend(contacts: Contact[]): Promise<{
    achatUsers: AchatUser[];
    totalContacts: number;
    totalPhones: number;
  }> {
    const phones = this.extractPhoneNumbers(contacts);
    const achatUsers = await this.findAchatUsers(contacts);

    return {
      achatUsers,
      totalContacts: contacts.length,
      totalPhones: phones.length,
    };
  }

  /**
   * Search contacts by name or phone
   */
  static searchContacts(contacts: Contact[], query: string): Contact[] {
    const lowerQuery = query.toLowerCase().trim();

    return contacts.filter(contact => {
      // Search in name
      const fullName = `${contact.givenName} ${contact.familyName}`.toLowerCase();
      if (fullName.includes(lowerQuery)) {
        return true;
      }

      // Search in phone numbers
      if (contact.phoneNumbers) {
        for (const phoneEntry of contact.phoneNumbers) {
          if (phoneEntry.number.includes(lowerQuery)) {
            return true;
          }
        }
      }

      return false;
    });
  }
}

export default ContactsService;

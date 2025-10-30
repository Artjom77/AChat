import EncryptionService from '../EncryptionService';

describe('EncryptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate key pair', async () => {
    const keyPair = await EncryptionService.generateKeyPair();

    expect(keyPair).toHaveProperty('public');
    expect(keyPair).toHaveProperty('private');
    expect(keyPair.public).toBeTruthy();
    expect(keyPair.private).toBeTruthy();
  });

  it('should encrypt and decrypt message', async () => {
    const keyPair = await EncryptionService.generateKeyPair();
    const message = 'Secret message';

    const encrypted = await EncryptionService.encryptMessage(
      message,
      keyPair.public
    );

    expect(encrypted).toHaveProperty('message');
    expect(encrypted).toHaveProperty('key');
    expect(encrypted.message).not.toBe(message);

    const decrypted = await EncryptionService.decryptMessage(
      encrypted.message,
      encrypted.key
    );

    expect(decrypted).toBe(message);
  });

  it('should hash password', () => {
    const password = 'myPassword123';
    const hashed = EncryptionService.hashPassword(password);

    expect(hashed).toBeTruthy();
    expect(hashed).not.toBe(password);
    expect(hashed.length).toBe(64); // SHA256 produces 64 char hex string
  });

  it('should check if keys exist', async () => {
    const hasKeys = await EncryptionService.hasKeys();

    expect(typeof hasKeys).toBe('boolean');
  });
});

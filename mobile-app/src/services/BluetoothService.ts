import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Bluetooth Mesh Service for React Native
 *
 * This is a STARTER IMPLEMENTATION for Bluetooth mesh networking.
 * Full production implementation requires 4-6 months of development.
 *
 * Features to be added:
 * - Complete AODV routing
 * - Message fragmentation
 * - E2E encryption through mesh
 * - Battery optimization
 * - Network topology management
 */

interface MeshMessage {
  id: string;
  type: 'message' | 'RREQ' | 'RREP' | 'ack';
  sourceId: string;
  destinationId: string;
  timestamp: number;
  ttl: number;
  sequenceNumber: number;
  payload: string;
  path: string[];
}

interface Route {
  destination: string;
  nextHop: string;
  hopCount: number;
  sequenceNumber: number;
}

export class BluetoothService {
  private manager: BleManager;
  private deviceId: string;
  private connectedDevices: Map<string, Device> = new Map();
  private routingTable: Map<string, Route> = new Map();
  private messageQueue: MeshMessage[] = [];
  private isScanning: boolean = false;

  // UUIDs
  private readonly SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
  private readonly MESSAGE_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef1';

  constructor() {
    this.manager = new BleManager();
    this.deviceId = this.generateDeviceId();
  }

  /**
   * Initialize Bluetooth service
   */
  async initialize(): Promise<void> {
    try {
      // Check Bluetooth state
      const state = await this.manager.state();
      console.log('Bluetooth state:', state);

      if (state !== 'PoweredOn') {
        throw new Error('Bluetooth is not enabled');
      }

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Bluetooth permissions denied');
      }

      console.log('✅ Bluetooth service initialized');
      console.log('Device ID:', this.deviceId);

    } catch (error) {
      console.error('Failed to initialize Bluetooth:', error);
      throw error;
    }
  }

  /**
   * Request Bluetooth permissions
   */
  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        // Android 12+ requires BLUETOOTH_SCAN and BLUETOOTH_CONNECT
        if (Platform.Version >= 31) {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);

          return (
            granted['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
            granted['android.permission.BLUETOOTH_CONNECT'] === 'granted' &&
            granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted'
          );
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (error) {
        console.error('Permission error:', error);
        return false;
      }
    }

    // iOS permissions handled automatically
    return true;
  }

  /**
   * Start scanning for AChat devices
   */
  async startScanning(): Promise<void> {
    if (this.isScanning) {
      console.log('Already scanning');
      return;
    }

    this.isScanning = true;
    console.log('🔍 Scanning for AChat devices...');

    this.manager.startDeviceScan(
      [this.SERVICE_UUID],
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          return;
        }

        if (device) {
          console.log('📱 Found device:', device.name || device.id);
          this.handleDiscoveredDevice(device);
        }
      }
    );

    // Stop scanning after 30 seconds
    setTimeout(() => this.stopScanning(), 30000);
  }

  /**
   * Stop scanning
   */
  stopScanning(): void {
    if (!this.isScanning) return;

    this.manager.stopDeviceScan();
    this.isScanning = false;
    console.log('⏹️ Stopped scanning');
  }

  /**
   * Handle discovered device
   */
  private async handleDiscoveredDevice(device: Device): Promise<void> {
    try {
      // Check if already connected
      if (this.connectedDevices.has(device.id)) {
        return;
      }

      // Connect to device
      console.log('🔗 Connecting to', device.name || device.id);
      const connected = await device.connect();

      // Discover services
      await connected.discoverAllServicesAndCharacteristics();

      // Monitor characteristic for incoming messages
      connected.monitorCharacteristicForService(
        this.SERVICE_UUID,
        this.MESSAGE_CHAR_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('Monitor error:', error);
            return;
          }

          if (characteristic?.value) {
            this.handleIncomingMessage(characteristic);
          }
        }
      );

      this.connectedDevices.set(device.id, connected);
      console.log('✅ Connected to', device.name || device.id);

      // Process pending messages
      this.processPendingMessages();

    } catch (error) {
      console.error('Connection failed:', error);
    }
  }

  /**
   * Send message via mesh
   */
  async sendMessage(destinationId: string, message: string): Promise<void> {
    const meshMessage: MeshMessage = {
      id: this.generateMessageId(),
      type: 'message',
      sourceId: this.deviceId,
      destinationId: destinationId,
      timestamp: Date.now(),
      ttl: 5, // Max 5 hops
      sequenceNumber: Date.now(),
      payload: message,
      path: [this.deviceId],
    };

    console.log('📤 Sending mesh message:', meshMessage);

    if (this.connectedDevices.size === 0) {
      console.log('⏳ No connections - queuing message');
      this.messageQueue.push(meshMessage);
      return;
    }

    try {
      await this.transmitMessage(meshMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
      this.messageQueue.push(meshMessage);
    }
  }

  /**
   * Transmit message to all connected devices
   */
  private async transmitMessage(message: MeshMessage): Promise<void> {
    const encoded = JSON.stringify(message);
    const base64 = Buffer.from(encoded).toString('base64');

    const promises = Array.from(this.connectedDevices.values()).map(device =>
      device.writeCharacteristicWithResponseForService(
        this.SERVICE_UUID,
        this.MESSAGE_CHAR_UUID,
        base64
      )
    );

    await Promise.allSettled(promises);
    console.log('✅ Message transmitted to all neighbors');
  }

  /**
   * Handle incoming message
   */
  private handleIncomingMessage(characteristic: Characteristic): void {
    try {
      if (!characteristic.value) return;

      const decoded = Buffer.from(characteristic.value, 'base64').toString();
      const message: MeshMessage = JSON.parse(decoded);

      console.log('📥 Received mesh message:', message);

      // Check if message is for us
      if (message.destinationId === this.deviceId) {
        console.log('✅ Message delivered!');
        this.deliverMessage(message);
        return;
      }

      // Check TTL
      if (message.ttl <= 0) {
        console.log('❌ Message expired (TTL=0)');
        return;
      }

      // Check for loops
      if (message.path.includes(this.deviceId)) {
        console.log('🔄 Loop detected - discarding');
        return;
      }

      // Forward message
      console.log('🔀 Forwarding message...');
      this.forwardMessage(message);

    } catch (error) {
      console.error('Failed to handle message:', error);
    }
  }

  /**
   * Forward message
   */
  private async forwardMessage(message: MeshMessage): Promise<void> {
    message.ttl -= 1;
    message.path.push(this.deviceId);
    await this.transmitMessage(message);
  }

  /**
   * Deliver message to local user
   */
  private deliverMessage(message: MeshMessage): void {
    console.log('📬 Delivering message to user');

    // TODO: Emit event or call callback
    // DeviceEventEmitter.emit('bluetooth-mesh-message', {
    //   from: message.sourceId,
    //   message: message.payload,
    //   timestamp: message.timestamp,
    //   hops: message.path.length - 1
    // });
  }

  /**
   * Process pending messages
   */
  private async processPendingMessages(): Promise<void> {
    if (this.messageQueue.length === 0) return;

    console.log(`📤 Processing ${this.messageQueue.length} pending messages...`);

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        try {
          await this.transmitMessage(message);
        } catch (error) {
          console.error('Failed to send pending message:', error);
        }
      }
    }
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(): string {
    return `achat-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get network status
   */
  getStatus() {
    return {
      deviceId: this.deviceId,
      connectedDevices: this.connectedDevices.size,
      pendingMessages: this.messageQueue.length,
      routes: this.routingTable.size,
      isScanning: this.isScanning,
    };
  }

  /**
   * Disconnect all devices
   */
  async disconnect(): Promise<void> {
    this.stopScanning();

    const promises = Array.from(this.connectedDevices.values()).map(device =>
      device.cancelConnection()
    );

    await Promise.allSettled(promises);
    this.connectedDevices.clear();

    console.log('🔌 Disconnected from all devices');
  }
}

export default BluetoothService;

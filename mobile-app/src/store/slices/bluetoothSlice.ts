import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import BluetoothService from '../../services/BluetoothService';

interface BluetoothDevice {
  id: string;
  name?: string;
  rssi?: number;
  lastSeen: number;
}

interface MeshMessage {
  id: string;
  sourceId: string;
  destinationId: string;
  content: string;
  timestamp: number;
  hopCount: number;
  status: 'pending' | 'sent' | 'delivered';
}

interface BluetoothState {
  enabled: boolean;
  scanning: boolean;
  devices: Record<string, BluetoothDevice>;
  connectedDevices: string[];
  messages: MeshMessage[];
  pendingMessages: string[];
  routes: Record<string, any>;
  error: string | null;
}

const initialState: BluetoothState = {
  enabled: false,
  scanning: false,
  devices: {},
  connectedDevices: [],
  messages: [],
  pendingMessages: [],
  routes: {},
  error: null,
};

let bluetoothService: BluetoothService | null = null;

// Async thunks
export const initializeBluetooth = createAsyncThunk(
  'bluetooth/initialize',
  async () => {
    bluetoothService = new BluetoothService();
    await bluetoothService.initialize();
    return bluetoothService.getStatus();
  }
);

export const startScanning = createAsyncThunk(
  'bluetooth/startScanning',
  async () => {
    if (!bluetoothService) {
      throw new Error('Bluetooth not initialized');
    }
    await bluetoothService.startScanning();
  }
);

export const stopScanning = createAsyncThunk(
  'bluetooth/stopScanning',
  async () => {
    if (!bluetoothService) {
      throw new Error('Bluetooth not initialized');
    }
    bluetoothService.stopScanning();
  }
);

export const sendMeshMessage = createAsyncThunk(
  'bluetooth/sendMessage',
  async ({
    destinationId,
    content,
  }: {
    destinationId: string;
    content: string;
  }) => {
    if (!bluetoothService) {
      throw new Error('Bluetooth not initialized');
    }

    await bluetoothService.sendMessage(destinationId, content);

    return {
      id: `msg-${Date.now()}`,
      sourceId: 'me',
      destinationId,
      content,
      timestamp: Date.now(),
      hopCount: 0,
      status: 'sent' as const,
    };
  }
);

export const disconnectBluetooth = createAsyncThunk(
  'bluetooth/disconnect',
  async () => {
    if (bluetoothService) {
      await bluetoothService.disconnect();
      bluetoothService = null;
    }
  }
);

// Slice
const bluetoothSlice = createSlice({
  name: 'bluetooth',
  initialState,
  reducers: {
    deviceDiscovered: (state, action: PayloadAction<BluetoothDevice>) => {
      const device = action.payload;
      state.devices[device.id] = device;
    },
    deviceConnected: (state, action: PayloadAction<string>) => {
      const deviceId = action.payload;
      if (!state.connectedDevices.includes(deviceId)) {
        state.connectedDevices.push(deviceId);
      }
    },
    deviceDisconnected: (state, action: PayloadAction<string>) => {
      const deviceId = action.payload;
      state.connectedDevices = state.connectedDevices.filter(
        (id) => id !== deviceId
      );
    },
    messageReceived: (state, action: PayloadAction<MeshMessage>) => {
      state.messages.push(action.payload);
    },
    updateMessageStatus: (
      state,
      action: PayloadAction<{
        messageId: string;
        status: MeshMessage['status'];
      }>
    ) => {
      const { messageId, status } = action.payload;
      const message = state.messages.find((m) => m.id === messageId);
      if (message) {
        message.status = status;
      }
    },
    routeDiscovered: (
      state,
      action: PayloadAction<{
        destination: string;
        nextHop: string;
        hopCount: number;
      }>
    ) => {
      const { destination, nextHop, hopCount } = action.payload;
      state.routes[destination] = { nextHop, hopCount };
    },
    clearDevices: (state) => {
      state.devices = {};
      state.connectedDevices = [];
    },
  },
  extraReducers: (builder) => {
    // Initialize
    builder.addCase(initializeBluetooth.fulfilled, (state, action) => {
      state.enabled = true;
      state.error = null;
    });
    builder.addCase(initializeBluetooth.rejected, (state, action) => {
      state.enabled = false;
      state.error = action.error.message || 'Failed to initialize Bluetooth';
    });

    // Start Scanning
    builder.addCase(startScanning.pending, (state) => {
      state.scanning = true;
    });
    builder.addCase(startScanning.fulfilled, (state) => {
      state.scanning = true;
    });
    builder.addCase(startScanning.rejected, (state, action) => {
      state.scanning = false;
      state.error = action.error.message || 'Failed to start scanning';
    });

    // Stop Scanning
    builder.addCase(stopScanning.fulfilled, (state) => {
      state.scanning = false;
    });

    // Send Message
    builder.addCase(sendMeshMessage.pending, (state, action) => {
      const messageId = `msg-${Date.now()}`;
      state.pendingMessages.push(messageId);
    });
    builder.addCase(sendMeshMessage.fulfilled, (state, action) => {
      state.messages.push(action.payload);
      state.pendingMessages = state.pendingMessages.filter(
        (id) => id !== action.payload.id
      );
    });
    builder.addCase(sendMeshMessage.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to send message';
    });

    // Disconnect
    builder.addCase(disconnectBluetooth.fulfilled, (state) => {
      state.enabled = false;
      state.scanning = false;
      state.devices = {};
      state.connectedDevices = [];
    });
  },
});

export const {
  deviceDiscovered,
  deviceConnected,
  deviceDisconnected,
  messageReceived,
  updateMessageStatus,
  routeDiscovered,
  clearDevices,
} = bluetoothSlice.actions;

export default bluetoothSlice.reducer;

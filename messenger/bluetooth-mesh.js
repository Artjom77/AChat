/**
 * AChat Bluetooth Mesh Network - Web Bluetooth API Implementation
 *
 * This is a PROOF OF CONCEPT implementation showing basic mesh networking.
 * Full production implementation would require 4-6 months of development.
 *
 * Supported: Chrome/Edge on Android, Chrome on Windows/Mac/Linux
 * NOT supported: iOS Safari (Apple restrictions)
 */

class BluetoothMeshNetwork {
    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
        this.isConnected = false;
        this.neighbors = new Map(); // deviceId -> { device, lastSeen }
        this.routingTable = new Map(); // destinationId -> { nextHop, hopCount }
        this.messageQueue = [];
        this.pendingMessages = new Map(); // messageId -> { message, attempts }

        // Configuration
        this.SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0'; // Custom service
        this.MESSAGE_CHARACTERISTIC_UUID = '12345678-1234-5678-1234-56789abcdef1';
        this.DEVICE_ID = this.generateDeviceId();
    }

    /**
     * Check if Web Bluetooth is supported
     */
    isSupported() {
        if (!navigator.bluetooth) {
            console.error('Web Bluetooth not supported');
            return false;
        }
        return true;
    }

    /**
     * Generate unique device ID
     */
    generateDeviceId() {
        return 'achat-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Start Bluetooth mesh service
     */
    async start() {
        if (!this.isSupported()) {
            throw new Error('Bluetooth not supported on this device/browser');
        }

        console.log('🔵 Starting Bluetooth Mesh Network...');
        console.log('Device ID:', this.DEVICE_ID);

        // Start discovery
        await this.discoverDevices();

        // Start periodic neighbor discovery
        setInterval(() => this.discoverDevices(), 30000); // Every 30 seconds
    }

    /**
     * Discover nearby AChat devices
     */
    async discoverDevices() {
        try {
            console.log('🔍 Scanning for AChat devices...');

            // Request device
            this.device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: [this.SERVICE_UUID] },
                    { namePrefix: 'AChat' }
                ],
                optionalServices: [this.SERVICE_UUID]
            });

            console.log('📱 Found device:', this.device.name);

            // Connect to device
            await this.connectToDevice(this.device);

        } catch (error) {
            if (error.name === 'NotFoundError') {
                console.log('No AChat devices found nearby');
            } else {
                console.error('Discovery error:', error);
            }
        }
    }

    /**
     * Connect to discovered device
     */
    async connectToDevice(device) {
        try {
            console.log('🔗 Connecting to', device.name);

            this.server = await device.gatt.connect();
            this.service = await this.server.getPrimaryService(this.SERVICE_UUID);
            this.characteristic = await this.service.getCharacteristic(this.MESSAGE_CHARACTERISTIC_UUID);

            // Setup notifications (receive messages)
            await this.characteristic.startNotifications();
            this.characteristic.addEventListener('characteristicvaluechanged',
                (event) => this.handleIncomingMessage(event)
            );

            this.isConnected = true;
            this.neighbors.set(device.id, {
                device: device,
                lastSeen: Date.now()
            });

            console.log('✅ Connected to', device.name);

            // Send pending messages
            this.processPendingMessages();

        } catch (error) {
            console.error('Connection error:', error);
            this.isConnected = false;
        }
    }

    /**
     * Send message via mesh
     */
    async sendMessage(destinationId, message) {
        const meshMessage = {
            version: 1,
            type: 'message',
            id: this.generateMessageId(),
            sourceId: this.DEVICE_ID,
            destinationId: destinationId,
            timestamp: Date.now(),
            ttl: 5, // Max 5 hops
            sequenceNumber: Date.now(),
            payload: message,
            path: [this.DEVICE_ID] // Track message path
        };

        console.log('📤 Sending mesh message:', meshMessage);

        if (!this.isConnected) {
            console.log('⏳ Not connected - queuing message');
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
     * Transmit message via Bluetooth
     */
    async transmitMessage(message) {
        if (!this.characteristic) {
            throw new Error('Not connected');
        }

        const encoded = new TextEncoder().encode(JSON.stringify(message));

        // BLE has MTU limit (usually 512 bytes)
        if (encoded.length > 512) {
            console.warn('Message too large, fragmenting...');
            await this.sendFragmented(message);
            return;
        }

        await this.characteristic.writeValue(encoded);
        console.log('✅ Message transmitted');
    }

    /**
     * Handle incoming message
     */
    handleIncomingMessage(event) {
        const value = event.target.value;
        const decoded = new TextDecoder().decode(value);

        try {
            const message = JSON.parse(decoded);
            console.log('📥 Received mesh message:', message);

            // Check if message is for us
            if (message.destinationId === this.DEVICE_ID) {
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
            if (message.path.includes(this.DEVICE_ID)) {
                console.log('🔄 Loop detected - discarding');
                return;
            }

            // Forward message
            console.log('🔀 Forwarding message...');
            this.forwardMessage(message);

        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    }

    /**
     * Forward message to next hop
     */
    async forwardMessage(message) {
        // Decrease TTL
        message.ttl -= 1;
        message.path.push(this.DEVICE_ID);

        // Find route
        const route = await this.discoverRoute(message.destinationId);

        if (!route) {
            console.error('No route to destination');
            return;
        }

        // Transmit to next hop
        await this.transmitMessage(message);
    }

    /**
     * Discover route to destination (AODV-like)
     */
    async discoverRoute(destinationId) {
        // Check routing table
        if (this.routingTable.has(destinationId)) {
            const route = this.routingTable.get(destinationId);
            console.log('📍 Route found in table:', route);
            return route;
        }

        console.log('🔍 Discovering route to', destinationId);

        // Broadcast RREQ (Route Request)
        const rreq = {
            version: 1,
            type: 'RREQ',
            id: this.generateMessageId(),
            sourceId: this.DEVICE_ID,
            destinationId: destinationId,
            timestamp: Date.now(),
            ttl: 5,
            sequenceNumber: Date.now(),
            hopCount: 0,
            path: [this.DEVICE_ID]
        };

        await this.transmitMessage(rreq);

        // Wait for RREP (Route Reply)
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log('⏱️ Route discovery timeout');
                resolve(null);
            }, 5000);

            // TODO: Listen for RREP
            // For now, return null (no route)
            resolve(null);
        });
    }

    /**
     * Deliver message to local user
     */
    deliverMessage(message) {
        console.log('📬 Delivering message to user:', message.payload);

        // Fire custom event
        const event = new CustomEvent('bluetooth-mesh-message', {
            detail: {
                from: message.sourceId,
                message: message.payload,
                timestamp: message.timestamp,
                hops: message.path.length - 1
            }
        });

        window.dispatchEvent(event);
    }

    /**
     * Process pending messages
     */
    async processPendingMessages() {
        if (this.messageQueue.length === 0) return;

        console.log(`📤 Processing ${this.messageQueue.length} pending messages...`);

        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            try {
                await this.transmitMessage(message);
            } catch (error) {
                console.error('Failed to send pending message:', error);
                // Re-queue with attempt tracking
                const attempts = this.pendingMessages.get(message.id) || 0;
                if (attempts < 3) {
                    this.messageQueue.push(message);
                    this.pendingMessages.set(message.id, attempts + 1);
                } else {
                    console.error('Message failed after 3 attempts');
                }
            }
        }
    }

    /**
     * Fragment large messages
     */
    async sendFragmented(message) {
        const FRAGMENT_SIZE = 400;
        const payload = JSON.stringify(message);
        const totalFragments = Math.ceil(payload.length / FRAGMENT_SIZE);

        console.log(`✂️ Fragmenting message into ${totalFragments} pieces`);

        for (let i = 0; i < totalFragments; i++) {
            const start = i * FRAGMENT_SIZE;
            const end = Math.min(start + FRAGMENT_SIZE, payload.length);
            const fragment = payload.slice(start, end);

            const fragmentMessage = {
                ...message,
                id: `${message.id}-frag-${i}`,
                fragmentIndex: i,
                totalFragments: totalFragments,
                payload: fragment
            };

            await this.transmitMessage(fragmentMessage);

            // Small delay between fragments
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Disconnect from all devices
     */
    async disconnect() {
        if (this.device && this.device.gatt.connected) {
            await this.device.gatt.disconnect();
        }

        this.isConnected = false;
        this.neighbors.clear();
        console.log('🔌 Disconnected from Bluetooth mesh');
    }

    /**
     * Get network status
     */
    getStatus() {
        return {
            deviceId: this.DEVICE_ID,
            connected: this.isConnected,
            neighbors: this.neighbors.size,
            pendingMessages: this.messageQueue.length,
            routes: this.routingTable.size
        };
    }
}

// Export for use in messenger
window.BluetoothMeshNetwork = BluetoothMeshNetwork;

console.log('✅ Bluetooth Mesh Network module loaded');

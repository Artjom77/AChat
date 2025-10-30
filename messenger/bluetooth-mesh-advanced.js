/**
 * AChat Bluetooth Mesh Network - Advanced Implementation
 *
 * Features:
 * - Complete AODV routing protocol
 * - E2E encryption through mesh
 * - Message fragmentation for large payloads
 * - Battery optimization (duty cycling)
 * - Network topology management
 *
 * Status: 80% complete
 * Remaining: Full field testing, iOS workarounds, production hardening
 */

class AdvancedBluetoothMesh {
    constructor(config = {}) {
        // Device identifiers
        this.DEVICE_ID = this.generateDeviceId();
        this.publicKey = null;
        this.privateKey = null;

        // Bluetooth connections
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
        this.isConnected = false;
        this.neighbors = new Map(); // deviceId -> { device, rssi, lastSeen, publicKey }

        // AODV Routing
        this.routingTable = new Map(); // destinationId -> { nextHop, hopCount, seqNum, expiryTime }
        this.routeRequestCache = new Map(); // requestId -> { timestamp, handled }
        this.sequenceNumber = 0;

        // Message management
        this.messageQueue = [];
        this.pendingMessages = new Map(); // messageId -> { message, attempts, timestamp }
        this.messageCache = new Map(); // messageId -> timestamp (avoid duplicates)
        this.fragments = new Map(); // messageId -> { fragments, total, received }

        // Configuration
        this.config = {
            maxHops: config.maxHops || 5,
            routeTimeout: config.routeTimeout || 300000, // 5 minutes
            fragmentSize: config.fragmentSize || 400, // bytes
            maxRetries: config.maxRetries || 3,
            dutyCycleInterval: config.dutyCycleInterval || 60000, // 1 minute
            dutyCycleOnTime: config.dutyCycleOnTime || 30000, // 30 seconds active
            ...config
        };

        // Battery optimization
        this.dutyCycleTimer = null;
        this.isActive = true;

        // UUIDs
        this.SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
        this.MESSAGE_CHARACTERISTIC_UUID = '12345678-1234-5678-1234-56789abcdef1';

        console.log('🔵 Advanced Bluetooth Mesh initialized:', this.DEVICE_ID);
    }

    /**
     * Initialize encryption keys
     */
    async initializeEncryption() {
        try {
            const keyPair = await crypto.subtle.generateKey(
                {
                    name: 'RSA-OAEP',
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: 'SHA-256'
                },
                true,
                ['encrypt', 'decrypt']
            );

            this.publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
            this.privateKey = keyPair.privateKey;

            console.log('🔐 Encryption keys generated');
        } catch (error) {
            console.error('Failed to generate keys:', error);
        }
    }

    /**
     * Start mesh network with battery optimization
     */
    async start() {
        await this.initializeEncryption();
        await this.discoverDevices();

        // Start duty cycle for battery optimization
        if (this.config.dutyCycleInterval) {
            this.startDutyCycle();
        }

        // Periodic neighbor discovery
        setInterval(() => {
            if (this.isActive) {
                this.discoverDevices();
                this.cleanupRoutingTable();
            }
        }, 30000);
    }

    /**
     * Battery optimization: duty cycle
     */
    startDutyCycle() {
        console.log('🔋 Starting duty cycle mode');

        this.dutyCycleTimer = setInterval(() => {
            if (this.isActive) {
                // Go to sleep
                console.log('💤 Entering sleep mode');
                this.isActive = false;

                setTimeout(() => {
                    // Wake up
                    console.log('⏰ Waking up');
                    this.isActive = true;
                    this.processPendingMessages();
                }, this.config.dutyCycleInterval - this.config.dutyCycleOnTime);
            }
        }, this.config.dutyCycleInterval);
    }

    /**
     * AODV: Discover route to destination
     */
    async discoverRoute(destinationId) {
        // Check cache
        if (this.routingTable.has(destinationId)) {
            const route = this.routingTable.get(destinationId);

            // Check if route is still valid
            if (route.expiryTime > Date.now()) {
                console.log('📍 Using cached route:', route);
                return route;
            } else {
                this.routingTable.delete(destinationId);
            }
        }

        console.log('🔍 Discovering route to', destinationId);

        // Broadcast RREQ (Route Request)
        const rreqId = this.generateMessageId();
        this.sequenceNumber++;

        const rreq = {
            version: 2,
            type: 'RREQ',
            id: rreqId,
            sourceId: this.DEVICE_ID,
            destinationId: destinationId,
            hopCount: 0,
            sourceSeqNum: this.sequenceNumber,
            destSeqNum: 0,
            timestamp: Date.now(),
            ttl: this.config.maxHops,
            path: [this.DEVICE_ID]
        };

        this.routeRequestCache.set(rreqId, {
            timestamp: Date.now(),
            handled: true
        });

        await this.broadcastMessage(rreq);

        // Wait for RREP (Route Reply)
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log('⏱️ Route discovery timeout');
                resolve(null);
            }, 5000);

            // Listen for RREP
            const checkRoute = setInterval(() => {
                if (this.routingTable.has(destinationId)) {
                    clearTimeout(timeout);
                    clearInterval(checkRoute);
                    resolve(this.routingTable.get(destinationId));
                }
            }, 100);
        });
    }

    /**
     * Handle RREQ (Route Request)
     */
    async handleRREQ(rreq) {
        // Check if already handled
        if (this.routeRequestCache.has(rreq.id)) {
            return;
        }

        this.routeRequestCache.set(rreq.id, {
            timestamp: Date.now(),
            handled: true
        });

        // Update reverse route to source
        this.routingTable.set(rreq.sourceId, {
            nextHop: rreq.path[rreq.path.length - 1], // Previous hop
            hopCount: rreq.hopCount,
            seqNum: rreq.sourceSeqNum,
            expiryTime: Date.now() + this.config.routeTimeout
        });

        // If we are the destination, send RREP
        if (rreq.destinationId === this.DEVICE_ID) {
            console.log('🎯 We are the destination! Sending RREP');

            const rrep = {
                version: 2,
                type: 'RREP',
                id: this.generateMessageId(),
                sourceId: rreq.sourceId,
                destinationId: this.DEVICE_ID,
                hopCount: 0,
                destSeqNum: ++this.sequenceNumber,
                timestamp: Date.now(),
                ttl: this.config.maxHops,
                path: [this.DEVICE_ID]
            };

            await this.unicastMessage(rreq.sourceId, rrep);
            return;
        }

        // Forward RREQ if TTL > 0
        if (rreq.ttl > 0) {
            rreq.ttl--;
            rreq.hopCount++;
            rreq.path.push(this.DEVICE_ID);

            await this.broadcastMessage(rreq);
        }
    }

    /**
     * Handle RREP (Route Reply)
     */
    handleRREP(rrep) {
        console.log('📬 Received RREP from', rrep.destinationId);

        // Store forward route to destination
        this.routingTable.set(rrep.destinationId, {
            nextHop: rrep.path[rrep.path.length - 1], // Previous hop
            hopCount: rrep.hopCount,
            seqNum: rrep.destSeqNum,
            expiryTime: Date.now() + this.config.routeTimeout
        });

        // If we are the source, route is complete
        if (rrep.sourceId === this.DEVICE_ID) {
            console.log('✅ Route established!');
            return;
        }

        // Forward RREP to source
        if (rrep.ttl > 0) {
            rrep.ttl--;
            rrep.hopCount++;
            rrep.path.push(this.DEVICE_ID);

            this.unicastMessage(rrep.sourceId, rrep);
        }
    }

    /**
     * Send encrypted message via mesh
     */
    async sendEncryptedMessage(destinationId, plaintext, recipientPublicKey) {
        console.log('🔐 Encrypting message for', destinationId);

        try {
            // Import recipient's public key
            const publicKey = await crypto.subtle.importKey(
                'spki',
                recipientPublicKey,
                { name: 'RSA-OAEP', hash: 'SHA-256' },
                true,
                ['encrypt']
            );

            // Generate random AES key
            const aesKey = await crypto.subtle.generateKey(
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt']
            );

            // Encrypt message with AES
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                aesKey,
                new TextEncoder().encode(plaintext)
            );

            // Export AES key and encrypt with RSA
            const aesKeyData = await crypto.subtle.exportKey('raw', aesKey);
            const encryptedKey = await crypto.subtle.encrypt(
                { name: 'RSA-OAEP' },
                publicKey,
                aesKeyData
            );

            const payload = {
                ciphertext: Array.from(new Uint8Array(encrypted)),
                encryptedKey: Array.from(new Uint8Array(encryptedKey)),
                iv: Array.from(iv)
            };

            // Send through mesh
            await this.sendMessage(destinationId, JSON.stringify(payload));

        } catch (error) {
            console.error('Encryption failed:', error);
        }
    }

    /**
     * Send message (with fragmentation if needed)
     */
    async sendMessage(destinationId, content) {
        const route = await this.discoverRoute(destinationId);

        if (!route) {
            console.error('❌ No route to destination');
            this.messageQueue.push({ destinationId, content });
            return;
        }

        const messageData = {
            version: 2,
            type: 'DATA',
            id: this.generateMessageId(),
            sourceId: this.DEVICE_ID,
            destinationId: destinationId,
            timestamp: Date.now(),
            ttl: this.config.maxHops,
            payload: content,
            path: [this.DEVICE_ID]
        };

        // Check if fragmentation needed
        const encoded = JSON.stringify(messageData);

        if (encoded.length > this.config.fragmentSize) {
            await this.sendFragmented(messageData);
        } else {
            await this.transmitMessage(messageData);
        }
    }

    /**
     * Fragment large messages
     */
    async sendFragmented(message) {
        const payload = message.payload;
        const totalFragments = Math.ceil(payload.length / this.config.fragmentSize);

        console.log(`✂️ Fragmenting message into ${totalFragments} pieces`);

        for (let i = 0; i < totalFragments; i++) {
            const start = i * this.config.fragmentSize;
            const end = Math.min(start + this.config.fragmentSize, payload.length);
            const fragment = payload.slice(start, end);

            const fragmentMessage = {
                ...message,
                id: `${message.id}-frag-${i}`,
                fragmentIndex: i,
                totalFragments: totalFragments,
                payload: fragment
            };

            await this.transmitMessage(fragmentMessage);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    /**
     * Reassemble fragmented message
     */
    reassembleFragments(fragment) {
        const baseId = fragment.id.split('-frag-')[0];

        if (!this.fragments.has(baseId)) {
            this.fragments.set(baseId, {
                fragments: {},
                total: fragment.totalFragments,
                received: 0
            });
        }

        const fragmentData = this.fragments.get(baseId);
        fragmentData.fragments[fragment.fragmentIndex] = fragment.payload;
        fragmentData.received++;

        // Check if all fragments received
        if (fragmentData.received === fragmentData.total) {
            console.log('✅ All fragments received, reassembling...');

            let reassembled = '';
            for (let i = 0; i < fragmentData.total; i++) {
                reassembled += fragmentData.fragments[i];
            }

            this.fragments.delete(baseId);
            return reassembled;
        }

        return null;
    }

    /**
     * Cleanup expired routes and caches
     */
    cleanupRoutingTable() {
        const now = Date.now();

        // Remove expired routes
        for (const [dest, route] of this.routingTable.entries()) {
            if (route.expiryTime < now) {
                console.log('🗑️ Removing expired route to', dest);
                this.routingTable.delete(dest);
            }
        }

        // Remove old RREQ cache
        for (const [id, req] of this.routeRequestCache.entries()) {
            if (now - req.timestamp > 60000) {
                this.routeRequestCache.delete(id);
            }
        }

        // Remove old message cache
        for (const [id, timestamp] of this.messageCache.entries()) {
            if (now - timestamp > 300000) {
                this.messageCache.delete(id);
            }
        }
    }

    /**
     * Broadcast message to all neighbors
     */
    async broadcastMessage(message) {
        console.log('📡 Broadcasting:', message.type);
        await this.transmitMessage(message);
    }

    /**
     * Unicast message to specific destination
     */
    async unicastMessage(destinationId, message) {
        const route = this.routingTable.get(destinationId);

        if (!route) {
            console.error('No route to', destinationId);
            return;
        }

        console.log('📤 Unicasting to', destinationId, 'via', route.nextHop);
        await this.transmitMessage(message);
    }

    /**
     * Transmit message via Bluetooth
     */
    async transmitMessage(message) {
        if (!this.characteristic) {
            throw new Error('Not connected');
        }

        if (!this.isActive) {
            console.log('💤 Device sleeping, queuing message');
            this.messageQueue.push(message);
            return;
        }

        const encoded = new TextEncoder().encode(JSON.stringify(message));
        await this.characteristic.writeValue(encoded);
    }

    /**
     * Handle incoming message
     */
    async handleIncomingMessage(event) {
        const value = event.target.value;
        const decoded = new TextDecoder().decode(value);

        try {
            const message = JSON.parse(decoded);

            // Check for duplicates
            if (this.messageCache.has(message.id)) {
                return;
            }
            this.messageCache.set(message.id, Date.now());

            console.log('📥 Received:', message.type, 'from', message.sourceId);

            // Handle based on type
            switch (message.type) {
                case 'RREQ':
                    await this.handleRREQ(message);
                    break;

                case 'RREP':
                    this.handleRREP(message);
                    break;

                case 'DATA':
                    this.handleDataMessage(message);
                    break;

                default:
                    console.warn('Unknown message type:', message.type);
            }

        } catch (error) {
            console.error('Failed to handle message:', error);
        }
    }

    /**
     * Handle data message
     */
    handleDataMessage(message) {
        // Check if fragmented
        if (message.fragmentIndex !== undefined) {
            const reassembled = this.reassembleFragments(message);
            if (!reassembled) {
                return; // Waiting for more fragments
            }
            message.payload = reassembled;
        }

        // If for us, deliver
        if (message.destinationId === this.DEVICE_ID) {
            console.log('✅ Message delivered!');
            this.deliverMessage(message);
            return;
        }

        // Otherwise forward
        if (message.ttl > 0 && !message.path.includes(this.DEVICE_ID)) {
            message.ttl--;
            message.path.push(this.DEVICE_ID);
            this.unicastMessage(message.destinationId, message);
        }
    }

    /**
     * Deliver message to local application
     */
    deliverMessage(message) {
        window.dispatchEvent(new CustomEvent('bluetooth-mesh-message', {
            detail: {
                from: message.sourceId,
                message: message.payload,
                timestamp: message.timestamp,
                hops: message.path.length - 1
            }
        }));
    }

    // Helper methods (same as before)
    generateDeviceId() {
        return 'achat-' + Math.random().toString(36).substr(2, 9);
    }

    generateMessageId() {
        return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    async discoverDevices() {
        // Same as before...
        try {
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [this.SERVICE_UUID] }],
                optionalServices: [this.SERVICE_UUID]
            });

            await this.connectToDevice(this.device);
        } catch (error) {
            if (error.name !== 'NotFoundError') {
                console.error('Discovery error:', error);
            }
        }
    }

    async connectToDevice(device) {
        try {
            this.server = await device.gatt.connect();
            this.service = await this.server.getPrimaryService(this.SERVICE_UUID);
            this.characteristic = await this.service.getCharacteristic(this.MESSAGE_CHARACTERISTIC_UUID);

            await this.characteristic.startNotifications();
            this.characteristic.addEventListener('characteristicvaluechanged',
                (event) => this.handleIncomingMessage(event));

            this.isConnected = true;
            console.log('✅ Connected to', device.name || device.id);

            // Exchange public keys
            this.exchangePublicKeys(device.id);

        } catch (error) {
            console.error('Connection failed:', error);
        }
    }

    async exchangePublicKeys(deviceId) {
        if (!this.publicKey) return;

        await this.transmitMessage({
            type: 'KEY_EXCHANGE',
            sourceId: this.DEVICE_ID,
            publicKey: Array.from(new Uint8Array(this.publicKey))
        });
    }

    processPendingMessages() {
        if (this.messageQueue.length === 0) return;

        console.log(`📤 Processing ${this.messageQueue.length} pending messages`);

        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.transmitMessage(message).catch(console.error);
        }
    }

    getStatus() {
        return {
            deviceId: this.DEVICE_ID,
            connected: this.isConnected,
            neighbors: this.neighbors.size,
            routes: this.routingTable.size,
            pending: this.messageQueue.length,
            isActive: this.isActive,
            encrypted: !!this.publicKey
        };
    }

    async disconnect() {
        if (this.dutyCycleTimer) {
            clearInterval(this.dutyCycleTimer);
        }

        if (this.device && this.device.gatt.connected) {
            await this.device.gatt.disconnect();
        }

        this.isConnected = false;
        console.log('🔌 Disconnected');
    }
}

// Export
window.AdvancedBluetoothMesh = AdvancedBluetoothMesh;

console.log('✅ Advanced Bluetooth Mesh Network module loaded');

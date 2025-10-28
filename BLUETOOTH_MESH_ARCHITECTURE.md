# 📡 AChat Bluetooth Mesh Network - Architecture

## 🎯 Цель

Создать децентрализованную mesh-сеть для обмена сообщениями через Bluetooth, работающую даже без интернета.

**Use Cases:**
- Катаклизмы (землетрясения, наводнения)
- Отключение интернета властями
- Массовые мероприятия с перегруженной сетью
- Удалённые локации без покрытия
- Конфиденциальные коммуникации

---

## 🏗️ Архитектура

### High-Level Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Device A  │◄───────►│   Device B  │◄───────►│   Device C  │
│  (Sender)   │  BT     │  (Relay)    │  BT     │ (Receiver)  │
└─────────────┘         └─────────────┘         └─────────────┘
                                │
                                │ BT
                                ▼
                        ┌─────────────┐
                        │   Device D  │
                        │  (Relay)    │
                        └─────────────┘
```

### Протокол стека

```
┌──────────────────────────────────────┐
│     Application Layer                │  ← AChat Messages
├──────────────────────────────────────┤
│     Encryption Layer (E2E)           │  ← Signal Protocol
├──────────────────────────────────────┤
│     Routing Layer                    │  ← Mesh Routing (AODV-like)
├──────────────────────────────────────┤
│     Network Layer                    │  ← Packet Fragmentation
├──────────────────────────────────────┤
│     Transport Layer                  │  ← BLE GATT
├──────────────────────────────────────┤
│     Physical Layer                   │  ← Bluetooth 5.0+
└──────────────────────────────────────┘
```

---

## 🔧 Технические компоненты

### 1. Bluetooth Low Energy (BLE)

**Почему BLE?**
- Низкое энергопотребление
- До 100m дальность (в идеальных условиях)
- Поддержка iOS и Android
- Web Bluetooth API для веба

**Ограничения:**
- Скорость: ~1 Mbps (реально ~100 kbps)
- MTU: 512 bytes (обычно 23-255)
- Одновременные соединения: 7-8 устройств

### 2. Web Bluetooth API (для PWA)

```javascript
// navigator.bluetooth API
const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: ['achat-mesh-service'] }]
});

const server = await device.gatt.connect();
const service = await server.getPrimaryService('achat-mesh-service');
const characteristic = await service.getCharacteristic('message-characteristic');

// Send message
await characteristic.writeValue(new TextEncoder().encode(message));

// Receive messages
await characteristic.startNotifications();
characteristic.addEventListener('characteristicvaluechanged', (event) => {
    const message = new TextDecoder().decode(event.target.value);
    handleIncomingMessage(message);
});
```

### 3. Mesh Routing Algorithm

**AODV (Ad-hoc On-Demand Distance Vector)**

```typescript
interface MeshNode {
    id: string;              // Device UUID
    publicKey: string;       // For encryption
    neighbors: string[];     // Connected devices
    lastSeen: number;        // Timestamp
    batteryLevel: number;    // For routing optimization
}

interface Route {
    destination: string;     // Target device ID
    nextHop: string;         // Next device in path
    hopCount: number;        // Distance
    sequenceNumber: number;  // For loop prevention
}

class MeshRouter {
    private routingTable: Map<string, Route> = new Map();
    private neighbors: Set<string> = new Set();

    // Discover route to destination
    async discoverRoute(destinationId: string): Promise<Route | null> {
        // 1. Check if already in routing table
        if (this.routingTable.has(destinationId)) {
            return this.routingTable.get(destinationId)!;
        }

        // 2. Broadcast Route Request (RREQ)
        const rreq = {
            type: 'RREQ',
            source: this.deviceId,
            destination: destinationId,
            sequenceNumber: this.getNextSequence(),
            hopCount: 0
        };

        await this.broadcast(rreq);

        // 3. Wait for Route Reply (RREP)
        return new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(null), 5000);

            this.once('route-reply', (rrep) => {
                clearTimeout(timeout);

                const route: Route = {
                    destination: rrep.source,
                    nextHop: rrep.nextHop,
                    hopCount: rrep.hopCount,
                    sequenceNumber: rrep.sequenceNumber
                };

                this.routingTable.set(destinationId, route);
                resolve(route);
            });
        });
    }

    // Forward message to next hop
    async forwardMessage(message: EncryptedMessage) {
        const route = await this.discoverRoute(message.destinationId);

        if (!route) {
            throw new Error('No route to destination');
        }

        // Send to next hop
        await this.sendTo(route.nextHop, message);
    }
}
```

### 4. E2E Encryption через Mesh

**Проблема:** Сообщение проходит через множество узлов

**Решение:** Signal Protocol (Double Ratchet)

```typescript
class MeshEncryption {
    // Generate key pair for each device
    async generateKeyPair() {
        return crypto.subtle.generateKey(
            {
                name: "ECDH",
                namedCurve: "P-256"
            },
            true,
            ["deriveKey", "deriveBits"]
        );
    }

    // Encrypt message for specific recipient
    async encryptMessage(plaintext: string, recipientPublicKey: CryptoKey) {
        // 1. Generate ephemeral key
        const ephemeralKey = await this.generateKeyPair();

        // 2. Derive shared secret (ECDH)
        const sharedSecret = await crypto.subtle.deriveKey(
            {
                name: "ECDH",
                public: recipientPublicKey
            },
            ephemeralKey.privateKey,
            {
                name: "AES-GCM",
                length: 256
            },
            false,
            ["encrypt"]
        );

        // 3. Encrypt with AES-GCM
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            sharedSecret,
            new TextEncoder().encode(plaintext)
        );

        return {
            ciphertext: encrypted,
            iv: iv,
            ephemeralPublicKey: ephemeralKey.publicKey
        };
    }

    // Relay nodes CANNOT decrypt - only forward
    async relayMessage(encryptedMessage: EncryptedMessage) {
        // Relay просто пересылает зашифрованные данные
        // без возможности расшифровки
        return encryptedMessage;
    }
}
```

### 5. Message Format

```typescript
interface MeshMessage {
    // Header (unencrypted)
    version: number;              // Protocol version
    type: 'message' | 'rreq' | 'rrep' | 'ack';
    sourceId: string;             // Sender device ID
    destinationId: string;        // Recipient device ID
    messageId: string;            // Unique message ID
    timestamp: number;            // Unix timestamp
    ttl: number;                  // Time-to-live (hop limit)
    sequenceNumber: number;       // For duplicate detection

    // Payload (encrypted)
    encryptedPayload: ArrayBuffer;
    iv: ArrayBuffer;
    ephemeralPublicKey: ArrayBuffer;

    // Signature (for authenticity)
    signature: ArrayBuffer;
}
```

### 6. Fragmentation (для больших сообщений)

BLE MTU = 512 bytes, но сообщения могут быть больше.

```typescript
class MessageFragmenter {
    private readonly FRAGMENT_SIZE = 400; // bytes

    fragmentMessage(message: MeshMessage): MeshMessage[] {
        const payload = new Uint8Array(message.encryptedPayload);

        if (payload.length <= this.FRAGMENT_SIZE) {
            return [message];
        }

        const fragments: MeshMessage[] = [];
        const totalFragments = Math.ceil(payload.length / this.FRAGMENT_SIZE);

        for (let i = 0; i < totalFragments; i++) {
            const start = i * this.FRAGMENT_SIZE;
            const end = Math.min(start + this.FRAGMENT_SIZE, payload.length);
            const fragment = payload.slice(start, end);

            fragments.push({
                ...message,
                messageId: `${message.messageId}-${i}`,
                fragmentIndex: i,
                totalFragments: totalFragments,
                encryptedPayload: fragment.buffer
            });
        }

        return fragments;
    }

    reassembleFragments(fragments: MeshMessage[]): MeshMessage {
        // Sort by fragmentIndex
        fragments.sort((a, b) => a.fragmentIndex - b.fragmentIndex);

        // Concatenate payloads
        const combined = new Uint8Array(
            fragments.reduce((acc, f) => acc + f.encryptedPayload.byteLength, 0)
        );

        let offset = 0;
        for (const fragment of fragments) {
            const payload = new Uint8Array(fragment.encryptedPayload);
            combined.set(payload, offset);
            offset += payload.length;
        }

        return {
            ...fragments[0],
            encryptedPayload: combined.buffer
        };
    }
}
```

---

## 📊 Performance Considerations

### Latency

```
Message delivery time = (hop_count × transmission_time) + routing_overhead

Example:
- hop_count: 4 nodes
- transmission_time: 500ms per hop
- routing_overhead: 1000ms (route discovery)

Total: 4 × 500ms + 1000ms = 3000ms (3 seconds)
```

### Battery Optimization

**Strategies:**
1. **Duty Cycling:** Bluetooth вкл/выкл циклически
2. **Role Assignment:** Некоторые устройства - только relay
3. **Adaptive Power:** Снижать мощность при близких соседях
4. **Message Prioritization:** Важные сообщения первыми

```typescript
class PowerManager {
    private role: 'relay' | 'leaf' | 'router';

    async optimizePower() {
        const batteryLevel = await this.getBatteryLevel();

        if (batteryLevel < 20) {
            // Low battery - minimal participation
            this.role = 'leaf';
            this.dutyCycle = 0.2; // 20% active time
        } else if (batteryLevel < 50) {
            // Medium battery - selective relaying
            this.role = 'relay';
            this.dutyCycle = 0.5;
        } else {
            // High battery - full router
            this.role = 'router';
            this.dutyCycle = 0.9;
        }
    }
}
```

### Scalability

**Limitations:**
- Max simultaneous connections: 7-8 per device
- Network size: ~100 devices praktisch
- Coverage area: ~1km² (urban), ~10km² (open area)

---

## 🔐 Security

### Threat Model

**Threats:**
1. **Eavesdropping** - Relay node пытается читать сообщения
2. **Man-in-the-Middle** - Подмена ключей
3. **Sybil Attack** - Множество фальшивых узлов
4. **DoS** - Flood атака

**Mitigations:**
1. **E2E Encryption** - Signal Protocol
2. **Key Exchange** - ECDH + Public Key Pinning
3. **Device Authentication** - Signed messages
4. **Rate Limiting** - Max messages per device
5. **Reputation System** - Блокировка подозрительных узлов

### Trust Model

```typescript
class TrustManager {
    private reputation: Map<string, number> = new Map();

    // Track device behavior
    recordBehavior(deviceId: string, action: 'relay' | 'drop' | 'corrupt') {
        const current = this.reputation.get(deviceId) || 50; // Start at 50%

        if (action === 'relay') {
            this.reputation.set(deviceId, Math.min(100, current + 1));
        } else {
            this.reputation.set(deviceId, Math.max(0, current - 10));
        }
    }

    // Decide whether to use device as relay
    shouldTrust(deviceId: string): boolean {
        const reputation = this.reputation.get(deviceId) || 50;
        return reputation > 30;
    }
}
```

---

## 🛠️ Implementation Roadmap

### Phase 1: Proof of Concept (2-3 недели)
- [ ] Basic BLE connection between 2 devices
- [ ] Simple message passing
- [ ] Basic encryption

### Phase 2: Mesh Basics (4-6 недель)
- [ ] Route discovery (RREQ/RREP)
- [ ] Multi-hop forwarding
- [ ] Message fragmentation

### Phase 3: Encryption & Security (3-4 недели)
- [ ] Signal Protocol integration
- [ ] Key exchange
- [ ] Message signing

### Phase 4: Optimization (4-6 недель)
- [ ] Battery optimization
- [ ] Route caching
- [ ] Congestion control

### Phase 5: Testing & Deployment (4-6 недель)
- [ ] Field testing
- [ ] Performance tuning
- [ ] App store submission

**Total:** ~4-6 месяцев for MVP

---

## 💡 Альтернативы & Existing Solutions

### Existing Mesh Apps:
1. **Bridgefy** - Bluetooth mesh для массовых мероприятий
2. **FireChat** - iOS mesh (закрыт в 2020)
3. **Briar** - Tor + Bluetooth + WiFi mesh
4. **Serval Mesh** - WiFi mesh для катастроф

### Lessons Learned:
- Mesh сети **сложны** в реализации
- Требуют **критическую массу** пользователей
- **Battery drain** - основная проблема
- **Routing instability** в мобильных сетях

---

## 🎯 Realistic Goals

### Minimum Viable Product:
1. **2-hop messaging** (A → B → C)
2. **E2E encryption**
3. **Offline queue**
4. **Automatic internet failover**

### Success Metrics:
- Message delivery: >90% within 10 seconds
- Battery impact: <15% per hour active use
- Network density: 50+ devices per km²

---

## 📚 References

**Academic Papers:**
- AODV RFC 3561
- Signal Protocol Specification
- Bluetooth 5.0 Mesh Profile

**Open Source Projects:**
- https://github.com/bridgefy/sdk-android
- https://briarproject.org/
- https://github.com/servalproject/

**Tools:**
- Web Bluetooth API: https://web.dev/bluetooth/
- React Native BLE: https://github.com/dotintent/react-native-ble-plx
- Nordic nRF Connect: Для тестирования BLE

---

## ⚠️ Challenges & Reality Check

### Technical Challenges:
1. **iOS Background Limitations** - Apple ограничивает BLE в фоне
2. **Android Fragmentation** - Разное поведение BLE
3. **Power Consumption** - Пользователи отключат
4. **Network Density** - Нужно много пользователей рядом
5. **Regulatory** - BLE регулируется в разных странах

### Business Challenges:
1. **User Adoption** - Зачем если есть интернет?
2. **Development Cost** - $200k-500k for full implementation
3. **Maintenance** - Continuous updates needed

---

## 🚀 Recommendation

**For AChat:**

### Option A: Full Bluetooth Mesh
**Pros:** Полная независимость от интернета
**Cons:** 6+ месяцев разработки, сложность, battery drain
**Cost:** $200k-500k
**Use Case:** Критические ситуации, активисты

### Option B: Hybrid (Internet + BLE Backup)
**Pros:** Лучшее из двух миров
**Cons:** Всё ещё сложно
**Cost:** $100k-200k
**Use Case:** Надёжная связь

### Option C: Internet-Only + Offline Queue
**Pros:** Проще, дешевле, работает сейчас
**Cons:** Не работает без интернета
**Cost:** Уже реализовано!
**Use Case:** 99% случаев

**Мой совет:** Начни с Option C, добавь Option B позже если будет запрос.

---

**Bluetooth Mesh - это отличная идея, но огромный проект!**

Для MVP достаточно:
1. ✅ PWA с offline mode (есть!)
2. ✅ Service Worker (есть!)
3. ✅ Pending messages queue
4. ⏳ Bluetooth mesh для emergency cases

Делай поэтапно! 🚀

# AChat - Technical Architecture

## 🎯 Overview

AChat is built as a secure, scalable messaging platform with AI capabilities. The architecture is designed around a **Secure Enclave** that processes all messages while maintaining end-to-end encryption.

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Web App     │  │  iOS App     │  │ Android App  │          │
│  │  (Next.js)   │  │  (React      │  │  (React      │          │
│  │              │  │   Native)    │  │   Native)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOAD BALANCER                               │
│                     (ALB / Nginx)                                │
└─────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│     API Gateway         │  │   WebSocket Server      │
│     (NestJS)            │  │   (Socket.io)           │
└─────────────────────────┘  └─────────────────────────┘
                │                       │
                └───────────┬───────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICES (NestJS)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │   Auth   │ │  Users   │ │ Messages │ │ Payments │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
┌────────────────┐ ┌──────────────┐ ┌──────────────┐
│   PostgreSQL   │ │    Redis     │ │   MongoDB    │
│   (Messages)   │ │   (Cache)    │ │  (Analytics) │
└────────────────┘ └──────────────┘ └──────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              🔒 SECURE ENCLAVE (AWS Nitro/SGX)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ┌─────────────────┐         ┌─────────────────┐        │  │
│  │  │   Encryption    │ ◄─────► │   AI Services   │        │  │
│  │  │   Manager       │         │   - Moderation  │        │  │
│  │  └─────────────────┘         │   - Assistant   │        │  │
│  │          ▲                    └─────────────────┘        │  │
│  │          │                             ▲                 │  │
│  │          │                             │                 │  │
│  │  ┌───────▼──────────┐        ┌────────▼─────────┐       │  │
│  │  │ Key Management   │        │  Python AI       │       │  │
│  │  │ (HSM-backed)     │        │  Service (API)   │       │  │
│  │  └──────────────────┘        └──────────────────┘       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔐 Security Architecture

### Encryption Flow

1. **Client → Enclave**
   ```
   Message → Encrypt with session key
          → Encrypt session key with enclave public key
          → Send encrypted bundle to server
   ```

2. **Enclave Processing**
   ```
   Receive encrypted bundle
   → Decrypt session key (inside enclave)
   → Decrypt message (inside enclave)
   → AI moderation (inside enclave)
   → Re-encrypt for recipient
   → Destroy plaintext from memory
   ```

3. **Enclave → Recipient**
   ```
   Encrypted bundle → Client decrypts with their private key
   ```

### Key Management

- **User Keys**: Ed25519 key pairs generated on device
- **Session Keys**: AES-256-GCM ephemeral keys per message
- **Enclave Keys**: Hardware-backed keys in HSM/TPM
- **Rotation**: Keys rotated every 24 hours

### Attestation

- Remote attestation every 60 seconds
- Clients verify enclave integrity before sending messages
- Code hash verification ensures no tampering

## 🤖 AI Architecture

### AI Moderation Pipeline

```
Message
  ↓
[Tier 1: Fast Classifier] (99% of messages, <100ms)
  ├─ Low Risk → ✅ Allow
  └─ Suspicious → [Tier 2]
                    ↓
            [Tier 2: Deep Analysis] (0.9%, <500ms)
              ├─ Medium Risk → 🚩 Flag for review
              └─ High Risk → [Tier 3]
                              ↓
                      [Tier 3: Expert Model] (0.1%, <2s)
                        ├─ Confirmed → ❌ Block
                        └─ Unclear → 👤 Human review
```

### AI Assistant Pipeline

```
User types message
  ↓
[Context Analysis]
  ├─ Conversation history
  ├─ User style profile
  └─ Current sentiment
  ↓
[Suggestion Generation] (GPT-4/Claude API)
  ├─ Multiple response options
  ├─ Tone adjustments
  └─ Confidence scores
  ↓
Present to user
```

## 📊 Database Schema

### PostgreSQL (Primary Data)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(30) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  public_key TEXT,
  subscription_tier VARCHAR(20),
  created_at TIMESTAMP,
  ...
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID,
  sender_id UUID,
  encrypted_content TEXT,
  encrypted_key TEXT,
  iv TEXT,
  auth_tag TEXT,
  moderation_risk_score FLOAT,
  is_blocked BOOLEAN,
  created_at TIMESTAMP,
  ...
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  type VARCHAR(20),
  participant_ids UUID[],
  last_message_id UUID,
  last_activity_at TIMESTAMP,
  ...
);
```

### Redis (Cache & Real-time)

```
# User online status
user:online:{userId} → timestamp

# Session keys cache
session_key:{messageId} → encrypted_key

# Rate limiting
rate_limit:{userId}:{endpoint} → count

# Message queue
queue:messages:pending → [message_ids]
```

## 🚀 Deployment

### Production Infrastructure

```
AWS/GCP/Azure
├── Compute
│   ├── Backend: EC2/Nitro Enclaves (8 instances, auto-scaling)
│   ├── AI Service: GPU instances (p3.2xlarge)
│   └── Frontend: CloudFront + S3
├── Database
│   ├── RDS PostgreSQL (Multi-AZ, read replicas)
│   ├── ElastiCache Redis (cluster mode)
│   └── DocumentDB (MongoDB-compatible)
├── Storage
│   ├── S3 (files, media)
│   └── EBS (database volumes)
├── Security
│   ├── AWS Nitro Enclaves
│   ├── AWS KMS (key management)
│   └── CloudHSM (hardware security)
└── Monitoring
    ├── CloudWatch (metrics)
    ├── X-Ray (tracing)
    └── GuardDuty (threats)
```

### Kubernetes Setup

```yaml
# Simplified k8s architecture
Cluster:
  - backend-service (3 replicas)
  - ai-service (2 replicas with GPU)
  - websocket-service (5 replicas)
  - postgres-primary (1)
  - postgres-replicas (2)
  - redis-cluster (3 nodes)

Ingress:
  - ALB → backend-service:3000
  - ALB → websocket-service:3000
```

## 📈 Scaling Strategy

### Horizontal Scaling

- **API Servers**: Auto-scale 2-50 instances based on CPU/Memory
- **WebSocket Servers**: Dedicated scaling based on connection count
- **AI Service**: GPU instances scaled based on queue depth

### Vertical Scaling

- **Database**: Start with db.r5.2xlarge, scale to db.r5.8xlarge
- **Redis**: Start with cache.r5.large, scale to cache.r5.4xlarge

### Geographic Distribution

```
Regions:
├── us-east-1 (Primary)
├── eu-west-1 (Europe)
├── ap-southeast-1 (Asia)
└── Cross-region replication for data redundancy
```

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **ORM**: TypeORM

### AI Service
- **Runtime**: Python 3.11+
- **Framework**: FastAPI
- **ML**: PyTorch, Transformers
- **APIs**: OpenAI, Anthropic

### Frontend Web
- **Framework**: Next.js 14
- **Language**: TypeScript
- **State**: Redux Toolkit
- **UI**: TailwindCSS

### Frontend Mobile
- **Framework**: React Native
- **Language**: TypeScript
- **State**: Redux Toolkit
- **Navigation**: React Navigation

### DevOps
- **Containers**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack

## 🔒 Compliance

- **GDPR**: Data portability, right to be forgotten
- **HIPAA**: (Optional) For healthcare use cases
- **SOC 2**: Security audit compliance
- **PCI DSS**: For payment processing

## 📊 Monitoring & Observability

### Metrics
- Request rate, latency, error rate (RED)
- CPU, memory, disk, network (USE)
- Business metrics (MAU, messages/day)

### Logging
- Structured JSON logs
- Log levels: ERROR, WARN, INFO, DEBUG
- No PII in logs (encrypted references only)

### Tracing
- Distributed tracing with OpenTelemetry
- Trace every request through all services
- Performance bottleneck identification

### Alerting
- On-call rotation (PagerDuty)
- Alerts for: High error rate, latency, downtime
- SLA: 99.9% uptime (8.76 hours downtime/year)

---

For detailed setup instructions, see [README.md](./README.md)

For security details, see [CONCEPT.md](./CONCEPT.md)

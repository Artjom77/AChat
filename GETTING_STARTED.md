# Getting Started with AChat Development

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://www.python.org/))
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/))
- **Redis** 7+ ([Download](https://redis.io/))
- **Docker** (optional, recommended) ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))

## 🚀 Quick Start (Docker)

The fastest way to get started is using Docker:

```bash
# Clone the repository
git clone https://github.com/yourusername/AChat.git
cd AChat

# Copy environment file
cp .env.example .env

# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# The services will be available at:
# - Backend API: http://localhost:3000
# - AI Service: http://localhost:8000
# - Frontend Web: http://localhost:3001
# - API Docs: http://localhost:3000/api/docs
```

That's it! The application is now running.

## 🛠️ Manual Setup (Without Docker)

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/yourusername/AChat.git
cd AChat

# Install Node.js dependencies
npm install

# Install Python dependencies for AI service
cd apps/ai-service
pip install -r requirements.txt
cd ../..
```

### 2. Setup Database

```bash
# Start PostgreSQL (if not running)
# On macOS with Homebrew:
brew services start postgresql

# On Linux:
sudo systemctl start postgresql

# Create database
createdb achat

# Create user
psql -c "CREATE USER achat WITH PASSWORD 'your_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE achat TO achat;"
```

### 3. Setup Redis

```bash
# Start Redis (if not running)
# On macOS with Homebrew:
brew services start redis

# On Linux:
sudo systemctl start redis
```

### 4. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
nano .env

# At minimum, configure:
# - DB_PASSWORD (database password you created)
# - JWT_SECRET (random string, min 32 chars)
# - OPENAI_API_KEY (if using AI features)
```

### 5. Build Packages

```bash
# Build shared packages
npm run build --workspace=@achat/types
npm run build --workspace=@achat/crypto
npm run build --workspace=@achat/shared
```

### 6. Start Services

Open 3 terminal windows:

**Terminal 1 - Backend:**
```bash
npm run backend
```

**Terminal 2 - AI Service:**
```bash
cd apps/ai-service
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 3 - Frontend (optional):**
```bash
npm run frontend-web
```

### 7. Verify Installation

Visit these URLs to verify everything is working:

- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api/docs
- AI Service: http://localhost:8000
- AI Service Docs: http://localhost:8000/docs
- Frontend Web: http://localhost:3001 (if started)

## 📱 Mobile Development

### React Native Setup

```bash
# Install Expo CLI globally
npm install -g expo-cli

# Navigate to mobile app
cd apps/frontend-mobile

# Install dependencies
npm install

# Start development server
npm run dev

# For iOS (requires Mac):
npm run ios

# For Android (requires Android Studio):
npm run android
```

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests for specific package
npm test --workspace=apps/backend

# Run with coverage
npm run test:coverage
```

## 📝 Development Workflow

### Creating a New Feature

1. **Create a branch:**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make changes in appropriate directory:**
   - Backend API: `apps/backend/src/`
   - AI Service: `apps/ai-service/app/`
   - Frontend Web: `apps/frontend-web/`
   - Mobile: `apps/frontend-mobile/`
   - Shared code: `packages/`

3. **Test your changes:**
   ```bash
   npm test
   npm run lint
   ```

4. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add: My new feature"
   git push origin feature/my-new-feature
   ```

5. **Create Pull Request** on GitHub

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix

# Format code with Prettier
npm run format
```

## 🔐 Testing Encryption

To test the encryption system:

```bash
# Generate test key pair
node -e "
const crypto = require('crypto');
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
console.log('Public:', publicKey.export({type: 'spki', format: 'der'}).toString('base64'));
console.log('Private:', privateKey.export({type: 'pkcs8', format: 'der'}).toString('base64'));
"

# Test encryption/decryption
npm run test:crypto
```

## 🤖 Testing AI Features

To test AI moderation and assistant:

```bash
# Test moderation
curl -X POST http://localhost:8000/moderation/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello, this is a test message"}'

# Test assistant
curl -X POST http://localhost:8000/assistant/suggest \
  -H "Content-Type: application/json" \
  -d '{"message": "How are you?", "userId": "test-user"}'
```

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
pg_isready

# Check connection
psql -U achat -d achat -h localhost -p 5432

# Reset database (WARNING: deletes all data)
npm run db:reset
```

### Redis Connection Error

```bash
# Check Redis is running
redis-cli ping
# Should respond with "PONG"

# View Redis logs
# On macOS:
tail -f /usr/local/var/log/redis.log

# On Linux:
sudo journalctl -u redis -f
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Node Modules Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear Turbo cache
rm -rf .turbo
```

### Python Dependencies Issues

```bash
# Recreate virtual environment
cd apps/ai-service
rm -rf venv
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 📚 Next Steps

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system design
- Read [CONCEPT.md](./CONCEPT.md) for detailed feature specifications
- Check [API Documentation](http://localhost:3000/api/docs) for endpoint details
- Join our [Discord Community](#) for help and discussions

## 🆘 Getting Help

- **Documentation**: Check the `/docs` directory
- **Issues**: [GitHub Issues](https://github.com/yourusername/AChat/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/AChat/discussions)
- **Discord**: [Join our server](#)

## 🎉 You're Ready!

You now have AChat running locally. Start exploring the codebase and happy coding!

---

**Pro Tips:**

- Use `npm run dev` to start all services in development mode
- Use Docker Compose for the easiest setup
- Enable hot reload for faster development
- Use the API documentation for testing endpoints
- Join our community for help and collaboration

Good luck! 🚀

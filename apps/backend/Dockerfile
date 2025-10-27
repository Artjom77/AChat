FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install dependencies
RUN npm install

# Copy source code
COPY apps/backend ./apps/backend
COPY packages ./packages

# Build
RUN npm run build --workspace=apps/backend

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=apps/backend"]

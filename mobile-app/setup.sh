#!/bin/bash

# AChat React Native Setup Script
# This script automates the setup of the React Native project

set -e  # Exit on error

echo "🚀 AChat React Native Setup"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Run this script from the mobile-app directory"
    exit 1
fi

echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Install from: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v)${NC}"

# Check React Native CLI
if ! command -v npx react-native &> /dev/null; then
    echo -e "${YELLOW}⚠️  React Native CLI not found, will use npx${NC}"
fi

echo ""
echo -e "${BLUE}Step 2: Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"

echo ""
echo -e "${BLUE}Step 3: Setting up environment...${NC}"

# Create .env from example if doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please configure .env with your API keys${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

echo ""
echo -e "${BLUE}Step 4: iOS Setup (if on macOS)...${NC}"

if [[ "$OSTYPE" == "darwin"* ]]; then
    # Check CocoaPods
    if ! command -v pod &> /dev/null; then
        echo -e "${RED}❌ CocoaPods not installed${NC}"
        echo "Install with: sudo gem install cocoapods"
        exit 1
    fi
    echo -e "${GREEN}✅ CocoaPods installed${NC}"

    # Install pods
    cd ios
    echo "Installing iOS dependencies..."
    pod install
    cd ..
    echo -e "${GREEN}✅ iOS dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping iOS setup (not on macOS)${NC}"
fi

echo ""
echo -e "${BLUE}Step 5: Android Setup...${NC}"

# Check for ANDROID_HOME
if [ -z "$ANDROID_HOME" ]; then
    echo -e "${YELLOW}⚠️  ANDROID_HOME not set${NC}"
    echo "Set it in your ~/.bashrc or ~/.zshrc:"
    echo "export ANDROID_HOME=\$HOME/Library/Android/sdk"
    echo "export PATH=\$PATH:\$ANDROID_HOME/emulator"
    echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
else
    echo -e "${GREEN}✅ ANDROID_HOME is set${NC}"
fi

# Check for Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java is not installed${NC}"
    echo "Install Java 11 or later"
    exit 1
fi
echo -e "${GREEN}✅ Java $(java -version 2>&1 | head -n 1)${NC}"

echo ""
echo -e "${BLUE}Step 6: Firebase Setup...${NC}"

# Check for Firebase config files
if [ ! -f "android/app/google-services.json" ]; then
    echo -e "${YELLOW}⚠️  android/app/google-services.json not found${NC}"
    echo "Download from Firebase Console:"
    echo "https://console.firebase.google.com/"
else
    echo -e "${GREEN}✅ google-services.json found${NC}"
fi

if [ ! -f "ios/GoogleService-Info.plist" ]; then
    echo -e "${YELLOW}⚠️  ios/GoogleService-Info.plist not found${NC}"
    echo "Download from Firebase Console"
else
    echo -e "${GREEN}✅ GoogleService-Info.plist found${NC}"
fi

echo ""
echo -e "${GREEN}=============================="
echo "✅ Setup Complete!"
echo "==============================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "1. Configure .env file with your API keys"
echo "2. Add Firebase config files:"
echo "   - android/app/google-services.json"
echo "   - ios/GoogleService-Info.plist"
echo ""
echo "3. Start Metro bundler:"
echo -e "   ${GREEN}npm start${NC}"
echo ""
echo "4. Run on device:"
echo -e "   ${GREEN}npm run ios${NC}     # iOS"
echo -e "   ${GREEN}npm run android${NC}  # Android"
echo ""
echo "5. Build for production:"
echo -e "   ${GREEN}npm run build:ios${NC}     # iOS release"
echo -e "   ${GREEN}npm run build:android${NC}  # Android release"
echo ""
echo -e "${YELLOW}📚 See README.md for detailed instructions${NC}"

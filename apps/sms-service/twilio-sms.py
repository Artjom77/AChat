#!/usr/bin/env python3
"""
AChat SMS Verification Service
Twilio Integration for Phone Number Verification
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import random
import time
from datetime import datetime, timedelta
import httpx

# Twilio imports (install: pip install twilio)
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    print("⚠️  Warning: Twilio not installed. Run: pip install twilio")

app = FastAPI(title="AChat SMS Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', '')

# In-memory storage for verification codes
verification_codes = {}  # phone -> {code, expires_at, attempts}
verified_phones = set()  # Set of verified phone numbers

class SendCodeRequest(BaseModel):
    phone: str  # Format: +1234567890

class VerifyCodeRequest(BaseModel):
    phone: str
    code: str

# Initialize Twilio client
twilio_client = None
if TWILIO_AVAILABLE and TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    print(f"✅ Twilio initialized with number: {TWILIO_PHONE_NUMBER}")
else:
    print("⚠️  Twilio not configured. Set environment variables:")
    print("   TWILIO_ACCOUNT_SID")
    print("   TWILIO_AUTH_TOKEN")
    print("   TWILIO_PHONE_NUMBER")

def generate_code() -> str:
    """Generate 6-digit verification code"""
    return str(random.randint(100000, 999999))

def normalize_phone(phone: str) -> str:
    """Normalize phone number format"""
    # Remove all non-digit characters except +
    phone = ''.join(c for c in phone if c.isdigit() or c == '+')

    # Ensure it starts with +
    if not phone.startswith('+'):
        # Assume US number if no country code
        phone = '+1' + phone

    return phone

def is_valid_phone(phone: str) -> bool:
    """Validate phone number format"""
    phone = normalize_phone(phone)
    # Must start with + and have 10-15 digits
    return phone.startswith('+') and 10 <= len(phone) <= 16

async def send_sms_via_twilio(phone: str, message: str) -> bool:
    """Send SMS via Twilio"""
    if not twilio_client:
        return False

    try:
        message_obj = twilio_client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=phone
        )

        print(f"✅ SMS sent to {phone}, SID: {message_obj.sid}")
        return True

    except Exception as e:
        print(f"❌ Twilio error: {e}")
        return False

async def send_sms_test_mode(phone: str, code: str):
    """Test mode - just print the code"""
    print(f"\n{'='*60}")
    print(f"📱 TEST MODE - Verification Code")
    print(f"{'='*60}")
    print(f"Phone: {phone}")
    print(f"Code:  {code}")
    print(f"{'='*60}\n")

@app.get("/")
async def root():
    return {
        "service": "AChat SMS Verification",
        "status": "running",
        "twilio_configured": twilio_client is not None,
        "test_mode": twilio_client is None
    }

@app.post("/sms/send-code")
async def send_verification_code(req: SendCodeRequest):
    """Send verification code to phone number"""

    # Validate phone number
    if not is_valid_phone(req.phone):
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    phone = normalize_phone(req.phone)

    # Check if already verified
    if phone in verified_phones:
        raise HTTPException(status_code=400, detail="Phone number already verified")

    # Rate limiting - only 1 code per minute
    if phone in verification_codes:
        last_sent = verification_codes[phone].get('sent_at', 0)
        if time.time() - last_sent < 60:
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Wait 1 minute before requesting new code"
            )

    # Generate code
    code = generate_code()
    expires_at = datetime.now() + timedelta(minutes=10)

    # Store code
    verification_codes[phone] = {
        'code': code,
        'expires_at': expires_at,
        'attempts': 0,
        'sent_at': time.time()
    }

    # Send SMS
    message = f"AChat verification code: {code}\n\nValid for 10 minutes.\nDo not share this code."

    if twilio_client:
        # Real SMS via Twilio
        success = await send_sms_via_twilio(phone, message)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to send SMS")

        return {
            'success': True,
            'message': 'Verification code sent via SMS',
            'phone': phone,
            'expires_in': 600  # 10 minutes
        }
    else:
        # Test mode - print code to console
        await send_sms_test_mode(phone, code)

        return {
            'success': True,
            'message': 'TEST MODE: Check server console for verification code',
            'phone': phone,
            'code': code,  # Only in test mode!
            'expires_in': 600,
            'test_mode': True
        }

@app.post("/sms/verify-code")
async def verify_code(req: VerifyCodeRequest):
    """Verify the SMS code"""

    phone = normalize_phone(req.phone)

    # Check if code exists
    if phone not in verification_codes:
        raise HTTPException(status_code=404, detail="No verification code sent to this number")

    stored = verification_codes[phone]

    # Check expiration
    if datetime.now() > stored['expires_at']:
        del verification_codes[phone]
        raise HTTPException(status_code=400, detail="Verification code expired")

    # Check attempts
    if stored['attempts'] >= 3:
        del verification_codes[phone]
        raise HTTPException(
            status_code=429,
            detail="Too many failed attempts. Request a new code"
        )

    # Verify code
    if req.code != stored['code']:
        stored['attempts'] += 1
        remaining = 3 - stored['attempts']
        raise HTTPException(
            status_code=400,
            detail=f"Invalid code. {remaining} attempts remaining"
        )

    # Success!
    del verification_codes[phone]
    verified_phones.add(phone)

    return {
        'success': True,
        'message': 'Phone number verified successfully',
        'phone': phone,
        'verified_at': datetime.now().isoformat()
    }

@app.get("/sms/is-verified/{phone}")
async def is_phone_verified(phone: str):
    """Check if phone number is verified"""
    phone = normalize_phone(phone)

    return {
        'phone': phone,
        'verified': phone in verified_phones
    }

@app.get("/health")
async def health_check():
    return {
        'status': 'healthy',
        'twilio': 'connected' if twilio_client else 'test_mode',
        'timestamp': datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting AChat SMS Service...")

    if not twilio_client:
        print("\n" + "="*60)
        print("⚠️  RUNNING IN TEST MODE")
        print("="*60)
        print("To use real SMS, configure Twilio:")
        print("1. Create account: https://www.twilio.com/try-twilio")
        print("2. Get phone number")
        print("3. Set environment variables:")
        print("   export TWILIO_ACCOUNT_SID='your_sid'")
        print("   export TWILIO_AUTH_TOKEN='your_token'")
        print("   export TWILIO_PHONE_NUMBER='+1234567890'")
        print("="*60 + "\n")

    uvicorn.run(app, host="0.0.0.0", port=5002, log_level="info")

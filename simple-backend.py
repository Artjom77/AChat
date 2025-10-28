#!/usr/bin/env python3
"""
AChat Simple Backend
Упрощенный backend без PostgreSQL - всё в памяти
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import uuid
import hashlib
import time
from datetime import datetime, timedelta
import json
import httpx  # For calling AI service
import asyncio

app = FastAPI(title="AChat Simple Backend")

# Configuration
AI_SERVICE_URL = "http://localhost:8000"
ENABLE_AI_MODERATION = True
ENABLE_CSAM_PROTECTION = True

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
users_db: Dict[str, dict] = {}
sessions_db: Dict[str, dict] = {}
conversations_db: Dict[str, dict] = {}
messages_db: List[dict] = []
active_connections: Dict[str, WebSocket] = {}

# Analytics and moderation storage
analytics_db: List[dict] = []  # Stores all chat analytics
blocked_users_db: Dict[str, dict] = {}  # Blocked users with reasons
moderation_logs_db: List[dict] = []  # Moderation action logs

# Models
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    displayName: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class SendMessageRequest(BaseModel):
    conversationId: str
    content: str
    type: str = "text"

# Helper functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_token(user_id: str) -> str:
    token = str(uuid.uuid4())
    sessions_db[token] = {
        'userId': user_id,
        'createdAt': time.time(),
        'expiresAt': time.time() + (7 * 24 * 3600)  # 7 days
    }
    return token

def get_user_from_token(token: str) -> Optional[dict]:
    session = sessions_db.get(token)
    if not session:
        return None
    if session['expiresAt'] < time.time():
        del sessions_db[token]
        return None
    return users_db.get(session['userId'])

# Moderation and analytics functions
async def moderate_content(content: str, user_id: str) -> dict:
    """
    Check content through AI moderation service
    Returns moderation result with flags
    """
    if not ENABLE_AI_MODERATION:
        return {'allowed': True, 'riskScore': 0.0, 'flags': []}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{AI_SERVICE_URL}/moderation/analyze",
                json={
                    "content": content,
                    "userId": user_id
                }
            )
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        print(f"Moderation error: {e}")

    # Fallback to allow if AI service unavailable
    return {'allowed': True, 'riskScore': 0.0, 'flags': []}

def block_user(user_id: str, reason: str, evidence: dict):
    """
    Block user account permanently
    """
    user = users_db.get(user_id)
    if user:
        blocked_users_db[user_id] = {
            'userId': user_id,
            'username': user.get('username'),
            'email': user.get('email'),
            'reason': reason,
            'evidence': evidence,
            'blockedAt': datetime.now().isoformat(),
            'blockedBy': 'AI_SYSTEM'
        }

        # Mark user as blocked
        user['blocked'] = True
        user['blockReason'] = reason

        # Log moderation action
        moderation_logs_db.append({
            'id': str(uuid.uuid4()),
            'userId': user_id,
            'action': 'ACCOUNT_BLOCKED',
            'reason': reason,
            'evidence': evidence,
            'timestamp': datetime.now().isoformat(),
            'automated': True
        })

        print(f"🚫 USER BLOCKED: {user.get('username')} - Reason: {reason}")
        return True
    return False

def save_analytics(message: dict, moderation_result: dict, user: dict):
    """
    Save message analytics for data collection
    """
    analytics_entry = {
        'id': str(uuid.uuid4()),
        'messageId': message['id'],
        'userId': user['id'],
        'username': user.get('username'),
        'conversationId': message['conversationId'],
        'contentLength': len(message['content']),
        'messageType': message['type'],
        'timestamp': datetime.now().isoformat(),
        'moderation': {
            'allowed': moderation_result.get('allowed'),
            'riskScore': moderation_result.get('riskScore'),
            'flags': moderation_result.get('flags', []),
            'confidence': moderation_result.get('confidence')
        },
        'metadata': {
            'subscriptionTier': user.get('subscriptionTier', 'free'),
            'userCreatedAt': user.get('createdAt')
        }
    }

    analytics_db.append(analytics_entry)

# Routes
@app.get("/")
async def root():
    return {
        "service": "AChat Simple Backend",
        "version": "1.0.0",
        "users": len(users_db),
        "conversations": len(conversations_db),
        "messages": len(messages_db),
        "status": "operational"
    }

@app.post("/auth/register")
async def register(req: RegisterRequest):
    # Check if email exists
    if any(u['email'] == req.email for u in users_db.values()):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if username exists
    if any(u['username'] == req.username for u in users_db.values()):
        raise HTTPException(status_code=400, detail="Username already taken")

    # Create user
    user_id = str(uuid.uuid4())
    user = {
        'id': user_id,
        'username': req.username,
        'email': req.email,
        'password': hash_password(req.password),
        'displayName': req.displayName or req.username,
        'avatar': f"https://ui-avatars.com/api/?name={req.username}&background=667eea&color=fff",
        'createdAt': datetime.now().isoformat(),
        'subscriptionTier': 'free'
    }

    users_db[user_id] = user

    # Create token
    token = create_token(user_id)

    # Remove password from response
    user_response = {k: v for k, v in user.items() if k != 'password'}

    return {
        'user': user_response,
        'token': token
    }

@app.post("/auth/login")
async def login(req: LoginRequest):
    # Find user
    user = None
    for u in users_db.values():
        if u['email'] == req.email:
            user = u
            break

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Check password
    if user['password'] != hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create token
    token = create_token(user['id'])

    # Remove password from response
    user_response = {k: v for k, v in user.items() if k != 'password'}

    return {
        'user': user_response,
        'token': token
    }

@app.get("/auth/me")
async def get_me(authorization: str = ""):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")

    token = authorization.replace("Bearer ", "")
    user = get_user_from_token(token)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_response = {k: v for k, v in user.items() if k != 'password'}
    return user_response

@app.get("/users")
async def get_users(authorization: str = ""):
    # Get all users except the current one
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")

    token = authorization.replace("Bearer ", "")
    current_user = get_user_from_token(token)

    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")

    users = []
    for user in users_db.values():
        if user['id'] != current_user['id']:
            users.append({
                'id': user['id'],
                'username': user['username'],
                'displayName': user['displayName'],
                'avatar': user['avatar'],
                'subscriptionTier': user['subscriptionTier']
            })

    return users

@app.post("/conversations/direct")
async def create_direct_conversation(request: dict, authorization: str = ""):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")

    token = authorization.replace("Bearer ", "")
    current_user = get_user_from_token(token)

    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")

    recipient_id = request.get('userId')

    # Check if conversation already exists
    for conv in conversations_db.values():
        if set(conv['participants']) == {current_user['id'], recipient_id}:
            return conv

    # Create new conversation
    conv_id = str(uuid.uuid4())
    conversation = {
        'id': conv_id,
        'type': 'direct',
        'participants': [current_user['id'], recipient_id],
        'createdAt': datetime.now().isoformat(),
        'messages': []
    }

    conversations_db[conv_id] = conversation

    return conversation

@app.get("/conversations")
async def get_conversations(authorization: str = ""):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")

    token = authorization.replace("Bearer ", "")
    current_user = get_user_from_token(token)

    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Get conversations for current user
    user_conversations = []
    for conv in conversations_db.values():
        if current_user['id'] in conv['participants']:
            # Get other participant info
            other_id = [p for p in conv['participants'] if p != current_user['id']][0]
            other_user = users_db.get(other_id, {})

            # Get last message
            conv_messages = [m for m in messages_db if m['conversationId'] == conv['id']]
            last_message = conv_messages[-1] if conv_messages else None

            user_conversations.append({
                'id': conv['id'],
                'type': conv['type'],
                'participant': {
                    'id': other_user.get('id'),
                    'username': other_user.get('username'),
                    'displayName': other_user.get('displayName'),
                    'avatar': other_user.get('avatar')
                },
                'lastMessage': last_message,
                'unreadCount': 0  # Simplified
            })

    return user_conversations

@app.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, authorization: str = ""):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")

    token = authorization.replace("Bearer ", "")
    current_user = get_user_from_token(token)

    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Get conversation
    conversation = conversations_db.get(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check access
    if current_user['id'] not in conversation['participants']:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get messages
    conv_messages = [m for m in messages_db if m['conversationId'] == conversation_id]

    return conv_messages

@app.post("/messages")
async def send_message(req: SendMessageRequest, authorization: str = ""):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")

    token = authorization.replace("Bearer ", "")
    current_user = get_user_from_token(token)

    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Check if user is blocked
    if current_user.get('blocked'):
        raise HTTPException(
            status_code=403,
            detail=f"Account blocked: {current_user.get('blockReason', 'Terms of Service violation')}"
        )

    # Get conversation
    conversation = conversations_db.get(req.conversationId)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check access
    if current_user['id'] not in conversation['participants']:
        raise HTTPException(status_code=403, detail="Access denied")

    # AI MODERATION - Check content before sending
    moderation_result = await moderate_content(req.content, current_user['id'])

    # Check for CSAM (Child Sexual Abuse Material)
    if ENABLE_CSAM_PROTECTION and 'csam' in moderation_result.get('flags', []):
        # CRITICAL: Block user immediately
        block_user(
            current_user['id'],
            "CSAM_DETECTED",
            {
                'messageContent': req.content[:100],  # First 100 chars for evidence
                'riskScore': moderation_result.get('riskScore'),
                'flags': moderation_result.get('flags'),
                'confidence': moderation_result.get('confidence'),
                'conversationId': req.conversationId,
                'detectedAt': datetime.now().isoformat()
            }
        )

        # Log the incident
        print(f"🚨 CRITICAL: CSAM detected from user {current_user.get('username')}")
        print(f"🚫 User blocked automatically")

        raise HTTPException(
            status_code=403,
            detail="Content violates terms of service. Account has been suspended."
        )

    # Check if content should be blocked (other violations)
    if not moderation_result.get('allowed', True):
        # Log the violation but don't block (unless repeat offender)
        moderation_logs_db.append({
            'id': str(uuid.uuid4()),
            'userId': current_user['id'],
            'action': 'MESSAGE_BLOCKED',
            'reason': moderation_result.get('reason'),
            'evidence': {
                'content': req.content[:100],
                'flags': moderation_result.get('flags'),
                'riskScore': moderation_result.get('riskScore')
            },
            'timestamp': datetime.now().isoformat(),
            'automated': True
        })

        raise HTTPException(
            status_code=400,
            detail=f"Message blocked: {moderation_result.get('reason', 'Content policy violation')}"
        )

    # Create message
    message = {
        'id': str(uuid.uuid4()),
        'conversationId': req.conversationId,
        'senderId': current_user['id'],
        'content': req.content,
        'type': req.type,
        'createdAt': datetime.now().isoformat(),
        'status': 'sent',
        'moderated': True,
        'aiAnalysis': {
            'riskScore': moderation_result.get('riskScore'),
            'flags': moderation_result.get('flags', []),
            'confidence': moderation_result.get('confidence')
        }
    }

    messages_db.append(message)

    # Save analytics for data collection
    save_analytics(message, moderation_result, current_user)

    # Broadcast to other participants via WebSocket
    for participant_id in conversation['participants']:
        if participant_id != current_user['id'] and participant_id in active_connections:
            try:
                await active_connections[participant_id].send_json({
                    'type': 'new_message',
                    'message': message
                })
            except:
                pass

    return message

# WebSocket for real-time
@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    await websocket.accept()

    user = get_user_from_token(token)
    if not user:
        await websocket.close(code=1008)
        return

    user_id = user['id']
    active_connections[user_id] = websocket

    try:
        while True:
            data = await websocket.receive_text()
            # Handle ping/pong
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        del active_connections[user_id]

# ============================================================================
# Analytics and Admin Endpoints
# ============================================================================

@app.get("/analytics/stats")
async def get_analytics_stats(authorization: str = ""):
    """Get overall statistics"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")

    token = authorization.replace("Bearer ", "")
    current_user = get_user_from_token(token)

    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Only premium users or admins can access analytics
    if current_user.get('subscriptionTier') == 'free':
        raise HTTPException(status_code=403, detail="Premium feature")

    return {
        'totalMessages': len(messages_db),
        'totalUsers': len(users_db),
        'totalConversations': len(conversations_db),
        'analyticsEntries': len(analytics_db),
        'blockedUsers': len(blocked_users_db),
        'moderationLogs': len(moderation_logs_db)
    }

@app.get("/analytics/messages")
async def get_message_analytics(
    authorization: str = "",
    limit: int = 100,
    offset: int = 0
):
    """Get message analytics data"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")

    token = authorization.replace("Bearer ", "")
    current_user = get_user_from_token(token)

    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Only premium users can access their own analytics
    if current_user.get('subscriptionTier') == 'free':
        raise HTTPException(status_code=403, detail="Premium feature")

    # Filter analytics by user (unless admin)
    user_analytics = [
        entry for entry in analytics_db
        if entry['userId'] == current_user['id']
    ]

    # Apply pagination
    start = offset
    end = offset + limit
    paginated = user_analytics[start:end]

    return {
        'total': len(user_analytics),
        'limit': limit,
        'offset': offset,
        'data': paginated
    }

@app.get("/analytics/moderation")
async def get_moderation_logs(
    authorization: str = "",
    limit: int = 50
):
    """Get moderation logs (admin only)"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")

    token = authorization.replace("Bearer ", "")
    current_user = get_user_from_token(token)

    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")

    # TODO: Add proper admin role check
    # For now, only business tier can see moderation logs
    if current_user.get('subscriptionTier') != 'business':
        raise HTTPException(status_code=403, detail="Admin access required")

    return {
        'total': len(moderation_logs_db),
        'logs': moderation_logs_db[-limit:]  # Last N logs
    }

@app.get("/analytics/blocked-users")
async def get_blocked_users(authorization: str = ""):
    """Get list of blocked users (admin only)"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")

    token = authorization.replace("Bearer ", "")
    current_user = get_user_from_token(token)

    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Admin access required
    if current_user.get('subscriptionTier') != 'business':
        raise HTTPException(status_code=403, detail="Admin access required")

    return {
        'total': len(blocked_users_db),
        'blocked_users': list(blocked_users_db.values())
    }

@app.get("/analytics/export")
async def export_analytics(
    authorization: str = "",
    format: str = "json"
):
    """Export analytics data"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")

    token = authorization.replace("Bearer ", "")
    current_user = get_user_from_token(token)

    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Business tier required for export
    if current_user.get('subscriptionTier') != 'business':
        raise HTTPException(status_code=403, detail="Business feature")

    # Filter user's own data
    user_analytics = [
        entry for entry in analytics_db
        if entry['userId'] == current_user['id']
    ]

    if format == "json":
        return {
            'userId': current_user['id'],
            'username': current_user.get('username'),
            'exportedAt': datetime.now().isoformat(),
            'totalMessages': len(user_analytics),
            'analytics': user_analytics
        }
    else:
        raise HTTPException(status_code=400, detail="Only JSON format supported")

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting AChat Simple Backend...")
    print("📝 No database required - everything in memory")
    print("🌐 API: http://localhost:5000")
    print("📚 Docs: http://localhost:5000/docs")
    uvicorn.run(app, host="0.0.0.0", port=5000)

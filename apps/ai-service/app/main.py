"""
AChat AI Service
=================

FastAPI service providing AI capabilities:
- Content moderation
- Conversation assistant
- Sentiment analysis
- Behavioral analysis
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging

from app.moderation.moderator import ContentModerator
from app.assistant.assistant import ConversationAssistant

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AChat AI Service",
    description="AI-powered moderation and conversation assistance",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI services
moderator = ContentModerator()
assistant = ConversationAssistant()


# ============================================================================
# Models
# ============================================================================

class ModerationRequest(BaseModel):
    content: str
    userId: Optional[str] = None
    conversationId: Optional[str] = None

class ModerationResponse(BaseModel):
    allowed: bool
    riskScore: float
    flags: List[str]
    requiresHumanReview: bool
    reason: Optional[str] = None
    confidence: float

class AssistantRequest(BaseModel):
    message: str
    conversationHistory: Optional[List[Dict[str, str]]] = None
    userId: str
    context: Optional[Dict[str, Any]] = None

class AssistantResponse(BaseModel):
    suggestions: List[Dict[str, Any]]
    sentiment: str
    mood: str
    context: Dict[str, Any]
    warnings: Optional[List[str]] = None

class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    sentiment: str
    score: float
    emotions: Dict[str, float]


# ============================================================================
# Health Check
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AChat AI Service",
        "version": "1.0.0",
        "status": "operational",
        "capabilities": [
            "content_moderation",
            "conversation_assistant",
            "sentiment_analysis",
            "emotion_detection"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "moderator": "ready",
        "assistant": "ready"
    }


# ============================================================================
# Moderation Endpoints
# ============================================================================

@app.post("/moderation/analyze", response_model=ModerationResponse)
async def moderate_content(request: ModerationRequest):
    """
    Analyze content for moderation

    Detects:
    - Illegal drugs
    - Weapons and violence
    - Money laundering
    - CSAM (child sexual abuse material)
    - Terrorism
    - Fraud and scams
    - Hate speech
    - Spam
    """
    try:
        logger.info(f"Moderating content (length: {len(request.content)})")

        result = await moderator.analyze(
            content=request.content,
            user_id=request.userId,
            conversation_id=request.conversationId
        )

        logger.info(f"Moderation result: allowed={result['allowed']}, risk={result['riskScore']:.2f}")

        return ModerationResponse(**result)

    except Exception as e:
        logger.error(f"Moderation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/moderation/batch")
async def moderate_batch(requests: List[ModerationRequest]):
    """Batch moderation for multiple messages"""
    try:
        results = []

        for req in requests:
            result = await moderator.analyze(
                content=req.content,
                user_id=req.userId,
                conversation_id=req.conversationId
            )
            results.append(ModerationResponse(**result))

        return {"results": results}

    except Exception as e:
        logger.error(f"Batch moderation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Assistant Endpoints
# ============================================================================

@app.post("/assistant/suggest", response_model=AssistantResponse)
async def get_suggestions(request: AssistantRequest):
    """
    Get AI suggestions for conversation

    Provides:
    - Message suggestions
    - Sentiment analysis
    - Context understanding
    - Conversation tips
    """
    try:
        logger.info(f"Generating suggestions for user {request.userId}")

        result = await assistant.suggest(
            message=request.message,
            conversation_history=request.conversationHistory,
            user_id=request.userId,
            context=request.context
        )

        return AssistantResponse(**result)

    except Exception as e:
        logger.error(f"Assistant error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/assistant/analyze-conversation")
async def analyze_conversation(request: Dict[str, Any]):
    """
    Analyze entire conversation

    Provides:
    - Relationship dynamics
    - Communication patterns
    - Emotional trends
    - Recommendations
    """
    try:
        result = await assistant.analyze_conversation(
            conversation_history=request.get("conversationHistory", []),
            participants=request.get("participants", [])
        )

        return result

    except Exception as e:
        logger.error(f"Conversation analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/assistant/auto-responder")
async def auto_respond(request: Dict[str, Any]):
    """
    Generate automatic response

    Based on:
    - User's communication style
    - Conversation context
    - User-defined rules
    """
    try:
        result = await assistant.auto_respond(
            message=request.get("message"),
            rules=request.get("rules", {}),
            style=request.get("style", "friendly")
        )

        return result

    except Exception as e:
        logger.error(f"Auto-responder error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Sentiment Analysis
# ============================================================================

@app.post("/sentiment/analyze", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """Analyze sentiment of text"""
    try:
        result = await assistant.analyze_sentiment(request.text)
        return SentimentResponse(**result)

    except Exception as e:
        logger.error(f"Sentiment analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Call Analysis (Real-time voice/video)
# ============================================================================

@app.post("/call/analyze-audio")
async def analyze_audio(request: Dict[str, Any]):
    """
    Analyze audio from voice call

    Provides:
    - Emotion detection
    - Sentiment
    - Speaking rate
    - Confidence levels
    """
    try:
        # Placeholder for audio analysis
        return {
            "sentiment": "neutral",
            "emotions": {"happy": 0.3, "calm": 0.6, "excited": 0.1},
            "speakingRate": "normal",
            "confidence": 0.75
        }

    except Exception as e:
        logger.error(f"Audio analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Startup/Shutdown
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize AI models on startup"""
    logger.info("🚀 Starting AChat AI Service...")

    try:
        await moderator.initialize()
        await assistant.initialize()

        logger.info("✅ AI Service initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize AI Service: {str(e)}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down AChat AI Service...")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

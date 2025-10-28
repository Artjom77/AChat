"""
Conversation Assistant
======================

AI assistant that helps users with conversations:
- Suggests responses
- Analyzes sentiment and emotions
- Provides conversation tips
- Auto-responder functionality
- Relationship analysis
"""

import logging
from typing import Dict, List, Optional, Any
import os
from anthropic import Anthropic
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class ConversationAssistant:
    """AI Conversation Assistant"""

    def __init__(self):
        self.initialized = False
        self.use_ai = os.getenv('ANTHROPIC_API_KEY') is not None

        if self.use_ai:
            self.client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
            self.model = os.getenv('AI_MODEL', 'claude-3-5-sonnet-20241022')

    async def initialize(self):
        """Initialize AI models"""
        logger.info("Initializing Conversation Assistant...")

        try:
            if self.use_ai:
                logger.info("✅ Conversation Assistant initialized (Claude AI mode)")
            else:
                logger.info("✅ Conversation Assistant initialized (basic mode)")

            self.initialized = True

        except Exception as e:
            logger.error(f"Failed to initialize Conversation Assistant: {str(e)}")
            raise

    async def suggest(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        user_id: str = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate conversation suggestions

        Returns:
        {
            'suggestions': List[Dict],
            'sentiment': str,
            'mood': str,
            'context': Dict,
            'warnings': Optional[List[str]]
        }
        """

        if not self.initialized:
            await self.initialize()

        # Use Claude AI if available
        if self.use_ai:
            return await self._suggest_with_claude(message, conversation_history)
        else:
            return await self._suggest_basic(message, conversation_history)

    async def _suggest_with_claude(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """Generate suggestions using Claude AI"""
        try:
            # Build conversation context
            context_str = ""
            if conversation_history:
                recent = conversation_history[-5:]  # Last 5 messages
                context_str = "\n".join([
                    f"{msg.get('sender', 'Unknown')}: {msg.get('content', '')}"
                    for msg in recent
                ])

            prompt = f"""You are an AI conversation assistant. Analyze the latest message and provide helpful suggestions.

{f"Recent conversation:{context_str}" if context_str else ""}

Latest message: "{message}"

Provide a response in this JSON format:
{{
  "sentiment": "positive/negative/neutral",
  "mood": "happy/sad/angry/excited/calm/curious",
  "suggestions": [
    {{
      "text": "suggested response 1",
      "confidence": 0.9,
      "reasoning": "why this is a good response",
      "tone": "friendly/professional/casual/supportive"
    }},
    {{
      "text": "suggested response 2",
      "confidence": 0.8,
      "reasoning": "why this works",
      "tone": "tone type"
    }},
    {{
      "text": "suggested response 3",
      "confidence": 0.7,
      "reasoning": "alternative approach",
      "tone": "tone type"
    }}
  ],
  "warnings": ["optional warning if the message seems concerning"]
}}

Provide 3 varied suggestions with different tones. Be helpful and natural."""

            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )

            # Parse response
            result_text = response.content[0].text.strip()

            # Extract JSON
            if '```json' in result_text:
                result_text = result_text.split('```json')[1].split('```')[0].strip()
            elif '```' in result_text:
                result_text = result_text.split('```')[1].split('```')[0].strip()

            result = json.loads(result_text)

            # Add context
            result['context'] = {'ai_powered': True}

            logger.info(f"Claude assistant result: {result}")
            return result

        except Exception as e:
            logger.error(f"Claude assistant error: {e}")
            # Fallback to basic mode
            return await self._suggest_basic(message, conversation_history)

    async def _suggest_basic(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """Basic suggestions (fallback)"""
        # Analyze current message
        sentiment = await self.analyze_sentiment(message)

        # Generate suggestions
        suggestions = self._generate_suggestions(
            message,
            conversation_history,
            sentiment['sentiment']
        )

        # Analyze mood
        mood = self._analyze_mood(message)

        # Build context
        conversation_context = self._build_context(
            message,
            conversation_history,
            None
        )

        # Check for warnings
        warnings = self._check_warnings(message, sentiment)

        result = {
            'suggestions': suggestions,
            'sentiment': sentiment['sentiment'],
            'mood': mood,
            'context': conversation_context,
            'warnings': warnings if warnings else None
        }

        return result

    def _generate_suggestions(
        self,
        message: str,
        history: Optional[List[Dict]] = None,
        sentiment: str = "neutral"
    ) -> List[Dict[str, Any]]:
        """Generate response suggestions"""

        # Placeholder implementation
        # In production, use GPT-4/Claude API

        suggestions = []

        # Analyze message type
        message_lower = message.lower()

        # Questions
        if '?' in message:
            suggestions.append({
                'text': "That's a great question! Let me think about it...",
                'confidence': 0.7,
                'reasoning': 'Thoughtful response to a question',
                'tone': 'friendly'
            })
            suggestions.append({
                'text': "I appreciate you asking. Here's what I think...",
                'confidence': 0.8,
                'reasoning': 'Professional response',
                'tone': 'professional'
            })

        # Greetings
        elif any(word in message_lower for word in ['hi', 'hello', 'hey']):
            suggestions.append({
                'text': "Hey! How's it going?",
                'confidence': 0.9,
                'reasoning': 'Casual greeting response',
                'tone': 'casual'
            })
            suggestions.append({
                'text': "Hello! Great to hear from you!",
                'confidence': 0.8,
                'reasoning': 'Warm greeting',
                'tone': 'friendly'
            })

        # Thanks
        elif any(word in message_lower for word in ['thank', 'thanks']):
            suggestions.append({
                'text': "You're welcome! Happy to help!",
                'confidence': 0.9,
                'reasoning': 'Positive response to gratitude',
                'tone': 'friendly'
            })

        # Negative sentiment
        elif sentiment == 'negative':
            suggestions.append({
                'text': "I understand this is frustrating. Let's work through it together.",
                'confidence': 0.8,
                'reasoning': 'Empathetic response to negative emotion',
                'tone': 'supportive'
            })

        # Default suggestions
        else:
            suggestions.append({
                'text': "I see what you mean. Tell me more about that.",
                'confidence': 0.7,
                'reasoning': 'Encouraging further conversation',
                'tone': 'neutral'
            })
            suggestions.append({
                'text': "That makes sense! What do you think about...",
                'confidence': 0.6,
                'reasoning': 'Continuing the conversation',
                'tone': 'engaging'
            })

        return suggestions[:3]  # Return top 3

    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of text"""

        # Placeholder implementation
        # In production, use sentiment analysis models

        text_lower = text.lower()

        # Positive keywords
        positive_keywords = [
            'happy', 'great', 'awesome', 'excellent', 'love',
            'wonderful', 'fantastic', 'amazing', 'good', 'thanks'
        ]

        # Negative keywords
        negative_keywords = [
            'sad', 'bad', 'terrible', 'awful', 'hate',
            'horrible', 'annoying', 'frustrated', 'angry', 'upset'
        ]

        positive_count = sum(1 for word in positive_keywords if word in text_lower)
        negative_count = sum(1 for word in negative_keywords if word in text_lower)

        # Determine sentiment
        if positive_count > negative_count:
            sentiment = 'positive'
            score = min(0.5 + (positive_count * 0.2), 1.0)
        elif negative_count > positive_count:
            sentiment = 'negative'
            score = max(0.5 - (negative_count * 0.2), 0.0)
        else:
            sentiment = 'neutral'
            score = 0.5

        # Emotion detection (simplified)
        emotions = {
            'happy': 0.0,
            'sad': 0.0,
            'angry': 0.0,
            'fearful': 0.0,
            'surprised': 0.0,
            'neutral': 0.5
        }

        if 'happy' in text_lower or 'joy' in text_lower:
            emotions['happy'] = 0.8
        if 'sad' in text_lower:
            emotions['sad'] = 0.7
        if 'angry' in text_lower or 'mad' in text_lower:
            emotions['angry'] = 0.7

        return {
            'sentiment': sentiment,
            'score': score,
            'emotions': emotions
        }

    def _analyze_mood(self, message: str) -> str:
        """Analyze mood from message"""

        message_lower = message.lower()

        if any(word in message_lower for word in ['!', 'exciting', 'amazing']):
            return 'excited'
        elif any(word in message_lower for word in ['?', 'wondering', 'curious']):
            return 'curious'
        elif any(word in message_lower for word in ['sad', 'down', 'depressed']):
            return 'sad'
        else:
            return 'neutral'

    def _build_context(
        self,
        message: str,
        history: Optional[List[Dict]] = None,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Build conversation context"""

        return {
            'messageLength': len(message),
            'conversationDepth': len(history) if history else 0,
            'hasHistory': history is not None and len(history) > 0,
            'additionalContext': context or {}
        }

    def _check_warnings(
        self,
        message: str,
        sentiment: Dict[str, Any]
    ) -> Optional[List[str]]:
        """Check for warnings"""

        warnings = []

        # Check for very negative sentiment
        if sentiment['sentiment'] == 'negative' and sentiment['score'] < 0.3:
            warnings.append("The conversation seems tense. Consider taking a break.")

        # Check for excessive capitals (shouting)
        if len([c for c in message if c.isupper()]) > len(message) * 0.7:
            warnings.append("Message appears to be shouting. Consider a calmer tone.")

        return warnings if warnings else None

    async def analyze_conversation(
        self,
        conversation_history: List[Dict[str, str]],
        participants: List[str]
    ) -> Dict[str, Any]:
        """Analyze entire conversation for patterns"""

        # Placeholder for conversation analysis
        return {
            'overallSentiment': 'positive',
            'participantMoods': {},
            'communicationPatterns': [],
            'recommendations': [
                "The conversation is going well!",
                "Both participants are engaged."
            ]
        }

    async def auto_respond(
        self,
        message: str,
        rules: Dict[str, Any],
        style: str = "friendly"
    ) -> Dict[str, Any]:
        """Generate automatic response"""

        # Simple auto-responder logic
        # In production, use AI to generate contextual responses

        message_lower = message.lower()

        # Check custom rules
        if 'keywords' in rules:
            for keyword, response in rules.get('keywords', {}).items():
                if keyword.lower() in message_lower:
                    return {
                        'response': response,
                        'confidence': 0.9,
                        'reasoning': f"Matched keyword: {keyword}"
                    }

        # Default responses based on style
        if style == 'friendly':
            default_response = "Thanks for your message! I'll get back to you soon! 😊"
        elif style == 'professional':
            default_response = "Thank you for your message. I will respond as soon as possible."
        elif style == 'casual':
            default_response = "Got your message! Will reply later!"
        else:
            default_response = "Thank you for your message."

        return {
            'response': default_response,
            'confidence': 0.7,
            'reasoning': 'Default auto-response'
        }

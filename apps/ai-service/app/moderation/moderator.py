"""
Content Moderator
=================

AI-powered content moderation system that detects:
- Illegal drugs and substances
- Weapons and violence
- Money laundering and financial crimes
- CSAM (child sexual abuse material)
- Terrorism and extremism
- Fraud and scams
- Hate speech
- Spam
"""

import re
from typing import Dict, List, Optional, Any
import logging
import os
from anthropic import Anthropic
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class ContentModerator:
    """AI Content Moderator"""

    def __init__(self):
        self.initialized = False
        self.use_ai = os.getenv('ANTHROPIC_API_KEY') is not None

        if self.use_ai:
            self.client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
            self.model = os.getenv('AI_MODEL', 'claude-3-5-sonnet-20241022')

        # Keyword-based detection (fallback)
        self.keywords = {
            'drugs': [
                'cocaine', 'heroin', 'meth', 'mdma', 'ecstasy',
                'fentanyl', 'opioid', 'drug deal', 'buying drugs',
                'selling drugs', 'drug supplier'
            ],
            'weapons': [
                'gun', 'firearm', 'weapon', 'ammunition', 'bomb',
                'explosive', 'grenade', 'assault rifle', 'buying gun',
                'selling weapon', 'illegal weapon'
            ],
            'financial_crime': [
                'money laundering', 'laundering money', 'wash money',
                'dirty money', 'crypto scam', 'ponzi scheme',
                'pyramid scheme', 'fraud', 'tax evasion'
            ],
            'csam': [
                # Extremely careful with keywords here
                # In production, use specialized ML models
                'child abuse', 'child exploitation'
            ],
            'terrorism': [
                'terrorist', 'terrorism', 'isis', 'al qaeda',
                'bomb threat', 'attack plan', 'jihad'
            ],
            'hate_speech': [
                'kill all', 'death to', 'hate crime',
                # Add more based on context
            ],
            'scam': [
                'nigerian prince', 'free money', 'click here to win',
                'you won lottery', 'urgent transfer', 'send money'
            ]
        }

    async def initialize(self):
        """Initialize AI models"""
        logger.info("Initializing Content Moderator...")

        try:
            if self.use_ai:
                logger.info("✅ Content Moderator initialized (Claude AI mode)")
            else:
                logger.info("✅ Content Moderator initialized (keyword-based mode)")

            self.initialized = True

        except Exception as e:
            logger.error(f"Failed to initialize Content Moderator: {str(e)}")
            raise

    async def analyze(
        self,
        content: str,
        user_id: Optional[str] = None,
        conversation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze content for moderation

        Returns:
        {
            'allowed': bool,
            'riskScore': float (0-1),
            'flags': List[str],
            'requiresHumanReview': bool,
            'reason': Optional[str],
            'confidence': float
        }
        """

        if not self.initialized:
            await self.initialize()

        # Use Claude AI if available, otherwise fallback to keywords
        if self.use_ai:
            return await self._analyze_with_claude(content)
        else:
            return await self._analyze_with_keywords(content)

    async def _analyze_with_claude(self, content: str) -> Dict[str, Any]:
        """Analyze content using Claude AI"""
        try:
            prompt = f"""Analyze the following message for moderation. Check if it contains:
- Illegal drugs or substances
- Weapons, violence, or threats
- Money laundering or financial crimes
- Child exploitation (CSAM)
- Terrorism or extremism
- Fraud or scams
- Hate speech
- Spam

Message: "{content}"

Respond in this exact JSON format:
{{
  "allowed": true/false,
  "riskScore": 0.0-1.0,
  "flags": ["category1", "category2"],
  "reason": "explanation if blocked",
  "confidence": 0.0-1.0
}}

Be strict but fair. Normal conversations should pass. Only flag genuinely problematic content."""

            response = self.client.messages.create(
                model=self.model,
                max_tokens=512,
                messages=[{"role": "user", "content": prompt}]
            )

            # Parse Claude's response
            import json
            result_text = response.content[0].text.strip()

            # Extract JSON from response
            if '```json' in result_text:
                result_text = result_text.split('```json')[1].split('```')[0].strip()
            elif '```' in result_text:
                result_text = result_text.split('```')[1].split('```')[0].strip()

            # Try to find JSON object
            start = result_text.find('{')
            end = result_text.rfind('}')
            if start != -1 and end != -1:
                result_text = result_text[start:end+1]

            result = json.loads(result_text)

            # Add requiresHumanReview
            risk_score = result.get('riskScore', 0.0)
            result['requiresHumanReview'] = 0.5 <= risk_score < 0.7

            logger.info(f"Claude moderation result: {result}")
            return result

        except Exception as e:
            logger.error(f"Claude moderation error: {e}")
            # Fallback to keyword-based
            return await self._analyze_with_keywords(content)

    async def _analyze_with_keywords(self, content: str) -> Dict[str, Any]:
        """Analyze content using keyword detection (fallback)"""
        content_lower = content.lower()

        # Detect flags
        flags = []
        confidence_scores = []

        for category, keywords in self.keywords.items():
            score, detected = self._check_keywords(content_lower, keywords)

            if detected:
                flags.append(category)
                confidence_scores.append(score)

        # Calculate overall risk score
        if len(confidence_scores) > 0:
            risk_score = max(confidence_scores)
        else:
            risk_score = 0.0

        # Additional checks
        risk_score += self._check_suspicious_patterns(content_lower)

        # Cap at 1.0
        risk_score = min(risk_score, 1.0)

        # Determine if content should be blocked
        allowed = risk_score < 0.7

        # Require human review for moderate risk
        requires_human_review = 0.5 <= risk_score < 0.7

        # Generate reason
        reason = None
        if not allowed:
            reason = f"Content flagged for: {', '.join(flags)}"

        # Calculate confidence
        confidence = 0.8 if len(flags) > 0 else 0.5

        result = {
            'allowed': allowed,
            'riskScore': risk_score,
            'flags': flags,
            'requiresHumanReview': requires_human_review,
            'reason': reason,
            'confidence': confidence
        }

        logger.info(f"Keyword moderation result: {result}")

        return result

    def _check_keywords(self, content: str, keywords: List[str]) -> tuple[float, bool]:
        """Check if content contains keywords"""
        matches = 0
        total_keywords = len(keywords)

        for keyword in keywords:
            if keyword in content:
                matches += 1

        if matches == 0:
            return 0.0, False

        # Score based on number of matches
        score = min(matches / 2.0, 1.0)  # 2 matches = 100% confidence
        return score, True

    def _check_suspicious_patterns(self, content: str) -> float:
        """Check for suspicious patterns"""
        score = 0.0

        # Check for URLs with suspicious TLDs
        if re.search(r'\.(ru|cn|tk|ml|ga|cf|gq)\b', content):
            score += 0.1

        # Check for excessive punctuation (!!!! ????)
        if len(re.findall(r'[!?]{3,}', content)) > 0:
            score += 0.05

        # Check for phone numbers (possible scam)
        if len(re.findall(r'\+?\d{10,15}', content)) > 0:
            score += 0.05

        # Check for cryptocurrency addresses (possible scam)
        if re.search(r'\b(bc1|0x)[a-zA-Z0-9]{20,}\b', content):
            score += 0.1

        # Check for excessive capitals (SHOUTING)
        capitals = len(re.findall(r'[A-Z]', content))
        if capitals > len(content) * 0.5 and len(content) > 10:
            score += 0.1

        return score

    async def analyze_image(self, image_url: str) -> Dict[str, Any]:
        """Analyze image for moderation (placeholder)"""
        # In production, use image recognition models
        return {
            'allowed': True,
            'riskScore': 0.0,
            'flags': [],
            'requiresHumanReview': False,
            'confidence': 0.5
        }

    async def analyze_audio(self, audio_data: bytes) -> Dict[str, Any]:
        """Analyze audio for moderation (placeholder)"""
        # In production, use audio analysis models
        return {
            'allowed': True,
            'riskScore': 0.0,
            'flags': [],
            'requiresHumanReview': False,
            'confidence': 0.5
        }

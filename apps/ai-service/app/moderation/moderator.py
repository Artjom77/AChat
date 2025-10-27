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

logger = logging.getLogger(__name__)


class ContentModerator:
    """AI Content Moderator"""

    def __init__(self):
        self.initialized = False

        # Keyword-based detection (will be replaced with ML models)
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
            # In production, load actual ML models here:
            # - Transformer-based text classifier
            # - Image recognition models
            # - Audio analysis models

            # For now, using keyword-based approach
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

        # Convert to lowercase for analysis
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

        logger.info(f"Moderation result: {result}")

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

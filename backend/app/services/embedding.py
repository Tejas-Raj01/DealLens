import math
import numpy as np
from typing import List
from httpx import AsyncClient

from app.core.config import settings


class EmbeddingService:
    """
    Vector Embedding Service.
    Generates normalized 1536-dimensional embeddings for pgvector storage.
    Supports OpenAI API or deterministic synthetic vector fallback for offline/local dev environments.
    """

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.EMBEDDING_MODEL
        self.dimension = settings.EMBEDDING_DIMENSION

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        # If OpenAI API Key is present, call OpenAI API synchronously
        if self.api_key:
            try:
                import openai
                client = openai.OpenAI(api_key=self.api_key)
                response = client.embeddings.create(
                    input=texts,
                    model=self.model
                )
                return [data.embedding for data in response.data]
            except Exception as e:
                print(f"[EmbeddingService] OpenAI Embedding API call failed: {e}. Utilizing deterministic vector generator fallback.")

        # Deterministic vector fallback generator (for offline testing & development)
        return [self._generate_synthetic_embedding(text) for text in texts]

    def _generate_synthetic_embedding(self, text: str) -> List[float]:
        """Generate a normalized 1536-dimensional pseudo-random embedding based on text hash."""
        seed = sum(ord(c) for c in text) % (2**32)
        rng = np.random.RandomState(seed)
        vec = rng.randn(self.dimension)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()


embedding_service = EmbeddingService()

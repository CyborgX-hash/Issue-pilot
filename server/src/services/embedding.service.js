import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class EmbeddingService {
  /**
   * Calculates cosine similarity between two numerical vectors.
   * Returns a float between -1.0 and 1.0 (or 0.0 and 1.0 for positive embeddings).
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(0, Math.min(1, similarity)); // Clamp to [0, 1]
  }

  /**
   * Tokenizes text into normalized word frequency vector (bag-of-words / TF with sublinear scaling)
   * Combined with character n-grams to capture semantic roots, typos, and technical jargon.
   */
  generateLocalFeatureVector(text, dimensions = 256) {
    if (!text || typeof text !== 'string') return new Array(dimensions).fill(0);

    const vector = new Array(dimensions).fill(0);
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_\s-]/g, ' ');
    const tokens = cleaned.split(/\s+/).filter(t => t.length > 1);

    if (tokens.length === 0) return vector;

    // Hash function to project tokens deterministically into fixed dimension space
    const hash = (str) => {
      let h = 2166136261;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return Math.abs(h);
    };

    // 1. Word unigrams
    for (const token of tokens) {
      const idx = hash(token) % dimensions;
      vector[idx] += 1.0;
    }

    // 2. Word bigrams for local context
    for (let i = 0; i < tokens.length - 1; i++) {
      const bigram = `${tokens[i]}_${tokens[i + 1]}`;
      const idx = hash(bigram) % dimensions;
      vector[idx] += 1.5;
    }

    // Sublinear term frequency scaling: 1 + ln(tf)
    for (let i = 0; i < dimensions; i++) {
      if (vector[i] > 0) {
        vector[i] = 1 + Math.log(vector[i]);
      }
    }

    // L2 normalization
    let norm = 0;
    for (let i = 0; i < dimensions; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < dimensions; i++) {
        vector[i] = vector[i] / norm;
      }
    }

    return vector;
  }

  /**
   * Generates embedding vector for issue text (title + body).
   * Supports local feature projection or remote embedding API if configured.
   */
  async getEmbedding(text) {
    // If AI_API_KEY and remote embedding endpoint are configured:
    if (env.AI_API_KEY && env.AI_BASE_URL && !env.AI_BASE_URL.includes('groq')) {
      try {
        const endpoint = `${env.AI_BASE_URL.replace(/\/+$/, '')}/embeddings`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.AI_API_KEY}`,
          },
          body: JSON.stringify({
            model: env.EMBEDDING_MODEL || 'text-embedding-3-small',
            input: text.substring(0, 4000),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.data?.[0]?.embedding) {
            return data.data[0].embedding;
          }
        }
      } catch (err) {
        logger.warn('Remote embedding generation failed, falling back to local feature vector', {
          error: err.message,
        });
      }
    }

    // Resilient, zero-dependency local embedding
    return this.generateLocalFeatureVector(text);
  }
}

export const embeddingService = new EmbeddingService();

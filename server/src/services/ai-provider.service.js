import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/error-handler.js';

export class BaseAiProvider {
  async complete({ messages, temperature = 0.2, maxTokens = 1500, jsonMode = true }) {
    throw new Error('complete() must be implemented by AI provider adapter.');
  }
}

export class OpenAICompatibleProvider extends BaseAiProvider {
  constructor({ baseUrl, apiKey, model }) {
    super();
    this.baseUrl = baseUrl || 'https://api.groq.com/openai/v1';
    this.apiKey = apiKey;
    this.model = model || 'gemma2-9b-it';
  }

  async complete({ messages, temperature = 0.2, maxTokens = 1500, jsonMode = true }) {
    if (!this.apiKey && !this.baseUrl.includes('localhost') && !this.baseUrl.includes('127.0.0.1')) {
      throw new AppError('AI API key is missing. Configure AI_API_KEY in environment.', 503);
    }

    const endpoint = `${this.baseUrl.replace(/\/+$/, '')}/chat/completions`;

    const body = {
      model: this.model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    if (jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('AI provider HTTP error', { status: response.status, errorText });
        throw new AppError(`AI provider inference failed (${response.status}): ${errorText.substring(0, 200)}`, 502);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new AppError('AI provider returned empty response.', 502);
      }

      return content;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('AI request execution failure', { error: err.message });
      throw new AppError(`AI connection error: ${err.message}`, 502);
    }
  }
}

export class MockAiProvider extends BaseAiProvider {
  constructor(model = 'gemma2-9b-it') {
    super();
    this.model = model;
  }

  async complete({ messages }) {
    const userMessage = messages.find(m => m.role === 'user')?.content || '';

    // Deterministic mock generation based on issue content for tests
    const isBug = /crash|error|bug|fail|exception|timeout/i.test(userMessage);
    const isFeature = /add|support|feature|proposal|request/i.test(userMessage);

    const category = isBug ? 'BUG' : isFeature ? 'FEATURE_REQUEST' : 'OTHER';
    const priority = isBug ? 'HIGH' : 'MEDIUM';

    const mockOutput = {
      category,
      priority,
      summary: isBug
        ? 'Issue describes a runtime crash during webhook timeout handling.'
        : 'Proposal to expand payment provider capabilities with an alternative gateway.',
      reasoning: 'Classification determined based on explicit error symptoms and component interaction details in the report.',
      suggestedLabels: isBug ? ['bug', 'priority:high'] : ['enhancement'],
      missingInformation: isBug ? [
        {
          field: 'stack_trace',
          description: 'Full stack trace with error code and line number.',
          importance: 'required',
        },
        {
          field: 'node_version',
          description: 'Node.js runtime version where the crash occurred.',
          importance: 'recommended',
        },
      ] : [],
      clarificationCommentDraft: isBug
        ? 'Thanks for opening this issue! Could you please provide the full stack trace and the version of Node.js you are running so we can investigate and reproduce this crash?'
        : null,
      confidence: 0.92,
    };

    return JSON.stringify(mockOutput);
  }
}

export function createAiProvider() {
  const providerType = env.AI_PROVIDER || 'groq';

  // If in test environment or provider set to mock, use MockAiProvider
  if (process.env.NODE_ENV === 'test' || providerType === 'mock' || !env.AI_API_KEY) {
    return new MockAiProvider(env.AI_MODEL);
  }

  return new OpenAICompatibleProvider({
    baseUrl: env.AI_BASE_URL,
    apiKey: env.AI_API_KEY,
    model: env.AI_MODEL,
  });
}

export const aiProvider = createAiProvider();

/**
 * Multi-Provider AI Service Layer (Release 06)
 * Supports OpenAI, Google Gemini, and Groq with unified interface
 * Includes cost/token logging and graceful error handling
 */

export type AIProvider = 'openai' | 'gemini' | 'groq';

export interface AIContext {
    userId?: string;
    sessionId?: string;
    feature: string;
    model?: string;
    metadata?: Record<string, unknown>;
}

export interface AIUsageLog {
    provider: AIProvider;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    latencyMs: number;
    success: boolean;
    error?: string;
    feature: string;
    userId?: string;
    timestamp: Date;
}

export interface AIRequestOptions {
    provider?: AIProvider;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
    metadata?: Record<string, unknown>;
}

export interface AIResponse<T = string> {
    content: T;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    model: string;
    provider: AIProvider;
    latencyMs: number;
    cost: number;
}

type AIProviderClient = {
    complete(prompt: string, options?: AIRequestOptions): Promise<AIResponse>;
    embed(text: string): Promise<number[]>;
};

/**
 * In-memory usage log store for immediate observability
 */
const usageLogs: AIUsageLog[] = [];

/**
 * Pricing per 1K tokens (USD) - update as needed
 */
const PRICING: Record<string, { prompt: number; completion: number }> = {
    'openai/gpt-4-turbo-preview': { prompt: 0.01, completion: 0.03 },
    'openai/gpt-4': { prompt: 0.03, completion: 0.06 },
    'openai/gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
    'gemini/gemini-pro': { prompt: 0.00025, completion: 0.0005 },
    'gemini/gemini-1.5-pro': { prompt: 0.00125, completion: 0.005 },
    'groq/llama2-70b-4096': { prompt: 0.0007, completion: 0.0009 },
    'groq/mixtral-8x7b-32768': { prompt: 0.0007, completion: 0.0009 },
};

/**
 * Fallback provider chain for graceful degradation
 */
const DEFAULT_PROVIDER_CHAIN: AIProvider[] = ['openai', 'gemini', 'groq'];

/**
 * OpenAI Provider with support for chat completions and embeddings
 */
class OpenAIProvider implements AIProviderClient {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async complete(prompt: string, options?: AIRequestOptions): Promise<AIResponse> {
        const start = Date.now();
        const model = options?.model || 'gpt-3.5-turbo';

        try {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: options?.temperature ?? 0.7,
                    max_tokens: options?.maxTokens ?? 1024,
                }),
                signal: AbortSignal.timeout(options?.timeoutMs ?? 30000),
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`OpenAI error ${res.status}: ${err}`);
            }

            const data = (await res.json()) as {
                choices: { message: { content: string } }[];
                usage: { prompt_tokens: number; completion_tokens: number };
                model: string;
            };

            const usage = data.usage;
            const latencyMs = Date.now() - start;
            const cost = this.estimateCost(model, usage.prompt_tokens, usage.completion_tokens);

            return {
                content: data.choices[0]?.message?.content || '',
                usage: { promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens, totalTokens: usage.prompt_tokens + usage.completion_tokens },
                model: data.model,
                provider: 'openai',
                latencyMs,
                cost,
            };
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            logUsage({
                provider: 'openai',
                model,
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
                cost: 0,
                latencyMs: Date.now() - start,
                success: false,
                error: errMsg,
                feature: options?.metadata?.feature as string || 'unknown',
                userId: options?.metadata?.userId as string,
                timestamp: new Date(),
            });
            throw error;
        }
    }

    async embed(text: string): Promise<number[]> {
        const res = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: text,
            }),
        });

        if (!res.ok) throw new Error(`OpenAI embed error ${res.status}`);
        const data = (await res.json()) as { data: { embedding: number[] }[] };
        return data.data[0]?.embedding || [];
    }

    private estimateCost(model: string, promptTokens: number, completionTokens: number): number {
        const key = `openai/${model}`;
        const p = PRICING[key] || { prompt: 0.001, completion: 0.002 };
        return (promptTokens * p.prompt + completionTokens * p.completion) / 1000;
    }
}

/**
 * Google Gemini Provider
 */
class GeminiProvider implements AIProviderClient {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async complete(prompt: string, options?: AIRequestOptions): Promise<AIResponse> {
        const start = Date.now();
        const model = (options?.model || 'gemini-pro').replace('models/', '');

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: options?.temperature ?? 0.7,
                        maxOutputTokens: options?.maxTokens ?? 1024,
                    },
                }),
                signal: AbortSignal.timeout(options?.timeoutMs ?? 30000),
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Gemini error ${res.status}: ${err}`);
            }

            const data = (await res.json()) as {
                candidates: { content: { parts: { text: string }[] } }[];
                usageMetadata: { promptTokenCount: number; candidatesTokenCount: number };
            };

            const content = data.candidates[0]?.content?.parts?.[0]?.text || '';
            const promptTokens = data.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4);
            const completionTokens = data.usageMetadata?.candidatesTokenCount || Math.ceil(content.length / 4);
            const latencyMs = Date.now() - start;
            const cost = this.estimateCost(model, promptTokens, completionTokens);

            return {
                content,
                usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
                model: `gemini/${model}`,
                provider: 'gemini',
                latencyMs,
                cost,
            };
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            logUsage({
                provider: 'gemini',
                model: `gemini/${model}`,
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
                cost: 0,
                latencyMs: Date.now() - start,
                success: false,
                error: errMsg,
                feature: (options?.metadata?.feature as string) || 'unknown',
                userId: options?.metadata?.userId as string,
                timestamp: new Date(),
            });
            throw error;
        }
    }

    async embed(text: string): Promise<number[]> {
        const model = 'text-embedding-004';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${this.apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: { parts: [{ text }] } }),
        });
        if (!res.ok) throw new Error(`Gemini embed error ${res.status}`);
        const data = (await res.json()) as { embedding: { values: number[] } };
        return data.embedding?.values || [];
    }

    private estimateCost(model: string, promptTokens: number, completionTokens: number): number {
        const key = `gemini/${model}`;
        const p = PRICING[key] || { prompt: 0.001, completion: 0.002 };
        return (promptTokens * p.prompt + completionTokens * p.completion) / 1000;
    }
}

/**
 * Groq Provider
 */
class GroqProvider implements AIProviderClient {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async complete(prompt: string, options?: AIRequestOptions): Promise<AIResponse> {
        const start = Date.now();
        const model = (options?.model || 'mixtral-8x7b-32768').replace('groq/', '');

        try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: options?.temperature ?? 0.7,
                    max_tokens: options?.maxTokens ?? 1024,
                }),
                signal: AbortSignal.timeout(options?.timeoutMs ?? 30000),
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Groq error ${res.status}: ${err}`);
            }

            const data = (await res.json()) as {
                choices: { message: { content: string } }[];
                usage: { prompt_tokens: number; completion_tokens: number };
                model: string;
            };

            const usage = data.usage;
            const latencyMs = Date.now() - start;
            const cost = this.estimateCost(model, usage.prompt_tokens, usage.completion_tokens);

            return {
                content: data.choices[0]?.message?.content || '',
                usage: { promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens, totalTokens: usage.prompt_tokens + usage.completion_tokens },
                model: data.model,
                provider: 'groq',
                latencyMs,
                cost,
            };
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            logUsage({
                provider: 'groq',
                model: `groq/${model}`,
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0,
                cost: 0,
                latencyMs: Date.now() - start,
                success: false,
                error: errMsg,
                feature: (options?.metadata?.feature as string) || 'unknown',
                userId: options?.metadata?.userId as string,
                timestamp: new Date(),
            });
            throw error;
        }
    }

    async embed(text: string): Promise<number[]> {
        // Groq embeddings via OpenAI-compatible endpoint when available
        // Fallback: cheap no-op or external service
        return [];
    }

    private estimateCost(model: string, promptTokens: number, completionTokens: number): number {
        const key = `groq/${model}`;
        const p = PRICING[key] || { prompt: 0.0007, completion: 0.0009 };
        return (promptTokens * p.prompt + completionTokens * p.completion) / 1000;
    }
}

/**
 * Central AI Service with provider management, fallback chain, and usage logging
 */
export class AIService {
    private providers: Map<AIProvider, AIProviderClient> = new Map();
    private defaultProvider: AIProvider = 'openai';
    private fallbackChain: AIProvider[] = DEFAULT_PROVIDER_CHAIN;

    constructor() {
        this.initializeProviders();
    }

    private initializeProviders() {
        const openaiKey = process.env.OPENAI_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;
        const groqKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY;

        if (openaiKey) this.providers.set('openai', new OpenAIProvider(openaiKey));
        if (geminiKey) this.providers.set('gemini', new GeminiProvider(geminiKey));
        if (groqKey) this.providers.set('groq', new GroqProvider(groqKey));

        if (this.providers.size === 0) {
            console.warn('No AI providers configured. Set OPENAI_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY');
        }
    }

    setProvider(provider: AIProvider) {
        if (!this.providers.has(provider)) {
            throw new Error(`Provider ${provider} not configured`);
        }
        this.defaultProvider = provider;
    }

    setFallbackChain(chain: AIProvider[]) {
        this.fallbackChain = chain;
    }

    async complete<T = string>(prompt: string, options?: AIRequestOptions & { context?: AIContext }): Promise<AIResponse<T>> {
        const context = options?.context;
        const providersToTry = [options?.provider, this.defaultProvider, ...this.fallbackChain]
            .filter((p, idx, arr): p is AIProvider => typeof p === 'string' && arr.indexOf(p) === idx);

        let lastError = new Error('No AI providers available');

        for (const provider of providersToTry) {
            const client = this.providers.get(provider);
            if (!client) continue;

            try {
                const enrichedOptions: AIRequestOptions = {
                    ...options,
                    metadata: { ...options?.metadata, feature: context?.feature, userId: context?.userId },
                };
                const response = await client.complete(prompt, enrichedOptions);
                logUsage({
                    provider: response.provider,
                    model: response.model,
                    promptTokens: response.usage.promptTokens,
                    completionTokens: response.usage.completionTokens,
                    totalTokens: response.usage.totalTokens,
                    cost: response.cost,
                    latencyMs: response.latencyMs,
                    success: true,
                    feature: (enrichedOptions.metadata?.feature as string) || 'unknown',
                    userId: enrichedOptions.metadata?.userId as string,
                    timestamp: new Date(),
                });
                return response as AIResponse<T>;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.warn(`AI provider ${provider} failed:`, lastError.message);
                continue;
            }
        }

        throw lastError;
    }

    async embed(text: string, provider?: AIProvider): Promise<number[]> {
        const tryProvider = provider || this.defaultProvider;
        const client = this.providers.get(tryProvider);
        if (!client) throw new Error(`Provider ${tryProvider} not configured`);
        return client.embed(text);
    }

    getProviders() {
        return Array.from(this.providers.keys());
    }

    getUsageStats(since?: Date) {
        const logs = since ? usageLogs.filter((l) => l.timestamp >= since) : [...usageLogs];
        return {
            totalCalls: logs.length,
            successfulCalls: logs.filter((l) => l.success).length,
            failedCalls: logs.filter((l) => !l.success).length,
            totalTokens: logs.reduce((acc, l) => acc + l.totalTokens, 0),
            totalCost: logs.reduce((acc, l) => acc + l.cost, 0),
            avgLatencyMs: logs.length ? logs.reduce((acc, l) => acc + l.latencyMs, 0) / logs.length : 0,
            logs: logs.slice(-100),
        };
    }
}

export const aiService = new AIService();

function logUsage(log: AIUsageLog) {
    usageLogs.push(log);
    if (usageLogs.length > 10000) usageLogs.splice(0, 1000);

    // Console observability with critical error highlighting
    if (!log.success) {
        console.error('[AI_USAGE_ERROR]', JSON.stringify(log));
    } else if (log.cost > 0.1 || log.totalTokens > 50000) {
        console.warn('[AI_USAGE_HIGH_COST]', JSON.stringify(log));
    }
}

export function resetUsageLogs() {
    usageLogs.length = 0;
}
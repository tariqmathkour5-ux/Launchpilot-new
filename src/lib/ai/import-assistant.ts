/**
 * AI-Assisted Import Assistant (Release 06)
 * Uses AI to validate, enrich, and clean imported tool data
 */

import { aiService } from "./multi-provider-service";

export interface ImportToolRow {
    raw: Record<string, unknown>;
    normalized?: {
        name: string;
        slug: string;
        description: string;
        category: string;
        company?: string;
        pricing?: string;
        features?: string[];
        issues: string[];
        suggestions: string[];
        confidence: number;
    };
}

export interface DataQualityReport {
    totalRows: number;
    validRows: number;
    rowsWithIssues: number;
    rowsWithSuggestions: number;
    commonIssues: Array<{ issue: string; count: number }>;
    processingTimeMs: number;
}

/**
 * Validates and enriches tool data using AI
 */
export async function enrichToolRow(row: ImportToolRow): Promise<ImportToolRow["normalized"]> {
    const context = {
        feature: "tool-import-assistant",
        metadata: { rawRow: row.raw },
    };

    const prompt = `You are a data quality assistant for an AI tools directory.

Analyze the following raw CSV/JSON row and return ONLY a JSON object (no markdown) with:
{
  "name": "clean tool name",
  "slug": "url-friendly-slug",
  "description": "clear marketing description (50-150 words)",
  "category": "appropriate category from: Writing, Marketing, SEO, Productivity, Image, Video, Audio, Analytics, Development, Business, Chatbot, Research, Design, Social Media, E-commerce, Education, Finance, HR, Legal",
  "company": "company name if available or null",
  "pricing": "Free / Freemium / Paid / Enterprise / Unknown",
  "features": ["feature1", "feature2", ...],
  "issues": ["missing-field", "invalid-url", ...],
  "suggestions": ["consider adding X", "verify Y"],
  "confidence": 0.0-1.0
}

Input row: ${JSON.stringify(row.raw)}`;

    const response = await aiService.complete<string>(prompt, {
        temperature: 0.2,
        maxTokens: 1024,
        context,
    });

    let parsed: Record<string, unknown>;
    try {
        const cleaned = response.content.replace(/```json/g, "").replace(/```/g, "").trim();
        parsed = JSON.parse(cleaned);
    } catch {
        parsed = {
            name: String(row.raw.name || row.raw.Name || ""),
            slug: String(row.raw.slug || row.raw.Slug || ""),
            description: String(row.raw.description || row.raw.Description || ""),
            category: String(row.raw.category || row.raw.Category || "General"),
            issues: ["AI parsing failed - review manually"],
            suggestions: [],
            confidence: 0.3,
        };
    }

    const issues = Array.isArray(parsed.issues) ? parsed.issues.filter(Boolean) : [];
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.filter(Boolean) : [];
    const features = Array.isArray(parsed.features) ? parsed.features.filter(Boolean) : [];

    return {
        name: String(parsed.name || row.raw.name || "").trim(),
        slug: String(parsed.slug || row.raw.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
        description: String(parsed.description || row.raw.description || "").trim(),
        category: String(parsed.category || row.raw.category || "General").trim(),
        company: parsed.company ? String(parsed.company).trim() : undefined,
        pricing: parsed.pricing ? String(parsed.pricing).trim() : undefined,
        features,
        issues,
        suggestions,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
    };
}

/**
 * Batch enrich rows with rate limiting
 */
export async function batchEnrichTools(
    rows: ImportToolRow[],
    concurrency = 4,
    onProgress?: (done: number, total: number) => void
): Promise<{ normalized: ImportToolRow["normalized"][]; report: DataQualityReport }> {
    const start = Date.now();
    const results: ImportToolRow["normalized"][] = [];
    let valid = 0;
    let withIssues = 0;
    let withSuggestions = 0;
    const issueCounts = new Map<string, number>();

    for (let i = 0; i < rows.length; i += concurrency) {
        const batch = rows.slice(i, i + concurrency);
        const batchResults = await Promise.all(batch.map((r) => enrichToolRow(r)));
        results.push(...batchResults);

        for (const r of batchResults) {
            if (!r) continue;
            if (r.issues.length > 0) {
                withIssues++;
                for (const issue of r.issues) {
                    issueCounts.set(issue, (issueCounts.get(issue) || 0) + 1);
                }
            }
            if (r.suggestions.length > 0) withSuggestions++;
            if (r.confidence >= 0.7) valid++;
        }

        onProgress?.(Math.min(i + concurrency, rows.length), rows.length);
    }

    return {
        normalized: results,
        report: {
            totalRows: rows.length,
            validRows: valid,
            rowsWithIssues: withIssues,
            rowsWithSuggestions: withSuggestions,
            commonIssues: Array.from(issueCounts.entries())
                .map(([issue, count]) => ({ issue, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 20),
            processingTimeMs: Date.now() - start,
        },
    };
}

/**
 * Summarizes a tool page into a concise marketing description
 */
export async function summarizeToolContent({
    name,
    content,
    existingDescription,
}: {
    name: string;
    content: string;
    existingDescription?: string;
}): Promise<{ summary: string; tags: string[] }> {
    const prompt = `Produce JSON with:
{
  "summary": "concise SEO-friendly summary (120-200 chars)",
  "tags": ["keyword1", "keyword2", ...]
}

Tool name: ${name}
Current description: ${existingDescription || "none"}
Content: ${content.slice(0, 4000)}`;

    const response = await aiService.complete<string>(prompt, {
        temperature: 0.3,
        maxTokens: 512,
        context: { feature: "tool-summarization" },
    });

    try {
        const cleaned = response.content.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return {
            summary: String(parsed.summary || "").trim(),
            tags: Array.isArray(parsed.tags) ? parsed.tags.filter(Boolean).map(String) : [],
        };
    } catch {
        return { summary: existingDescription || `AI for ${name}`, tags: [] };
    }
}

/**
 * Classifies tools into categories automatically
 */
export async function classifyToolCategory({
    name,
    description,
    features,
}: {
    name: string;
    description: string;
    features?: string[];
}): Promise<{ category: string; confidence: number }> {
    const prompt = `Return ONLY a JSON object: {"category":"...","confidence":0.0-1.0}

Categories: Writing, Marketing, SEO, Productivity, Image, Video, Audio, Analytics, Development, Business, Chatbot, Research, Design, Social Media, E-commerce, Education, Finance, HR, Legal

Name: ${name}
Description: ${description}
Features: ${(features || []).join(", ")}`;

    const response = await aiService.complete<string>(prompt, {
        temperature: 0.1,
        maxTokens: 256,
        context: { feature: "tool-categorization" },
    });

    try {
        const cleaned = response.content.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return {
            category: String(parsed.category || "General"),
            confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
        };
    } catch {
        return { category: "General", confidence: 0.3 };
    }
}

/**
 * Generates SEO metadata for a tool page
 */
export async function generateToolSEO({
    name,
    description,
    category,
    features,
}: {
    name: string;
    description: string;
    category: string;
    features: string[];
}): Promise<{ title: string; description: string; keywords: string[] }> {
    const prompt = `Generate SEO metadata in JSON:
{
  "title": "max 60 chars, catchy, include category",
  "description": "max 160 chars, compelling, include value proposition",
  "keywords": ["primary", "secondary", "long-tail"]
}

Name: ${name}
Category: ${category}
Description: ${description}
Features: ${features.slice(0, 10).join(", ")}`;

    const response = await aiService.complete<string>(prompt, {
        temperature: 0.4,
        maxTokens: 512,
        context: { feature: "tool-seo-generation" },
    });

    try {
        const cleaned = response.content.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return {
            title: String(parsed.title || name).slice(0, 60),
            description: String(parsed.description || description).slice(0, 160),
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords.filter(Boolean).map(String) : [],
        };
    } catch {
        return {
            title: `${name} - ${category} AI Tool`,
            description: description.slice(0, 160),
            keywords: [name, category, "AI tool"],
        };
    }
}
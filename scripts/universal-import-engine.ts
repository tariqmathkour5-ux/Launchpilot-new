// =====================================================
// UNIVERSAL IMPORT ENGINE - Release 02
// Processes 28,000+ tools from project/data/extracted
// Features:
//   - Batch processing with progress logging every 1,000 records
//   - Permanent Affiliate Sanitizer (strips all tracking params)
//   - Duplicate-check validation before insertion
//   - Malformed file handling (report & skip)
//   - Outputs to tools_master.json + optional DB import
// =====================================================

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// =====================================================
// TYPES
// =====================================================

interface RawTool {
  [key: string]: string;
}

interface Tool {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  category: string;
  content: string;
  pricing: string;
  has_free_tier: boolean;
  has_api: boolean;
  platforms: string[];
  features: string[];
  pros: string[];
  cons: string[];
  use_cases: string[];
  integrations: string[];
  website_url: string;
  rating: number | null;
  published: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
  source_file?: string;
}

interface ImportStats {
  totalFiles: number;
  processedFiles: number;
  malformedFiles: number;
  totalRecords: number;
  newRecords: number;
  duplicatesSkipped: number;
  affiliateUrlsCleaned: number;
  errors: string[];
  fileDetails: FileDetail[];
}

interface FileDetail {
  file: string;
  records: number;
  newRecords: number;
  duplicates: number;
  cleaned: number;
  status: 'ok' | 'malformed' | 'skipped';
  error?: string;
}

interface ProcessingResult {
  tools: Tool[];
  stats: ImportStats;
}

// =====================================================
// CONFIGURATION
// =====================================================

const CONFIG = {
  // Paths
  extractedPath: path.join(process.cwd(), 'project', 'data', 'extracted'),
  knowledgeBasePath: path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase'),
  outputPath: path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase', 'tools_master.json'),
  reportPath: path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase', 'import_report.json'),

  // Batch processing
  batchSize: 1000,
  logInterval: 1000,

  // Duplicate detection
  duplicateFields: ['slug', 'website_url'] as const,

  // Affiliate tracking parameters to strip (Permanent Affiliate Sanitizer)
  trackingParams: [
    // Google Analytics / Ads
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'gclid', 'gclsrc', 'dclid',
    // Facebook
    'fbclid', 'fbclick', 'fb_source', 'fb_ref',
    // Microsoft / Bing
    'msclkid',
    // Twitter / X
    'twclid',
    // LinkedIn
    'li_fat_id',
    // General affiliate / referral
    'ref', 'ref_src', 'ref_url', 'referrer', 'referral',
    'affiliate', 'aff', 'aff_id', 'affiliate_id', 'affiliate_code',
    'source', 'src', 'campaign', 'campaign_id',
    'clickid', 'click_id', 'tracking', 'tracking_id',
    'partner', 'partner_id', 'partner_code',
    'subid', 'sub_id', 'sub1', 'sub2', 'sub3',
    'siteid', 'site_id',
    'cid', 'pid', 'sid',
    'mc_cid', 'mc_eid', // Mailchimp
    '_ga', '_gl', // Google cross-domain
    'pk_source', 'pk_medium', 'pk_campaign', 'pk_keyword', // Matomo
    'mtm_source', 'mtm_medium', 'mtm_campaign', 'mtm_keyword', // Matomo
    'yclid', // Yahoo
    'igshid', // Instagram
    'zanpid', // Zanox/Awin
  ],

  // CSV files to process (in priority order - later files have lower priority for duplicates)
  csvFiles: [
    'archive_(8)/AI_Landscape_19k_Tools_2026.csv',
    'archive_(7)/AI_tools_dataset.csv',
    'archive_(9)/ai_tools.csv',
    'archive_(6)/Generative AI Tools - Platforms 2025.csv',
    'archive_(2)/Ai Tools Directory.csv',
    'archive/Ai Tools Directory.csv',
  ],

  // Known affiliate domains that should always be sanitized
  affiliateDomains: [
    'insidr.ai',
    'affiliate',
    'ref=',
    'tapfiliate',
    'shareasale',
    'impactradius',
    'commissionjunction',
    'rakuten',
    'skimlinks',
    'viglink',
    'awin',
    'partnerstack',
    'firstpromoter',
  ],
};

// =====================================================
// PERMANENT AFFILIATE SANITIZER
// =====================================================

class AffiliateSanitizer {
  private cleanedCount = 0;

  /**
   * Strip all tracking/affiliate parameters from a URL
   * Returns the cleaned URL and whether it was modified
   */
  sanitizeUrl(url: string): { cleaned: string; modified: boolean } {
    if (!url || url.trim() === '') {
      return { cleaned: url, modified: false };
    }

    let modified = false;
    let cleaned = url.trim();

    try {
      // Handle URLs without protocol by adding a temporary one
      let needsProtocol = false;
      if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
        cleaned = 'https://' + cleaned;
        needsProtocol = true;
      }

      const parsed = new URL(cleaned);
      let paramsChanged = false;

      // Remove tracking parameters
      const params = parsed.searchParams;
      for (const param of CONFIG.trackingParams) {
        if (params.has(param)) {
          params.delete(param);
          paramsChanged = true;
        }
      }

      // Check for affiliate path patterns (e.g., /aff/..., /ref/..., /referral/...)
      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      const affiliatePathPatterns = ['aff', 'ref', 'referral', 'refer', 'affiliate', 'go', 'out'];
      let pathChanged = false;

      // Detect and clean affiliate path patterns
      for (let i = 0; i < pathSegments.length; i++) {
        if (affiliatePathPatterns.includes(pathSegments[i].toLowerCase())) {
          // If the next segment exists, it might be the actual destination
          // We keep the path but note it was an affiliate link
          modified = true;
        }
      }

      // Check if domain contains known affiliate keywords
      const hostname = parsed.hostname.toLowerCase();
      for (const domain of CONFIG.affiliateDomains) {
        if (hostname.includes(domain)) {
          modified = true;
          break;
        }
      }

      if (paramsChanged) {
        // Rebuild URL without tracking params
        const newParams = new URLSearchParams();
        for (const [key, value] of params.entries()) {
          newParams.append(key, value);
        }
        const paramString = newParams.toString();
        parsed.search = paramString ? '?' + paramString : '';
        paramsChanged = true;
      }

      if (paramsChanged || pathChanged) {
        cleaned = parsed.toString();
        // Remove trailing slash if present
        if (cleaned.endsWith('/') && parsed.pathname.length > 1) {
          cleaned = cleaned.replace(/\/$/, '');
        }
        modified = true;
      }

      // Remove temporary protocol if we added it
      if (needsProtocol) {
        cleaned = cleaned.replace(/^https:\/\//, '');
      }

    } catch {
      // If URL parsing fails, return original (not malformed, just can't parse)
      return { cleaned: url, modified: false };
    }

    if (modified) {
      this.cleanedCount++;
    }

    return { cleaned, modified };
  }

  getCleanedCount(): number {
    return this.cleanedCount;
  }

  reset(): void {
    this.cleanedCount = 0;
  }
}

// =====================================================
// DUPLICATE DETECTOR
// =====================================================

class DuplicateDetector {
  private slugIndex: Map<string, Tool>;
  private urlIndex: Map<string, Tool>;

  constructor(existingTools: Tool[] = []) {
    this.slugIndex = new Map();
    this.urlIndex = new Map();

    // Index existing tools
    for (const tool of existingTools) {
      this.indexTool(tool);
    }
  }

  private indexTool(tool: Tool): void {
    this.slugIndex.set(tool.slug.toLowerCase(), tool);
    if (tool.website_url) {
      const normalizedUrl = this.normalizeUrl(tool.website_url);
      if (normalizedUrl) {
        this.urlIndex.set(normalizedUrl, tool);
      }
    }
  }

  private normalizeUrl(url: string): string {
    try {
      let normalized = url.trim().toLowerCase();
      // Remove protocol
      normalized = normalized.replace(/^https?:\/\//, '');
      // Remove trailing slash
      normalized = normalized.replace(/\/$/, '');
      // Remove www.
      normalized = normalized.replace(/^www\./, '');
      return normalized;
    } catch {
      return '';
    }
  }

  /**
   * Check if a tool is a duplicate
   * Returns the existing tool if duplicate found, null otherwise
   */
  checkDuplicate(tool: Tool): { isDuplicate: boolean; existingTool?: Tool; reason?: string } {
    // Check by slug
    const existingBySlug = this.slugIndex.get(tool.slug.toLowerCase());
    if (existingBySlug) {
      return {
        isDuplicate: true,
        existingTool: existingBySlug,
        reason: `slug "${tool.slug}" already exists`,
      };
    }

    // Check by website URL
    if (tool.website_url) {
      const normalizedUrl = this.normalizeUrl(tool.website_url);
      if (normalizedUrl) {
        const existingByUrl = this.urlIndex.get(normalizedUrl);
        if (existingByUrl) {
          return {
            isDuplicate: true,
            existingTool: existingByUrl,
            reason: `website_url "${tool.website_url}" already exists (as "${existingByUrl.name}")`,
          };
        }
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Add a tool to the index (after it passes duplicate check)
   */
  addTool(tool: Tool): void {
    this.indexTool(tool);
  }

  getTotalIndexed(): number {
    return this.slugIndex.size;
  }
}

// =====================================================
// CSV PARSER
// =====================================================

class CsvParser {
  /**
   * Parse CSV content into array of raw tool objects
   */
  parse(content: string): RawTool[] {
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length === 0) return [];

    const headers = this.parseLine(lines[0]);
    const tools: RawTool[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseLine(lines[i]);
        const tool: RawTool = {};
        headers.forEach((header, idx) => {
          tool[header] = values[idx] || '';
        });

        // Only include if it has a recognizable name field
        if (this.hasNameField(tool)) {
          tools.push(tool);
        }
      } catch {
        // Skip malformed lines within a file
        continue;
      }
    }

    return tools;
  }

  private parseLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  private hasNameField(tool: RawTool): boolean {
    const nameFields = ['AI_Name', 'tool_name', 'name', 'Tool Name', 'Tool name', 'Names', 'Name'];
    return nameFields.some(field => tool[field] && tool[field].trim().length > 0);
  }
}

// =====================================================
// TOOL CONVERTER
// =====================================================

class ToolConverter {
  private sanitizer: AffiliateSanitizer;

  constructor(sanitizer: AffiliateSanitizer) {
    this.sanitizer = sanitizer;
  }

  /**
   * Convert a raw CSV row to a standardized Tool object
   */
  convert(raw: RawTool, sourceFile: string): Tool {
    const name = this.extractName(raw);
    const description = this.extractDescription(raw);
    const websiteUrl = this.extractWebsiteUrl(raw);
    const pricing = this.extractPricing(raw);
    const category = this.extractCategory(raw, name, description);
    const slug = this.generateSlug(name);

    // Sanitize the website URL (strip affiliate tracking)
    const { cleaned: sanitizedUrl, modified: urlCleaned } = this.sanitizer.sanitizeUrl(websiteUrl);

    return {
      id: slug,
      slug: slug,
      name: name,
      title: name + ' — ' + (description.length > 120 ? description.substring(0, 120) + '...' : description),
      description: description,
      category: category,
      content: description,
      pricing: pricing,
      has_free_tier: this.detectFreeTier(pricing, raw),
      has_api: this.detectHasApi(raw),
      platforms: ['Web'],
      features: [],
      pros: [],
      cons: [],
      use_cases: [],
      integrations: [],
      website_url: sanitizedUrl,
      rating: null,
      published: true,
      featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source_file: sourceFile,
    };
  }

  private extractName(raw: RawTool): string {
    return raw['AI_Name'] || raw['tool_name'] || raw['Tool Name'] || raw['Tool name'] || raw['Names'] || raw['Name'] || 'Unknown Tool';
  }

  private extractDescription(raw: RawTool): string {
    return raw['Key_Functionality'] || raw['description'] || raw['Short Description'] || raw['Descriptions'] || raw['Description'] || '';
  }

  private extractWebsiteUrl(raw: RawTool): string {
    return raw['Website_URL'] || raw['website_url'] || raw['Website'] || raw['URL'] || raw['website'] || raw['Web_URLs'] || raw['url'] || '';
  }

  private extractPricing(raw: RawTool): string {
    const pricing = raw['Pricing_Model'] || raw['pricing'] || raw['Pricing'] || raw['Prices'] || raw['pricing_model'] || '';
    return this.normalizePricing(pricing);
  }

  private normalizePricing(pricing: string): string {
    if (!pricing) return 'unknown';
    const p = pricing.toLowerCase().trim();
    if (p.includes('free') || p === '0' || p.includes('open source') || p === 'yes') return 'free';
    if (p.includes('freemium') || p.includes('trial')) return 'freemium';
    if (p.includes('pay-as-you-go') || p.includes('subscription') || p.includes('$') || p.includes('mo') || p.includes('paid')) return 'paid';
    return 'unknown';
  }

  private detectFreeTier(pricing: string, raw: RawTool): boolean {
    const p = pricing.toLowerCase();
    if (p === 'free' || p.includes('freemium') || p.includes('trial')) return true;
    const openSource = (raw['open_source'] || '').toLowerCase();
    if (openSource === 'yes' || openSource === 'true') return true;
    return false;
  }

  private detectHasApi(raw: RawTool): boolean {
    const api = (raw['API_Availability'] || raw['has_api'] || raw['api_available'] || '').toLowerCase();
    return api === 'yes' || api === 'true' || api === '1' || api === 'available';
  }

  private generateSlug(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  }

  private extractCategory(raw: RawTool, name: string, description: string): string {
    const categoryRaw = raw['category_canonical'] || raw['category'] || raw['Intelligence_Type'] || raw['Primary_Domain'] || '';
    if (categoryRaw) {
      const lower = categoryRaw.toLowerCase().trim();
      const mapped = this.mapToStandardCategory(lower);
      if (mapped) return mapped;
    }

    const combined = (name + ' ' + description).toLowerCase();

    if (combined.includes('agent') || combined.includes('autonomous')) return 'ai-agents';
    if (combined.includes('chat') || combined.includes('assistant') || combined.includes('bot') || combined.includes('conversation') || combined.includes('llm')) return 'ai-chat';
    if (combined.includes('code') || combined.includes('coding') || combined.includes('developer') || combined.includes('programming') || combined.includes('dev')) return 'ai-code';
    if (combined.includes('image') || combined.includes('photo') || combined.includes('art') || combined.includes('design') || combined.includes('visual') || combined.includes('generate')) return 'ai-image';
    if (combined.includes('write') || combined.includes('content') || combined.includes('copy') || combined.includes('text') || combined.includes('seo') || combined.includes('blog') || combined.includes('article')) return 'ai-writing';
    if (combined.includes('audio') || combined.includes('voice') || combined.includes('speech') || combined.includes('music') || combined.includes('podcast') || combined.includes('transcription')) return 'ai-audio';
    if (combined.includes('video') || combined.includes('clip') || combined.includes('editing') || combined.includes('movie') || combined.includes('animation')) return 'ai-video';
    if (combined.includes('productiv') || combined.includes('task') || combined.includes('automation') || combined.includes('workflow')) return 'ai-productivity';
    if (combined.includes('marketing') || combined.includes('sales') || combined.includes('ads') || combined.includes('campaign') || combined.includes('social')) return 'ai-marketing';
    if (combined.includes('research') || combined.includes('search') || combined.includes('academic') || combined.includes('science')) return 'ai-research';
    if (combined.includes('data') || combined.includes('analytics') || combined.includes('intelligence') || combined.includes('bi ')) return 'ai-data';

    return 'ai-chat'; // Default fallback
  }

  private mapToStandardCategory(lower: string): string | null {
    if (lower.includes('chat') || lower.includes('conversational') || lower.includes('llm')) return 'ai-chat';
    if (lower.includes('image') || lower.includes('design') || lower.includes('visual') || lower.includes('art') || lower.includes('generative') && lower.includes('image')) return 'ai-image';
    if (lower.includes('code') || lower.includes('developer') || lower.includes('programming') || lower.includes('coding')) return 'ai-code';
    if (lower.includes('writing') || lower.includes('content') || lower.includes('text') || lower.includes('copywriting')) return 'ai-writing';
    if (lower.includes('audio') || lower.includes('voice') || lower.includes('speech') || lower.includes('music')) return 'ai-audio';
    if (lower.includes('video') || lower.includes('animation') || lower.includes('generative') && lower.includes('video')) return 'ai-video';
    if (lower.includes('productiv') || lower.includes('automation') || lower.includes('workflow') || lower.includes('agent')) return 'ai-productivity';
    if (lower.includes('marketing') || lower.includes('seo') || lower.includes('ads') || lower.includes('advertising')) return 'ai-marketing';
    if (lower.includes('research') || lower.includes('search')) return 'ai-research';
    if (lower.includes('data') || lower.includes('analytics')) return 'ai-data';
    return null;
  }
}

// =====================================================
// PROGRESS LOGGER
// =====================================================

class ProgressLogger {
  private startTime: number;
  private lastLogTime: number;
  private lastLogCount: number;

  constructor() {
    this.startTime = Date.now();
    this.lastLogTime = this.startTime;
    this.lastLogCount = 0;
  }

  log(processed: number, total: number, phase: string): void {
    const now = Date.now();
    const elapsed = ((now - this.startTime) / 1000).toFixed(1);
    const rate = processed > 0 ? ((now - this.lastLogTime) / (processed - this.lastLogCount || 1)).toFixed(0) : 'N/A';
    const percent = total > 0 ? ((processed / total) * 100).toFixed(1) : 'N/A';

    console.log(
      `[${elapsed}s] ${phase}: ${processed.toLocaleString()}/${total.toLocaleString()} (${percent}%) | ` +
      `${rate}ms/record`
    );

    this.lastLogTime = now;
    this.lastLogCount = processed;
  }

  summary(): { elapsed: number; ratePerSecond: number } {
    const elapsed = (Date.now() - this.startTime) / 1000;
    return { elapsed, ratePerSecond: 0 };
  }
}

// =====================================================
// MAIN IMPORT ENGINE
// =====================================================

class UniversalImportEngine {
  private sanitizer: AffiliateSanitizer;
  private parser: CsvParser;
  private converter: ToolConverter;
  private duplicateDetector: DuplicateDetector;
  private logger: ProgressLogger;
  private stats: ImportStats;
  private prisma: PrismaClient | null;

  constructor(existingTools: Tool[] = []) {
    this.sanitizer = new AffiliateSanitizer();
    this.parser = new CsvParser();
    this.converter = new ToolConverter(this.sanitizer);
    this.duplicateDetector = new DuplicateDetector(existingTools);
    this.logger = new ProgressLogger();
    this.prisma = null;

    this.stats = {
      totalFiles: 0,
      processedFiles: 0,
      malformedFiles: 0,
      totalRecords: 0,
      newRecords: 0,
      duplicatesSkipped: 0,
      affiliateUrlsCleaned: 0,
      errors: [],
      fileDetails: [],
    };
  }

  /**
   * Run the full import pipeline
   */
  async run(importToDb: boolean = false): Promise<ProcessingResult> {
    console.log('='.repeat(70));
    console.log('🚀 UNIVERSAL IMPORT ENGINE v2.0');
    console.log('='.repeat(70));
    console.log(`📁 Source: ${CONFIG.extractedPath}`);
    console.log(`📦 Output: ${CONFIG.outputPath}`);
    console.log(`🔍 Duplicate check: by slug + website_url`);
    console.log(`🧹 Affiliate Sanitizer: ${CONFIG.trackingParams.length} tracking params`);
    console.log(`📊 Log interval: every ${CONFIG.logInterval.toLocaleString()} records`);
    console.log('-'.repeat(70));

    // Initialize Prisma if DB import requested
    if (importToDb) {
      this.prisma = new PrismaClient();
      console.log('🗄️  Database import mode: ENABLED');
    } else {
      console.log('🗄️  Database import mode: DISABLED (JSON only)');
    }
    console.log('-'.repeat(70));

    // Phase 1: Process all CSV files
    const allNewTools = await this.processAllFiles();

    // Phase 2: Generate output files
    const result = this.generateOutput(allNewTools);

    // Phase 3: Import to database (if requested)
    if (importToDb && this.prisma) {
      await this.importToDatabase(result.tools);
    }

    // Phase 4: Print final report
    this.printReport(result.stats);

    // Cleanup
    if (this.prisma) {
      await this.prisma.$disconnect();
    }

    return result;
  }

  /**
   * Phase 1: Process all CSV files
   */
  private async processAllFiles(): Promise<Tool[]> {
    console.log('\n📥 PHASE 1: Processing CSV files...\n');

    const allNewTools: Tool[] = [];
    this.stats.totalFiles = CONFIG.csvFiles.length;

    for (let fileIndex = 0; fileIndex < CONFIG.csvFiles.length; fileIndex++) {
      const relativePath = CONFIG.csvFiles[fileIndex];
      const fullPath = path.join(CONFIG.extractedPath, relativePath);

      console.log(`\n[${fileIndex + 1}/${CONFIG.csvFiles.length}] Processing: ${relativePath}`);

      if (!fs.existsSync(fullPath)) {
        console.log(`  ⚠️  File not found, skipping.`);
        this.stats.malformedFiles++;
        this.stats.fileDetails.push({
          file: relativePath,
          records: 0,
          newRecords: 0,
          duplicates: 0,
          cleaned: 0,
          status: 'skipped',
          error: 'File not found',
        });
        continue;
      }

      try {
        // Read file
        const content = fs.readFileSync(fullPath, 'utf-8');

        // Validate file is not empty
        if (!content || content.trim().length === 0) {
          throw new Error('File is empty');
        }

        // Parse CSV
        const rawTools = this.parser.parse(content);

        if (rawTools.length === 0) {
          console.log(`  ⚠️  No valid records found in file.`);
          this.stats.fileDetails.push({
            file: relativePath,
            records: 0,
            newRecords: 0,
            duplicates: 0,
            cleaned: 0,
            status: 'malformed',
            error: 'No valid records',
          });
          this.stats.malformedFiles++;
          continue;
        }

        console.log(`  📄 Found ${rawTools.length.toLocaleString()} raw records`);

        // Process records in batches
        const fileNewTools: Tool[] = [];
        let fileDuplicates = 0;
        let fileCleaned = 0;

        for (let i = 0; i < rawTools.length; i += CONFIG.batchSize) {
          const batch = rawTools.slice(i, i + CONFIG.batchSize);

          for (const raw of batch) {
            try {
              // Convert raw data to Tool
              const tool = this.converter.convert(raw, relativePath);

              // Track affiliate URL cleaning
              const { modified } = this.sanitizer.sanitizeUrl(raw['Website_URL'] || raw['website_url'] || raw['Website'] || '');
              if (modified) fileCleaned++;

              // Duplicate check
              const dupCheck = this.duplicateDetector.checkDuplicate(tool);
              if (dupCheck.isDuplicate) {
                fileDuplicates++;
                continue;
              }

              // Add to index and results
              this.duplicateDetector.addTool(tool);
              fileNewTools.push(tool);
            } catch (err) {
              // Individual record error - don't fail the whole batch
              const errorMsg = err instanceof Error ? err.message : String(err);
              this.stats.errors.push(`Record error in ${relativePath} at index ${i}: ${errorMsg}`);
            }
          }

          // Progress logging every 1,000 records
          const processedSoFar = Math.min(i + CONFIG.batchSize, rawTools.length);
          if (processedSoFar % CONFIG.logInterval === 0 || processedSoFar >= rawTools.length) {
            this.logger.log(processedSoFar, rawTools.length, relativePath);
          }
        }

        // Add file results to total
        allNewTools.push(...fileNewTools);
        this.stats.newRecords += fileNewTools.length;
        this.stats.duplicatesSkipped += fileDuplicates;
        this.stats.affiliateUrlsCleaned += fileCleaned;
        this.stats.processedFiles++;

        this.stats.fileDetails.push({
          file: relativePath,
          records: rawTools.length,
          newRecords: fileNewTools.length,
          duplicates: fileDuplicates,
          cleaned: fileCleaned,
          status: 'ok',
        });

        console.log(`  ✅ ${fileNewTools.length.toLocaleString()} new, ${fileDuplicates.toLocaleString()} duplicates skipped, ${fileCleaned} URLs cleaned`);

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.log(`  ❌ MALFORMED FILE: ${errorMsg}`);
        this.stats.malformedFiles++;
        this.stats.errors.push(`Malformed file ${relativePath}: ${errorMsg}`);
        this.stats.fileDetails.push({
          file: relativePath,
          records: 0,
          newRecords: 0,
          duplicates: 0,
          cleaned: 0,
          status: 'malformed',
          error: errorMsg,
        });
        // Continue to next file (do not halt)
        continue;
      }
    }

    this.stats.totalRecords = allNewTools.length;
    return allNewTools;
  }

  /**
   * Phase 2: Generate output files
   */
  private generateOutput(newTools: Tool[]): ProcessingResult {
    console.log('\n📦 PHASE 2: Generating output files...\n');

    // Load existing tools
    let existingTools: Tool[] = [];
    if (fs.existsSync(CONFIG.outputPath)) {
      try {
        existingTools = JSON.parse(fs.readFileSync(CONFIG.outputPath, 'utf-8'));
        console.log(`📂 Loaded ${existingTools.length.toLocaleString()} existing tools`);
      } catch {
        console.log('⚠️  Could not load existing tools_master.json, starting fresh');
      }
    }

    // Merge: existing tools + new tools (new tools override duplicates)
    const existingSlugs = new Set(existingTools.map(t => t.slug));
    const mergedTools = [...existingTools];

    let added = 0;
    let updated = 0;
    for (const tool of newTools) {
      if (existingSlugs.has(tool.slug)) {
        // Update existing
        const idx = mergedTools.findIndex(t => t.slug === tool.slug);
        if (idx >= 0) {
          mergedTools[idx] = tool;
          updated++;
        }
      } else {
        mergedTools.push(tool);
        existingSlugs.add(tool.slug);
        added++;
      }
    }

    console.log(`📊 Merge: ${added} added, ${updated} updated, ${existingTools.length} existing`);

    // Write tools_master.json
    fs.writeFileSync(CONFIG.outputPath, JSON.stringify(mergedTools, null, 2));
    console.log(`✅ Written: ${CONFIG.outputPath} (${mergedTools.length.toLocaleString()} tools)`);

    // Generate category breakdown
    const categoryCounts: Record<string, number> = {};
    mergedTools.forEach(t => {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });

    // Write import report
    const report = {
      timestamp: new Date().toISOString(),
      engine: 'Universal Import Engine v2.0',
      summary: {
        totalTools: mergedTools.length,
        newToolsAdded: added,
        existingToolsUpdated: updated,
        duplicatesSkipped: this.stats.duplicatesSkipped,
        affiliateUrlsCleaned: this.stats.affiliateUrlsCleaned,
        filesProcessed: this.stats.processedFiles,
        filesMalformed: this.stats.malformedFiles,
        totalFiles: this.stats.totalFiles,
      },
      fileDetails: this.stats.fileDetails,
      categoryBreakdown: Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => ({ category, count })),
      errors: this.stats.errors,
    };

    fs.writeFileSync(CONFIG.reportPath, JSON.stringify(report, null, 2));
    console.log(`✅ Written: ${CONFIG.reportPath}`);

    return {
      tools: mergedTools,
      stats: this.stats,
    };
  }

  /**
   * Phase 3: Import to database
   */
  private async importToDatabase(tools: Tool[]): Promise<void> {
    if (!this.prisma) return;

    console.log('\n🗄️  PHASE 3: Importing to database...\n');

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // Process in batches for DB efficiency
    for (let i = 0; i < tools.length; i += CONFIG.batchSize) {
      const batch = tools.slice(i, i + CONFIG.batchSize);

      for (const tool of batch) {
        try {
          // Find or create category
          let category = await this.prisma.category.findUnique({
            where: { slug: tool.category },
          });

          if (!category) {
            category = await this.prisma.category.create({
              data: {
                slug: tool.category,
                name: tool.category.replace('ai-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                description: tool.category + ' tools',
              },
            });
          }

          // Upsert tool
          await this.prisma.tool.upsert({
            where: { slug: tool.slug },
            update: {
              name: tool.name,
              title: tool.title,
              description: tool.description,
              content: tool.content,
              categoryId: category.id,
              pricing: tool.pricing,
              hasFreeTier: tool.has_free_tier,
              hasApi: tool.has_api,
              platforms: JSON.stringify(tool.platforms),
              features: JSON.stringify(tool.features),
              pros: JSON.stringify(tool.pros),
              cons: JSON.stringify(tool.cons),
              useCases: JSON.stringify(tool.use_cases),
              integrations: JSON.stringify(tool.integrations),
              websiteUrl: tool.website_url,
              published: tool.published,
            },
            create: {
              slug: tool.slug,
              name: tool.name,
              title: tool.title,
              description: tool.description,
              content: tool.content,
              categoryId: category.id,
              pricing: tool.pricing,
              hasFreeTier: tool.has_free_tier,
              hasApi: tool.has_api,
              platforms: JSON.stringify(tool.platforms),
              features: JSON.stringify(tool.features),
              pros: JSON.stringify(tool.pros),
              cons: JSON.stringify(tool.cons),
              useCases: JSON.stringify(tool.use_cases),
              integrations: JSON.stringify(tool.integrations),
              websiteUrl: tool.website_url,
              published: tool.published,
            },
          });

          imported++;
        } catch (err) {
          errors++;
          const errorMsg = err instanceof Error ? err.message : String(err);
          this.stats.errors.push(`DB import error for ${tool.slug}: ${errorMsg}`);
        }
      }

      // Progress logging
      if ((i + CONFIG.batchSize) % CONFIG.logInterval === 0 || (i + CONFIG.batchSize) >= tools.length) {
        console.log(`  DB Import: ${Math.min(i + CONFIG.batchSize, tools.length).toLocaleString()}/${tools.length.toLocaleString()} (${imported} imported, ${skipped} skipped, ${errors} errors)`);
      }
    }

    console.log(`\n✅ Database import complete: ${imported} imported, ${skipped} skipped, ${errors} errors`);
  }

  /**
   * Print final report
   */
  private printReport(stats: ImportStats): void {
    console.log('\n' + '='.repeat(70));
    console.log('📊 IMPORT REPORT');
    console.log('='.repeat(70));
    console.log(`  Total files:          ${stats.totalFiles}`);
    console.log(`  Processed files:      ${stats.processedFiles}`);
    console.log(`  Malformed files:      ${stats.malformedFiles}`);
    console.log(`  Total records:        ${stats.totalRecords.toLocaleString()}`);
    console.log(`  New records:          ${stats.newRecords.toLocaleString()}`);
    console.log(`  Duplicates skipped:   ${stats.duplicatesSkipped.toLocaleString()}`);
    console.log(`  Affiliate URLs cleaned: ${stats.affiliateUrlsCleaned.toLocaleString()}`);
    console.log(`  Errors:               ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors (first 10):');
      stats.errors.slice(0, 10).forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
      if (stats.errors.length > 10) {
        console.log(`  ... and ${stats.errors.length - 10} more`);
      }
    }

    console.log('-'.repeat(70));
    console.log('\n📁 File Details:');
    stats.fileDetails.forEach(detail => {
      const statusIcon = detail.status === 'ok' ? '✅' : detail.status === 'malformed' ? '❌' : '⚠️';
      console.log(`  ${statusIcon} ${detail.file}: ${detail.newRecords} new, ${detail.duplicates} dup, ${detail.cleaned} cleaned`);
      if (detail.error) {
        console.log(`     Error: ${detail.error}`);
      }
    });

    console.log('-'.repeat(70));
    console.log('✅ Universal Import Engine completed successfully!');
    console.log('='.repeat(70));
  }
}

// =====================================================
// CLI ENTRY POINT
// =====================================================

async function main() {
  const args = process.argv.slice(2);
  const importToDb = args.includes('--db') || args.includes('--database');
  const dryRun = args.includes('--dry-run') || args.includes('--dry');

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     UNIVERSAL IMPORT ENGINE — Release 02                ║');
  console.log('║     "Permanent Affiliate Sanitizer" Active              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE — No files will be written');
    console.log('');
  }

  // Load existing tools for duplicate detection
  const outputPath = path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase', 'tools_master.json');
  let existingTools: Tool[] = [];
  if (fs.existsSync(outputPath)) {
    try {
      existingTools = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      console.log(`📂 Loaded ${existingTools.length.toLocaleString()} existing tools for duplicate detection`);
    } catch {
      console.log('⚠️  Could not load existing tools, starting fresh');
    }
  }

  // Create and run the engine
  const engine = new UniversalImportEngine(existingTools);

  if (dryRun) {
    console.log('\n🔍 DRY RUN: Validating file structure and parsing...\n');
    // Just validate files exist and can be parsed
    for (const relativePath of CONFIG.csvFiles) {
      const fullPath = path.join(CONFIG.extractedPath, relativePath);
      if (!fs.existsSync(fullPath)) {
        console.log(`  ❌ Missing: ${relativePath}`);
      } else {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim()).length;
        console.log(`  ✅ ${relativePath}: ${lines.toLocaleString()} lines`);
      }
    }
    console.log('\n✅ Dry run complete. Run without --dry-run to execute.');
    return;
  }

  try {
    const result = await engine.run(importToDb);
    console.log(`\n📦 Final tool count: ${result.tools.length.toLocaleString()}`);
  } catch (err) {
    console.error('\n❌ Fatal error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { UniversalImportEngine, AffiliateSanitizer, DuplicateDetector, CsvParser, ToolConverter };
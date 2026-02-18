import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';
import cache from '../utils/cache.js';
import { ShoppingItem } from '../types/index.js';
import { ApiError } from '../middleware/errorHandler.js';

interface ParsedQuery {
    items: ShoppingItem[];
    budget: number | null;
}

/**
 * Service to handle AI-powered natural language processing for shopping queries.
 */
class AIService {
    private client: GoogleGenerativeAI;
    private readonly MODEL = 'gemini-1.5-flash';

    constructor() {
        this.client = new GoogleGenerativeAI(config.geminiApiKey || 'dummy-key');
    }

    /**
     * Helper to clean JSON response from Markdown code blocks
     */
    private cleanJsonResponse(text: string): string {
        return text.replace(/```json\n?|\n?```/g, '').trim();
    }

    /**
     * Parses a natural language query into a structured shopping list.
     * Handles English and Norwegian, and extracts quantities, units, and budgets.
     * 
     * @param userQuery The raw string input from the user
     * @returns Structured object with items and budget
     */
    public async parseShoppingQuery(userQuery: string): Promise<ParsedQuery> {
        if (!config.geminiApiKey) {
            console.error('[AIService] Missing API Key');
            throw new ApiError(503, 'AI service configuration error');
        }

        const cacheKey = `ai:parse:${userQuery.trim().toLowerCase()}`;
        const cached = cache.get<ParsedQuery>(cacheKey);
        if (cached) return cached;

        const systemPrompt = `You are a Norwegian grocery shopping assistant. Extract items from user input.
Normalize item names to common Norwegian grocery terms in their base form for the 'name' field (Always capitalize the first letter, e.g., "Melk"), preserve the user's original term in the 'originalName' field, and provide a clear English translation in the 'englishName' field (Always capitalize the first letter, e.g., "Milk").
Also, provide a 'suggestedCategory' field that identifies the core category of the product (e.g., 'melk', 'meieri', 'bakeri', 'brød', 'frukt', 'grønt', 'kjøtt', 'egg', 'godteri').

**Intelligence & Typo Correction:**
- Correct any spelling mistakes or typos in the user input.
- Predict the most likely product the user intended to search for if the spelling is ambiguous.
- Categorize accurately: if searching for "milk", the category is "melk" or "meieri", NOT "godteri".

Examples:
Input: "Jeg trenger 2 liter melk og brød"
Output: {"items":[{"name":"melk","originalName":"melk","englishName":"Milk","suggestedCategory":"melk","quantity":2,"unit":"liter"},{"name":"brød","originalName":"brød","englishName":"Bread","suggestedCategory":"brød","quantity":1}],"budget":null}

Input: "I need eggs and chiken"
Output: {"items":[{"name":"egg","originalName":"eggs","englishName":"Egg","suggestedCategory":"egg","quantity":1},{"name":"kyllingfilet","originalName":"chiken","englishName":"Chicken Fillet","suggestedCategory":"kjøtt","quantity":1}],"budget":null}

Input: "I want milk chocolate"
Output: {"items":[{"name":"melkesjokolade","originalName":"milk chocolate","englishName":"Milk Chocolate","suggestedCategory":"godteri","quantity":1}],"budget":null}

Rules:
- Strictly convert English items to Norwegian for the 'name' field.
- Preserve the user's original term (even with typos) in the 'originalName' field.
- Provide a concise English translation for the 'englishName' field.
- Assign a precise 'suggestedCategory' (melk, meieri, bakeri, frukt, kjøtt, godteri, etc).
- Normalize 'name' to the SINGULAR/BASE form.
- Be smart with typos: always predict the intended grocery item for 'name'.
- Return ONLY valid JSON.
- If quantity is not specified, default to 1.`;

        try {
            console.log(`[AIService] Parsing query: "${userQuery}"`);

            const model = this.client.getGenerativeModel({
                model: this.MODEL,
                systemInstruction: systemPrompt
            });

            const result = await model.generateContent(userQuery);
            const response = await result.response;
            const text = this.cleanJsonResponse(response.text());

            const parsed: ParsedQuery = JSON.parse(text);

            // Basic validation of the parsed structure
            if (!parsed.items || !Array.isArray(parsed.items)) {
                throw new Error('Invalid JSON structure: items array missing');
            }

            // Cache the result for 1 hour
            cache.set(cacheKey, parsed, 3600);

            return parsed;
        } catch (error: any) {
            console.error('[AIService] Error parsing query:', error);

            // Handle API-specific errors
            if (error.status === 403) {
                throw new ApiError(503, 'AI Service Access Denied (Check API Key)');
            }
            if (error.status === 429) {
                throw new ApiError(429, 'AI Service Overloaded');
            }

            // Handle JSON parsing errors with a safe fallback
            if (error instanceof SyntaxError) {
                console.error('[AIService] Invalid JSON response:', error);
                throw new ApiError(502, 'AI response was not valid JSON');
            }

            throw new ApiError(500, 'Failed to parse shopping query with AI');
        }
    }

    /**
     * Provides shopping suggestions (complementary items, recipe ideas, or budget alternatives).
     * 
     * @param items Current list of shopping item names
     * @param context Optional context (e.g., "healthy", "dinner party")
     * @returns Array of suggestions
     */
    public async getSuggestions(items: string[], context?: string): Promise<string[]> {
        const cacheKey = `ai:suggest:${items.join(',')}:${context || ''}`;
        const cached = cache.get<string[]>(cacheKey);
        if (cached) return cached;

        const systemPrompt = `You are a Norwegian grocery shopping assistant. Based on the user's shopping list, suggest 3-5 complementary items, recipe ideas, or budget-friendly alternatives.
Return ONLY a valid JSON array of strings in Norwegian.`;

        const userPrompt = `Shopping list: ${items.join(', ')}
Context: ${context || 'General shopping'}
Suggestions:`;

        try {
            const model = this.client.getGenerativeModel({
                model: this.MODEL,
                systemInstruction: systemPrompt
            });

            const result = await model.generateContent(userPrompt);
            const response = await result.response;
            const text = this.cleanJsonResponse(response.text());

            const parsed: string[] = JSON.parse(text);

            // Limit and clean suggestions
            const suggestions = Array.isArray(parsed) ? parsed.slice(0, 5) : [];

            cache.set(cacheKey, suggestions, 3600);
            return suggestions;
        } catch (error) {
            console.error('[AIService] Error getting suggestions:', error);
            // Return empty array on failure as suggestions are non-critical
            return [];
        }
    }

    /**
     * Checks if the Gemini API is responsive.
     */
    public async checkHealth(): Promise<boolean> {
        try {
            if (!config.geminiApiKey) return false;
            // Minimal call to check connectivity
            const model = this.client.getGenerativeModel({ model: this.MODEL });
            await model.generateContent('ping');
            return true;
        } catch (error) {
            console.error('[AIService] Health check failed:', error);
            return false;
        }
    }
}

export const aiService = new AIService();
export default aiService;


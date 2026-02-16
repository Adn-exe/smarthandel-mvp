import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Interface for the application configuration
 */
interface Config {
    /** The port the server listens on */
    port: number;
    /** API key for Kassal.app */
    kassalApiKey: string;
    /** API key for Google Gemini AI */
    geminiApiKey: string;
    /** Current environment (development/production) */
    nodeEnv: string;
    /** Cache time-to-live in seconds */
    cacheTTL: number;
    /** List of allowed CORS origins */
    allowedOrigins: string[];
}

/**
 * Validates and retrieves required environment variables
 * @param key The environment variable key
 * @returns The value of the environment variable
 * @throws Error if the environment variable is missing
 */
const getRequiredEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is required but missing.`);
    }
    return value;
};

/**
 * Central configuration object for the application
 */
export const config: Config = {
    port: parseInt(process.env.PORT || '3001', 10),

    // Required API keys with validation
    kassalApiKey: getRequiredEnv('KASSAL_API_KEY').trim(),
    geminiApiKey: process.env.GEMINI_API_KEY || (() => {
        console.warn('⚠️  WARNING: GEMINI_API_KEY is not set. AI features will be unavailable.');
        return '';
    })(),

    nodeEnv: process.env.NODE_ENV || 'development',

    // Default to 3600 seconds (1 hour) if not specified
    cacheTTL: parseInt(process.env.CACHE_TTL || '3600', 10),

    // Convert comma-separated string to array
    allowedOrigins: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
        : ['http://localhost:3000']
};

export default config;

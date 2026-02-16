/**
 * Validation and sanitization utilities for SmartHandel
 */

/**
 * Validates if the given coordinates are within global ranges
 * @param lat - Latitude (-90 to 90)
 * @param lng - Longitude (-180 to 180)
 * @returns boolean
 */
export const isValidLocation = (lat: number, lng: number): boolean => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * Validates a search query string
 * @param query - The search query to validate
 * @returns boolean
 */
export const isValidQuery = (query: string): boolean => {
    const trimmed = query.trim();
    return trimmed.length >= 2 && trimmed.length <= 500;
};

/**
 * Sanitizes a search query string
 * @param query - The raw search query
 * @returns string - Trimmed, lowercased, and stripped of special characters
 */
export const sanitizeQuery = (query: string): string => {
    return query
        .trim()
        .toLowerCase()
        .replace(/[^\w\s\u00C0-\u017F,.-]/gi, '') // Keep letters (including Norwegian), numbers, spaces, and basic punctuation
        .replace(/\s+/g, ' '); // Normalize multiple spaces
};

/**
 * Validates a budget value
 * @param budget - The budget amount in NOK
 * @returns boolean
 */
export const isValidBudget = (budget: number): boolean => {
    return budget > 0 && budget >= 10 && budget <= 10000;
};

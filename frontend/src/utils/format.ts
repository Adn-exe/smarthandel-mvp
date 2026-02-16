/**
 * Formatting utilities for SmartHandel
 */

/**
 * Formats a number as Norwegian currency
 * @param amount The amount to format
 * @param currency The currency code (default: 'NOK')
 * @returns Formatted string (e.g., "123,45 kr")
 */
export function formatCurrency(amount: number, currency = 'NOK'): string {
    // Norwegian locale uses comma as decimal separator and space as thousand separator
    return new Intl.NumberFormat('nb-NO', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
        .format(amount)
        .replace('NOK', '') // Remove default NOK prefix/suffix if present to standardize
        .trim() + ' kr'; // Append kr suffix preferred in Norway
}

/**
 * Formats distance in meters to kilometers or meters
 * @param meters Distance in meters
 * @returns Formatted string (e.g., "1.2 km" or "850 m")
 */
export function formatDistance(meters: number): string {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
}

/**
 * Formats a date string or object to Norwegian date format
 * @param date Date object or string
 * @returns Formatted string (e.g., "12. feb. 2026")
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat('nb-NO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(d);
}

/**
 * Formats a number as a percentage
 * @param value The value (0-100 or decimal) - logic assumes if > 1 it's 0-100, if < 1 it might be ratio but handling as direct value for simplicity based on request
 * @param decimals Number of decimal places
 * @returns Formatted string (e.g., "15.5%")
 */
export function formatPercentage(value: number, decimals = 1): string {
    return `${value.toFixed(decimals)}%`;
}

/**
 * Formats an item name (capitalized, trimmed)
 * @param name The raw item name
 * @returns Formatted name
 */
export function formatItemName(name: string): string {
    if (!name) return '';
    const trimmed = name.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

// Example usage / Unit tests (commented out for production but ready for testing)
/*
if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;
  
  it('formats currency correctly', () => {
    expect(formatCurrency(100.50)).toContain('100,50');
    expect(formatCurrency(100.50)).toContain('kr');
  });

  it('formats distance correctly', () => {
    expect(formatDistance(500)).toBe('500 m');
    expect(formatDistance(1500)).toBe('1.5 km');
  });
}
*/

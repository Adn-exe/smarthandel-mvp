import { Location } from '../types/index.js';
import { calculateDistance } from './distance.js';

// Trondheim Center Coordinates (Torvet)
export const TRONDHEIM_CENTER: Location = { lat: 63.4305, lng: 10.3951 };
export const TRONDHEIM_REGION_RADIUS_KM = 20; // 20km radius allows suburb access
export const TRONDHEIM_DEFAULT_RADIUS_KM = 10; // 10km for default view

/**
 * Ensures the search location is within the Trondheim region.
 * Snaps to Trondheim Center for remote users.
 * 
 * @param location The user's provided location
 * @param maxRadius Optional radius override
 * @returns { location: Location, radius: number, snapped: boolean }
 */
export const ensureInRegion = (location: Location, maxRadius?: number) => {
    const distanceToTrondheim = calculateDistance(
        location.lat,
        location.lng,
        TRONDHEIM_CENTER.lat,
        TRONDHEIM_CENTER.lng
    );

    // If more than 20km away, snap to center
    if (distanceToTrondheim > (TRONDHEIM_REGION_RADIUS_KM * 1000)) {
        console.log(`[LocationUtils] User outside Trondheim (${(distanceToTrondheim / 1000).toFixed(1)}km). Snapping to center.`);
        return {
            location: TRONDHEIM_CENTER,
            radius: maxRadius || TRONDHEIM_DEFAULT_RADIUS_KM,
            snapped: true
        };
    }

    return {
        location,
        radius: maxRadius || 5, // Default 5km for locals if not specified
        snapped: false
    };
};

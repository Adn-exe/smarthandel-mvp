import { Location, Store } from '../types/index.js';

/**
 * Calculates the distance between two points on Earth using the Haversine formula.
 * The Haversine formula accounts for the Earth's curvature.
 * 
 * @param lat1 Latitude of point 1 in degrees
 * @param lng1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lng2 Longitude of point 2 in degrees
 * @returns Distance in meters
 */
export const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number => {
    const R = 6371000; // Earth's mean radius in meters

    // Convert degrees to radians
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);

    // The 'a' value represents the square of half the chord length between the points
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    // The 'c' value is the angular distance in radians
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Result in meters
    return R * c;
};

/**
 * Sorts an array of stores by their distance from a user location.
 * Adds the calculated distance property to each store.
 * 
 * @param stores Array of stores to sort
 * @param userLocation The user's current location
 * @returns Sorted array of stores with distance updated
 */
export const sortStoresByDistance = (
    stores: Store[],
    userLocation: Location
): Store[] => {
    return stores
        .map(store => ({
            ...store,
            distance: calculateDistance(
                userLocation.lat,
                userLocation.lng,
                store.location.lat,
                store.location.lng
            )
        }))
        .sort((a, b) => a.distance - b.distance);
};

/**
 * Filters stores that are within a specified radius from a location.
 * 
 * @param stores Array of stores to filter
 * @param userLocation The center point for filtering
 * @param radiusMeters The maximum distance in meters
 * @returns Filtered array of stores
 */
export const filterStoresByRadius = (
    stores: Store[],
    userLocation: Location,
    radiusMeters: number
): Store[] => {
    return stores.filter(store => {
        const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            store.location.lat,
            store.location.lng
        );
        return distance <= radiusMeters;
    });
};

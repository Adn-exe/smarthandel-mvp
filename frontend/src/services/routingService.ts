import axios from 'axios';
import { type LatLngTuple } from 'leaflet';

/**
 * Service to fetch road-following routes from OSRM (Open Source Routing Machine)
 */
export const routingService = {
    /**
     * Get the road path between a set of waypoints
     * @param waypoints Array of [lat, lng] coordinates
     * @returns Array of [lat, lng] coordinates following actual roads
     */
    getRoadRoute: async (waypoints: LatLngTuple[]): Promise<LatLngTuple[]> => {
        if (waypoints.length < 2) return waypoints;

        try {
            // Format waypoints for OSRM: lng,lat;lng,lat...
            const coordinates = waypoints
                .map(point => `${point[1]},${point[0]}`)
                .join(';');

            const response = await axios.get(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`);

            if (response.data.code !== 'Ok') {
                console.error('[RoutingService] OSRM error:', response.data.code);
                return waypoints; // Fallback to straight lines
            }

            // Extract coordinates from GeoJSON (OSRM returns [lng, lat])
            const routeCoordinates: [number, number][] = response.data.routes[0].geometry.coordinates;

            // Map back to [lat, lng] for Leaflet
            return routeCoordinates.map(coord => [coord[1], coord[0]] as LatLngTuple);

        } catch (error) {
            console.error('[RoutingService] Failed to fetch road route:', error);
            return waypoints; // Fallback to straight lines
        }
    }
};

export default routingService;

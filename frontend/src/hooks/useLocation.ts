import { useState, useEffect, useCallback } from 'react';
import type { Location } from '../types';

interface UseLocationReturn {
    location: Location | null;
    loading: boolean;
    error: string | null;
    requestLocation: () => void;
    permissionStatus: PermissionState | 'unknown';
}

const STORAGE_KEY = 'smarthandel_location';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

const DEFAULT_LOCATION: Location = { lat: 59.9139, lng: 10.7522 }; // Oslo

export function useLocation(): UseLocationReturn {
    const [location, setLocation] = useState<Location | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'unknown'>('unknown');

    // Load from cache or request on mount
    useEffect(() => {
        const checkPermissionAndLoad = async () => {
            // 1. Check Cache
            const cached = localStorage.getItem(STORAGE_KEY);
            if (cached) {
                try {
                    const { location: cachedLoc, timestamp } = JSON.parse(cached);
                    if (Date.now() - timestamp < CACHE_DURATION) {
                        setLocation(cachedLoc);
                        setLoading(false);
                        // Even if cached, check permission status for UI
                        if (navigator.permissions && navigator.permissions.query) {
                            const result = await navigator.permissions.query({ name: 'geolocation' });
                            setPermissionStatus(result.state);
                        }
                        return;
                    }
                } catch (e) {
                    console.error('Failed to parse cached location', e);
                    localStorage.removeItem(STORAGE_KEY);
                }
            }

            // 2. If no valid cache, check permission
            if (!navigator.geolocation) {
                setError('Geolocation is not supported by your browser.');
                setLoading(false);
                return;
            }

            if (navigator.permissions && navigator.permissions.query) {
                try {
                    const result = await navigator.permissions.query({ name: 'geolocation' });
                    setPermissionStatus(result.state);

                    if (result.state === 'granted') {
                        requestLocation();
                    } else if (result.state === 'prompt') {
                        // Wait for user action or auto-request if appropriate
                        // For now, we'll wait for manual trigger or rely on the component to call requestLocation
                        setLoading(false);
                    } else {
                        // Denied
                        setError('Location permission denied.');
                        setLoading(false);
                    }

                    // Listen for changes
                    result.onchange = () => {
                        setPermissionStatus(result.state);
                    };
                } catch (e) {
                    console.error('Error querying permissions', e);
                    setLoading(false);
                }
            } else {
                // Fallback for browsers without permissions API
                requestLocation();
            }
        };

        checkPermissionAndLoad();
    }, []);

    const requestLocation = useCallback(() => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError('Geolocation is not supported.');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLocation: Location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                setLocation(newLocation);
                setLoading(false);

                // Cache it
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    location: newLocation,
                    timestamp: Date.now()
                }));
            },
            (err) => {
                console.error('Geolocation error:', err);
                setLoading(false);

                let errorMessage = 'Could not get location.';
                if (err.code === err.PERMISSION_DENIED) {
                    errorMessage = 'Location permission denied. Using default location.';
                    // Fallback
                    setLocation(DEFAULT_LOCATION);
                    setPermissionStatus('denied');
                } else if (err.code === err.TIMEOUT) {
                    errorMessage = 'Location request timed out.';
                }

                setError(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000 // Accept 1 min old position
            }
        );
    }, []);

    return {
        location,
        loading,
        error,
        requestLocation,
        permissionStatus
    };
}

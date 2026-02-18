import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { divIcon, type LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Store, User, ShoppingBag, Navigation } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import { formatDistance } from '../utils/format';
import type { Store as StoreType, Location } from '../types';

interface StoreMapProps {
    userLocation: Location;
    stores: StoreType[];
    route?: StoreType[];
    roadPath?: LatLngTuple[];
    selectedStore?: string;
    isRouting?: boolean;
    onStoreClick?: (store: StoreType) => void;
}

import type { LucideIcon } from 'lucide-react';

// Custom Marker Icons
const createIcon = (color: string, IconComponent: LucideIcon) => {
    return divIcon({
        className: 'custom-marker',
        html: renderToString(
            <div className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white`} style={{ backgroundColor: color }}>
                <IconComponent size={16} strokeWidth={2.5} />
            </div>
        ),
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
};

const userIcon = createIcon('#3B82F6', User); // Blue
const storeIcon = createIcon('#EF4444', ShoppingBag); // Red
const selectedIcon = createIcon('#10B981', Store); // Green for selected

// Component to handle auto-zoom
function MapBounds({
    userLocation,
    stores
}: {
    userLocation: Location;
    stores: StoreType[];
}) {
    const map = useMap();
    const prevStoreIdsStr = useRef<string>('');

    useEffect(() => {
        if (!map || !userLocation) return;

        const currentStoreIdsStr = stores.map(s => s.id).sort().join(',');

        // Only auto-zoom if the set of stores has changed (e.g. switching between 1 and 3 stores)
        // This prevents zoom resets when just selecting a different store in the same set
        if (currentStoreIdsStr !== prevStoreIdsStr.current) {
            const points: LatLngTuple[] = [
                [userLocation.lat, userLocation.lng],
                ...stores.map(s => [s.location.lat, s.location.lng] as LatLngTuple)
            ];

            if (points.length > 0) {
                map.fitBounds(points, {
                    padding: [50, 50],
                    maxZoom: 15,
                    animate: true
                });
            }
            prevStoreIdsStr.current = currentStoreIdsStr;
        }
    }, [map, userLocation?.lat, userLocation?.lng, stores]);

    return null;
}

// Component to handle map resize invalidation (fixes grey map on mobile toggle)
function MapResizer() {
    const map = useMap();

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });

        // Observe the map container
        if (map.getContainer()) {
            resizeObserver.observe(map.getContainer());
        }

        // Also force invalidate on mount/update
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);

        return () => {
            resizeObserver.disconnect();
            clearTimeout(timer);
        };
    }, [map]);

    return null;
}

export function StoreMap({
    userLocation,
    stores,
    route,
    roadPath,
    selectedStore,
    isRouting,
    onStoreClick
}: StoreMapProps) {

    // Create route path if route is provided
    const routePositions: LatLngTuple[] = route
        ? [
            [userLocation.lat, userLocation.lng],
            ...route.map(s => [s.location.lat, s.location.lng] as LatLngTuple)
        ]
        : [];

    return (
        <div className="relative w-full h-full overflow-hidden z-0">
            <MapContainer
                center={[userLocation.lat, userLocation.lng]}
                zoom={13}
                scrollWheelZoom={false}
                className="w-full h-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User Location */}
                <Marker
                    position={[userLocation.lat, userLocation.lng]}
                    icon={userIcon}
                >
                    <Popup className="font-sans">
                        <div className="text-sm font-semibold">You are here</div>
                    </Popup>
                </Marker>

                {/* Stores */}
                {stores.map((store, idx) => {
                    // Check if this store overlaps with any PREVIOUS store in the array
                    const overlappingIdx = stores.slice(0, idx).filter(s =>
                        Math.abs(s.location.lat - store.location.lat) < 0.00001 &&
                        Math.abs(s.location.lng - store.location.lng) < 0.00001
                    ).length;

                    // Add small deterministic jitter for overlapping markers
                    const jitter = 0.0002;
                    const lat = store.location.lat + (overlappingIdx > 0 ? (Math.sin(idx * 12.345) * jitter) : 0);
                    const lng = store.location.lng + (overlappingIdx > 0 ? (Math.cos(idx * 12.345) * jitter) : 0);
                    const storeId = String(store.id);

                    return (
                        <Marker
                            key={storeId}
                            position={[lat, lng]}
                            icon={String(selectedStore) === storeId ? selectedIcon : storeIcon}
                            eventHandlers={{
                                click: () => onStoreClick?.(store),
                            }}
                        >
                            <Popup className="font-sans min-w-[150px]">
                                <div className="p-1">
                                    <h3 className="font-bold text-dark">{store.chain}</h3>
                                    <p className="text-xs text-gray-500 mb-2">{store.name}</p>
                                    <div className="flex items-center gap-1 text-xs font-medium text-primary">
                                        <Navigation className="w-3 h-3" />
                                        {formatDistance(store.distance)} away
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Route Line */}
                {roadPath && roadPath.length > 0 ? (
                    <Polyline
                        positions={roadPath}
                        pathOptions={{
                            color: '#10B981', // Emerald Green for the road path
                            weight: 5,
                            opacity: isRouting ? 0.3 : 0.8,
                            lineCap: 'round',
                            lineJoin: 'round'
                        }}
                    />
                ) : route && route.length > 0 ? (
                    <Polyline
                        positions={routePositions}
                        pathOptions={{
                            color: '#10B981', // Fallback Emerald
                            weight: 5,
                            opacity: 0.6,
                            lineCap: 'round',
                            lineJoin: 'round'
                        }}
                    />
                ) : null}

                {/* Auto Zoom Handler */}
                <MapResizer />
                <MapBounds userLocation={userLocation} stores={stores} />

            </MapContainer>
        </div>
    );
}

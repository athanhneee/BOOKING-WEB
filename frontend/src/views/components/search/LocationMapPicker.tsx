import { useEffect, useMemo, useRef, useState, useCallback, type KeyboardEvent } from "react";
import * as L from "leaflet";
import type { LatLngExpression, LeafletMouseEvent, Marker as LeafletMarker } from "leaflet";
import { MapPin, X } from "lucide-react";
import { MapContainer, Marker, Circle, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./LocationMapPicker.css";
import {
    clampLatLngToVungTauBounds,
    isLatLngInVungTauBounds,
} from "../../../data/vungTauLocationGroups";
import {
    VUNG_TAU_LEAFLET_BOUNDS,
    VUNG_TAU_MIN_MAP_ZOOM,
    VungTauMapBoundsLimiter,
} from "../maps/VungTauMapBounds";
import {
    LEAFLET_MAP_THEMES,
    type LeafletMapTheme,
} from "./maps/leafletMapThemes";
import Toast from "../common/Toast";

// Custom Marker Icon
const customMarkerIcon = L.divIcon({
    className: "custom-map-marker",
    html: `<div class="marker-pin"><div class="marker-inner"></div></div><div class="marker-pulse"></div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 34],
});

export type MapSearchPosition = {
    lat: number;
    lng: number;
};

type LocationMapPickerProps = {
    isOpen: boolean;
    value: MapSearchPosition;
    radiusMeters: number;
    onChange: (position: MapSearchPosition) => void;
    onClose: () => void;
    onConfirm: (position: MapSearchPosition) => void;
};

const MapViewUpdater = ({ position }: { position: MapSearchPosition }) => {
    const map = useMap();

    useEffect(() => {
        map.setView([position.lat, position.lng], map.getZoom(), { animate: true });
    }, [map, position.lat, position.lng]);

    return null;
};

const MapClickHandler = ({
    onChange,
    onOutOfBounds,
}: {
    onChange: (position: MapSearchPosition) => void;
    onOutOfBounds: () => void;
}) => {
    useMapEvents({
        click: (event: LeafletMouseEvent) => {
            const position = { lat: event.latlng.lat, lng: event.latlng.lng };
            if (!isLatLngInVungTauBounds(position)) {
                onOutOfBounds();
                return;
            }
            onChange(position);
        },
    });

    return null;
};



const LocationMapPicker = ({
    isOpen,
    value,
    radiusMeters,
    onChange,
    onClose,
    onConfirm,
}: LocationMapPickerProps) => {
    const markerRef = useRef<LeafletMarker | null>(null);
    const mapTheme: LeafletMapTheme = "satellite";
    
    // Fallback logic state
    const [useFallback, setUseFallback] = useState(false);
    const tileErrorCountRef = useRef(0);

    const [toastMessage, setToastMessage] = useState("");

    const boundedValue = useMemo(
        () => clampLatLngToVungTauBounds(value),
        [value],
    );
    const markerPosition = useMemo<LatLngExpression>(
        () => [boundedValue.lat, boundedValue.lng],
        [boundedValue.lat, boundedValue.lng],
    );

    const handleTileError = useCallback(() => {
        tileErrorCountRef.current += 1;
        if (tileErrorCountRef.current >= 3 && !useFallback) {
            setUseFallback(true);
            setToastMessage("Đang chuyển sang bản đồ nền dự phòng...");
        }
    }, [useFallback]);

    const handleOutOfBounds = () => {
        setToastMessage("Minh Thành Villa hiện chỉ hỗ trợ tìm kiếm trong khu vực Vũng Tàu.");
    };

    const eventHandlers = useMemo(
        () => ({
            dragend: () => {
                const marker = markerRef.current;

                if (!marker) {
                    return;
                }

                const nextPosition = marker.getLatLng();
                const posObj = { lat: nextPosition.lat, lng: nextPosition.lng };
                
                if (!isLatLngInVungTauBounds(posObj)) {
                    handleOutOfBounds();
                    // Reset marker to previous bounded position
                    marker.setLatLng(markerPosition);
                    return;
                }

                onChange(clampLatLngToVungTauBounds(posObj));
            },
        }),
        [onChange, markerPosition],
    );

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        if (isLatLngInVungTauBounds(value)) {
            return;
        }

        onChange(boundedValue);
    }, [boundedValue, onChange, value]);

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape") {
            onClose();
        }
    };

    if (!isOpen) {
        return null;
    }

    const currentTileUrl = useFallback 
        ? LEAFLET_MAP_THEMES[mapTheme].fallbackUrl 
        : LEAFLET_MAP_THEMES[mapTheme].url;

    return (
        <div
            className="fixed inset-0 z-[100000] flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
            role="dialog"
            aria-modal="true"
            aria-label="Tìm kiếm bằng bản đồ"
            onKeyDown={handleKeyDown}
        >
            <button className="absolute inset-0 cursor-default" type="button" onClick={onClose} aria-label="Đóng bản đồ" />
            <div className="relative flex h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[32px] bg-white shadow-2xl sm:h-[min(720px,80dvh)] sm:rounded-[36px]">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-8">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">Tìm kiếm trên bản đồ</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            Di chuyển bản đồ hoặc kéo ghim để chọn vị trí. Chúng tôi sẽ tìm các villa xung quanh khu vực này.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                        aria-label="Đóng bản đồ"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="relative min-h-0 flex-1 bg-[#f1f5f9]">
                    {toastMessage && (
                        <div className="absolute left-1/2 top-4 z-[1000] -translate-x-1/2">
                            <Toast 
                                message={toastMessage} 
                                type="info" 
                                onClose={() => setToastMessage("")} 
                                duration={4000} 
                            />
                        </div>
                    )}
                    
                    <MapContainer
                        center={markerPosition}
                        zoom={14}
                        minZoom={VUNG_TAU_MIN_MAP_ZOOM}
                        maxBounds={VUNG_TAU_LEAFLET_BOUNDS}
                        maxBoundsViscosity={1}
                        scrollWheelZoom
                        className="h-full w-full"
                    >
                        <TileLayer
                            key={mapTheme + (useFallback ? "-fallback" : "")}
                            url={currentTileUrl}
                            attribution={LEAFLET_MAP_THEMES[mapTheme].attribution}
                            eventHandlers={{ tileerror: handleTileError }}
                        />
                        <VungTauMapBoundsLimiter />
                        <MapViewUpdater position={boundedValue} />
                        <MapClickHandler onChange={onChange} onOutOfBounds={handleOutOfBounds} />
                        
                        <Circle
                            center={markerPosition}
                            radius={radiusMeters}
                            pathOptions={{
                                color: "#06b6d4",
                                weight: 1.5,
                                fillColor: "#06b6d4",
                                fillOpacity: 0.1,
                            }}
                        />

                        <Marker
                            draggable
                            eventHandlers={eventHandlers}
                            position={markerPosition}
                            ref={markerRef}
                            icon={customMarkerIcon}
                        />
                    </MapContainer>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
                    <div className="flex min-w-0 items-center gap-3 text-sm text-slate-600">
                        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 shadow-sm">
                            <MapPin size={20} />
                        </span>
                        <span className="min-w-0">
                            <span className="block font-semibold text-slate-900">
                                {boundedValue.lat.toFixed(5)}, {boundedValue.lng.toFixed(5)}
                            </span>
                            <span className="block truncate text-slate-500">
                                Tìm kiếm trong bán kính <strong>{radiusMeters}m</strong> quanh vị trí này
                            </span>
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => onConfirm(boundedValue)}
                        className="inline-flex h-12 items-center justify-center rounded-2xl bg-cyan-500 px-6 text-[15px] font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-cyan-400"
                    >
                        Tìm quanh vị trí này
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationMapPicker;

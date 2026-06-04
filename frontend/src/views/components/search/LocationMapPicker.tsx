import { useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import * as L from "leaflet";
import type { LatLngExpression, LeafletMouseEvent, Marker as LeafletMarker } from "leaflet";
import { MapPin, X } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
    clampLatLngToVungTauBounds,
    isLatLngInVungTauBounds,
} from "../../../data/vungTauLocationGroups";
import {
    VUNG_TAU_LEAFLET_BOUNDS,
    VUNG_TAU_MIN_MAP_ZOOM,
    VungTauMapBoundsLimiter,
} from "../maps/VungTauMapBounds";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
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

const MapClickHandler = ({ onChange }: { onChange: (position: MapSearchPosition) => void }) => {
    useMapEvents({
        click: (event: LeafletMouseEvent) => {
            onChange(clampLatLngToVungTauBounds({
                lat: event.latlng.lat,
                lng: event.latlng.lng,
            }));
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
    const boundedValue = useMemo(
        () => clampLatLngToVungTauBounds(value),
        [value],
    );
    const markerPosition = useMemo<LatLngExpression>(
        () => [boundedValue.lat, boundedValue.lng],
        [boundedValue.lat, boundedValue.lng],
    );
    const eventHandlers = useMemo(
        () => ({
            dragend: () => {
                const marker = markerRef.current;

                if (!marker) {
                    return;
                }

                const nextPosition = marker.getLatLng();
                onChange(clampLatLngToVungTauBounds({
                    lat: nextPosition.lat,
                    lng: nextPosition.lng,
                }));
            },
        }),
        [onChange],
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

    return (
        <div
            className="fixed inset-0 z-[100000] flex items-end justify-center bg-slate-950/55 p-0 sm:items-center sm:p-5"
            role="dialog"
            aria-modal="true"
            aria-label="Tìm kiếm bằng bản đồ"
            onKeyDown={handleKeyDown}
        >
            <button className="absolute inset-0 cursor-default" type="button" onClick={onClose} aria-label="Đóng bản đồ" />
            <div className="relative flex h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:h-[min(760px,90dvh)] sm:rounded-[28px]">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-950">Tìm kiếm bằng bản đồ</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            Chọn hoặc kéo ghim trên bản đồ để tìm chỗ nghỉ trong bán kính {radiusMeters}m.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                        aria-label="Đóng bản đồ"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="min-h-0 flex-1 bg-slate-100">
                    <MapContainer
                        center={markerPosition}
                        zoom={13}
                        minZoom={VUNG_TAU_MIN_MAP_ZOOM}
                        maxBounds={VUNG_TAU_LEAFLET_BOUNDS}
                        maxBoundsViscosity={1}
                        scrollWheelZoom
                        className="h-full w-full"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            bounds={VUNG_TAU_LEAFLET_BOUNDS}
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <VungTauMapBoundsLimiter />
                        <MapViewUpdater position={boundedValue} />
                        <MapClickHandler onChange={onChange} />
                        <Marker
                            draggable
                            eventHandlers={eventHandlers}
                            position={markerPosition}
                            ref={markerRef}
                        />
                    </MapContainer>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex min-w-0 items-center gap-3 text-sm text-slate-600">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                            <MapPin size={18} />
                        </span>
                        <span className="min-w-0">
                            <span className="block font-semibold text-slate-900">
                                {boundedValue.lat.toFixed(6)}, {boundedValue.lng.toFixed(6)}
                            </span>
                            <span className="block truncate">Kết quả trong bán kính {radiusMeters}m từ vị trí bạn chọn</span>
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => onConfirm(boundedValue)}
                        className="inline-flex h-12 items-center justify-center rounded-2xl bg-cyan-500 px-5 text-sm font-semibold text-white transition hover:bg-cyan-500"
                    >
                        Tìm quanh vị trí này
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationMapPicker;

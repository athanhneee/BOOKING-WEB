import { useEffect } from "react";
import * as L from "leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import { useMap } from "react-leaflet";
import { VUNG_TAU_MAP_BOUNDS } from "../../../data/vungTauLocationGroups";

export const VUNG_TAU_LEAFLET_BOUNDS: LatLngBoundsExpression = [
    [VUNG_TAU_MAP_BOUNDS.south, VUNG_TAU_MAP_BOUNDS.west],
    [VUNG_TAU_MAP_BOUNDS.north, VUNG_TAU_MAP_BOUNDS.east],
];

export const VUNG_TAU_MIN_MAP_ZOOM = 12;

const createVungTauBounds = () => L.latLngBounds(VUNG_TAU_LEAFLET_BOUNDS);

const getRestrictedMinZoom = (map: L.Map, bounds: L.LatLngBounds) =>
    Math.max(VUNG_TAU_MIN_MAP_ZOOM, map.getBoundsZoom(bounds, true));

export const VungTauMapBoundsLimiter = () => {
    const map = useMap();

    useEffect(() => {
        const bounds = createVungTauBounds();

        const restrictMapToVungTau = () => {
            const minZoom = getRestrictedMinZoom(map, bounds);

            if (map.getMinZoom() !== minZoom) {
                map.setMinZoom(minZoom);
            }

            map.setMaxBounds(bounds);

            if (map.getZoom() < minZoom) {
                map.setZoom(minZoom, { animate: false });
                return;
            }

            map.panInsideBounds(bounds, { animate: false });
        };

        restrictMapToVungTau();
        map.on("resize zoomend moveend", restrictMapToVungTau);

        return () => {
            map.off("resize zoomend moveend", restrictMapToVungTau);
        };
    }, [map]);

    return null;
};

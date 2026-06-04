import { useEffect } from "react";
import * as L from "leaflet";
import { useMap } from "react-leaflet";
import { VUNG_TAU_LEAFLET_BOUNDS, VUNG_TAU_MIN_MAP_ZOOM } from "./VungTauMapConstants";

export { VUNG_TAU_LEAFLET_BOUNDS, VUNG_TAU_MIN_MAP_ZOOM } from "./VungTauMapConstants";

const createVungTauBounds = () => L.latLngBounds(VUNG_TAU_LEAFLET_BOUNDS);

const getRestrictedMinZoom = (map: L.Map, bounds: L.LatLngBounds) =>
    Math.max(VUNG_TAU_MIN_MAP_ZOOM, map.getBoundsZoom(bounds, true));

const VungTauMapBoundsLimiter = () => {
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

export { VungTauMapBoundsLimiter };

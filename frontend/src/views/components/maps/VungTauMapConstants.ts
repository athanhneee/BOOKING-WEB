import type { LatLngBoundsExpression } from "leaflet";
import { VUNG_TAU_MAP_BOUNDS } from "../../../data/vungTauLocationGroups";

export const VUNG_TAU_LEAFLET_BOUNDS: LatLngBoundsExpression = [
    [VUNG_TAU_MAP_BOUNDS.south, VUNG_TAU_MAP_BOUNDS.west],
    [VUNG_TAU_MAP_BOUNDS.north, VUNG_TAU_MAP_BOUNDS.east],
];

export const VUNG_TAU_MIN_MAP_ZOOM = 12;

export type LeafletMapTheme = "satellite";

export const LEAFLET_MAP_THEMES = {
    satellite: {
        label: "Vệ tinh",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        fallbackUrl: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        attribution: "Tiles &copy; Esri",
    },
} as const;

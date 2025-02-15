export type TMapEvent =
    "mousedow" |
    "mouseup" |
    "mouseover" |
    "mouseout" |
    "mousemove" |
    "mouseenter" |
    "mouseleave" |
    "preclick" |
    "click" |
    "dblclick" |
    "contextmenu" |
    "touchstart" |
    "touchend" |
    "touchcancel" |
    "wheel" |
    "resize" |
    "remove" |
    "touchmove" |
    "movestart" |
    "move" |
    "moveend" |
    "dragstart" |
    "drag" |
    "dragend" |
    "zoomstart" |
    "zoom" |
    "zoomend" |
    "rotatestart" |
    "rotate" |
    "rotateend" |
    "pitchstart" |
    "pitch" |
    "pitchend" |
    "boxzoomstart" |
    "boxzoomend" |
    "boxzoomcancel" |
    "webglcontextlost" |
    "webglcontextrestored" |
    "load" |
    "render" |
    "idle" |
    "error" |
    "data" |
    "styledata" |
    "sourcedata" |
    "dataloading" |
    "styledataloading" |
    "sourcedataloading" |
    "styleimagemissing" |
    "style.load" | 
    "draw.selectionchange";

export interface LngLat {
    lng: number;
    lat: number;
    wrap(): LngLat;
    toArray(): [
        number,
        number
    ];
    toArray(): [
        number,
        number
    ];
    distanceTo(lngLat: LngLat): number;
}

export type LngLatLike = LngLat | {
    lng: number;
    lat: number;
} | {
    lon: number;
    lat: number;
} | [
    number,
    number
];

export interface IMap {
    getContainer(): HTMLElement,

    getStyle(): any;
    setStyle(style: string): any;
    setCenter(center: LngLatLike): void;
    getCenter(): LngLat;
    setBearing(bearing: number): void;
    getBearing(): number;
    setPitch(pitch: number): void;
    getPitch(): number;
    getZoom(): number,
    setZoom(zoom: number): void,

    easeTo(options: { center?: LngLatLike, zoom?: number, duration?: number }): void,

    getCanvas(): HTMLCanvasElement,

    on(event: TMapEvent, callback: (...args: any[]) => void): void,
    off(event: TMapEvent, callback: (...args: any[]) => void): void,

    getSource(id: string): any,
    getLayer(id: string): any,

    addLayer(layer: any, beforeId?: string): IMap,
    removeLayer(id: string): IMap,
    addSource(id: string, source: any): IMap,
    removeSource(id: string): IMap,

    setPaintProperty(layerId: string, property: string, value: any): void,
    setLayoutProperty(layerId: string, property: string, value: any): void,

    setFilter(id: string, filter?: any, options?: any): void,

    doubleClickZoom: {
        enable(): void;
        disable(): void;
        isEnabled(): boolean;
        isActive(): boolean;
    }
}

export type TIdentityGeoJSONFeature = GeoJSON.Feature<GeoJSON.Geometry, { id: string }>;
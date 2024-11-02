export type TMapEvent = 'click' | 'dblclick' | 'mousemove' | 'contextmenu' | 'zoom' | 'style.load';

export interface IMap {
    getStyle(): any;
    setStyle(style: string): any;
    setCenter(center: [number, number]): void,

    getZoom(): number,
    setZoom(zoom: number): void,

    easeTo(options: { center?: [number, number], zoom?: number, duration?: number }): void,

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

    setFilter(id: string, filter?: any, options?: any): void
}
import maplibregl from 'maplibre-gl';
import { LayerProxy, CONTRACT_STRINGS } from '../maplugin-core';

export * from './geojson-layer-manager';
export * from '../maplugin-core';

declare module 'maplibre-gl' {
    interface Map {
        getLayerProxy<T extends maplibregl.LayerSpecification>(id: string): LayerProxy<T>;
    }
}

const _addLayer = maplibregl.Map.prototype.addLayer;
maplibregl.Map.prototype.addLayer = function (layer: maplibregl.AddLayerObject, before?: string) {
    if (layer.type !== 'custom') {
        const proxy = new LayerProxy(this, layer);

        (this as any)[CONTRACT_STRINGS.MAP_LAYER_PROXY_SYMBOL] ??= {};
        (this as any)[CONTRACT_STRINGS.MAP_LAYER_PROXY_SYMBOL][layer.id] = proxy;
    }

    return _addLayer.call(this, layer, before);
}

maplibregl.Map.prototype.getLayerProxy = function <T extends maplibregl.LayerSpecification>(id: string) {
    return (this as any)[CONTRACT_STRINGS.MAP_LAYER_PROXY_SYMBOL][id] as LayerProxy<T>;
}
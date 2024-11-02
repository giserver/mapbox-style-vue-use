import maplibregl from 'maplibre-gl';
import { LayerProxy } from '../maplugin-core';

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

        if (!(this as any)["_layerProxies"])
            (this as any)["_layerProxies"] = {};

        (this as any)["_layerProxies"][layer.id] = proxy;
    }


    return _addLayer.call(this, layer, before);
}

maplibregl.Map.prototype.getLayerProxy = function <T extends maplibregl.LayerSpecification>(id: string) {
    return (this as any)["_layerProxies"][id] as LayerProxy<T>;
}
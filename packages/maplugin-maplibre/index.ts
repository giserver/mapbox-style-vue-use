import maplibregl from 'maplibre-gl';
import { LayerProxy } from '../maplugin-core';

declare module 'maplibre-gl' {
    interface Map {
        getLayerProxy(id: string): LayerProxy<maplibregl.Map, maplibregl.LayerSpecification>;
    }
}

const _addLayer = maplibregl.Map.prototype.addLayer;
maplibregl.Map.prototype.addLayer = function (layer: maplibregl.LayerSpecification, before?: string) {
    const proxy = new LayerProxy(this, layer);
    if(!(this as any)["_layerProxies"]) (this as any)["_layerProxies"] = {};
    (this as any)["_layerProxies"][layer.id] = proxy;
    
    return _addLayer.call(this, layer, before);
}

maplibregl.Map.prototype.getLayerProxy = function (id: string) {
    return (this as any)["_layerProxies"][id];
}
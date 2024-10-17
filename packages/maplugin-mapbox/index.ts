import mapboxgl from 'mapbox-gl';
import { LayerProxy } from '../maplugin-core';

declare module 'mapbox-gl' {
    interface Map {
        getLayerProxy(id: string): LayerProxy<Map, mapboxgl.LayerSpecification>;
    }
}

const _addLayer = mapboxgl.Map.prototype.addLayer;
mapboxgl.Map.prototype.addLayer = function (layer: mapboxgl.LayerSpecification, before?: string) {
    const proxy = new LayerProxy(this, layer);
    if(!(this as any)["_layerProxies"]) (this as any)["_layerProxies"] = {};
    (this as any)["_layerProxies"][layer.id] = proxy;
    
    return _addLayer.call(this, layer, before);
}

mapboxgl.Map.prototype.getLayerProxy = function (id: string) {
    return (this as any)["_layerProxies"][id];
}
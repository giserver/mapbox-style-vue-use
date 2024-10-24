import mapboxgl from 'mapbox-gl';
import { LayerProxy } from '../maplugin-core';

export * from './GeoJSONlayerManager';

type AnyLayerSource = {
	source?: mapboxgl.LayerSpecification["source"] | mapboxgl.SourceSpecification;
};
type TAnyLayer = Omit<mapboxgl.LayerSpecification, "source"> & AnyLayerSource | mapboxgl.CustomLayerInterface;

declare module 'mapbox-gl' {
    interface Map {
        getLayerProxy<T extends mapboxgl.LayerSpecification>(id: string): LayerProxy<mapboxgl.LayerSpecification>;
    }
}

const _addLayer = mapboxgl.Map.prototype.addLayer;
mapboxgl.Map.prototype.addLayer = function (layer: TAnyLayer, before?: string) {
    if(layer.type !== 'custom'){
        const proxy = new LayerProxy(this, layer as any);
        
        if(!(this as any)["_layerProxies"]) 
            (this as any)["_layerProxies"] = {};
        
        (this as any)["_layerProxies"][layer.id] = proxy;
    }

    return _addLayer.call(this, layer, before);
}

mapboxgl.Map.prototype.getLayerProxy = function<T extends mapboxgl.LayerSpecification> (id: string) {
    return (this as any)["_layerProxies"][id] as LayerProxy<T>;
}
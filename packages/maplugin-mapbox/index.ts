import mapboxgl from 'mapbox-gl';
import { LayerProxy, CONTRACT_STRINGS } from '../maplugin-core';

export * from './geojson-layer-manager';
export * from '../maplugin-core'

type AnyLayerSource = {
    source?: mapboxgl.LayerSpecification["source"] | mapboxgl.SourceSpecification;
};
type TAnyLayer = Omit<mapboxgl.LayerSpecification, "source"> & AnyLayerSource | mapboxgl.CustomLayerInterface;

declare module 'mapbox-gl' {
    interface Map {
        getLayerProxy<T extends mapboxgl.LayerSpecification>(id: string): LayerProxy<T>;
    }
}

const _addLayer = mapboxgl.Map.prototype.addLayer;
mapboxgl.Map.prototype.addLayer = function (layer: TAnyLayer, before?: string) {
    if (layer.type !== 'custom') {
        const proxy = new LayerProxy(this, layer as any);

        (this as any)[CONTRACT_STRINGS.MAP_LAYER_PROXY_SYMBOL] ??= {};
        (this as any)[CONTRACT_STRINGS.MAP_LAYER_PROXY_SYMBOL][layer.id] = proxy;
    }

    return _addLayer.call(this, layer, before);
}

mapboxgl.Map.prototype.getLayerProxy = function <T extends mapboxgl.LayerSpecification>(id: string) {
    return (this as any)[CONTRACT_STRINGS.MAP_LAYER_PROXY_SYMBOL][id] as LayerProxy<T>;
}
import { GeoJSONLayerManagerBase, TFeatureEvent, TIdentityGeoJSONFeature } from '../maplugin-core';

export class GeoJSONLayerManager<TFeature extends TIdentityGeoJSONFeature = TIdentityGeoJSONFeature>
    extends GeoJSONLayerManagerBase<mapboxgl.Map, TFeature> {

    /**
     *
     */
    constructor(map: mapboxgl.Map, data: Array<TFeature>) {
        super({
            map,
            data
        });
    }
    protected onChange(mode: TFeatureEvent, features?: TIdentityGeoJSONFeature[] | undefined): void {
        if (mode === 'update' || mode === 'add' || mode === 'delete' || mode === 'clear') {
            this.reRender();
        }
    }
}
import { GeoJSONLayerManagerBase, TFeatureEvent, TIdentityGeoJSONFeature } from '../maplugin-core';

export class GeoJSONLayerManager<TFeature extends TIdentityGeoJSONFeature = TIdentityGeoJSONFeature>
    extends GeoJSONLayerManagerBase<TFeature> {

    /**
     *
     */
    constructor(map: maplibregl.Map, data: Array<TFeature>) {
        super({
            map,
            data
        });
    }
    protected onChange(mode: TFeatureEvent, features?: TIdentityGeoJSONFeature[] | undefined): void {
        const source = this.map.getSource(this.source) as maplibregl.GeoJSONSource;
        if (features) {
            if (mode === 'create') {
                source.updateData({
                    add: features
                });
            } else if (mode === 'update') {
                source.updateData({
                    update: features.map(x => ({
                        id: x.properties.id,
                        newGeometry: x.geometry,
                        addOrUpdateProperties: Object.keys(x.properties).map(y => ({ key: y, value: (x.properties as any)[y] }))
                    }))
                })
            } else if (mode === 'delete') {
                source.updateData({
                    remove: features.map(x => x.properties.id)
                });
            }
        }

        if (mode === 'clear') {
            source.updateData({
                removeAll: true
            });
        }
    }
}
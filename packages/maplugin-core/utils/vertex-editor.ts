import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { IMap, TIdentityGeoJSONFeature } from '../types';

export class VertexEditor {
    private editor: MapboxDraw;

    /**
     *
     */
    constructor(private map: IMap) {
        // 创建编辑器
        this.editor = new MapboxDraw({
            controls: {
                trash: true
            },
            displayControlsDefault: false
        });
        this.editor.onAdd(map as any);
        // 禁止图形平移
        const onDrag = MapboxDraw.modes.direct_select.onDrag;
        MapboxDraw.modes.direct_select.onDrag = function (this, state, e) {
            if (state.selectedCoordPaths.length > 0)
                onDrag?.call(this, state, e);
        };
        // 禁止删除图形
        const directSelectOnTrash = MapboxDraw.modes.direct_select.onTrash;
        MapboxDraw.modes.direct_select.onTrash = function (this, state) {
            const featureType = state.feature.type;
            const coordinates = state.feature.coordinates;
            if ((featureType === 'Polygon' && coordinates[0].length > 3) ||
                (featureType === 'LineString' && coordinates.length > 2)
            ) {
                directSelectOnTrash?.call(this, state);
            }
        }
        MapboxDraw.modes.simple_select.onTrash = function (this, _) { }
    }

    setFeature(feature: TIdentityGeoJSONFeature, onChange: (feature: TIdentityGeoJSONFeature) => void) {
        const fId = feature.properties.id;
        feature.id = fId;
        const geometryCopy = JSON.stringify(feature.geometry);

        // 编辑器重置数据
        const editor = this.editor;
        editor.set({ type: 'FeatureCollection', "features": [feature] });

        if (feature.geometry.type === 'Point')
            editor.changeMode('simple_select', { featureIds: [fId] })
        else
            editor.changeMode('direct_select', { featureId: fId });

        const handleSelectChange = (e: any) => {
            const cFeature = editor.get(fId);

            // 当前选择图形失去选择状态 完成修改
            if (e.features.length === 0 && cFeature) {
                // 若发生改变
                if (geometryCopy === JSON.stringify(cFeature.geometry)) {
                    onChange(cFeature as TIdentityGeoJSONFeature);
                }

                // 删除编辑数据
                this.map.off('draw.selectionchange', handleSelectChange);
                editor.changeMode('draw_point');
                editor.deleteAll();
            }
        }

        this.map.on('draw.selectionchange', handleSelectChange);
    }
}
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { IMap, TIdentityGeoJSONFeature } from '../types';
import { Units } from '../utils';

export class VertexEditor {
    private editor: MapboxDraw;

    /**
     *
     */
    constructor(private map: IMap) {
        map.doubleClickZoom.disable();
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

        // TODO : mapbox-gl-draw 之后会更新调整contracts.classes.CANVASE 数值
        if (Units.isMaplibregl(map)) {
            window.addEventListener("keydown", e => {
                if (e.code === "Delete") {
                    this.editor.trash();
                }
            });
        }

        const time = setInterval(() => {
            ["gl-draw-line-inactive.cold", "gl-draw-polygon-stroke-inactive.cold", "gl-draw-polygon-fill-inactive.cold"].forEach(x => {
                if (map.getLayer(x)) {
                    map.setLayoutProperty(x, "visibility", "none");
                    clearInterval(time);
                }
            });
        }, 400);
    }

    setFeature<TF extends TIdentityGeoJSONFeature>(feature: TF, setDone: (id: string, geometry: TF['geometry']) => void) {
        const fId = feature.properties.id;
        const editor = this.editor;

        // 如果存在数据，清空数据，并设置该数据编辑完成
        const sFeautre = editor.getAll().features[0];
        if (sFeautre) {
            setDone(sFeautre.id! as string, sFeautre.geometry);
        }

        // 将数据设置到编辑器
        editor.set({
            type: 'FeatureCollection', "features": [{
                type: 'Feature',
                id: fId,
                geometry: feature.geometry,
                properties: {}
            }]
        });

        if (feature.geometry.type === 'Point')
            editor.changeMode('simple_select', { featureIds: [fId] })
        else
            editor.changeMode('direct_select', { featureId: fId });

        // 图形选择发生变化
        const handleSelectChange = (e: any) => {
            const cFeature = editor.get(fId);

            // 当前选择图形失去选择状态 完成修改
            if (e.features.length === 0 && cFeature) {
                setDone(fId, cFeature.geometry);

                // 删除编辑数据
                this.map.off('draw.selectionchange', handleSelectChange);
                editor.changeMode('draw_point');
                editor.deleteAll();
            }
        }

        this.map.on('draw.selectionchange', handleSelectChange);
    }
}
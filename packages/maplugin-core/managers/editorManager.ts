import { Tools } from "../utils/tools";
import { GeoJSONLayerManager } from "./GeoJSONLayerManager";

/**
 * 图层图形类型
 */
export type TEditorGeometryType = "Point" | "LineString" | "Polygon"

export interface EditorOptions {
    onDrawed?(feature: GeoJSON.Feature): void;
    once?: boolean;
}

export class EditorManager {
    readonly id_layer_point = Tools.uuid();
    readonly id_layer_point_symbol = Tools.uuid();
    readonly id_layer_line = Tools.uuid();
    readonly id_layer_line_circle = Tools.uuid();
    readonly id_layer_polygon = Tools.uuid();
    readonly id_layer_polygon_circle = Tools.uuid();
    readonly id_layer_polygon_outline = Tools.uuid();
    readonly id_layer_polygon_subline = Tools.uuid();

    private stopFunc?(): void;
    private currentFeatureId: string | undefined;

    private escOnce: (e: KeyboardEvent) => void;

    /**
     *
     */
    constructor(protected glManager: GeoJSONLayerManager, private options: EditorOptions) {
        //#region add layers

        glManager.addLayer({
            id: this.id_layer_point,
            type: 'circle',
            paint: {
                'circle-color': "#fbb03b",
                'circle-radius': 5,
                'circle-stroke-color': '#fff',
                'circle-stroke-width': 2,
            },
            filter: ['==', '$type', 'Point']
        });

        glManager.addLayer({
            id: this.id_layer_point_symbol,
            type: 'symbol',
            filter: ['==', '$type', 'Point']
        });

        glManager.addLayer({
            id: this.id_layer_line,
            type: 'line',
            paint: {
                'line-color': "#fbb03b",
                'line-width': 2,
            },
            filter: ['==', '$type', 'LineString']
        });

        glManager.addLayer({
            id: this.id_layer_line_circle,
            type: 'circle',
            paint: {
                'circle-color': "#fbb03b",
                'circle-radius': 5,
                'circle-stroke-color': '#fff',
                'circle-stroke-width': 2,
            },
            filter: ['==', '$type', 'LineString']
        });

        glManager.addLayer({
            id: this.id_layer_polygon,
            type: 'fill',
            paint: {
                'fill-color': "#fbb03b",
                'fill-opacity': 0.2
            },
            filter: ['==', '$type', 'Polygon']
        });

        glManager.addLayer({
            id: this.id_layer_polygon_circle,
            type: 'circle',
            paint: {
                'circle-color': "#fbb03b",
                'circle-radius': 5,
                'circle-stroke-color': '#fff',
                'circle-stroke-width': 2,
            },
            filter: ['==', '$type', 'Polygon']
        });

        glManager.addLayer({
            id: this.id_layer_polygon_outline,
            type: 'line',
            paint: {
                'line-color': "#fbb03b",
                'line-width': 2,
            },
            filter: ['==', '$type', 'Polygon']
        });

        glManager.map.addLayer({
            id: this.id_layer_polygon_subline,
            type: 'line',
            source: { type: "geojson", data: { type: 'FeatureCollection', features: [] } },
            paint: {
                'line-color': "#fbb03b",
                'line-width': 2,
            }
        });

        //#endregion

        this.escOnce = (e: KeyboardEvent) => {
            // 如果按下esc
            if (e.key.toLocaleLowerCase() === "escape") {
                // 如果当前绘制数据删除
                if (this.currentFeatureId) {
                    glManager.deleteById(this.currentFeatureId);
                    this.currentFeatureId = undefined;
                }

                // 清除临时数据
                ((glManager.map as any).getSource(this.id_layer_polygon_subline) as any).setData({
                    type: 'FeatureCollection',
                    features: []
                });
            }
        }
    }

    start(mode: TEditorGeometryType) {
        this.stop();

        if (mode === 'Point')
            this.stopFunc = this.drawPoint();
        else if (mode === 'LineString')
            this.stopFunc = this.drawLine();
        else if (mode === 'Polygon')
            this.stopFunc = this.drawPolygon();

        this.glManager.map.getCanvas().style.cursor = 'crosshair';

        window.addEventListener('keydown', this.escOnce);
    }

    stop() {
        if (this.currentFeatureId) {
            this.glManager.deleteById(this.currentFeatureId);
            this.currentFeatureId = undefined;
        }

        this.stopFunc?.();
        this.glManager.map.getCanvas().style.cursor = '';
        this.stopFunc = undefined;

        window.removeEventListener('keypress', this.escOnce);
    }

    clear(): void {
        this.glManager.clear();

        ((this.glManager.map as any).getSource(this.id_layer_polygon_subline)).setData({
            type: 'FeatureCollection',
            features: []
        });
    }

    private drawPoint() {
        const map = this.glManager.map;
        
        const clickHandler = (e: any) => {
            const features = this.glManager.create({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [e.lngLat.lng, e.lngLat.lat]
                },
                properties: {
                    id: Tools.uuid()
                }
            });

            this.options.onDrawed?.(features[0]);
            if (this.options.once) {
                this.stop();
            }
        }
        
        map.on('click', clickHandler);
        return () => map.off('click', clickHandler);
    }

    private drawLine() {
        const map = this.glManager.map;
        
        const clickHandler = (e: any) => {
            const point = [e.lngLat.lng, e.lngLat.lat];

            if (this.currentFeatureId) {
                const feature = this.glManager.query(this.currentFeatureId)!;
                const geometry = feature.geometry as GeoJSON.LineString;
                if (!geometry.coordinates[geometry.coordinates.length - 2])
                    return;

                geometry.coordinates.push(point);
                this.glManager.update(feature);

            } else {
                this.currentFeatureId = Tools.uuid();
                this.glManager.create({
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [point]
                    },
                    properties: {
                        id: this.currentFeatureId
                    }
                });

                map.on('mousemove', mouseMoveHandler);
                map.on('contextmenu', rightClickHandler);
            }
        }

        const doubleClickHandler = (e: any) => {
            map.off('mousemove', mouseMoveHandler);
            map.off('contextmenu', rightClickHandler);

            const feature = this.glManager.query(this.currentFeatureId ?? "");
            const geometry = feature?.geometry as GeoJSON.LineString;
            if (!feature || !geometry) return;

            this.currentFeatureId = undefined;

            // 排除最后一个点和动态点
            geometry.coordinates.pop();
            geometry.coordinates.pop();

            // 如果直接双击，删除本次测量
            if (geometry.coordinates.length < 2) {
                this.glManager.deleteById(feature.properties.id);
            }
            else {
                this.options.onDrawed?.call(this, feature);

                if (this.options.once)
                    this.stop();
            }
        }

        const mouseMoveHandler = (e: any) => {
            const point = [e.lngLat.lng, e.lngLat.lat];

            const feature = this.glManager.query(this.currentFeatureId ?? "");
            const geometry = feature?.geometry as GeoJSON.LineString;
            if (!feature || !geometry) return;

            if (geometry.coordinates.length > 1) {
                geometry.coordinates.pop();
            }

            geometry.coordinates.push(point);

            this.glManager.update(feature);
        }

        const rightClickHandler = (e: any) => {
            const feature = this.glManager.query(this.currentFeatureId ?? "");
            const geometry = feature?.geometry as GeoJSON.LineString;
            if (!feature || !geometry) return;

            if (geometry.coordinates.length === 2) { // 只存在第一个点和动态点直接删除图形
                this.glManager.deleteById(feature.properties.id);

                this.currentFeatureId = undefined;
                map.off('mousemove', mouseMoveHandler);
                map.off('contextmenu', rightClickHandler);
            } else {
                geometry.coordinates.pop();
                mouseMoveHandler(e); // 调用鼠标移动事件，重新建立动态线
            }
        }

        const backKeyHandler = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === "backspace" && this.currentFeatureId) {
                const currentFeature = this.glManager.query(this.currentFeatureId);
                const lastCoord = (currentFeature!.geometry as GeoJSON.LineString).coordinates.slice(-1)[0]!;
                rightClickHandler({
                    lngLat: {
                        lat: lastCoord[1],
                        lng: lastCoord[0],
                    } as any
                } as any);
            }
        }

        map.on('click', clickHandler);
        map.on('dblclick', doubleClickHandler);
        window.addEventListener('keydown', backKeyHandler);

        return () => {
            map.off('mousemove', mouseMoveHandler);
            map.off('contextmenu', rightClickHandler);
            map.off('click', clickHandler);
            map.off('dblclick', doubleClickHandler);
            window.removeEventListener('keydown', backKeyHandler);
        }
    }

    private drawPolygon() {
        const map = this.glManager.map;
        
        const clickHandler = (e: any) => {
            const point = [e.lngLat.lng, e.lngLat.lat];

            // 判断是否已经落笔
            if (this.currentFeatureId) {
                const feature = this.glManager.query(this.currentFeatureId)!;
                const geometry = feature.geometry as GeoJSON.Polygon;
                const coords = geometry.coordinates[0];
                if (coords.length > 2)
                    coords.pop(); //删除第一个点
                coords.push(point);
                coords.push(coords[0]);

                this.glManager.update(feature);

            } else {
                this.currentFeatureId = Tools.uuid();
                this.glManager.create({
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[point]]
                    },
                    properties: {
                        id: this.currentFeatureId
                    }
                });

                map.on('mousemove', mouseMoveHandler);
                map.on('contextmenu', rightClickHandler);
            }
        };

        const doubleClickHandler = (e:any) => {
            map.off('mousemove', mouseMoveHandler);
            map.off('contextmenu', rightClickHandler);

            const feature = this.glManager.query(this.currentFeatureId ?? "");
            const geometry = feature?.geometry as GeoJSON.Polygon;
            if (!feature || !geometry) return;

            this.currentFeatureId = undefined;

            const coords = geometry.coordinates[0];
            coords.pop();
            coords.pop();
            coords.pop();
            if (coords.length < 3) {
                this.glManager.deleteById(feature.properties.id);
            } else {
                // 添加第一个点 (闭合)
                coords.push(coords[0]);
                this.glManager.update(feature);
                this.options.onDrawed?.call(this, feature);

                if (this.options.once)
                    this.stop();
            }

            (map.getSource(this.id_layer_polygon_subline)).setData({
                type: 'FeatureCollection',
                features: []
            });
        };

        const mouseMoveHandler = (e: any) => {
            const feature = this.glManager.query(this.currentFeatureId ?? "");
            const geometry = feature?.geometry as GeoJSON.Polygon;
            if (!feature || !geometry) return;

            const point = [e.lngLat.lng, e.lngLat.lat];
            const coords = geometry.coordinates[0];

            if (coords.length === 2) {
                setTimeout(() => {
                    (map.getSource(this.id_layer_polygon_subline)).setData({
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: coords },
                        properties: {}
                    })
                }, 50);
            }

            if (coords.length > 1)
                coords.pop();

            if (coords.length > 1) {
                coords.pop();
            }

            coords.push(point);

            if (coords.length > 2)
                coords.push(coords[0]);

            this.glManager.update(feature);
        }

        const rightClickHandler = (e: any) => {
            const feature = this.glManager.query(this.currentFeatureId ?? "");
            const geometry = feature?.geometry as GeoJSON.Polygon;
            if (!feature || !geometry) return;

            const coords = geometry.coordinates[0];

            if (coords.length === 2) {// 只存在第一个点和动态点则删除当前图形，进行下一次绘制
                map.off('mousemove', mouseMoveHandler);
                map.off('contextmenu', rightClickHandler);
                this.glManager.deleteById(feature.properties.id);
                this.currentFeatureId = undefined;

                setTimeout(() => {
                    (map.getSource(this.id_layer_polygon_subline)).setData({
                        type: 'FeatureCollection',
                        features: []
                    });
                }, 50);
            } else {
                coords.pop();
                if (coords.length === 3) coords.pop(); // 辅助线 _line_addion 更新
                mouseMoveHandler(e); // 调用鼠标移动事件，重新建立动态线
            }
        }

        const backKeyHandler = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === "backspace" && this.currentFeatureId) {
                const currentFeature = this.glManager.query(this.currentFeatureId);
                const lastCoord = (currentFeature!.geometry as GeoJSON.Polygon).coordinates[0].slice(-2)[0]!;
                rightClickHandler({
                    lngLat: {
                        lat: lastCoord[1],
                        lng: lastCoord[0],
                    } as any
                } as any);
            }
        }

        map.on('click', clickHandler);
        map.on('dblclick', doubleClickHandler);
        window.addEventListener("keydown", backKeyHandler);

        return () => {
            map.off('mousemove', mouseMoveHandler);
            map.off('contextmenu', rightClickHandler);
            map.off('click', clickHandler);
            map.off('dblclick', doubleClickHandler);

            (map.getSource(this.id_layer_polygon_subline)).setData({
                type: 'FeatureCollection',
                features: []
            });

            window.removeEventListener("keydown", backKeyHandler);
        }
    }
}
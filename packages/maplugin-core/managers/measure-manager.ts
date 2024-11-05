import booleanClockwise from '@turf/boolean-clockwise';
import { DrawManager } from './geojson-draw-manager';
import { GeoJSONLayerManagerBase } from './geojson-layer-manager';
import { Units, Measurement, Tools } from '../utils';
import { TIdentityGeoJSONFeature } from '../types';

type TMeasureUnits = {
    area: Units.TUnitsArea | "M2KM2",
    length: Units.TUnitsLength | "MKM",
}

interface MeasureOptions {
    formats: {
        point: (coord: GeoJSON.Position) => string,
        line: (length: number, units: Units.TUnitsLength, index: number, end: boolean, segment: boolean) => string,
        polygon: (area: number, units: Units.TUnitsArea) => string,
        'polygon-line': (length: number, units: Units.TUnitsLength, index: number, end: boolean, segment: boolean) => string,
    }
}

export class MeasureManager {

    private glManager: GeoJSONLayerManagerBase;

    private customFeatures: TIdentityGeoJSONFeature[] = [];

    /**
     * 测量单位
     */
    private units: TMeasureUnits;

    /**
     * 不同单位的精度，执行number类型的toFix(precisions)方法
     */
    private precisions: Map<Units.TUnitsLength | Units.TUnitsArea, number>;


    readonly id_source_measure_symbol = Tools.uuid();


    readonly id_layer_measrue_point = Tools.uuid();
    readonly id_layer_measrue_line = Tools.uuid();
    readonly id_layer_measrue_line_segment = Tools.uuid();
    readonly id_layer_measrue_polygon = Tools.uuid();
    readonly id_layer_measrue_polygon_line = Tools.uuid();
    readonly id_layer_measure_polygon_line_segment = Tools.uuid();

    /**
     * 面方向图层id
     * 
     * 用于创建面方向layer和source
     */
    readonly id_layer_polygon_clockwise = Tools.uuid();

    /**
     * 长度单位
     */
    get unitsLength() {
        return this.units.length;
    }

    /**
     * 面积单位
     */
    get unitsArea() {
        return this.units.area;
    }

    constructor(dataSource: DrawManager | GeoJSONLayerManagerBase, private options: MeasureOptions = {
        formats: {
            point: p => {
                return `${p[0].toFixed(6)},${p[1].toFixed(6)}`;
            },
            line: (len, units) => {
                const val = len.toFixed(this.precisions.get(units)) + ` ${Units.unitsLengthDescriptions.find(x => x.value === units)?.label}`;
                return val;
            },
            polygon: (area, units) => {
                const val = area.toFixed(this.precisions.get(units)) + ` ${Units.unitsAreaDescriptions.find(x => x.value === units)?.label}`;
                return val;
            },
            "polygon-line": (len, units, _, end) => {
                const val = len.toFixed(this.precisions.get(units)) + ` ${Units.unitsLengthDescriptions.find(x => x.value === units)?.label}`;
                return end ? `终点: ${val}` : val;
            }
        }
    }) {
        this.glManager = dataSource instanceof DrawManager ? dataSource.glManager : dataSource;

        // 清空自定义数据
        this.glManager.on('clear', () => this.customFeatures = []);
        this.glManager.on('all', () => this.renderMeasure());

        /**
         * 添加数据源
         */
        this.glManager.map.addSource(this.id_source_measure_symbol, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        });

        /**
         * 添加面方向图层
         */
        this.glManager.map.addLayer({
            id: this.id_layer_polygon_clockwise,
            type: 'symbol',
            source: {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            },
            layout: {
                'symbol-placement': 'line',
                'text-field': ['case', ['boolean', ['get', 'clockwise'], true], '▶', '◀'],
                'text-size': ['interpolate', ['linear'], ['zoom'], 12, 16, 22, 24],
                'symbol-spacing': ['interpolate', ['linear'], ['zoom'], 12, 30, 22, 60],
                'text-keep-upright': false,
            },
            paint: {
                'text-color': '#3887be',
                'text-halo-color': 'hsl(55, 11%, 96%)',
                'text-halo-width': 3
            },
            filter: ['==', '$type', 'Polygon']
        });

        /**
         * 测量点结果的图层
         */
        this.glManager.map.addLayer({
            id: this.id_layer_measrue_point,
            type: 'symbol',
            source: this.id_source_measure_symbol,
            layout: {
                "text-field": ['get', 'value'],
                'text-size': 14,
                'text-offset': [0, -1]
            },
            paint: {
                'text-color': 'black',
                'text-halo-color': 'white',
                'text-halo-width': 2
            },
            filter: ['==', ['get', 'type'], 'point']
        });

        /**
         * 添加线测量总结果图层
         */
        this.glManager.map.addLayer({
            id: this.id_layer_measrue_line,
            type: 'symbol',
            source: this.id_source_measure_symbol,
            layout: {
                "text-field": ['get', 'value'],
                'text-size': 14,
                'text-offset': [0, -1]
            },
            paint: {
                'text-color': 'black',
                'text-halo-color': 'white',
                'text-halo-width': 2
            },
            filter: ['==', ['get', 'type'], 'line']
        });

        /**
         * 添加线测量线段结果图层
         */
        this.glManager.map.addLayer({
            id: this.id_layer_measrue_line_segment,
            type: 'symbol',
            source: this.id_source_measure_symbol,
            layout: {
                "text-field": ['get', 'value'],
                'text-size': 12,
                'text-offset': [0, -1]
            },
            paint: {
                'text-color': 'red',
                'text-halo-color': 'white',
                'text-halo-width': 2
            },
            filter: ['==', ['get', 'type'], 'line-segment']
        });

        /**
         * 添加面测量结果图层
         */
        this.glManager.map.addLayer({
            id: this.id_layer_measrue_polygon,
            type: 'symbol',
            source: this.id_source_measure_symbol,
            layout: {
                "text-field": ['get', 'value'],
                'text-size': 18,
                'text-offset': [0, -1]
            },
            paint: {
                'text-color': 'black',
                'text-halo-color': 'white',
                'text-halo-width': 2
            },
            filter: ['==', ['get', 'type'], 'polygon']
        });

        /**
         * 添加面测量外侧线结果图层
         */
        this.glManager.map.addLayer({
            id: this.id_layer_measrue_polygon_line,
            type: 'symbol',
            source: this.id_source_measure_symbol,
            layout: {
                "text-field": ['get', 'value'],
                'text-size': 14,
                'text-offset': [0, -1]
            },
            paint: {
                'text-color': 'black',
                'text-halo-color': 'white',
                'text-halo-width': 2
            },
            filter: ['==', ['get', 'type'], 'polygon-line']
        });

        /**
         * 添加面测量外侧线段结果图层
         */
        this.glManager.map.addLayer({
            id: this.id_layer_measure_polygon_line_segment,
            type: 'symbol',
            source: this.id_source_measure_symbol,
            layout: {
                "text-field": ['get', 'value'],
                'text-size': 12,
                'text-offset': [0, -1]
            },
            paint: {
                'text-color': 'red',
                'text-halo-color': 'white',
                'text-halo-width': 2
            },
            filter: ['==', ['get', 'type'], 'polygon-line-segment']
        });

        this.units = {
            area: 'M2KM2',
            length: 'MKM'
        };
        this.precisions = new Map<Units.TUnitsLength | Units.TUnitsArea, number>([
            ['M', 1],
            ['KM', 2],
            ['M2', 2],
            ['MU', 2],
            ['KM2', 2]
        ]);

    }

    setVisible(visible: boolean) {
        [this.id_layer_measrue_point,
        this.id_layer_measrue_line,
        this.id_layer_measrue_line_segment,
        this.id_layer_measrue_polygon,
        this.id_layer_measrue_polygon_line,
        this.id_layer_measure_polygon_line_segment,
        this.id_layer_polygon_clockwise].forEach(id => {
            this.glManager.map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
        });
    }

    /**
     * 设置面方向符号
     * @param right 向右符号
     * @param left 向左符号
     */
    setDirectionSymbol(right: string = '▶', left: string = '◀') {
        this.glManager.map.setLayoutProperty(this.id_layer_polygon_clockwise, "text-field",
            ['case', ['boolean', ['get', 'clockwise'], true], right, left]
        );
    }


    /**
     * 设置或更新测量数据（该接口数据不自动渲染geometry）
     * @param fs
     */
    setFeature(f: TIdentityGeoJSONFeature) {
        const feature = JSON.parse(JSON.stringify(f));

        const existedFeature = this.customFeatures.find(x => x.properties.id === f.properties.id);

        if (existedFeature) {
            existedFeature.geometry = feature.geometry;
            existedFeature.properties = feature.properties;
        } else {
            this.customFeatures.push(feature);
        }

        this.renderMeasure();
    }

    /**
     * 删除测量数据
     * @param id 
     */
    removeFeature(id: string) {
        let feature = this.glManager.deleteById(id);

        const index = this.customFeatures.findIndex(x => x.properties.id === id);
        feature ??= this.customFeatures[index];
        this.customFeatures.splice(index, 1);

        this.renderMeasure();
        return feature;
    }

    /**
     * 设置单位，只应用units参数中有值的数据
     * @param units 
     * @returns 
     */
    setUnits(units: Partial<TMeasureUnits>) {
        let re = false;

        for (const p in units) {
            const u = (units as any)[p];
            if (u) {
                (this.units as any)[p] = u;
                re = true;
            }
        }

        if (re) this.renderMeasure();
    }

    /**
     * 设置单位精度
     * @param units 
     * @param precision
     */
    setPrecision(units: Units.TUnitsLength | Units.TUnitsArea, precision: number) {
        this.precisions.set(units, precision);
        this.renderMeasure();
    }

    /**
     * 设置是否显示面方向
     * @param val 
     */
    showPolygonDirection(val: boolean) {
        this.glManager.map.setFilter(this.id_layer_polygon_clockwise,
            val ? ['==', '$type', 'Polygon'] : ['==', '1', '0']);
    }

    /**
     * 显示面线数据
     * @param val 
     */
    showPolygonLine(val: boolean) {
        this.glManager.map.setFilter(this.id_layer_measrue_polygon_line,
            val ? ['==', ['get', 'type'], 'polygon-line'] : ['==', '1', '0']);
    }

    /**
     * 显示面线段数据
     * @param val 
     */
    showPolygonLineSegment(val: boolean) {
        this.glManager.map.setFilter(this.id_layer_measure_polygon_line_segment,
            val ? ['==', ['get', 'type'], 'polygon-line-segment'] : ['==', '1', '0']);
    }

    /**
     * 显示线线段数据
     * @param val 
     */
    showLineSegment(val: boolean) {
        this.glManager.map.setFilter(this.id_layer_measrue_line_segment,
            val ? ['==', ['get', 'type'], 'line-segment'] : ['==', '1', '0']);
    }

    /**
     * 重绘
     */
    renderMeasure() {
        const features = this.glManager.fc.features.concat(this.customFeatures);

        // 设置测量结果数据
        (this.glManager.map.getSource(this.id_source_measure_symbol)).setData({
            type: 'FeatureCollection',
            features: Measurement.cal(features, {
                polygon: {
                    measureLineStringOptions: {
                        withStart: false,
                        format: (len, i, end, segment) => {
                            let units = this.units.length;

                            if (units === 'MKM')
                                if (len > 1000) units = 'KM';
                                else units = 'M';

                            len = Units.convertLength(len, 'M', units);

                            return this.options.formats['polygon-line'](len, units, i, end, segment);
                        }
                    },
                    withLineString: true,
                    format: area => {
                        let units = this.units.area;

                        if (units === 'M2KM2')
                            if (area > 1000000) units = 'KM2';
                            else units = 'M2';

                        area = Units.convertArea(area, 'M2', units);

                        return this.options.formats.polygon(area, units);
                    }
                },
                lineString: {
                    format: (len, i, end, center) => {

                        let units = this.units.length;

                        if (units === 'MKM')
                            if (len > 1000) units = 'KM';
                            else units = 'M';

                        len = Units.convertLength(len, 'M', units);
                        
                        return this.options.formats.line(len, units, i, end, center);
                    }
                },
                point: {
                    format: p => {
                        return this.options.formats.point(p);
                    }
                }
            })
        });

        // 设置面方向数据
        (this.glManager.map.getSource(this.id_layer_polygon_clockwise)).setData({
            type: 'FeatureCollection',
            features: features.filter(x => x.geometry.type === 'Polygon').map(x => {
                return {
                    type: 'Feature',
                    geometry: x.geometry,
                    properties: {
                        ...x.properties,
                        clockwise: booleanClockwise((x.geometry as any).coordinates[0])
                    }
                }
            })
        });
    }
}
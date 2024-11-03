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

    /**
     * 是否进行面边界线的测量
     */
    private polygonDistance: boolean = true;

    /**
 * 测量id
 * 
 * 用于创建标注文字id
 */
    readonly id_layer_measure_symbol = Tools.uuid();

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

    constructor(dataSource: DrawManager | GeoJSONLayerManagerBase, options: MeasureOptions = {}) {
        this.glManager = dataSource instanceof DrawManager ? dataSource.glManager : dataSource;

        this.glManager.on('all', () => this.renderMeasure());

        this.glManager.addLayer(this.id_layer_measure_symbol);
        this.glManager.addLayer(this.id_layer_polygon_clockwise);

        /**
         * 添加测量数值图层
         */
        this.glManager.map.addLayer({
            id: this.id_layer_measure_symbol,
            type: 'symbol',
            source: {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            },
            layout: {
                "text-field": ['get', 'value'],
                'text-size': ['case',
                    ['boolean', ['get', 'center'], false], 12,
                    ['==', ['get', 'type'], 'Polygon'], 16, 14],
                'text-offset': [0, -1]
            },
            paint: {
                'text-color': ['case',
                    ['boolean', ['get', 'center'], false], 'red', 'black'],
                'text-halo-color': 'white',
                'text-halo-width': 2
            }
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
        }, this.id_layer_measure_symbol);

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
        this.glManager.map.setLayoutProperty(this.id_layer_measure_symbol, 'visibility', visible ? 'visible' : 'none');
        this.glManager.map.setLayoutProperty(this.id_layer_polygon_clockwise, 'visibility', visible ? 'visible' : 'none');
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
        this.glManager.map.setLayoutProperty(this.id_layer_polygon_clockwise, "visibility", val ? "visible" : 'none');
    }

    /**
     * 是否显示面的长度数据（边界线的测量）
     * @param val 
     */
    showPolygonDistance(val: boolean) {
        this.polygonDistance = val;
        this.renderMeasure();
    }

    /**
     * 显示段数据
     * @param val 
     */
    showSegment(val: boolean) {
        this.glManager.map.setFilter(this.id_layer_measure_symbol,
            val ? undefined : ['!', ['boolean', ['get', 'center'], false]]);
    }

    /**
     * 重绘
     */
    renderMeasure() {
        const features = this.glManager.fc.features.concat(this.customFeatures);

        // 设置测量结果数据
        (this.glManager.map.getSource(this.id_layer_measure_symbol)).setData({
            type: 'FeatureCollection',
            features: Measurement.cal(features, {
                polygon: {
                    measureLineStringOptions: {
                        withStart: false,
                        format: (len, i, end, center) => {
                            let units = this.units.length;

                            if (units === 'MKM')
                                if (len > 1000) units = 'KM';
                                else units = 'M';

                            len = Units.convertLength(len, 'M', units);
                            const val = len.toFixed(this.precisions.get(units)) + ` ${Units.unitsLengthDescriptions.find(x => x.value === units)?.label}`;
                            return end ? `终点: ${val}` : val;
                        }
                    },
                    withLineString: this.polygonDistance,
                    format: area => {
                        let units = this.units.area;

                        if (units === 'M2KM2')
                            if (area > 1000000) units = 'KM2';
                            else units = 'M2';

                        area = Units.convertArea(area, 'M2', units);

                        const val = area.toFixed(this.precisions.get(units)) + ` ${Units.unitsAreaDescriptions.find(x => x.value === units)?.label}`;
                        return val;
                    }
                },
                lineString: {
                    format: (len, i, end, center) => {

                        let units = this.units.length;

                        if (units === 'MKM')
                            if (len > 1000) units = 'KM';
                            else units = 'M';

                        len = Units.convertLength(len, 'M', units);
                        const val = len.toFixed(this.precisions.get(units)) + ` ${Units.unitsLengthDescriptions.find(x => x.value === units)?.label}`;
                        return val;
                    }
                },
                point: {
                }
            })
        });

        // 设置方向数据
        (this.glManager.map.getSource(this.id_layer_polygon_clockwise)).setData({
            type: 'FeatureCollection',
            features: features.map(x => {
                if (x.geometry.type === 'Polygon') {
                    (x.properties as any).clockwise = booleanClockwise(x.geometry.coordinates[0]);
                }
                return x;
            })
        });
    }
}
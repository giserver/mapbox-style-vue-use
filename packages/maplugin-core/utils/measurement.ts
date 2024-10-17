import proj4 from "proj4";
import calCenter from '@turf/center'

export namespace Measurement {
    /**
     * 计算长度
     * @param value 
     */
    export function length(value: Array<[number, number]>): number;

    /**
     * 计算长度
     * @param value Geometry
     * @param projExpression proj4 投影参数 {@link http://proj4js.org/}，也可以在 {@link https://epsg.io/} 中获取
     */
    export function length(value: GeoJSON.Geometry, projExpression?: string | ((coordinates: GeoJSON.Position[]) => string)): number;
    export function length(value: GeoJSON.Geometry | Array<[number, number]>, projExpression?: string | ((coordinates: GeoJSON.Position[]) => string)): number {
        if (value instanceof Array) {
            return value.reduce((p, c, i) => {
                return i === value.length - 1 ?
                    p :
                    p + Math.sqrt(Math.pow(c[0] - value[i + 1][0], 2) + Math.pow(c[1] - value[i + 1][1], 2));
            }, 0);
        }

        // 默认坐标系为4549，中央精度使用多边形最小值，变形最小
        projExpression ??= (coordinates: GeoJSON.Position[]) => {
            const lon_0 = coordinates.reduce((p, c) => Math.min(c[0], p), Number.MAX_VALUE);
            return `+proj=tmerc +lat_0=0 +lon_0=${lon_0} +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs`;
        }

        if (value.type === 'Point' || value.type === "MultiPoint") return 0;

        function calSingleLineLength(coordinates: GeoJSON.Position[]) {
            const toProjection = typeof projExpression === 'string' ? projExpression : projExpression!(coordinates);
            const proj_coords = coordinates.map(x => proj4(toProjection, x));
            return length(proj_coords as any);
        }

        if (value.type === 'LineString') return calSingleLineLength(value.coordinates);
        if (value.type === 'MultiLineString' || value.type === 'Polygon') return value.coordinates.reduce((p, c) => p + calSingleLineLength(c), 0);
        if (value.type === 'MultiPolygon') return value.coordinates.reduce((p, c) => p + c.reduce((p1, c1) => p1 + calSingleLineLength(c1), 0), 0);

        return value.geometries.reduce((p, c) => p + length(c, projExpression), 0);
    }


    /**
     * 计算环形闭合围成多边形的面积
     * @param value 
     */
    export function area(value: Array<[number, number]>): number;

    /**
     * 计算地理多边形面积
     * @param value 面或者多面
     * @param projExpression  proj4 投影参数 {@link http://proj4js.org/}，也可以在 {@link https://epsg.io/} 中获取
     * @returns 
     */
    export function area(value: GeoJSON.Polygon | GeoJSON.MultiPolygon, projExpression?: string | ((coordinates: GeoJSON.Position[]) => string)): number;
    export function area(value: GeoJSON.Polygon | GeoJSON.MultiPolygon | Array<[number, number]>, projExpression?: string | ((coordinates: GeoJSON.Position[]) => string)): number {
        if (value instanceof Array) {
            if (value.length < 3) return 0;

            let sum = 0;

            for (let i = 0; i < value.length; i++) {
                const current = value[i];
                const next = i === value.length - 1 ? value[0] : value[i + 1];

                sum += current[0] * next[1] - current[1] * next[0];
            }

            return Math.abs(0.5 * sum);
        }

        // 默认坐标系为4549，中央精度使用多边形最小值，变形最小
        projExpression ??= (coordinates: GeoJSON.Position[]) => {
            const lon_0 = coordinates.reduce((p, c) => Math.min(c[0], p), Number.MAX_VALUE);
            return `+proj=tmerc +lat_0=0 +lon_0=${lon_0} +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs +type=crs`;
        }

        /**
         * 计算封闭多边形面积
         * @param coordinates 
         * @returns 
         */
        function calClosedPolygon(coordinates: GeoJSON.Position[]): number {
            const toProjection = typeof projExpression === 'string' ? projExpression : projExpression!(coordinates);
            const proj_coords = coordinates.map(x => proj4(toProjection, x));
            return area(proj_coords as any);
        }

        /**
         * 计算单个多边形面积
         * @param coordinates 
         * @returns 
         */
        function calSinglePolygon(coordinates: GeoJSON.Position[][]): number {
            return coordinates.reduce<number>((p, c) => {
                const currentArea = calClosedPolygon(c);
                return p === Number.MIN_VALUE ? currentArea : p - currentArea;
            }, Number.MIN_VALUE);
        }

        return value.type === 'MultiPolygon' ?
            value.coordinates.reduce((p, c) => p + calSinglePolygon(c), 0) :
            calSinglePolygon(value.coordinates);
    }

    /**
    * 测量标记属性
    */
    type TMeasureProperties = {
        /**
         * 测量显示数据
         */
        value: string,

        /**
         * 是否为中间值
         * 
         * 线测量中的线段数据
         */
        center?: boolean,

        /**
         * 测量类型
         */
        type: "point" | "line" | "polygon"
    }

    type TMeasureMarkerFeature = GeoJSON.Feature<GeoJSON.Point, TMeasureProperties>;

    /**
     * 点测量计算参数
     */
    type TMeasureCalPointOptions = {
        /**
         * 经纬度格式化
         * @param position 经纬度 lng=position[0] lat=position[1]
         */
        format?(position: GeoJSON.Position): string
    }

    /**
     * 线测量计算参数
     */
    type TMeasureCalLineStringOptions = {
        /**
         * 长度格式化
         * @param length 长度数值
         * @param index 标点下标
         * @param end 是否为最后一个
         * @param center 是否为中间数值
         */
        format?(length: number, index: number, end: boolean, center: boolean): string,

        /**
         * 是否包含第一个数值
         * 
         * 如果计算圆环数据时 防止最后一个数据被第一个数据压盖
         */
        withStart?: boolean
    }

    type TMeasureCalPolygonOptions = {
        format?(area: number): string,
        withLineString?: boolean,
        measureLineStringOptions?: TMeasureCalLineStringOptions,
    }

    /**
     * 测量计算参数
     */
    type TMeasureCalOptions = {
        point?: TMeasureCalPointOptions,
        lineString?: TMeasureCalLineStringOptions,
        polygon?: TMeasureCalPolygonOptions
    }

    function calPoint(g: GeoJSON.Position, options?: TMeasureCalPointOptions): TMeasureMarkerFeature[] {
        const value = options?.format?.(g) || `${g[0].toFixed(6)} , ${g[1].toFixed(6)}`;
        return [{
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: g
            },
            properties: {
                value,
                type: 'point'
            }
        }]
    }

    function calLineString(g: GeoJSON.Position[], options?: TMeasureCalLineStringOptions): TMeasureMarkerFeature[] {
        const ret = new Array<TMeasureMarkerFeature>();
        let sumLength = 0;

        for (let i = 0; i < g.length; i++) {
            const current = g[i];

            if (i > 0) {
                const last = g[i - 1];
                const line: GeoJSON.Feature<GeoJSON.LineString> = { type: 'Feature', geometry: { type: 'LineString', coordinates: [last, current] }, properties: {} };
                const l = length(line.geometry);
                const c = calCenter(line);

                sumLength += l;

                ret.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: c.geometry.coordinates
                    },
                    properties: {
                        value: options?.format?.(l, i, false, true) || `${l.toFixed(2)} m`,
                        center: true,
                        type: 'line'
                    }
                });
            }

            // 不记录第一个点 0 数值
            if (options?.withStart === false && i === 0) continue;

            ret.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: current
                },
                properties: {
                    value: options?.format?.(sumLength, i, i === g.length - 1, false) || `${sumLength.toFixed(2)} m`,
                    type: 'line'
                }
            });
        }

        return ret;
    }

    function calPolygon(g: GeoJSON.Position[][], options?: TMeasureCalPolygonOptions): TMeasureMarkerFeature[] {
        const ret = new Array<TMeasureMarkerFeature>();

        if (options?.withLineString !== false) {
            g.forEach(x => {
                ret.push(...calLineString(x, options?.measureLineStringOptions));
            });
        }

        if (g[0].length > 3) {
            const polygon: GeoJSON.Feature<GeoJSON.Polygon> = { type: 'Feature', geometry: { type: 'Polygon', coordinates: g }, properties: {} };
            const center = calCenter(polygon);
            const a = area(polygon.geometry);

            ret.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: center.geometry.coordinates
                },
                properties: {
                    value: options?.format?.(a) || `${a.toFixed(2)} m²`,
                    type: 'polygon'
                }
            })
        }

        return ret;
    }

    function calGeometry(g: GeoJSON.Geometry, options?: TMeasureCalOptions): TMeasureMarkerFeature[] {
        if (g.type === 'Point') return calPoint(g.coordinates, options?.point);
        if (g.type === 'LineString') return calLineString(g.coordinates, options?.lineString);
        if (g.type === 'Polygon') return calPolygon(g.coordinates, options?.polygon);

        function calMulGeometry<T>(data: Array<T>, cal: (d: T, options?: any) => TMeasureMarkerFeature[], options: any): TMeasureMarkerFeature[] {
            return data.reduce((p, c) => {
                return p.concat(cal(c, options));
            }, new Array<TMeasureMarkerFeature>());
        }

        if (g.type === 'MultiPoint') return calMulGeometry(g.coordinates, calPoint, options?.point);
        if (g.type === 'MultiLineString') return calMulGeometry(g.coordinates, calLineString, options?.lineString);
        if (g.type === 'MultiPolygon') return calMulGeometry(g.coordinates, calPolygon, options?.polygon);

        throw new Error(`not suppose geometry type: ${g.type} to measure`);
    }

    /**
     * 根据地理数据计算测量数据
     * @param data 地理数据
     * @param options 计算参数
     * @returns 
     */
    export function cal(data: GeoJSON.Feature | GeoJSON.Feature[] | GeoJSON.Geometry, options?: TMeasureCalOptions) {
        if (data instanceof Array) {
            return data.reduce((p, c) => {
                const features = calGeometry(c.geometry, options);

                // 将父级id写入测量数据feature，如：测量线的距离文字实现点击文字获取线数据
                features.forEach(f => (f.properties as any).id = (c.properties as any).id);
                return p.concat(features);
            }, new Array<TMeasureMarkerFeature>());
        }

        if (data.type === 'Feature')
            return calGeometry(data.geometry, options);

        return calGeometry(data, options);
    }
}


import { IMap, TIdentityGeoJSONFeature } from "../types";
import { Tools } from "../utils/tools";

export type TFeatureEvent = "all" | "add" | "update" | "delete" | "clear" | "destory";

export interface GeoJSONLayerManagerOptions<TMap extends IMap = IMap, TFeature extends TIdentityGeoJSONFeature = TIdentityGeoJSONFeature> {
    map: TMap;
    data: Array<TFeature>;
}

export abstract class GeoJSONLayerManagerBase<TMap extends IMap = IMap, TFeature extends TIdentityGeoJSONFeature = TIdentityGeoJSONFeature> {
    private events = new Map<string, Array<(e: { features?: TFeature[] }) => void>>();
    protected readonly layers = new Array<string>();
    protected data = new Map<string, TFeature>();
    protected hiddenData = new Map<string, TFeature>();

    readonly map: TMap;
    readonly source: string = Tools.uuid();

    /**
     * 数据重组成GeoJSON格式
     */
    get fc() {
        return {
            type: 'FeatureCollection',
            features: Array.from(this.data.values())
        } as Readonly<GeoJSON.FeatureCollection>;
    }

    constructor(options: GeoJSONLayerManagerOptions<TMap, TFeature>) {
        this.map = options.map;
        options.data.forEach(f => {
            this.data.set(f.properties.id, f);
        });

        this.map.addSource(this.source, {
            type: 'geojson',
            data: this.fc,
            promoteId: 'id'
        });
    }

    protected abstract onChange(mode: TFeatureEvent, features?: TFeature[]): void;

    /**
     * 获取数据
     * @param id 
     * @returns 
     */
    query(id: string): TFeature | undefined {
        return this.data.get(id);
    }

    /**
     * 添加图层
     * @param layer 
     */
    addLayer(layer: any) {
        if (typeof layer === 'string') {
            this.layers.push(layer);
        } else {
            this.map.addLayer({ ...layer, source: this.source } as any);
            this.layers.push(layer.id);
        }
    }

    /**
     * 创建数据
     * @param features 
     */
    add(...features: TFeature[]) {
        features.forEach(f => {
            this.data.set(f.properties.id, f);
        });
        this.triggerEvents("add", features);

        return features;
    }

    /**
     * 更新数据
     * @param feature 
     */
    update(...feature: TFeature[]) {
        feature.forEach(f => {
            this.data.set(f.properties.id, f);
        });

        this.triggerEvents("update", feature)
    }

    deleteById(id: string) {
        const feature = this.data.get(id);

        if (feature) {
            this.data.delete(id);
            this.triggerEvents("delete", [feature])
        }

        return feature;
    }

    /**
     * 删除数据
     * @param feature 
     */
    delete(...feature: TFeature[]) {
        feature.forEach(f => {
            this.data.delete(f.properties.id);
        });
        this.triggerEvents("delete", feature);
    }

    /**
     * 清除数据
     */
    clear() {
        this.data.clear();
        this.triggerEvents("clear", []);
    }

    /**
     * 卸载
     */
    destroy() {
        this.data.clear();
        this.triggerEvents("destory", []);

        this.layers.forEach(l => {
            this.map.removeLayer(l);
        });

        this.map.removeSource(this.source);
    }

    /**
     * 设置Feature隐藏
     * @param id
     * @returns 
     */
    setFeatureHidden(...id: string[]) {
        const fs = new Array<TFeature>();
        id.forEach(i => {
            const f = this.data.get(i);
            if (!f) return;

            // 如果已经隐藏，则不处理
            if (this.hiddenData.has(i)) return;

            // 处理隐藏
            this.data.delete(i)
            this.hiddenData.set(i, f);
            fs.push(f);
        });

        this.onChange("delete", fs);
    }

    /**
     * 
     * @param id 当id为空时清除所有隐藏
     */
    clearFeatureHidden(...id: string[]) {
        const fs = new Array<TFeature>();
        if (id.length === 0)
            id.forEach(i => {
                const f = this.hiddenData.get(i);
                if (!f) return;

                this.hiddenData.delete(i);
                this.data.set(i, f);
                fs.push(f);
            });
        else {
            this.hiddenData.forEach((v, k) => {
                this.data.set(k, v);
                fs.push(v);
            });
            this.hiddenData.clear();
        }

        this.onChange('add', fs);
    }

    /**
     * 设置是否显示
     * @param visible 
     */
    setVisible(visible: boolean) {
        this.layers.forEach(l => {
            this.map.setLayoutProperty(l, 'visibility', visible ? 'visible' : 'none');
        });
    }

    /**
     * 挂在事件
     * @param mode 
     * @param callback 
     */
    on(mode: TFeatureEvent, callback: (e: { features?: TFeature[] }) => void) {
        if (!this.events.has(mode))
            this.events.set(mode, [callback]);
        else
            this.events.get(mode)!.push(callback);
    }

    /**
     * 此方法会触发 map.source.setData 完整更新
     * 
     * maplibre更新部分数据时，最好使用 updata 方法
     * 
     * 此类 add update delete clear 方法使用onChange去执行更新
     */
    reRender() {
        (this.map.getSource(this.source) as any).setData(this.fc);
    }

    private triggerEvents(mode: TFeatureEvent, features: TFeature[]) {
        // 执行内部事件
        this.onChange(mode, features);

        // 执行外部事件
        const events = this.events.get(mode);
        events?.forEach(e => {
            e({ features });
        });

        this.events.get('all')?.forEach(e => {
            e({ features });
        })
    }
}
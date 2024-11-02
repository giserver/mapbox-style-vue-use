import { IMap } from '../types';
import { CONTRACT_STRINGS } from '../contracts';

export default class StyleProxy {

    private cacheLayers = new Array<any>();

    private customLayers = new Array<any>();
    private customSources = new Map<string, any>();

    constructor(private map: IMap) {
        map.on('style.load', () => {
            // 清空代理
            (this.map as any)[CONTRACT_STRINGS.MAP_LAYER_PROXY_SYMBOL] = {};

            // 缓存 初始style中的layer
            this.cacheLayers = map.getStyle().layers;

            // 添加自定义source
            this.customSources.forEach((v, k) => {
                // 确保source没有被添加, mapbox-gl-draw 会在load之前被添加
                if (!map.getSource(k))
                    map.addSource(k, v)
            });
            // 添加自定义layer
            this.customLayers.forEach(l => {
                // 确保layer没有被添加, mapbox-gl-draw 会在load之前被添加
                if (!map.getLayer(l.id))
                    map.addLayer(l)
            });
        })
    }

    setStyle(style: string) {
        this.customLayers = new Array<any>();
        this.customSources = new Map<string, any>();

        this.map.getStyle().layers.forEach((l: any) => {
            if (this.cacheLayers.some(cl => cl.id === l.id))
                return;

            this.customLayers.push(l);
            const sourceId = (l as any).source as string;

            if (!this.customSources.get(sourceId))
                this.customSources.set(sourceId, (this.map.getSource(sourceId) as any).serialize())
        })

        this.map.setStyle(style);
    }
}
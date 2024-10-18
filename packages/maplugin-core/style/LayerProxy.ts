import { ref, Ref, watch } from 'vue';

export class LayerProxy<TLayer>{
    private readonly proxy: Ref<TLayer>;

    constructor(map: any, layer: TLayer) {
        const l = layer as any;
        
        if (!l['paint']) l['paint'] = {};
        if (!l['layout']) l['layout'] = {};

        this.proxy = ref(layer) as any;

        watch(() => (this.proxy.value as any)['paint'], (a: { [x: string]: any; }) => {
            for (let p in a) {
                map.setPaintProperty((this.proxy.value as any)['id'], p, a[p]);
            }
        }, { deep: true });

        watch(() => (this.proxy.value as any)['layout'], (a: { [x: string]: any; }) => {
            for (let p in a) {
                map.setLayoutProperty((this.proxy.value as any)['id'], p, a[p]);
            }
        }, { deep: true });
    }

    get value(): TLayer {
        return this.proxy.value;
    }

    toJSON(){
        return this.proxy.value;
    }
}
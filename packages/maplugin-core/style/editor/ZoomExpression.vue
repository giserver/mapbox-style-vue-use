<template>
    <ZoomSlider v-model:active-mark-zoom="activeMarkZoom" v-model:marks="marks" :configs="(configs as any)" :map="map"
        :min-zoom="minZoom" :max-zoom="maxZoom" :slider-width="sliderWidth">
        <template #symbol="{ mark }">
            <slot name="symbol" :mark="mark"></slot>
        </template>
    </ZoomSlider>

    <slot name="controller" :mark="marks[activeMarkZoom]!"></slot>
</template>

<script setup lang="ts" generic="T">
import { reactive, ref, watch } from 'vue';
import ZoomSlider, { TZoomSliderOptions } from './ZoomSlider.vue';

type TMark = {
    [K in keyof T]: any
}
type TOptions = Omit<Omit<TZoomSliderOptions<TMark>, "activeMarkZoom">, "marks"> & {
    type : "linear"
    value: T
};

const props = defineProps<TOptions>();
const activeMarkZoom = ref<number>(1);
const marks = reactive<Array<TMark | undefined>>([]);

// 数据初始化
for (let k in props.configs) {
    const v = props.value[k];
    
    // 如果有线性渐变配置，则使用配置
    if (v instanceof Array && v[0] === 'interpolate' && v[1] === 'linear' && v[2] === 'zoom') {
        
        // 从第四个数据开始，zoom 和 value 交错
        // ['interpolate', 'linear', 'zoom', 5, '#ff0000', 14, '#00ff00']
        // zoom < 5       #ff000
        // 5 <= zoom < 14 #00ff00 过度到 #00ff00
        // zoom >= 14     #00ff00
        for (let i = 3; i < v.length; i += 2) {
            const zoom = v[i];
            const value = v[i + 1];

            if (!marks[zoom]) marks[zoom] = {} as any;
            (marks[zoom] as any)[k] = value;
            
            // TODO 重新考虑默认active值，目前采用非zoom=1的zoom值，但是原本数据中就有zoom=1的情况需要考虑
            if (activeMarkZoom.value === 1) {
                activeMarkZoom.value = zoom;
            }
        }
    } else { // 如果没有线性渐变，则设置zoom=1的默认值
        marks[1] = {} as any;
        for (const k in props.configs) {
            (marks[1] as any)[k] = props.configs[k]!.defaultValue;
        }
    }
}

// 重组线性渐变数据
watch(marks, () => {
    let values = {} as any;
    for (let k in props.configs) {
        values[k] = ['interpolate', ['linear'], ['zoom']] as any;
    }

    marks.forEach((m, zoom) => {
        if (!m) return;

        for (let k in m) {
            let v = m[k];

            if (((props.configs as any)[k]).valueConverter)
                v = ((props.configs as any)[k]).valueConverter(v);

            values[k].push(zoom, v);
        }
    });

    for (let k in values) {
        (props.value as any)[k] = values[k];
    }
});


</script>

<style scoped></style>
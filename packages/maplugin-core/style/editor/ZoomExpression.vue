<template>
    <ZoomSlider v-model:active-mark-zoom="activeMarkZoom" v-model:marks="marks" :configs="(configs as any)" :map="map"
        :min-zoom="minZoom" :max-zoom="maxZoom" :slider-width="sliderWidth">
        <template #symbol="{ mark }">
            <slot name="symbol" :mark="mark"></slot>
        </template>

        <template #controller="{ mark }">
            <slot name="controller" :mark="mark"></slot>
        </template>
    </ZoomSlider>
</template>

<script setup lang="ts" generic="T">
import { reactive, ref, watch } from 'vue';
import ZoomSlider, { TZoomSliderOptions } from './ZoomSlider.vue';

type TMark = {
    [K in keyof T]: any
}

type TOptions = Omit<Omit<TZoomSliderOptions<TMark>, "activeMarkZoom">, "marks"> & {
    value: T
};
const props = withDefaults(defineProps<TOptions>(), {
    minZoom: 1,
    maxZoom: 22,
    sliderWidth: 300,
    activeMarkZoom: 1
});


const activeMarkZoom = ref<number>(1);
const marks = reactive<Array<TMark | undefined>>([]);

// 数据初始化
for (let k in props.configs) {
    const v = props.value[k];
    if (v instanceof Array && v[0] === 'interpolate' && v[1] === 'linear' && v[2] === 'zoom') {
        for (let i = 3; i < v.length; i += 2) {
            const zoom = v[i];
            const value = v[i + 1];

            if (!marks[zoom]) marks[zoom] = {} as any;
            (marks[zoom] as any)[k] = value;

            if (activeMarkZoom.value === 1) {
                activeMarkZoom.value = zoom;
            }
        }
    } else {
        marks[1] = {} as any;
        for (const k in props.configs) {
            (marks[1] as any)[k] = props.configs[k]!.defaultValue;
        }
    }
}

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
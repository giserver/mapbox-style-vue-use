<template>
    <Map v-on:mapLoad="handleMapLoad"></Map>
    <div style="">
        <ZoomExpression v-if="loaded" :map="map" type="linear"
            :value="map.getLayerProxy<maplibregl.LineLayerSpecification>('china-line').value.paint!" :configs="{
                'line-color': {
                    defaultValue: '#ff0000',
                    valueConverter: v => v
                },
                'line-width': {
                    defaultValue: 3,
                    valueConverter: v => parseInt(v)
                }
            }">
            <template #symbol="{ mark }">
                <div
                    :style="{ height: '20px', width: mark['line-width'] + 'px', backgroundColor: mark['line-color'], transform: 'rotate(30deg)' }">
                </div>
            </template>

            <template #controller="{ mark }">
                <div>
                    <label for="line-color">线颜色</label>
                    <input id="line-color" type="color" v-model="mark['line-color']">
                </div>

                <div>
                    <label for="line-width">线宽</label>
                    <input id="line-width" type="range" min="1" max="10" step="1" v-model="mark['line-width']">
                </div>
            </template>
        </ZoomExpression>
    </div>

</template>

<script setup lang="ts">
import { ref } from 'vue';
import Map from './Map.vue';
import '../index';
import { ZoomExpression } from '../index';

let map: maplibregl.Map;
const loaded = ref(false);

function handleMapLoad(m: maplibregl.Map) {
    map = m;
    map.addLayer({
        id: "china-line",
        type: 'line',
        source: {
            type: 'geojson',
            data: "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json"
        }
    });

    loaded.value = true;
}
</script>

<style>
.zoom-slider {
    line-height: normal;
}
</style>
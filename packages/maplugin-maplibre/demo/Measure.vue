<template>
    <Map :onMapLoad="onMapLoad"></Map>

    <div class="controls" v-if="measure !== null">
        <button @click="measure.start('Point')">点测量</button>
        <button @click="measure.start('LineString')">线测量</button>
        <button @click="measure.start('Polygon')">面测量</button>
        <button @click="measure.clear()">清除</button>
    </div>
</template>

<script setup lang="ts">
import Map from './Map.vue';
import {GeoJSONLayerManager} from '../geoJSONlayerManager';
import {MeasureManager} from '@maplugin/core';

let measure : MeasureManager;

function onMapLoad(map: maplibregl.Map) {
    const glManager = new GeoJSONLayerManager(map, []);
    measure = new MeasureManager(glManager, {});  
    console.log(12321);
}
</script>
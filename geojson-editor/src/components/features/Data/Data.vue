<template>
    <div class="data">
        <IO :onUpload="onUpload" :onDownload="onDownload"></IO>
        <Drawer :drawManager="drawManager"></Drawer>
    </div>
</template>

<script setup lang="ts">
import IO from './IO.vue';
import Drawer from './Drawer.vue';
import { DrawManager, TIdentityGeoJSONFeature } from '../../../../../packages/maplugin-maplibre';

defineProps<{
    onUpload(features: Array<TIdentityGeoJSONFeature>): void,
    onDownload(): GeoJSON.FeatureCollection,
    drawManager: DrawManager
}>();

</script>

<style scoped>
.data {
    display: flex;
    gap: 8px;
}
</style>
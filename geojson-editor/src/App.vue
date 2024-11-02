<template>
    <div class="container">
        <Map class="map" :onMapLoad="handleMapLoaded"></Map>
        <div class="editor">
            <FeatureCollectionEditor :fc="fc"></FeatureCollectionEditor>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Component, createApp, ref } from 'vue';
import Map from '../../packages/maplugin-maplibre/demo/Map.vue';
import Drawer from '../components/features/Drawer.vue';
import Measurer from '../components/features/Measurer.vue';
import FeatureCollectionEditor from '../components/features/FeatureCollectionEditor.vue';

import { DrawManager, GeoJSONLayerManager, MeasureManager } from '../../packages/maplugin-maplibre';
import { TIdentityGeoJSONFeature } from '../../packages/maplugin-core/types';

const fc = ref<GeoJSON.FeatureCollection>({
    type: 'FeatureCollection',
    features: []
});
let glManager: GeoJSONLayerManager;

function handleMapLoaded(map: maplibregl.Map) {
    map.setCenter([121, 31]);
    map.setZoom(8);
    map.addLayer({
        id: "world-raster",
        type: 'raster',
        source: {
            type: 'raster',
            tiles: ["https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"]
        }
    });

    glManager = new GeoJSONLayerManager(map, new Array<TIdentityGeoJSONFeature>());
    glManager.on('all', () => {
        fc.value = glManager.fc;
    });

    createMapControl(map, Drawer, { drawManager: new DrawManager(glManager, {}) });
    createMapControl(map, Measurer, { measureManager: new MeasureManager(glManager, {}) });
}

function createMapControl(map: maplibregl.Map, component: Component, data?: Record<string, unknown>, position: maplibregl.ControlPosition = 'top-right') {
    const div = document.createElement('div');
    div.classList.add("maplibregl-ctrl");

    createApp(component, data).mount(div);

    map.addControl({
        onAdd() {
            return div;
        },
        onRemove() {
            div.remove();
        }
    }, position);
}
</script>

<style scoped>
.container {
    height: 100%;
    width: 100%;
    display: flex;
}

.map {
    height: 100vh !important;
    flex: 1;
}

.editor {
    height: 100vh !important;
    width: 30%;
}
</style>
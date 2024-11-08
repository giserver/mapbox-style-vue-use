<template>
    <div class="container">
        <Map class="map" :onMapLoad="handleMapLoaded"></Map>
        <div class="editor" :class="{ hidden: !StoreEditor.show.value }">
            <FeatureCollectionEditor :fc="fc"></FeatureCollectionEditor>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Component, createApp, ref } from 'vue';
import Map from '../../packages/maplugin-maplibre/demo/Map.vue';
import Drawer from './components/features/Drawer.vue';
import Measurer from './components/features/Measurer.vue';
import FeatureCollectionEditor from './components/features/FeatureCollectionEditor.vue';
import ShowEditorButton from './components/features/ShowEditorButton.vue';
import IO from './components/features/IO.vue';

import { DrawManager, GeoJSONLayerManager, MeasureManager, TIdentityGeoJSONFeature, MiddleButtonRoate, VertexEditor } from '../../packages/maplugin-maplibre';
import { StoreEditor } from './stores';

import img_marker from './assets/map-marker.png?url';

const fc = ref<GeoJSON.FeatureCollection>({
    type: 'FeatureCollection',
    features: []
});

function handleMapLoaded(map: maplibregl.Map) {
    map.setCenter([121, 31]);
    map.setZoom(8);
    map.addLayer({
        id: "world-raster",
        type: 'raster',
        source: {
            type: 'raster',
            maxzoom: 19,
            tiles: ["https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"]
        }
    });

    // 中键旋转
    new MiddleButtonRoate(map);

    const glManager = new GeoJSONLayerManager(map, new Array<TIdentityGeoJSONFeature>());
    glManager.on('all', () => {
        fc.value = glManager.fc;
    });
    const drawManager = new DrawManager(glManager);
    const measureManager = new MeasureManager(glManager);
    const vertexEditor = new VertexEditor(map);


    map.loadImage(img_marker).then((img) => {
        map.addImage("marker", img.data);

        map.getLayerProxy<maplibregl.CircleLayerSpecification>(drawManager.id_layer_point).value.layout!['visibility'] = 'none';
        map.getLayerProxy<maplibregl.SymbolLayerSpecification>(measureManager.id_layer_measrue_point).value.layout!['text-offset'] = [0, 1];

        const layout = map.getLayerProxy<maplibregl.SymbolLayerSpecification>(drawManager.id_layer_point_symbol).value.layout!;
        layout['icon-image'] = 'marker'
        layout['icon-size'] = 0.3;
        layout['icon-anchor'] = 'bottom';
    });

    map.on('click', [
        drawManager.id_layer_polygon,
        drawManager.id_layer_polygon_circle,
        drawManager.id_layer_polygon_outline,
        drawManager.id_layer_line,
        drawManager.id_layer_line_circle,
        drawManager.id_layer_point,
        drawManager.id_layer_point_symbol], ({ features }) => {
            if (drawManager.drawing || !features || features.length === 0) return;
            const f = glManager.query((features[0].properties as any)['id']);
            if (f) {
                glManager.setFeatureHidden(f.properties.id);

                vertexEditor.setFeature(f, (id, g) => {
                    glManager.clearFeatureHidden(id);

                    const featrue = glManager.query(id)!;
                    featrue.geometry = g;
                    glManager.update(featrue);
                });
            }
        });

    createMapControl(map, ShowEditorButton);
    createMapControl(map, IO, {
        onUpload: (features: Array<TIdentityGeoJSONFeature>) => glManager.add(...features),
        onDownload: () => glManager.fc
    });
    createMapControl(map, Drawer, { drawManager }, 'top-left');
    createMapControl(map, Measurer, { measureManager }, 'top-left');
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

.editor.hidden {
    display: none;
}
</style>
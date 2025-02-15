<template>
    <div class="container">
        <Map class="map" :onMapLoad="handleMapLoaded"></Map>
        <div class="editor" :class="{ hidden: !StoreEditor.show.value }">
            <FeatureCollectionEditor :fc="fc"></FeatureCollectionEditor>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { createMapControl, createMapPopup } from './utils';

import Map from '../../packages/maplugin-maplibre/demo/Map.vue';
import Measurer from './components/features/Measurer.vue';
import FeatureCollectionEditor from './components/features/FeatureCollectionEditor.vue';
import ShowEditorButton from './components/features/ShowEditorButton.vue';
import Data from './components/features/Data/Data.vue';
import ToggleButton from './components/base/ToggleButton.vue';
import DataDetail from './components/features/DataDetail.vue';

import { DrawManager, GeoJSONLayerManager, MeasureManager, TIdentityGeoJSONFeature, MiddleButtonRoate, VertexEditor, useCamera } from '../../packages/maplugin-maplibre';
import { StoreEditor } from './stores';

import img_marker from './assets/map-marker.png?url';

const fc = ref<GeoJSON.FeatureCollection>({
    type: 'FeatureCollection',
    features: []
});

const { camera, setMap } = useCamera({
    center: [0, 0],
    bearing: 0,
    pitch: 0,
    zoom: 1
});

watch(camera, a => {
    const c = `${a.zoom.toFixed(2)}/${a.center.lng.toFixed(5)}/${a.center.lat.toFixed(5)}/${a.bearing.toFixed(1)}/${a.pitch.toFixed(0)}`;
    const url = window.location.href.split('#camera=')[0] + "#camera=" + c;
    history.pushState({}, '', new URL(url));
});

function handleMapLoaded(map: maplibregl.Map) {
    const c = window.location.hash.split('#camera=')[1];
    if (c) {
        const [zoom, lng, lat, bearing, pitch] = c.split('/').map(x => parseFloat(x));
        if (zoom) map.setZoom(zoom);
        if (lng && lat) map.setCenter([lng, lat]);
        if (bearing) map.setBearing(bearing);
        if (pitch) map.setPitch(pitch);
    } else {
        map.setCenter([121, 31]);
        map.setZoom(8);
    }

    map.addLayer({
        id: "world-raster",
        type: 'raster',
        source: {
            type: 'raster',
            maxzoom: 19,
            tiles: ["https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"]
        }
    });
    setMap(map);

    // 中键旋转
    new MiddleButtonRoate(map);

    const glManager = new GeoJSONLayerManager<TIdentityGeoJSONFeature>(map, [
        {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [
                            121.20015593197513,
                            31.646326873778108
                        ],
                        [
                            121.21262716876038,
                            31.636886722815902
                        ],
                        [
                            121.22128404677903,
                            31.644328677177043
                        ],
                        [
                            121.20797723212729,
                            31.654153282119196
                        ],
                        [
                            121.20015593197513,
                            31.646326873778108
                        ]
                    ]
                ]
            },
            "properties": {
                "id": "09cd7939-9a47-4318-aeeb-64b8f2ed7ff4"
            }
        }
    ]);

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
        drawManager.id_layer_point_symbol], ({ features, lngLat }) => {
            if (drawManager.drawing || !features || features.length === 0) return;
            const f = glManager.query((features[0].properties as any)['id']);
            if (f) {
                const popup = createMapPopup(map, lngLat, DataDetail, {
                    featrue: f,
                    onDelete() {
                        glManager.delete(f);
                        popup.remove();
                    },
                    onEdit() {
                        glManager.setFeatureHidden(f.properties.id);

                        vertexEditor.setFeature(f, (id, g) => {
                            glManager.clearFeatureHidden(id);

                            const featrue = glManager.query(id)!;
                            featrue.geometry = g;
                            glManager.update(featrue);
                        });
                        popup.remove();
                    },
                    onCopy() {
                        popup.remove();
                    }
                });
            }
        });

    createMapControl(map, ShowEditorButton);
    createMapControl(map, Data, {
        drawManager,
        onUpload: (features: Array<TIdentityGeoJSONFeature>) => glManager.add(...features),
        onDownload: () => glManager.fc
    }, "top-center");
    createMapControl(map, Measurer, { measureManager }, 'top-left');
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
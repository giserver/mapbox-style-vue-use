<template>
    <Map :onMapLoad="onMapLoad"></Map>

    <div class="controls" style="margin-top: 24px;display: flex;flex-direction: column;gap: 24px;"
        v-if="measure !== null">
        <div style="display: flex; gap: 32px;">
            <div v-for="l, t in radios" @click="handleRadioClick(t)" style="cursor: pointer;">
                {{ l }}
                <input type="radio" :value="t" v-model="value">
            </div>
            <div>
                <button class="button" @click="measure.clear()">清除</button>
            </div>
            <div>
                <button class="button" @click="measure.stop()">停止</button>
            </div>
        </div>

        <div style="display: flex; justify-content: space-between;">
            <div style="display: flex;flex-direction: column;gap: 16px;">
                显示
                <div @click="handleShowLineDirection">
                    显示面线段方向
                    <input type="checkbox" :value="true" v-model="direction">
                </div>

                <div @click="handleShowDistance">
                    显示面线段距离
                    <input type="checkbox" :value="true" v-model="distance">
                </div>

                <div @click="handleShowSegment">
                    显示线段距离
                    <input type="checkbox" :value="true" v-model="center">
                </div>
            </div>
            <div style="display: flex;flex-direction: column;gap: 16px;">
                单位
                <div>
                    面积 :
                    <select v-model="areaUnit">
                        <option value="M2">平方米</option>
                        <option value="KM2">平方千米</option>
                        <option value="MU">亩</option>
                        <option value="M2KM2">自动</option>
                    </select>
                </div>
                <div>
                    长度 :
                    <select v-model="lengthUnit">
                        <option value="M">米</option>
                        <option value="KM">千米</option>
                        <option value="MKM">自动</option>
                    </select>
                </div>
            </div>

            <div style="display: flex;flex-direction: column;gap: 16px;">
                <div>精度</div>
                <div style="display: grid;grid-template-columns: 1fr auto;gap: 12px;">
                    <div>米</div>
                    <input type="number" v-model="precisions[0]" :min="0" step="1"
                        style="border: 1px solid blueviolet;">
                    <div>千米</div>
                    <input type="number" v-model="precisions[1]" :min="0" step="1"
                        style="border: 1px solid blueviolet;">

                    <div>平方米</div>
                    <input type="number" v-model="precisions[2]" :min="0" step="1"
                        style="border: 1px solid blueviolet;">

                    <div> 平方千米</div>
                    <input type="number" v-model="precisions[3]" :min="0" step="1"
                        style="border: 1px solid blueviolet;">

                    <div>亩</div>
                    <input type="number" v-model="precisions[4]" :min="0" step="1"
                        style="border: 1px solid blueviolet;">
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import Map from './Map.vue';
import { GeoJSONLayerManager } from '../GeoJSONlayerManager';
import { MeasureManager, TEditorGeometryType, Units } from '../../maplugin-core';
import { ref, watch } from 'vue';

const value = ref("");
const radios = {
    Point: "点测量",
    LineString: "线测量",
    Polygon: "面测量"
}

let measure: MeasureManager;
const direction = ref(false);
const distance = ref(false);
const center = ref(false);

const areaUnit = ref<Units.TUnitsArea | 'M2KM2'>("M2KM2");
watch(areaUnit, a => {
    measure.setUnits({
        area: a
    })
});

const lengthUnit = ref<Units.TUnitsLength | 'MKM'>("MKM");
watch(lengthUnit, a => {
    measure.setUnits({
        length: a
    });
});

const precisions = ref(["2", "2", "2", "2", "2"]);
watch(precisions, a => {
    measure.setPrecision('M', parseInt(a[0] ?? "2"));
    measure.setPrecision('KM', parseInt(a[1] ?? "2"));
    measure.setPrecision('M2', parseInt(a[2] ?? "2"));
    measure.setPrecision('KM2', parseInt(a[3] ?? "2"));
    measure.setPrecision('MU', parseInt(a[4] ?? "2"));
},{deep:true});

function onMapLoad(map: maplibregl.Map) {
    const glManager = new GeoJSONLayerManager(map, []);
    measure = new MeasureManager(glManager, {});
    measure.setDirectionSymbol(">>", "<<");
    measure.showPolygonDirection(false);
    measure.showPolygonDistance(false);
    measure.showSegment(false);
}

function handleRadioClick(measureType: TEditorGeometryType) {
    measure.start(measureType);
    value.value = measureType;
}

function handleShowLineDirection() {
    direction.value = !direction.value;
    measure.showPolygonDirection(direction.value);
}

function handleShowDistance() {
    distance.value = !distance.value;
    measure.showPolygonDistance(distance.value);
}

function handleShowSegment() {
    center.value = !center.value;
    measure.showSegment(center.value);
}

</script>

<style scoped></style>
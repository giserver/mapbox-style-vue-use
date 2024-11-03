<template>
    <div class="measure-control">
        <fieldset>
            <legend>
                <div class="form-check">
                    <label class="form-check-label" for="ck-measure">测量</label>
                    <input id="ck-measure" type="checkbox" v-model="measureEnable">
                </div>
            </legend>

            <div class="measure-properties">
                <RadioButton class="measure-properties-tabs" :radios="tabs" v-model:value="currentTab"></RadioButton>

                <div class="measure-properties-controls visible" v-show="currentTab === 'visible'">
                    <div>面线段方向</div>
                    <input type="checkbox" v-model="direction">
                    <div>面线段距离</div>
                    <input type="checkbox" v-model="distance">
                    <div>线段距离</div>
                    <input type="checkbox" v-model="centerDistance">
                </div>

                <div class="measure-properties-controls" v-show="currentTab === 'units'">
                    <div>
                        面积
                    </div>
                    <select v-model="areaUnit">
                        <option value="M2">平方米</option>
                        <option value="KM2">平方千米</option>
                        <option value="MU">亩</option>
                        <option value="M2KM2">自动</option>
                    </select>

                    <div>
                        长度
                    </div>
                    <select v-model="lengthUnit">
                        <option value="M">米</option>
                        <option value="KM">千米</option>
                        <option value="MKM">自动</option>
                    </select>
                </div>

                <div class="measure-properties-controls precision" v-show="currentTab === 'precision'">
                    <div>米</div>
                    <input type="number" @keydown="e => e.preventDefault()" v-model="precisions[0]" :min="0" step="1">
                    <div>千米</div>
                    <input type="number" @keydown="e => e.preventDefault()" v-model="precisions[1]" :min="0" step="1">
                    <div>平方米</div>
                    <input type="number" @keydown="e => e.preventDefault()" v-model="precisions[2]" :min="0" step="1">
                    <div> 平方千米</div>
                    <input type="number" @keydown="e => e.preventDefault()" v-model="precisions[3]" :min="0" step="1">
                    <div>亩</div>
                    <input type="number" @keydown="e => e.preventDefault()" v-model="precisions[4]" :min="0" step="1">
                </div>
            </div>
        </fieldset>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { MeasureManager, Units } from '../../../../packages/maplugin-core';
import RadioButton from '../base/RadioButton.vue';

const tabs: Record<"visible" | "units" | "precision", string> = {
    'visible': "显示",
    'units': "单位",
    'precision': "精度"
};
const currentTab = ref<keyof typeof tabs>("visible");

const props = defineProps<{
    measureManager: MeasureManager
}>();

props.measureManager.setVisible(false);
props.measureManager.setDirectionSymbol('>', '<')

const measureEnable = ref(false);
watch(measureEnable, a => {
    props.measureManager.setVisible(a);
});

const direction = ref(true);
watch(direction, a => {
    props.measureManager.showPolygonDirection(a);
});

const distance = ref(true);
watch(distance, a => {
    props.measureManager.showPolygonDistance(a);
});

const centerDistance = ref(true);
watch(centerDistance, a => {
    props.measureManager.showSegment(a);
});

const areaUnit = ref<Units.TUnitsArea | 'M2KM2'>("M2KM2");
watch(areaUnit, a => {
    props.measureManager.setUnits({
        area: a
    })
});

const lengthUnit = ref<Units.TUnitsLength | 'MKM'>("MKM");
watch(lengthUnit, a => {
    props.measureManager.setUnits({
        length: a
    });
});

const precisions = ref(["2", "2", "2", "2", "2"]);
watch(precisions, a => {
    props.measureManager.setPrecision('M', parseInt(a[0] ?? "2"));
    props.measureManager.setPrecision('KM', parseInt(a[1] ?? "2"));
    props.measureManager.setPrecision('M2', parseInt(a[2] ?? "2"));
    props.measureManager.setPrecision('KM2', parseInt(a[3] ?? "2"));
    props.measureManager.setPrecision('MU', parseInt(a[4] ?? "2"));
}, { deep: true });

</script>

<style scoped>
.measure-control {
    background: var(--color-bg);
    color: var(--color-word);
    font-size: var(--size-word);
    padding: 8px;
    border-radius: 6px;
    width: 200px;
}

.form-check {
    display: flex;
    align-items: center;
}

.form-check>* {
    cursor: pointer;
}

.form-check-label {
    font-size: 14px;
}

.measure-properties {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.measure-properties-tabs {
    border-radius: 4px;
    width: fit-content;
}

:deep(.measure-properties-tabs>.radio) {
    font-size: 12px !important;
    padding: 2px 8px;
}

.measure-properties-controls {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px 40px;
}

.measure-properties-controls.visible>input {
    cursor: pointer;
}

.measure-properties-controls.precision>input {
    width: 40px;
}
</style>
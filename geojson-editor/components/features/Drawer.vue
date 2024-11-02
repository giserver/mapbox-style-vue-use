<template>
    <div class="drawer-control">
        <RadioButton :radios="radios" v-model:value="currentMeasure"></RadioButton>
        <div class="btn" @click="handleClear()">清空</div>
        <div class="btn" @click="handleStop()">停止</div>
    </div>
</template>

<script lang="ts" setup>
import RadioButton from '../base/RadioButton.vue';
import { DrawManager, TDrawGeometryType } from '../../../packages/maplugin-core';
import { ref, watch } from 'vue';

const radios: Record<TDrawGeometryType, string> = {
    'Point': '点',
    'LineString': '线',
    'Polygon': '面'
}

const props = defineProps<{
    drawManager: DrawManager
}>();

const currentMeasure = ref<TDrawGeometryType | undefined>();

watch(currentMeasure, a => {
    if (a) {
        props.drawManager.start(a);
    }
});

function handleClear() {
    props.drawManager.clear();
}

function handleStop() {
    props.drawManager.stop();
    currentMeasure.value = undefined;

}
</script>

<style scoped>
.drawer-control {
    display: flex;
    background: var(--color-bg);
    color: var(--color-word);
    border-radius: 6px;
    overflow: hidden;
}

.btn {
    cursor: pointer;
    padding: 6px 12px;
    font-size: var(--size-word);
}

.btn:hover {
    background: var(--color-hover);
}
</style>
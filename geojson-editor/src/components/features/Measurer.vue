<template>
    <div class="measure-control">

        <fieldset>
            <legend>
                <div class="form-check">
                    <label for="ck-measure">测量</label>
                    <input id="ck-measure" type="checkbox" v-model="measureEnable">
                </div>
            </legend>
        </fieldset>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { MeasureManager } from '../../../../packages/maplugin-core';

const props = defineProps<{
    measureManager: MeasureManager
}>();

const measureEnable = ref(false);
props.measureManager.setVisible(false);

watch(measureEnable, a => {
    props.measureManager.setVisible(a);
});

</script>

<style scoped>
.measure-control {
    background: var(--color-bg);
    color: var(--color-word);
    font-size: var(--size-word);
    padding: 8px;
    border-radius: 6px;
}

.form-check {
    display: flex;
    align-items: center;
}

.form-check>* {
    cursor: pointer;
}
</style>
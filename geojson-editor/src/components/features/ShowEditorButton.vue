<template>
    <ToggleButton content="编辑器" :defaultActive="StoreEditor.show.value" :onChange="v => StoreEditor.showEditor(v)">
    </ToggleButton>
</template>

<script setup lang="ts">
import ToggleButton from '../base/ToggleButton.vue';
import { StoreEditor } from '../../stores/index';

</script>

<style scoped></style>
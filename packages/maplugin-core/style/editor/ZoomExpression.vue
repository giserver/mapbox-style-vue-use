<template>
    <ZoomSlider></ZoomSlider>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import ZoomSlider from './ZoomSlider.vue';

const props = defineProps<{
    type : 'interpolate'
}>();

</script>

<style scoped>

</style>
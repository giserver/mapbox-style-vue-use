<template>
    <div class="toggle-button" :class="{ active: active }" @click="handleClick">{{ content }}</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const props = defineProps<{
    content: string,
    defaultActive: boolean,
    onChange: (val: boolean) => void
}>();

const active = ref(props.defaultActive);

function handleClick(v: boolean) {
    props.onChange(!active.value);
    active.value = !active.value;
}
</script>

<style scoped>
.toggle-button {
    padding: 6px 12px;
    background: var(--color-bg);
    color: var(--color-word);
    font-size: var(--color-word);
    cursor: pointer;
    border-radius: 6px;
}

.toggle-button.active {
    color: var(--color-primary);
}

.toggle-button:hover {
    background-color: var(--color-hover);
}
</style>
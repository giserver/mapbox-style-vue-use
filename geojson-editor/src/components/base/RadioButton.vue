<template>
    <div class="radio-group">
        <div class="radio" :class="{ active: value === key as any }" v-for="label, key in radios" :key="key"
            @click="handleRadioChange(key as any)">
            {{ label }}
        </div>
    </div>
</template>

<script setup lang="ts" generic="K extends string, T extends Record<K,string>">

defineProps<{
    radios: T,
    value: K | undefined
}>();

const emits = defineEmits<{
    (e: 'update:value', value: T): void
}>();

function handleRadioChange(k: T) {
    emits('update:value', k);
}
</script>

<style scoped>
.radio-group {
    display: flex;
    align-items: center;
    overflow: hidden;
    background: var(--color-bg);
    color: var(--color-word);
}

.radio {
    cursor: pointer;
    padding: 6px 12px;
    font-size: var(--size-word);
}

.radio:hover {
    background: var(--color-hover);
}

.radio.active {
    background: var(--color-hover) !important;
    color: var(--color-primary) !important;
}
</style>
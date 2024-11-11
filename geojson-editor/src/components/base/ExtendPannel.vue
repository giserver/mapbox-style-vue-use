<template>
    <div class="extend-pannel">
        <ToggleButton :content="title" :default-active="defaultActive" :onToggle="onToggleWrap"></ToggleButton>
        <div :class="extendPannelContentClass">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import ToggleButton from './ToggleButton.vue';

const props = withDefaults(defineProps<{
    title: string,
    defaultActive?: boolean,
    onToggle?: (active: boolean) => void,
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right"
}>(), {
    defaultActive: false
});

const activeRef = ref(props.defaultActive);
const extendPannelContentClass = computed(() => {
    let ret = `extend-pannel-content ${props.position}`;
    if (activeRef.value) {
        ret += " active";
    }

    return ret;
});
function onToggleWrap(active: boolean) {
    props.onToggle?.(active);
    activeRef.value = active;
}
</script>

<style scoped>
.extend-pannel {
    position: relative;
}

.extend-pannel-content {
    position: absolute;
    background-color: var(--color-bg);
    padding: 8px;
    border-radius: 6px;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;

}

.extend-pannel-content.active {
    opacity: 1;
}

.top-left {
    top: 0;
    right: 0;
    transform: translateX(calc(100% + 8px));
}

.top-right {
    top: 0;
    left: 0;
    transform: translateX(calc(-100% - 8px));
}

.bottom-left {
    bottom: 0;
    right: 0;
    transform: translateX(calc(100% + 8px));
}

.bottom-right {
    bottom: 0;
    left: 0;
    transform: translateX(calc(-100% - 8px));
}
</style>
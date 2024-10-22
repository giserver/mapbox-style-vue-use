<template>
    <div class="zoom-slider">
        <div class="zoom-slider-triggers" @mousemove="handleSliderTriggerMouseMove" @mouseup="handleSliderTriggerMouseUp">
            <div v-for="i in (maxZoom - minZoom + 1)" :key="i" @mouseover="handleSliderTriggerMouseOver(i)"
                @mouseout="handleSliderTriggerMouseOut">
                <div :class="{ 'zoom-slider-trigger-top': true, 'active': activeMarkZoom === i }" :style="{
                    cursor: marks[i] ? 'pointer' : 'default'
                }" @click="handleSliderTriggerTopClick(i)" @mousedown="handleSliderTriggerTopMouseDown">
                </div>
                <div class="zoom-slider-trigger-bottom" @click="handleSliderTriggerBottomClick(i)"></div>
            </div>
        </div>

        <div class="zoom-slider-symble">
            <div class="zoom-slider-cursor-item" v-for="m, i in marks" :key="i" :style="{
                opacity: m ? 1 : 0,
                left: calCursorLeft(i) + 'px',
                transform: 'translate(-50%, -100%)'
            }">
                <slot v-if="m" name="symbol" :mark="m"></slot>
            </div>
        </div>

        <div class="zoom-slider-ranger">
            <div class="zoom-slider-cursor-item ball" :class="{ active: activeMarkZoom === i }"
                v-for="i in (maxZoom - minZoom + 1)" :key="i" :style="{
                    left: calCursorLeft(i) + 'px',
                    opacity: marks[i] !== undefined || triggerHoverKey === i ? 1 : 0
                }">
            </div>
        </div>

        <div class="zoom-slider-labels">
            <div class="zoom-slider-cursor-item" :style="{
                left: calCursorLeft(currentMapZoom) + 'px',
                cursor: 'ew-resize',
                zIndex: 100
            }" @mousedown="handleMapZoomCursorMouseDown" @mouseup="handleMapZoomCursorMouseUp">
                <div>▲</div>
                <div>{{ currentMapZoom.toFixed(1) }}</div>
            </div>
            <div class="zoom-slider-cursor-item label" v-for="i in (maxZoom - minZoom + 1)" :key="i" :style="{
                left: calCursorLeft(i) + 'px',
                opacity: marks[i] !== undefined || triggerHoverKey === i ? (Math.min(Math.abs(currentMapZoom - i), 1)) * 0.5 : 0,
            }">
                <div>▲</div>
                <div>{{ i }}</div>
            </div>
        </div>
    </div>

    <slot name="controller" :mark="marks[activeMarkZoom]"></slot>
</template>

<script setup lang="ts" generic="TMark extends Record<any, any>">
import { ref } from 'vue';
import { IMap } from '../../types';

export type TZoomSliderOptions<T> = {
    activeMarkZoom: number,
    marks: Array<T | undefined>,
    configs: {
        [K in keyof T]: {
            valueConverter?: (value: any) => T[K],
            defaultValue: T[K],
        }
    },
    map: IMap,
    minZoom?: number,
    maxZoom?: number,
    sliderWidth?: number,
}

const props = withDefaults(defineProps<TZoomSliderOptions<TMark>>(), {
    minZoom: 1,
    maxZoom: 22,
    sliderWidth: 300,
    activeMarkZoom: 1
});

function setDefaultValue(zoom: number) {
    const v = {} as any;
    for (let k in props.configs) {
        v[k] = props.configs[k].defaultValue;
    }

    props.marks[zoom] = v;
}

if (!props.marks[props.activeMarkZoom]) {
    setDefaultValue(props.activeMarkZoom);
}

const widthPerRange = props.sliderWidth / (props.maxZoom - props.minZoom + 1);

const emits = defineEmits<{
    (e: "update:activeMarkZoom", value: number): void,
    (e: "update:marks", value: Array<TMark | undefined>): void
}>();

/**
 * 上方trigger（symbol层）鼠标hover的mark key
 */
const triggerHoverKey = ref<number>();

/**
 * 当前地图的zoom，反应到游标
 */
const currentMapZoom = ref<number>(props.map.getZoom());

/**
 * 监听地图zoom变化，修改游标
 */
props.map.on('zoom', (_: any) => {
    currentMapZoom.value = Math.max(props.map.getZoom(), 1);
});

function calCursorLeft(zoom: number) {
    return (zoom - props.minZoom + 0.5) * widthPerRange;
}

function calZoomFromLeft(left: number) {
    return left / widthPerRange + props.minZoom - 0.5;
}

function handleSliderTriggerTopClick(zoom: number) {
    if (!props.marks[zoom]) {
        setDefaultValue(zoom);
    }

    emits('update:activeMarkZoom', zoom);
}

function handleSliderTriggerBottomClick(zoom: number) {
    props.map.easeTo({
        zoom: zoom,
    });
}

function handleSliderTriggerMouseOver(zoom: number) {
    triggerHoverKey.value = zoom;
}

function handleSliderTriggerMouseOut() {
    triggerHoverKey.value = undefined;
}

let draggedMarkKey: number | undefined;
let moveCoverData: { key: number, value: any } | undefined;
function handleSliderTriggerTopMouseDown() {
    if (triggerHoverKey.value !== props.activeMarkZoom) return;
    draggedMarkKey = triggerHoverKey.value;
}

let mapZoomCursorDragged = false;
function handleMapZoomCursorMouseDown() {
    mapZoomCursorDragged = true;
}

function handleMapZoomCursorMouseUp() {
    mapZoomCursorDragged = false;
}

function handleSliderTriggerMouseUp() {
    draggedMarkKey = undefined;
    moveCoverData = undefined;

    mapZoomCursorDragged = false;
}

function handleSliderTriggerMouseMove(e: MouseEvent) {
    // 拖拽symbol移动marks
    if (draggedMarkKey && triggerHoverKey.value && draggedMarkKey !== triggerHoverKey.value) {
        const lastMoveCoverData = moveCoverData;
        // 获取当前hover mark 复制数据
        if (props.marks[triggerHoverKey.value]) {
            moveCoverData = { key: triggerHoverKey.value, value: JSON.parse(JSON.stringify(props.marks[triggerHoverKey.value])) };
        } else {
            moveCoverData = undefined;
        }

        props.marks[triggerHoverKey.value] = JSON.parse(JSON.stringify(props.marks[draggedMarkKey]));

        if (lastMoveCoverData) {
            props.marks[lastMoveCoverData.key] = lastMoveCoverData.value;
        } else {
            props.marks[draggedMarkKey] = undefined;
        }

        draggedMarkKey = triggerHoverKey.value;
        emits('update:activeMarkZoom', triggerHoverKey.value);
    }

    if (mapZoomCursorDragged) {
        const bound = document.querySelector('.zoom-slider')!.getBoundingClientRect();
        const left = e.clientX - bound.left;

        props.map.setZoom(calZoomFromLeft(left));
    }
}

</script>

<style scoped>
.zoom-slider {
    position: relative;
    width: v-bind(sliderWidth + 'px');
    height: 100px;

    --slider-ranger-height: 8px;
    --slider-ranger-ball-size: 6px;

    -webkit-user-select: none;
    -moz-user-select: none;
    -o-user-select: none;
    user-select: none;
}

.zoom-slider-cursor-item {
    position: absolute;
    transform: translateX(-50%);
}

.zoom-slider-cursor-item.ball {
    top: calc((var(--slider-ranger-height) - var(--slider-ranger-ball-size))/2);
    width: var(--slider-ranger-ball-size);
    height: var(--slider-ranger-ball-size);
    border-radius: 50%;
    background: #ccc;
}

.zoom-slider-cursor-item.ball.active {
    background: #111;
}

.zoom-slider-triggers {
    display: flex;
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 99;
}

.zoom-slider-triggers>div {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.zoom-slider-triggers>div:hover {
    background-color: #ccc;
    opacity: 0.1;
}

.zoom-slider-trigger-top {
    width: 100%;
    height: 60%;
}

.zoom-slider-trigger-top.active:hover {
    cursor: ew-resize !important;
}

.zoom-slider-trigger-bottom {
    width: 100%;
    flex: 1;
}

.zoom-slider-symble {
    position: absolute;
    top: 60%;
    width: 100%;
    transform: translateY(calc(-100% - var(--slider-ranger-height) - 8px));
}

.zoom-slider-ranger {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.05);
    width: 100%;
    height: var(--slider-ranger-height);
    top: 60%;
    transform: translateY(-100%);
}

.zoom-slider-labels {
    position: absolute;
    width: 100%;
    top: 60%;
    font-size: 8px;
    text-align: center;

    cursor: pointer;
}
</style>
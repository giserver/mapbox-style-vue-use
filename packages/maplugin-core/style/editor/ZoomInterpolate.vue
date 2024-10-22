<template>
    <div class="slider">
        <div class="slider-triggers" @mousemove="handleSliderTriggerMouseMove" @mouseup="handleSliderTriggerMouseUp">
            <div v-for="i in (maxZoom - minZoom + 1)" :key="i" @mouseover="handleSliderTriggerMouseOver(i)"
                @mouseout="handleSliderTriggerMouseOut">
                <div :class="{ 'slider-trigger-top': true, 'active': activeMarkKey === i }" :style="{
                    cursor: marks[i] ? 'pointer' : 'default'
                }" @click="handleSliderTriggerTopClick(i)" @mousedown="handleSliderTriggerTopMouseDown">
                </div>
                <div class="slider-trigger-bottom" @click="handleSliderTriggerBottomClick(i)"></div>
            </div>
        </div>

        <div class="slider-symble">
            <div class="slider-cursor-item" v-for="m, i in marks" :key="i" :style="{
                opacity: m ? 1 : 0,
                left: calCursorLeft(i) + 'px',
                transform: 'translate(-50%, -100%)'
            }">
                <slot v-if="m" name="symbol" :mark="m"></slot>
            </div>
        </div>

        <div class="slider-ranger">
            <div class="slider-cursor-item ball" v-for="i in (maxZoom - minZoom + 1)" :key="i" :style="{
                left: calCursorLeft(i) + 'px',
                opacity: marks[i] !== undefined || triggerHoverKey === i ? 1 : 0,
                background: activeMarkKey === i ? '#111' : '#ccc'
            }">
            </div>
        </div>

        <div class="slider-labels">
            <div class="slider-cursor-item" :style="{
                left: calCursorLeft(currentMapZoom) + 'px',
                cursor: 'ew-resize',
                zIndex: 100
            }" @mousedown="handleMapZoomCursorMouseDown" @mouseup="handleMapZoomCursorMouseUp">
                <div>▲</div>
                <div>{{ currentMapZoom.toFixed(1) }}</div>
            </div>
            <div class="slider-cursor-item label" v-for="i in (maxZoom - minZoom + 1)" :key="i" :style="{
                left: calCursorLeft(i) + 'px',
                opacity: marks[i] !== undefined || triggerHoverKey === i ? (Math.min(Math.abs(currentMapZoom - i), 1)) * 0.5 : 0,
            }">
                <div>▲</div>
                <div>{{ i }}</div>
            </div>
        </div>
    </div>

    <slot name="controller" :mark="marks[activeMarkKey]"></slot>
</template>

<script setup lang="ts" generic="T">
import { reactive, ref, watch } from 'vue';
import { IMap } from '../../types';

type TMark = {
    [K in keyof T]: any
}

const props = withDefaults(defineProps<{
    map: IMap,
    value: Partial<T>,
    configs: {
        [K in keyof T]: {
            valueConverter?: (value: any) => any,
            defaultValue: any,
        }
    },
    minZoom?: number,
    maxZoom?: number,
    sliderWidth?: number,
}>(), {
    minZoom: 1,
    maxZoom: 23,
    sliderWidth: 300,
});

const widthPerRange = props.sliderWidth / (props.maxZoom - props.minZoom + 1);

/**
 * 这个是被点击的mark，表示可以拖动，ranger球标显示红色
 */
const activeMarkKey = ref<number>(1);

/**
 * 滑动条上的所有标记
 */
const marks = reactive<Array<TMark | undefined>>([]);
for (let k in props.configs) {
    const v = props.value[k];
    if (v instanceof Array && v[0] === 'interpolate' && v[1] === 'linear' && v[2] === 'zoom') {
        for (let i = 3; i < v.length; i += 2) {
            const zoom = v[i];
            const value = v[i + 1];

            if (!marks[zoom]) marks[zoom] = {} as any;
            (marks[zoom] as any)[k] = value;

            if (activeMarkKey.value === 1) {
                activeMarkKey.value = zoom;
            }
        }
    } else {
        marks[1] = {} as any;
        for(const k in props.configs){
            (marks[1] as any)[k] = props.configs[k].defaultValue;
        }
    }
}

watch(marks, () => {
    let values = {} as any;
    for (let k in props.configs) {
        values[k] = ['interpolate', ['linear'], ['zoom']] as any;
    }

    marks.forEach((m, zoom) => {
        if (!m) return;

        for (let k in m) {
            let v = m[k];

            if (((props.configs as any)[k]).valueConverter)
                v = ((props.configs as any)[k]).valueConverter(v);

            values[k].push(zoom, v);
        }
    });

    for (let k in values) {
        (props.value as any)[k] = values[k];
    }
});

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
    currentMapZoom.value = props.map.getZoom();
});

function calCursorLeft(zoom: number) {
    return (zoom - props.minZoom + 0.5) * widthPerRange;
}

function calZoomFromLeft(left: number) {
    return left / widthPerRange + props.minZoom - 0.5;
}

function handleSliderTriggerTopClick(zoom: number) {
    if (!marks[zoom]) {
        marks[zoom] = {} as any;
        for (let k in props.configs) {
            (marks[zoom] as any)[k] = props.configs[k].defaultValue;
        }
    }

    activeMarkKey.value = zoom;
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
    if (triggerHoverKey.value !== activeMarkKey.value) return;
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
        if (marks[triggerHoverKey.value]) {
            moveCoverData = { key: triggerHoverKey.value, value: JSON.parse(JSON.stringify(marks[triggerHoverKey.value])) };
        } else {
            moveCoverData = undefined;
        }

        marks[triggerHoverKey.value] = JSON.parse(JSON.stringify(marks[draggedMarkKey]));

        if (lastMoveCoverData) {
            marks[lastMoveCoverData.key] = lastMoveCoverData.value;
        } else {
            marks[draggedMarkKey] = undefined;
        }

        draggedMarkKey = triggerHoverKey.value;
        activeMarkKey.value = triggerHoverKey.value;
    }

    if (mapZoomCursorDragged) {
        const bound = document.querySelector('.slider')!.getBoundingClientRect();
        const left = e.clientX - bound.left;

        props.map.setZoom(calZoomFromLeft(left));
    }
}

</script>

<style scoped>
.slider {
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

.slider-cursor-item {
    position: absolute;
    transform: translateX(-50%);
}

.slider-cursor-item.ball {
    top: calc((var(--slider-ranger-height) - var(--slider-ranger-ball-size))/2);
    width: var(--slider-ranger-ball-size);
    height: var(--slider-ranger-ball-size);
    border-radius: 50%;
    background: #ccc;
}

.slider-triggers {
    display: flex;
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 99;
}

.slider-triggers>div {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.slider-triggers>div:hover {
    background-color: #ccc;
    opacity: 0.1;
}

.slider-trigger-top {
    width: 100%;
    height: 60%;
}

.slider-trigger-top.active:hover {
    cursor: ew-resize !important;
}

.slider-trigger-bottom {
    width: 100%;
    flex: 1;
}

.slider-symble {
    position: absolute;
    top: 60%;
    width: 100%;
    transform: translateY(calc(-100% - var(--slider-ranger-height) - 8px));
}

.slider-ranger {
    position: absolute;
    background-color: rgba(0,0,0,0.05);
    width: 100%;
    height: var(--slider-ranger-height);
    top: 60%;
    transform: translateY(-100%);
    border-radius: 4px;
}

.slider-labels {
    position: absolute;
    width: 100%;
    top: 60%;
    font-size: 8px;
    text-align: center;

    cursor: pointer;
}
</style>
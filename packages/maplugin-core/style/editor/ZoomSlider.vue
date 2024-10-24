<template>
    <div class="zoom-slider">
        <div class="zoom-slider-triggers" @mousemove="handleSliderTriggerMouseMove"
            @mouseup="handleSliderTriggerMouseUp">
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
            <div class="zoom-slider-subdivision" v-for="m, i in marks" :key="i" :style="{
                opacity: m ? 1 : 0,
                left: calSubdivisionLeft(i) + 'px',
                transform: 'translate(-50%, -100%)'
            }">
                <slot v-if="m" name="symbol" :mark="m"></slot>
            </div>
        </div>

        <div class="zoom-slider-ranger">
            <div class="zoom-slider-subdivision ball" :class="{ active: activeMarkZoom === i }"
                v-for="i in (maxZoom - minZoom + 1)" :key="i" :style="{
                    left: calSubdivisionLeft(i) + 'px',
                    opacity: marks[i] !== undefined || triggerHoverKey === i ? 1 : 0
                }">
            </div>
        </div>

        <div class="zoom-slider-labels">
            <div class="zoom-slider-subdivision cursor" :style="{
                left: calSubdivisionLeft(currentMapZoom) + 'px',
            }" @mousedown="handleMapZoomCursorMouseDown" @mouseup="handleMapZoomCursorMouseUp">
                <div class="symbol">▲</div>
                <div class="zoom">{{ currentMapZoom.toFixed(1) }}</div>
            </div>
            <div class="zoom-slider-subdivision label" v-for="i in (maxZoom - minZoom + 1)" :key="i" :style="{
                left: calSubdivisionLeft(i) + 'px',
                opacity: marks[i] !== undefined || triggerHoverKey === i ? (Math.min(Math.abs(currentMapZoom - i), 1)) * 0.5 : 0,
            }">
                <div class="symbol">▲</div>
                <div class="zoom">{{ i }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts" generic="TMark extends Record<any, any>">
import { ref } from 'vue';
import { IMap } from '../../types';


/**
 * 组件设计
 * 
 *   █                                           symbol <slot>
 * --●----------○-----------------------------   ranger
 *   ▲   ...    △                                cursor
 *   1   ...    7                                zoom
 * 
 * 1. 和普通的slider不同，分为上下两个部分，上半区（symbol）和下半区（cursor + zoom）
 * 2. 上半区 控制数据属性修改
 *    左键单击空白区域增加一个mark symbol
 *    单击已增加的mark symbol设置该mark为active状态记录activeMarkZoom
 *    mark处于active后，再用鼠标拖动，mark symbol会跟随鼠标移动，并在鼠标抬起事件设置该位置zoom对应被拖拽的mark
 * 3. 下半区 控制地图缩放（zoom）
 *    存在游标，用鼠标拖动，设置地图zoom，同时跟随地图zoom变化
 */

export type TZoomSliderOptions<T> = {
    /**
     * 当前选中的mark
     */
    activeMarkZoom: number,

    /**
     * 全部的mark数据，数组下标代表zoom
     */
    marks: Array<T | undefined>,

    /**
     * 数据配置，只有配置的属性，才能在增加mark时赋值
     */
    configs: {
        [K in keyof T]: {
            valueConverter?: (value: any) => T[K],
            defaultValue: T[K],
        }
    },
    
    /**
     * 地图
     */
    map: IMap,

    /**
     * 地图最小缩放级别
     */
    minZoom?: number,

    /**
     * 最大缩放级别
     */
    maxZoom?: number,

    /**
     * 宽度
     */
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

/**
 * 计算细分zoom对应的css left
 * @param zoom 
 */
function calSubdivisionLeft(zoom: number) {
    return (zoom - props.minZoom + 0.5) * widthPerRange;
}

/**
 * 从css left 计算zoom
 * @param left 
 */
function calZoomFromLeft(left: number) {
    return left / widthPerRange + props.minZoom - 0.5;
}

/**
 * 点击上半区，如果该位置没有mark，设置mark并赋默认值，设置为activeMarkZoom
 * @param zoom 
 */
function handleSliderTriggerTopClick(zoom: number) {
    if (!props.marks[zoom]) {
        setDefaultValue(zoom);
    }

    emits('update:activeMarkZoom', zoom);
}

/**
 * 点击下半区，地图缩放到zoom
 * @param zoom 
 */
function handleSliderTriggerBottomClick(zoom: number) {
    props.map.easeTo({
        zoom: zoom,
    });
}

let draggedMarkKey: number | undefined;
let moveCoverData: { key: number, value: any } | undefined;
let mapZoomCursorDragged = false;

function handleSliderTriggerTopMouseDown() {
    if (triggerHoverKey.value !== props.activeMarkZoom) return;
    draggedMarkKey = triggerHoverKey.value;
}

function handleMapZoomCursorMouseDown() {
    mapZoomCursorDragged = true;
}

function handleMapZoomCursorMouseUp() {
    mapZoomCursorDragged = false;
}

function handleSliderTriggerMouseOver(zoom: number) {
    triggerHoverKey.value = zoom;
}

function handleSliderTriggerMouseOut() {
    triggerHoverKey.value = undefined;
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
        
        /**
         * 数据回溯，如果拖动symbol时到达一个存在的mark，过去后，这个mark要复原
         */
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

.zoom-slider-subdivision {
    position: absolute;
    transform: translateX(-50%);
}

.zoom-slider-subdivision.ball {
    top: calc((var(--slider-ranger-height) - var(--slider-ranger-ball-size))/2);
    width: var(--slider-ranger-ball-size);
    height: var(--slider-ranger-ball-size);
    border-radius: 50%;
    background: #ccc;
}

.zoom-slider-subdivision.ball.active {
    background: #111;
}

.zoom-slider-subdivision.cursor {
    cursor: ew-resize;
    z-index: 100;
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
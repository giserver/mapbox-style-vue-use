import { ref, watch } from "vue";
import { IMap } from '../types';

export namespace Units {
    export type TUnitsLength = "M" | "KM";

    export type TUnitsArea = "M2" | "KM2" | "MU";

    export type TUnitsAngle = "D" | "M" | "S" | "R";

    function unsupportUnitsError(units: string) {
        return Error(`不支持的单位转换：${units}`);
    }

    /**
     * 面积转换到基础单位(平方米)
     * @param value 面积
     * @param units value的单位
     * @returns 面积 单位平方米
     */
    export function areaToBase(value: number, units: TUnitsArea) {
        switch (units) {
            case "KM2": return value * 1000000;
            case "MU": return value * 666.67;
            case "M2": return value;
            default: throw unsupportUnitsError(units);
        }
    }

    /**
     * 面积基础单位(平方米)，转换到对应面积单位
     * @param value 面积 单位平方米
     * @param units 转换至的面积单位
     * @returns units 对应的面积
     */
    export function areaBaseTo(value: number, units: TUnitsArea) {
        switch (units) {
            case "KM2": return value / 1000000;
            case "MU": return value / 666.67;
            case "M2": return value;
            default: throw unsupportUnitsError(units);
        }
    }

    /**
     * 长度转换到基础单位(米)
     * @param value 长度
     * @param units value的单位
     * @returns 长度 单位米
     */
    export function lengthToBase(value: number, units: TUnitsLength) {
        switch (units) {
            case "KM": return value * 1000;
            case "M": return value;
            default: throw unsupportUnitsError(units);
        }
    }

    /**
     * 长度基础单位(米)，转换到对应长度单位
     * @param value 长度 单位米
     * @param units 转换至的长度单位
     * @returns units 对应的长度
     */
    export function lengthBaseTo(value: number, units: TUnitsLength) {
        switch (units) {
            case "KM": return value / 1000;
            case "M": return value;
            default: throw unsupportUnitsError(units);
        }
    }

    /**
     * 角转换成基础单位(°)
     * @param value 角
     * @param units value的单位
     * @returns 角 单位度
     */
    export function angleToBase(value: number, units: TUnitsAngle) {
        switch (units) {
            case "D": return value;
            case "M": return value / 60;
            case "S": return value / 3600;
            case "R": return value * 180 / Math.PI;
            default: throw unsupportUnitsError(units);
        }
    }

    /**
     * 角度(°)，转换到对应的单位
     * @param value 角 单位°
     * @param units 转换至的角单位
     * @returns units 对应的角数据
     */
    export function angleBaseTo(value: number, units: TUnitsAngle) {
        switch (units) {
            case "D": return value;
            case "M": return value * 60;
            case "S": return value * 3600;
            case "R": return value * Math.PI / 180;
            default: throw unsupportUnitsError(units);
        }
    }

    /**
     * 面积转换
     * @param value 面积
     * @param fromUnits 原单位
     * @param toUnits 转换后单位
     * @returns 
     */
    export function convertArea(value: number, fromUnits: TUnitsArea, toUnits: TUnitsArea): number {
        return areaBaseTo(areaToBase(value, fromUnits), toUnits);
    }

    /**
     * 长度转换
     * @param value 长度 
     * @param fromUnits 原单位
     * @param toUnits 转换后单位
     * @returns 
     */
    export function convertLength(value: number, fromUnits: TUnitsLength, toUnits: TUnitsLength): number {
        return lengthBaseTo(lengthToBase(value, fromUnits), toUnits);
    }

    /**
     * 角度转换
     * @param value 角度 
     * @param fromUnits 原单位
     * @param toUnits 转换后单位
     * @returns 
     */
    export function convertAngle(value: number, fromUnits: TUnitsAngle, toUnits: TUnitsAngle): number {
        return angleBaseTo(angleToBase(value, fromUnits), toUnits);
    }

    /**
     * 角度单位类型转换到单位符号
     * @param type 
     * @returns 
     */
    export function angleTypeToUnitLabel(type: TUnitsAngle) {
        return type === 'D' ? "°" : type === 'M' ? "′" : type === 'S' ? "″" : "";
    }

    type TUnitsDescription<TValue> = {
        label: string,
        value: TValue
    }

    export const unitsLengthDescriptions: Array<TUnitsDescription<TUnitsLength>> = [
        {
            label: "米",
            value: "M"
        }, {
            label: "千米",
            value: "KM"
        }];

    export const unitsAreaDescriptions: Array<TUnitsDescription<TUnitsArea>> = [
        {
            label: "平方米",
            value: "M2"
        }, {
            label: "平方千米",
            value: "KM2"
        }, {
            label: "亩",
            value: "MU"
        }];



    /**
     * 单位转换器hook
     * @param converter 转换函数 
     * @param value 初始化数据
     * @param units 初始化单位
     * @param valueUnits 初始化数据的单位，当value和units不一致时指定value的单位
     * @returns 
     */
    function createUseUnits<TUnits>(converter: (value: number, fromUnits: TUnits, toUnits: TUnits) => number, value: number, units: TUnits, valueUnits?: TUnits) {
        if (valueUnits)
            value = converter(value, valueUnits, units);

        const valueRef = ref(value);
        const unitsRef = ref(units);

        watch(unitsRef, (a, b) => {
            valueRef.value = converter(valueRef.value, b as any, a as any);
        });

        return { valueRef, unitsRef }
    }

    /**
     * 面积 hook
     * @param value 初始化数据
     * @param units 初始化单位
     * @param valueUnits 初始化数据的单位，当value和units不一致时指定value的单位
     * @returns 
     */
    export function useAreaUnits(value: number, units: Units.TUnitsArea, valueUnits?: Units.TUnitsArea) {
        const vu = createUseUnits(Units.convertArea, value, units, valueUnits);
        return { ...vu, unitsDescriptions: Units.unitsAreaDescriptions };
    }

    /**
     * 长度 hook
     * @param value 初始化数据
     * @param units 初始化单位
     * @param valueUnits 初始化数据的单位，当value和units不一致时指定value的单位
     * @returns 
     */
    export function useLengthUnits(value: number, units: Units.TUnitsLength, valueUnits?: Units.TUnitsLength) {
        const vu = createUseUnits(Units.convertLength, value, units, valueUnits);
        return { ...vu, unitsDescriptions: Units.unitsLengthDescriptions };
    }

    export function isMaplibregl(map: IMap) {
        return map.getCanvas()!.classList.contains("maplibregl-canvas");
    }

    export function isMapboxgl(map: IMap) {
        return map.getCanvas()!.classList.contains("mapboxgl-canvas");
    }
}


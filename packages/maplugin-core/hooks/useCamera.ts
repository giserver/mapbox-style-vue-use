import { IMap, TMapEvent } from '../types';
import { ref } from 'vue';

export function useCamera(defaultValue: {
    center: [number, number],
    zoom: number,
    bearing: number,
    pitch: number
}, map?: IMap, event: TMapEvent = 'moveend') {
    let m = map;
    const camera = ref({
        center: m?.getCenter() || { lng: defaultValue.center[0], lat: defaultValue.center[1] },
        zoom: m?.getZoom() || defaultValue.zoom,
        bearing: m?.getBearing() || defaultValue.bearing,
        pitch: m?.getPitch() || defaultValue.pitch
    });

    const cameraChangeHandler = () => {
        camera.value = {
            center: m!.getCenter(),
            zoom: m!.getZoom(),
            bearing: m!.getBearing(),
            pitch: m!.getPitch()
        };
    };

    m?.on(event, cameraChangeHandler);

    function setMap(map: IMap) {
        m?.off(event, cameraChangeHandler);
        m = map;
        m.on(event, cameraChangeHandler);
    }

    return { camera, setMap };
}

export function useZoom(defaultValue: number, map?: IMap, event: TMapEvent = 'pitchend') {
    let m = map;
    const zoom = ref(m?.getZoom() || defaultValue);
    const cameraChangeHandler = () => {
        zoom.value = m!.getZoom();
    }

    m?.on(event, cameraChangeHandler);

    function setMap(map: IMap) {
        m?.off(event, cameraChangeHandler);
        m = map;
        m.on(event, cameraChangeHandler);
    }

    return { zoom, setMap };
}

export function useCenter(defaultValue: [number, number], map?: IMap, event: TMapEvent = "moveend") {
    let m = map;
    const center = ref({
        lng: m?.getCenter().lng || defaultValue[0],
        lat: m?.getCenter().lat || defaultValue[1]
    });
    const cameraChangeHandler = () => {
        center.value = m!.getCenter();
    }

    m?.on(event, cameraChangeHandler);

    function setMap(map: IMap) {
        m?.off(event, cameraChangeHandler);
        m = map;
        m.on(event, cameraChangeHandler);
    }

    return { center, setMap };
}


export function usePitch(defaultValue: number, map?: IMap, event: TMapEvent = 'pitchend') {
    let m = map;
    const pitch = ref(m?.getPitch() || defaultValue);
    const cameraChangeHandler = () => {
        pitch.value = m!.getPitch();
    }

    m?.on(event, cameraChangeHandler);

    function setMap(map: IMap) {
        m?.off(event, cameraChangeHandler);
        m = map;
        m.on(event, cameraChangeHandler);
    }

    return { pitch, setMap };
}

export function useBearing(defaultValue: number, map?: IMap, event: TMapEvent = 'rotateend') {
    let m = map;
    const bearing = ref(m?.getBearing() || defaultValue);

    const cameraChangeHandler = () => {
        bearing.value = m!.getBearing();
    };

    m?.on(event, cameraChangeHandler);

    function setMap(map: IMap) {
        m?.off(event, cameraChangeHandler);
        m = map;
        m.on(event, cameraChangeHandler);
    }

    return { bearing, setMap };
}


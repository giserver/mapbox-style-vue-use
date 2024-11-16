import { Component, createApp } from "vue";

export function createMapControl(map: maplibregl.Map, component: Component, data?: Record<string, unknown>, position: maplibregl.ControlPosition | "top-center" | "bottom-center" = 'top-right') {
    const div = document.createElement('div');
    div.classList.add("maplibregl-ctrl");
    createApp(component, data).mount(div);

    if (position !== 'top-center' && position !== "bottom-center")
        map.addControl({
            onAdd() {
                return div;
            },
            onRemove() {
                div.remove();
            }
        }, position);

    else {
        let container = document.querySelector(`.maplibregl-ctrl-${position}`);
        if (!container) {
            container = document.createElement('div');
            container.classList.add(`maplibregl-ctrl-${position}`);
            map._controlContainer.append(container);
        }

        container.append(div);
    }
}

export function createMapPopup(map: maplibregl.Map, position: maplibregl.LngLatLike, component: Component, data?: Record<string, unknown>) {
    const div = document.createElement('div');
    div.classList.add("maplibregl-popup");
    createApp(component, data).mount(div);

    // @ts-ignore
    const popup = new maplibregl.Popup()
        .setDOMContent(div)
        .setLngLat(position)
        .addTo(map);

    return
}
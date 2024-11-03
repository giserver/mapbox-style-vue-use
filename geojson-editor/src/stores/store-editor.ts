import { computed, ref } from "vue";

export namespace StoreEditor {
    const _show = ref(false);

    export function toggle() {
        _show.value = !_show.value;
    }

    export function showEditor(value: boolean) {
        _show.value = value;
    }

    export const show = computed(() => {
        return _show.value;
    })
}
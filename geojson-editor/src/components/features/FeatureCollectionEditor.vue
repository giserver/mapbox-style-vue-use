<template>
    <div ref="codeEditBox" class="fc-editor"></div>
</template>

<script setup lang="ts">
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import * as monaco from 'monaco-editor'
import geojson_schema from '../../contracts/geojson-schema.json';
import { onMounted, ref, watch } from 'vue';

self.MonacoEnvironment = {
    getWorker(_: string, label: string) {
        if (label === 'json') {
            return new jsonWorker()
        }

        return new EditorWorker()
    },
}

monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    schemas: [
        {
            uri: 'https://geojson.org/schema/GeoJSON.json',
            fileMatch: ['*'],
            schema: geojson_schema
        }
    ]
});

const props = defineProps<{
    fc: GeoJSON.FeatureCollection
}>();

const codeEditBox = ref<HTMLDivElement>();
let editor: monaco.editor.IStandaloneCodeEditor;

onMounted(() => {
    editor = monaco.editor.create(codeEditBox.value!, {
        value: JSON.stringify(props.fc, null, 4),
        language: 'json',
        theme: 'vs-dark',
        minimap: {
            enabled: false
        },
        automaticLayout: true,
        formatOnPaste: true
    });
});

watch(() => props.fc, (a) => {
    editor.setValue(JSON.stringify(props.fc, null, 4));
});
</script>

<style scoped>
.fc-editor {
    height: 100%;
    width: 100%;
}
</style>
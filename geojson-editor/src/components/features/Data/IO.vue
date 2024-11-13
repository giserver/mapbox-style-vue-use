<template>
    <div class="up-down-load">
        <div class="upload" @click="handleUpload">
            <svg t="1731034374048" class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="32"
                height="20">
                <path
                    d="M576 631.466667V725.333333h170.666667c59.733333-8.533333 106.666667-64 106.666666-128 0-72.533333-55.466667-128-128-128-17.066667 0-29.866667 4.266667-42.666666 8.533334V469.333333c0-93.866667-76.8-170.666667-170.666667-170.666666s-170.666667 76.8-170.666667 170.666666c0 17.066667 4.266667 29.866667 4.266667 46.933334-8.533333-4.266667-17.066667-4.266667-25.6-4.266667C260.266667 512 213.333333 558.933333 213.333333 618.666667S260.266667 725.333333 320 725.333333h170.666667v-93.866666l-46.933334 46.933333L384 618.666667l149.333333-149.333334 149.333334 149.333334-59.733334 59.733333-46.933333-46.933333z m0 93.866666v85.333334h-85.333333v-85.333334h-42.666667v85.333334h-128C213.333333 810.666667 128 725.333333 128 618.666667c0-85.333333 55.466667-157.866667 128-183.466667C273.066667 311.466667 379.733333 213.333333 512 213.333333c110.933333 0 209.066667 72.533333 243.2 170.666667 102.4 12.8 183.466667 102.4 183.466667 213.333333s-85.333333 200.533333-192 213.333334h-128v-85.333334h-42.666667z"
                    fill="#1e1e1e" p-id="8232" style="--darkreader-inline-fill: #33373a;"></path>
            </svg>
        </div>
        <div class="download" @click="handleDownload">
            <svg t="1731034330703" class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="32"
                height="20">
                <path
                    d="M490.666667 644.266667V469.333333h85.333333v174.933334l46.933333-46.933334 59.733334 59.733334-68.266667 68.266666h132.266667c59.733333-8.533333 106.666667-64 106.666666-128 0-72.533333-55.466667-128-128-128-17.066667 0-29.866667 4.266667-42.666666 8.533334V469.333333c0-93.866667-76.8-170.666667-170.666667-170.666666s-170.666667 76.8-170.666667 170.666666c0 17.066667 4.266667 29.866667 4.266667 46.933334-8.533333-4.266667-17.066667-4.266667-25.6-4.266667C260.266667 512 213.333333 558.933333 213.333333 618.666667S260.266667 725.333333 320 725.333333h132.266667L384 657.066667l59.733333-59.733334 46.933334 46.933334z m123.733333 81.066666l-81.066667 81.066667-81.066666-81.066667H405.333333v85.333334h-85.333333C213.333333 810.666667 128 725.333333 128 618.666667c0-85.333333 55.466667-157.866667 128-183.466667C273.066667 311.466667 379.733333 213.333333 512 213.333333c110.933333 0 209.066667 72.533333 243.2 170.666667 102.4 12.8 183.466667 102.4 183.466667 213.333333s-85.333333 200.533333-192 213.333334h-85.333334v-85.333334h-46.933333z"
                    fill="#1e1e1e" style="--darkreader-inline-fill: #33373a;"></path>
            </svg>
        </div>
    </div>
</template>

<script setup lang="ts">
import { TIdentityGeoJSONFeature } from '../../../../../packages/maplugin-core';
import FileProcesses from '../../../services/file-processes';

const props = defineProps<{
    onUpload(features: Array<TIdentityGeoJSONFeature>): void,
    onDownload(): GeoJSON.FeatureCollection
}>();

function handleUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = FileProcesses.filter(x => x.decode).map(x => x.extension).join(", ");
    input.onchange = async function (e: any) {
        const file: File = e.target.files[0];
        const extension = file.name.split('.').pop()!;
        const features = await FileProcesses.find(x => x.extension === `.${extension}`)!.decode!(file);
        props.onUpload(features);
        input.remove();
    }
    input.click();
}

async function handleDownload() {
    const geojson = props.onDownload();

    if ((window as any)['showSaveFilePicker']) {
        const opts = {
            types: FileProcesses.filter(x => x.encode).map(x => ({
                description: x.description,
                accept: {
                    [x.contentType]: [x.extension]
                }
            })),
        };

        let writable: FileSystemWritableFileStream | undefined;
        try {
            const handle: FileSystemFileHandle = await (window as any).showSaveFilePicker(opts); // 打开保存文件对话框
            writable = await handle.createWritable(); // 创建可写入的文件对象

            const extension = handle.name.split('.').pop()!;
            let encode = FileProcesses.find(x => x.extension === `.${extension}`)?.encode;
            if (!encode) encode = FileProcesses.find(x => x.extension === '.geojson')!.encode!;

            const encodeData = await encode(geojson);
            writable.write(encodeData).then(() => {
                writable?.close();
            });

        } catch (e) {
            writable?.close();
        }
    }
    else {
        const blob = new Blob([JSON.stringify(geojson)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "geojson.geojson";
        a.click();
        a.remove();
    }
}

</script>

<style scoped>
.up-down-load {
    display: flex;
    align-items: center;
    background: var(--color-bg);
    border-radius: 6px;
    overflow: hidden;
}

.up-down-load>div {
    line-height: 0;
    cursor: pointer;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.up-down-load>div:hover {
    background-color: var(--color-hover);
}
</style>
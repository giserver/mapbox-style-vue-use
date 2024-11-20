<template>
    <div class="detail">
        <div class="detail-data"></div>
        <div class="detail-action">
            <div class="detail-action-delete" @click="onDelete">删除</div>
            <div class="detail-action-edit" @click="onEdit">修改</div>
            <div class="detail-action-copy" @click="onCopy">复制</div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    onDelete():void,
    onEdit():void
    onCopy():void,
    feature: GeoJSON.Feature
}>();


</script>

<style scoped>
.detail {
    width: 200px;
    background-color: var(--color-bg);
}

.detail-data {
    max-height: 300px;
    overflow-y: auto;
}

.detail-action {
    display: flex;
}

.detail-action>div {
    cursor: pointer;
    flex: 1;
    text-align: center;
    border: 1px solid #ccc;
}

.detail-action>div:hover {
    background-color: var(--color-hover);
}

.detail-action-delete {
    color: #f00;
}
</style>
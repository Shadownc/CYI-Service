<template>
  <n-tabs
    type="bar"
    size="large"
    :animated="true"
    :tabs-padding="20"
    pane-style="padding: 20px;"
  >
    <n-tab-pane name="链接">
      <CopyInput :value="url" />
    </n-tab-pane>
    <n-tab-pane name="HTML">
      <CopyInput :value="htmlText" />
    </n-tab-pane>
    <n-tab-pane name="Markdown">
      <CopyInput :value="markdownText" />
    </n-tab-pane>
    <template #suffix>
      <n-text style="padding-right: 15px">点击一键复制</n-text>
    </template>
  </n-tabs>
</template>

<script setup>
import CopyInput from "@/components/front/CopyInput.vue";
const props = defineProps({
  fileInfo: {
    type: Object,
    required: true,
    default: null,
  },
});
const url = computed(() => {
  return props.fileInfo.url;
});
const htmlText = computed(() => {
  return `<img src="${props.fileInfo.url}" alt="${props.fileInfo.filename}" border="0" />`;
});

const markdownText = computed(() => {
  return `![${props.fileInfo.filename}](${props.fileInfo.url})`;
});
</script>
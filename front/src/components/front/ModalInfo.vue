<template>
  <n-modal :show="show" :close-on-esc="false" :mask-closable="false" @update:show="updateShow" preset="card" title="详情"
    @close="updateShow(false)" style="width: 800px; height: auto">
    <n-flex justify="center">
      <n-card>
        <template #cover>
          <div id="image-container">
            <n-image lazy :src="fileInfo.url" object-fit="contain" fallback-src="https://img.loliapi.cn/i/pc/img52.webp"
              :intersection-observer-options="{
                root: '#image-container',
              }" style="width: 100%; height: auto;max-height: 500px; justify-content: center" />
          </div>

        </template>
      </n-card>
      <TabInfo :fileInfo="fileInfo" />
    </n-flex>
  </n-modal>
</template>

<script setup>
import TabInfo from "./TabInfo.vue";
const props = defineProps({
  show: {
    type: Boolean,
    required: true,
    default: false,
  },
  fileInfo: {
    type: Object,
    required: true,
    default: null,
  },
});

const emit = defineEmits(["update:show"]);

const updateShow = (value) => {
  emit("update:show", value);
};
</script>
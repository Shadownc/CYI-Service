<template>
  <n-input-group>
    <n-input :value="value" readonly :style="{ width: '70%' }" />
    <n-button type="primary" ghost @click="copyToClipboard">
      <template #icon>
        <n-icon><Copy /></n-icon>
      </template>
    </n-button>
  </n-input-group>
</template>

<script setup>
import { Copy } from "@vicons/fa";

const props = defineProps({
  value: {
    type: String,
    required: true,
  },
});

const isCopying = ref(false);

const copyToClipboard = async () => {
  if (!props.value) {
    message.warning("Nothing to copy!");
    return;
  }

  isCopying.value = true;
  try {
    await navigator.clipboard.writeText(props.value);
    $message.success("复制成功");
  } catch (error) {
    console.error("Copy failed", error);
    $message.error("复制失败!");
  } finally {
    isCopying.value = false;
  }
};
</script>
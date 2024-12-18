<template>
  <div class="flex items-center">
    <label v-if="label || label === 0" class="flex-shrink-0" :style="{ width: `${labelWidth}px` }">
      {{ label }}
    </label>
    <div :style="{ width: `${contentWidth}px` }" class="flex-shrink-0">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: '',
  },
  labelWidth: {
    type: Number,
    default: 80,
  },
  contentWidth: {
    type: Number,
    default: 220,
  },
})
</script>

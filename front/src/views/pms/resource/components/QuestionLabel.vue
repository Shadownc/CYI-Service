<template>
  <span class="flex items-center">
    <n-popover v-if="content" trigger="hover">
      <template #trigger>
        <i class="i-material-symbols:help mr-4" />
      </template>
      <span>{{ content }}</span>
    </n-popover>
    {{ label }}
  </span>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    default: '',
  },
})
</script>

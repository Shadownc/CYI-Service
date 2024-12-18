<template>
  <main class="cus-scroll h-full flex-col flex-1 bg-#f5f6fb dark:bg-#121212">
    <main :class="{ 'flex-1': full }" class="m-12">
      <slot />
    </main>
    <slot v-if="$slots.footer" name="footer" />
    <TheFooter v-else-if="showFooter" class="mb-12 mt-auto" />
    <n-back-top :bottom="20" />
  </main>
</template>

<script setup>
defineProps({
  full: {
    type: Boolean,
    default: false,
  },
  showFooter: {
    type: Boolean,
    default: false,
  },
})
</script>

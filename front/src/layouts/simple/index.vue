<template>
  <div class="wh-full flex">
    <aside
      class="flex-col flex-shrink-0 transition-width-300"
      :class="appStore.collapsed ? 'w-64' : 'w-220'"
      border-r="1px solid light_border dark:dark_border"
    >
      <SideBar />
    </aside>

    <article class="w-0 flex-col flex-1">
      <slot />
    </article>
  </div>
</template>

<script setup>
import { useAppStore } from '@/store'
import SideBar from './sidebar/index.vue'

const appStore = useAppStore()
</script>

<style>
.collapsed {
  width: 64px;
}
</style>

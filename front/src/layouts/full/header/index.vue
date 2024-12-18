<template>
  <AppCard class="flex items-center px-12" border-b="1px solid light_border dark:dark_border">
    <MenuCollapse />

    <BreadCrumb />

    <div class="ml-auto flex flex-shrink-0 items-center px-12 text-18">
      <ToggleTheme />

      <Fullscreen />

      <i
        class="i-fe:github mr-16 cursor-pointer"
        @click="handleLinkClick('https://github.com/Shadownc')"
      />
      <i
        class="i-me:gitee mr-16 cursor-pointer"
        @click="handleLinkClick('https://blog.lmyself.top/')"
      />

      <ThemeSetting class="mr-16" />

      <UserAvatar />
    </div>
  </AppCard>
</template>

<script setup>
import { ToggleTheme } from '@/components'
import { BreadCrumb, Fullscreen, MenuCollapse, UserAvatar } from '@/layouts/components'

function handleLinkClick(link) {
  window.open(link)
}
</script>

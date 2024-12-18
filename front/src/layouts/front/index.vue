<template>
  <div class="wh-full flex">
    <n-layout-header style="height: 70px; padding: 0 30px" bordered>
      <n-flex justify="space-between" style="width: 100%; height: 100%">
        <n-flex align="center"> CYI-Service </n-flex>
        <n-flex justify="center" align="center" :wrap="false">
          <n-menu
            class="mt-6"
            v-model:value="activeKey"
            mode="horizontal"
            :options="menuOptions"
            responsive
          ></n-menu>
          <n-icon
            size="20"
            style="cursor: pointer"
            :color="appStore.isDark ? '#FFEA00' : '#000'"
            @click="toggleTheme"
          >
            <Sunny v-if="appStore.isDark" />
            <MoonSharp v-else />
          </n-icon>
          <n-flex>
            <Avatar v-if="authStore.isLogin" />
          </n-flex>
        </n-flex>
      </n-flex>
    </n-layout-header>
    <slot />
    <n-layout-footer
      bordered
      position="absolute"
      style="height: 70px; padding: 0 30px"
    >
      <n-flex justify="center" align="center" style="width: 100%; height: 100%">
        &copy; 2024 IMyself.<n-divider vertical /><a
          href="https://blog.lmyself.top/"
          target="_blank"
          >Blog</a
        >
      </n-flex>
    </n-layout-footer>
  </div>
</template>
  
  <script setup>
import { darkTheme } from "naive-ui";
import { useAppStore, useAuthStore } from "@/store";
import { Sunny, MoonSharp } from "@vicons/ionicons5";
import { RouterLink, useRoute, useRouter } from "vue-router";
import Avatar from "./Avatar.vue";
const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();

const activeKey = ref(route.name || "Home");
const menuOptions = computed(() => [
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: "Home",
          },
        },
        { default: () => "主页" }
      ),
    key: "Home",
  },
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: "PublicImg",
          },
        },
        { default: () => "图片广场" }
      ),
    key: "PublicImg",
  },
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: "Login",
            query: {
              redirect: route.fullPath,
            },
          },
        },
        { default: () => "登录" }
      ),
    key: "Login",
    show: !authStore.isLogin,
  },
]);

onMounted(() => {
  activeKey.value = route.name || "Home";
});

const toggleTheme = () => {
  appStore.toggleDark();
};
</script>
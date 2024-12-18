<template>
  <n-dropdown :options="options" trigger="hover" @select="getCommand">
    <n-avatar round size="medium" src="avatar.jpg" />
  </n-dropdown>
</template>

<script setup>
import { useAuthStore } from "@/store";
import api from "@/api";
const authStore = useAuthStore();
const router = useRouter();

const options = ref([
  {
    label: "管理后台",
    key: "adminHome",
    icon: () => h("i", { class: "i-mdi-home text-14" }),
  },
  {
    label: "退出登录",
    key: "logout",
    icon: () => h("i", { class: "i-mdi:exit-to-app text-14" }),
  },
]);

const getCommand = async (v) => {
  switch (v) {
    case "adminHome":
      router.push("/adminHome");
      break;
    case "logout":
      $dialog.confirm({
        title: "提示",
        type: "info",
        content: "确认退出？",
        async confirm() {
          try {
            await api.logout();
          } catch (error) {
            console.error(error);
          }
          authStore.logout();
          $message.success("已退出登录");
        },
      });
  }
};
</script>

<style lang="scss" scoped></style>
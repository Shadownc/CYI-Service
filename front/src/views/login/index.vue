<template>
  <div
    class="wh-full flex-col bg-[url(@/assets/images/login_bg.webp)] bg-cover"
  >
    <div
      class="m-auto max-w-700 min-w-345 f-c-c rounded-8 bg-opacity-20 bg-cover p-12 card-shadow auto-bg"
    >
      <div class="hidden w-380 px-20 py-35 md:block">
        <img
          src="@/assets/images/login_banner.webp"
          class="w-full"
          alt="login_banner"
        />
      </div>

      <div class="w-320 flex-col px-20 py-32">
        <!-- <h2 class="f-c-c text-24 text-#6a6a6a font-normal">
          <img src="@/assets/images/logo.png" class="mr-12 h-50" />
          {{ title }}
        </h2> -->
        <n-tabs
          animated
          :value="tabValue"
          justify-content="center"
          @update:value="handleUpdateValue"
        >
          <n-tab-pane name="signin" tab="登录">
            <n-input
              v-model:value="loginInfo.username"
              autofocus
              class="mt-32 h-40 items-center"
              placeholder="请输入用户名"
              :maxlength="20"
            >
              <template #prefix>
                <i class="i-fe:user mr-12 opacity-20" />
              </template>
            </n-input>
            <n-input
              v-model:value="loginInfo.password"
              class="mt-20 h-40 items-center"
              type="password"
              show-password-on="mousedown"
              placeholder="请输入密码"
              :maxlength="20"
              @keydown.enter="handleLogin()"
            >
              <template #prefix>
                <i class="i-fe:lock mr-12 opacity-20" />
              </template>
            </n-input>

            <n-checkbox
              class="mt-20"
              :checked="isRemember"
              label="记住我"
              :on-update:checked="(val) => (isRemember = val)"
            />
          </n-tab-pane>
          <n-tab-pane name="signup" tab="注册" v-if="enable_register">
            <n-input
              v-model:value="registerInfo.username"
              autofocus
              class="mt-32 h-40 items-center"
              placeholder="请输入用户名"
              :maxlength="20"
            >
              <template #prefix>
                <i class="i-fe:user mr-12 opacity-20" />
              </template>
            </n-input>
            <n-input
              v-model:value="registerInfo.email"
              autofocus
              class="mt-32 h-40 items-center"
              placeholder="请输入邮箱"
              :maxlength="20"
            >
              <template #prefix>
                <i class="i-mdi-email mr-12 opacity-20" />
              </template>
            </n-input>
            <n-input
              v-model:value="registerInfo.password"
              class="mt-20 h-40 items-center"
              type="password"
              show-password-on="mousedown"
              placeholder="请输入密码"
              :maxlength="20"
              @keydown.enter="handleLogin()"
            >
              <template #prefix>
                <i class="i-fe:lock mr-12 opacity-20" />
              </template>
            </n-input>
          </n-tab-pane>
        </n-tabs>
        <div class="mt-20 flex items-center">
          <n-button
            class="h-40 flex-1 rounded-5 text-16"
            type="primary"
            :loading="loading"
            @click="handleSubmit()"
          >
            登录
          </n-button>
        </div>
      </div>
    </div>

    <TheFooter class="py-12" />
  </div>
</template>

<script setup>
import { useAuthStore, useSettingsStore } from "@/store";
import { lStorage, throttle } from "@/utils";
import { useStorage } from "@vueuse/core";
import api from "./api";
import { AES_Encrypt, AES_Decrypt } from "@/utils/crypto";

const authStore = useAuthStore();
const settingStore = useSettingsStore();
const router = useRouter();
const route = useRoute();
const title = import.meta.env.VITE_TITLE;
const tabValue = ref("signin");

const { enable_register } = settingStore.config;

const loginInfo = ref({
  username: "",
  password: "",
});

const registerInfo = ref({
  username: "",
  email: "",
  password: "",
});

const localLoginInfo = lStorage.get("loginInfo");
if (localLoginInfo) {
  loginInfo.value.username = localLoginInfo.username || "";
  loginInfo.value.password = AES_Decrypt(localLoginInfo.password) || "";
}

function quickLogin() {
  loginInfo.value.username = "admin";
  loginInfo.value.password = "123456";
  handleLogin(true);
}
const handleUpdateValue = (tabName) => {
  tabValue.value = tabName;
};

const handleSubmit = () => {
  tabValue.value == "signin" ? handleLogin() : handleRegister();
};

const emailPattern =
  /^[a-zA-Z0-9._%+-]+@(qq\.com|gmail\.com|163\.com|126\.com|hotmail\.com|yahoo\.com)$/;
const handleRegister = async () => {
  let { email } = registerInfo.value;
  if (!emailPattern.test(email)) return $message.warning("请输入正确的邮箱");
  let password = AES_Encrypt(registerInfo.value.password);
  $message.loading("正在注册，请稍后...", { key: "register" });
  const res = await api.register({ ...registerInfo.value, password });
  const { code, message } = res;
  if (code == 200) {
    const d = $dialog.warning({
      content: "注册成功",
      title: "提示",
      positiveText: "去登录",
      negativeText: "取消",
      async onPositiveClick() {
        try {
          let { username, password } = registerInfo.value;
          tabValue.value = "signin";
          loginInfo.value = {
            username,
            password,
          };
        } catch (error) {
          console.error(error);
          d.loading = false;
        }
      },
    });
  } else {
    $message.error(message);
  }
};

const isRemember = useStorage("isRemember", true);
const loading = ref(false);
async function handleLogin() {
  let { username, password } = loginInfo.value;
  if (!username || !password) return $message.warning("请输入用户名和密码");
  try {
    loading.value = true;
    password = AES_Encrypt(password);
    $message.loading("正在验证，请稍后...", { key: "login" });
    const { token: accessToken } = await api.login({
      email: username,
      password: password,
    });
    if (isRemember.value) {
      lStorage.set("loginInfo", { username, password });
    } else {
      lStorage.remove("loginInfo");
    }
    onLoginSuccess({ accessToken });
  } catch (error) {
    $message.destroy("login");
    console.error(error);
  }
  loading.value = false;
}

async function onLoginSuccess(data = {}) {
  authStore.setToken(data);
  $message.loading("登录中...", { key: "login" });
  try {
    $message.success("登录成功", { key: "login" });
    if (route.query.redirect) {
      const path = route.query.redirect;
      delete route.query.redirect;
      router.push({ path, query: route.query });
    } else {
      router.push("/");
    }
  } catch (error) {
    console.error(error);
    $message.destroy("login");
  }
}
</script>

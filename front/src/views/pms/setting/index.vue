<template>
    <CommonPage>
        <n-card title="网站设置" class="w-[70%]">
            <n-form ref="formRef" :label-width="80" :model="settingStore.config">
                <n-form-item label="开启注册">
                    <n-switch v-model:value="settingStore.config.enable_register" />
                </n-form-item>
                <n-form-item label="token过期时间">
                    <n-flex vertical>
                        <n-input-number v-model:value="settingStore.config.expiration_time" :min="1" :max="24" />
                        <n-alert :show-icon="false" type="error">
                            token过期时间:单位为小时
                        </n-alert>
                    </n-flex>
                </n-form-item>
                <n-form-item label="必须登录上传">
                    <n-switch v-model:value="settingStore.config.upload_require_auth" />
                </n-form-item>
                <!-- <n-form-item label="路由白名单">
                    <n-flex>
                        <n-input v-model:value="whiteList" />
                        <n-alert :show-icon="false" type="error">
                            不清楚怎么改的不要随意修改 非白名单内的路径需要登录才可访问<br>
                            默认值为:/login,/,/publicimg,/404
                        </n-alert>
                    </n-flex>
                </n-form-item> -->
                <n-form-item>
                    <n-button :loading="loading" type="info" @click="saveSetting">
                        保存
                    </n-button>
                </n-form-item>
            </n-form>
        </n-card>
    </CommonPage>
</template>

<script setup>
import api from '@/api'
import { useSettingsStore } from "@/store";
const settingStore = useSettingsStore();
defineOptions({ name: 'Settings' })

const formRef = ref(null);
const loading = ref(false)

const whiteList = ref(null)
if(settingStore?.config?.whitelist_routes){
    whiteList.value=settingStore.config.whitelist_routes.join(',')
}

const saveSetting = async () => {
    loading.value = true
    if(settingStore?.config?.whitelist_routes){
        settingStore.config.whitelist_routes = whiteList.value.split(',')
    }
    try {
        const res = await api.updateSettings(settingStore.config)
        $message.success(res.message)
        settingStore.getSetting()
        loading.value = false
    } catch (e) {
        loading.value = false
    }
}

onMounted(() => {
    settingStore.getSetting()
})
</script>

import { usePermissionStore, useRouterStore, useTabStore, useUserStore } from '@/store'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: undefined,
    isLogin: false
  }),
  actions: {
    setToken({ accessToken }) {
      this.accessToken = accessToken
      this.isLogin = true
    },
    resetToken() {
      this.$reset()
    },
    toLogin() {
      const { router, route } = useRouterStore()
      // router.replace({
      //   path: '/login',
      //   query: route.query,
      // })
      // router.replace({
      //   path: '/'
      // })
      window.location.href = '/'
    },
    async switchCurrentRole(data) {
      this.resetLoginState()
      await nextTick()
      this.setToken(data)
    },
    resetLoginState() {
      const { resetUser } = useUserStore()
      const { resetRouter } = useRouterStore()
      const { resetPermission, accessRoutes } = usePermissionStore()
      const { resetTabs } = useTabStore()
      // 重置路由
      resetRouter(accessRoutes)
      // 重置用户
      resetUser()
      // 重置权限
      resetPermission()
      // 重置Tabs
      resetTabs()
      // 重置token
      this.resetToken()
    },
    async logout() {
      this.isLogin = false
      this.resetLoginState()
      this.toLogin()
    },
  },
  persist: {
    key: 'vue-naivue-admin_auth',
  },
})

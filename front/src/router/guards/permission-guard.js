import api from '@/api'
import { useAuthStore, usePermissionStore, useUserStore, useSettingsStore } from '@/store'
import { getPermissions, getUserInfo } from '@/store/helper'

let WHITE_LIST = ['/login', '/', '/publicimg', '/404']
let fetchedWhiteList = false
export function createPermissionGuard(router) {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore()
    const token = authStore.accessToken
    const settingStore = useSettingsStore()

    // 如果还没有获取过白名单，则从接口获取白名单
    if (!fetchedWhiteList) {
      try {
        await settingStore.getSetting()
        // console.log(settingStore.config);
        const { upload_require_auth } = settingStore.config
        if (upload_require_auth) WHITE_LIST = ['/login', '/404']
        // WHITE_LIST = whitelist_routes || WHITE_LIST  // 更新白名单
        fetchedWhiteList = true
      } catch (error) {
        console.error("获取白名单失败", error)
      }
    }

    /** 没有token */
    if (!token) {
      if (WHITE_LIST.includes(to.path))
        return true
      return { path: 'login', query: { ...to.query, redirect: to.path } }
    }

    // 有token的情况
    if (to.path === '/login')
      return { path: '/' }
    if (WHITE_LIST.includes(to.path))
      return true

    const userStore = useUserStore()
    const permissionStore = usePermissionStore()
    if (!userStore.userInfo) {
      // const [user, permissions] = await Promise.all([getUserInfo(), getPermissions()])
      const user = await getUserInfo()
      const permissions = await getPermissions(user)
      userStore.setUser(user)
      permissionStore.setPermissions(permissions)
      const routeComponents = import.meta.glob('@/views/**/*.vue')
      permissionStore.accessRoutes.forEach((route) => {
        route.component = routeComponents[route.component] || undefined
        !router.hasRoute(route.name) && router.addRoute(route)
      })
      return { ...to, replace: true }
    }

    const routes = router.getRoutes()
    if (routes.find(route => route.name === to.name))
      return true

    // 判断是无权限还是404
    const { data: hasMenu } = await api.validateMenuPath(to.path)
    return hasMenu
      ? { name: '403', query: { path: to.fullPath }, state: { from: 'permission-guard' } }
      : { name: '404', query: { path: to.fullPath } }
  })
}

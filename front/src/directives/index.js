import { router } from '@/router'

const permission = {
  mounted(el, binding) {
    const currentRoute = unref(router.currentRoute)
    const btns = currentRoute.meta?.btns?.map(item => item.code) || []
    if (!btns.includes(binding.value)) {
      el.remove()
    }
  },
}

export function setupDirectives(app) {
  app.directive('permission', permission)
}

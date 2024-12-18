export const basicRoutes = [
  {
    name: 'Login',
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      title: '登录页',
      layout: 'empty',
    },
  },
  {
    path: "/",
    name: 'Home',
    component: () => import('@/views/front/home.vue'),
    meta: {
      title: '首页',
      layout: 'front'
    },
  },
  {
    path: "/publicimg",
    name: 'PublicImg',
    component: () => import('@/views/front/publicImg.vue'),
    meta: {
      title: '图片广场',
      layout: 'front'
    },
  },
  {
    name: 'AdminHome',
    path: '/adminHome',
    component: () => import('@/views/home/index.vue'),
    meta: {
      title: '管理首页',
    },
  },

  {
    name: '404',
    path: '/404',
    component: () => import('@/views/error-page/404.vue'),
    meta: {
      title: '页面飞走了',
      layout: 'empty',
    },
  },

  {
    name: '403',
    path: '/403',
    component: () => import('@/views/error-page/403.vue'),
    meta: {
      title: '没有权限',
      layout: 'empty',
    },
  },
]

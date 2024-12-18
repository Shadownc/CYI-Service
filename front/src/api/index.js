import { request } from '@/utils'

export default {
  // 获取用户信息
  getUser: () => request.get('/userinfo'),
  getSettings: () => request.get('/settings'),
  updateSettings: data => request.post('/updateSetting', data),
  // 刷新token
  refreshToken: () => request.get('/auth/refresh/token'),
  // 登出
  logout: () => request.post('/logout'),
  // 切换当前角色
  switchCurrentRole: role => request.post(`/auth/current-role/switch/${role}`),
  // 获取角色权限
  getRolePermissions: () => request.get('/role/permissions/tree'),
  // 验证菜单路径
  validateMenuPath: path => request.get(`/permission/menu/validate?path=${path}`),
}

export const upload = (data) => request.post('/upload', data)
export const getPublciImg = (data) => request.post('/pubimg', data)

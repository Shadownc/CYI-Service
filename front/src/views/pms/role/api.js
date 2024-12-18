import { request } from '@/utils'

export default {
  create: data => request.post('/role', data),
  read: (params = {}) => request.get('/role/page', { params }),
  update: data => request.patch(`/role/${data.id}`, data),
  delete: id => request.delete(`/role/${id}`),

  getAllPermissionTree: () => request.get('/permission/tree'),
  getAllUsers: (params = {}) => request.get('/user', { params }),
  addRoleUsers: (roleId, data) => request.patch(`/role/users/add/${roleId}`, data),
  removeRoleUsers: (roleId, data) => request.patch(`/role/users/remove/${roleId}`, data),
}

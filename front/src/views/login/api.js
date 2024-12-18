import { request } from '@/utils'

export default {
  // toggleRole: data => request.post('/auth/role/toggle', data),
  login: data => request.post('/login', data),
  register: data => request.post('/register', data),
  getUser: () => request.get('/userinfo'),
}

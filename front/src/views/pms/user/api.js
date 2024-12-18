import { request } from '@/utils'
import { AES_Encrypt } from "@/utils/crypto";

export default {
  create: data =>{
    data.password=AES_Encrypt(data.password)
    console.log(data);
    return request.post('/admin/addUser', data)
  },
  read: data => request.post('/admin/userList', data),
  update: data => request.post(`/admin/resetPassword`, data),
  delete: id => request.delete(`/admin/deleteUser/${id}`),
  resetPwd: (data) => request.post(`/admin/resetPassword`, data),

  // getAllRoles: () => request.get('/role?enable=1'),
}

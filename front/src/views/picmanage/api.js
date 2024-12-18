import { request } from '@/utils'

export default {
    create: data => {

    },
    read: data => request.post('/admin/imgList', data),
    update: data => { },
    delete: data => request.post(`/admin/deleteImg`, data),
    resetPwd: (data) => { },
}

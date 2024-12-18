import api from '@/api'
import { basePermissions } from '@/settings'

export async function getUserInfo() {
  const res = await api.getUser()
  const { id, username, profile, email, roles, user_type: currentRole } = res.data || {}
  return {
    id,
    username,
    avatar: profile?.avatar || '/avatar.jpg',
    nickName: profile?.nickName,
    gender: profile?.gender,
    address: profile?.address,
    email: email,
    roles,
    currentRole,
  }
}

export async function getPermissions(user) {
  const { currentRole } = user
  let asyncPermissions = []
  let menuData = [
    {
      "id": 1,
      "name": "资源管理",
      "code": "ImgMgt",
      "type": "MENU",
      "parentId": null,
      "path": null,
      "redirect": null,
      "icon": "i-fe:list",
      "component": null,
      "layout": null,
      "keepAlive": null,
      "method": null,
      "description": null,
      "show": true,
      "enable": true,
      "order": 1,
      "currentRole": ['admin','user'],
      "children": [
        {
          "id": 1,
          "name": "图片管理",
          "code": "fileImgMgt",
          "type": "MENU",
          "parentId": 2,
          "path": "/pms/picmanage",
          "redirect": null,
          "icon": "i-fe:image",
          "component": "/src/views/picmanage/index.vue",
          "layout": null,
          "keepAlive": null,
          "method": null,
          "description": null,
          "show": true,
          "enable": true,
          "order": 1
        }
      ]
    },
    {
      "id": 2,
      "name": "系统管理",
      "code": "SysMgt",
      "type": "MENU",
      "parentId": null,
      "path": null,
      "redirect": null,
      "icon": "i-fe:grid",
      "component": null,
      "layout": null,
      "keepAlive": null,
      "method": null,
      "description": null,
      "show": true,
      "enable": true,
      "order": 2,
      "currentRole": ['admin'],
      "children": [
        {
          "id": 4,
          "name": "用户管理",
          "code": "UserMgt",
          "type": "MENU",
          "parentId": 2,
          "path": "/pms/user",
          "redirect": null,
          "icon": "i-fe:user",
          "component": "/src/views/pms/user/index.vue",
          "layout": null,
          "keepAlive": true,
          "method": null,
          "description": null,
          "show": true,
          "enable": true,
          "order": 1,
          "children": [
            {
              "id": 11,
              "name": "创建新用户",
              "code": "AddUser",
              "type": "BUTTON",
              "parentId": 4,
              "path": null,
              "redirect": null,
              "icon": null,
              "component": null,
              "layout": null,
              "keepAlive": null,
              "method": null,
              "description": null,
              "show": true,
              "enable": true,
              "order": 1
            }
          ]
        },
        {
          "id": 5,
          "name": "网站设置",
          "code": "siteSetting",
          "type": "MENU",
          "parentId": 2,
          "path": "/pms/setting",
          "redirect": null,
          "icon": "i-fe:settings",
          "component": "/src/views/pms/setting/index.vue",
          "layout": "",
          "keepAlive": null,
          "method": null,
          "description": null,
          "show": true,
          "enable": true,
          "order": 2,
          "children": []
        }
      ]
    }
  ]
  try {
    // const res = await api.getRolePermissions()
    // asyncPermissions = res?.data || []
    asyncPermissions = menuData.filter(i => i.currentRole.includes(currentRole))
    // console.log(asyncPermissions);
  }
  catch (error) {
    console.error(error)
  }
  return basePermissions.concat(asyncPermissions)
}

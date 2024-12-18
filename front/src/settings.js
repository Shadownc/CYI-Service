export const defaultLayout = 'normal'

export const defaultPrimaryColor = '#316C72'

// 控制 LayoutSetting 组件是否可见
export const layoutSettingVisible = true

export const naiveThemeOverrides = {
  common: {
    primaryColor: '#316C72FF',
    primaryColorHover: '#316C72E3',
    primaryColorPressed: '#2B4C59FF',
    primaryColorSuppl: '#316C72E3',
  },
}

export const basePermissions = [
  {
    code: 'ExternalLink',
    name: '外链(可内嵌打开)',
    type: 'MENU',
    icon: 'i-fe:external-link',
    order: 98,
    enable: true,
    show: true,
    children: [
      {
        code: 'ShowDocs',
        name: '项目文档',
        type: 'MENU',
        path: 'https://kfcgw50.me',
        icon: 'i-me:docs',
        order: 1,
        enable: true,
        show: true,
      },
      {
        code: 'ApiFoxDocs',
        name: '接口文档',
        type: 'MENU',
        path: '',
        icon: 'i-me:apifox',
        order: 2,
        enable: true,
        show: true,
      },
      {
        code: 'NaiveUI',
        name: 'Naive UI',
        type: 'MENU',
        path: 'https://www.naiveui.com/zh-CN/os-theme',
        icon: 'i-me:naiveui',
        order: 3,
        enable: true,
        show: true,
      },
      {
        code: 'MyBlog',
        name: '博客',
        type: 'MENU',
        path: 'https://blog.lmyself.top',
        icon: 'i-fa-solid:blog',
        order: 4,
        enable: true,
        show: true,
      },
    ],
  },
]

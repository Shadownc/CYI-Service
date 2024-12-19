<h1 align="center">CYI-Worker</h1>

CYI-Worker 是一个基于 Cloudflare Workers 的后端服务项目，提供了用户认证、图片管理、系统设置等功能的 API 服务。

## 功能特性

- 用户认证系统（登录、注册、登出）
- 图片管理（上传、获取、删除）
- 用户管理（添加、删除、密码重置）
- 系统设置管理
- 支持 CORS
- 模块化路由设计

## 项目结构
```bash
src/
├── controllers/ # 控制器层，处理具体业务逻辑
│ ├── admin.js # 管理员相关功能
│ ├── auth.js # 认证相关功能
│ ├── image.js # 图片相关功能
│ └── settings.js # 设置相关功能
├── middleware/ # 中间件
│ └── response.middleware.js # 响应处理中间件
├── routes/ # 路由定义
│ ├── admin.js # 管理员路由
│ ├── auth.js # 认证路由
│ ├── image.js # 图片路由
│ └── settings.js # 设置路由
├── utils/ # 工具函数
│ ├── router.js # 路由工具
│ └── index.js # 通用工具函数
└── index.js # 应用入口文件
```

## API 路由

### 认证相关
- `POST /login` - 用户登录
- `POST /register` - 用户注册
- `POST /logout` - 用户登出
- `GET /userinfo` - 获取用户信息
- `GET /protected` - 受保护的路由
- `GET /admin` - 管理员路由

### 图片相关
- `POST /upload` - 上传图片
- `POST /upload-links` - 上传图片链接
- `GET /file/:id` - 获取指定图片
- `POST /images` - 获取图片列表
- `POST /pubimg` - 获取公开图片

### 管理员相关
- `POST /admin/userList` - 获取用户列表
- `POST /admin/resetPassword` - 重置用户密码
- `POST /admin/addUser` - 添加用户
- `DELETE /admin/deleteUser/:userid` - 删除用户
- `POST /admin/imgList` - 获取图片列表
- `POST /admin/deleteImg` - 删除图片
- `POST /updateSetting` - 更新系统设置

### 设置相关
- `GET /settings` - 获取系统设置

## 环境要求

- Node.js 16+
- Cloudflare Workers 账号
- Wrangler CLI

## 安装部署

1. 克隆项目
```bash
git clone https://github.com/Shadownc/CYI-Service.git
cd service
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量 参考`wrangler.toml.example`直接删除`.example`修改值即可

4. 部署到 Cloudflare Workers
```bash
npm run deploy
```


## 技术栈

- Cloudflare Workers
- itty-router - 轻量级路由库
- D1 Database - Cloudflare 的 SQL 数据库
- KV Storage - Cloudflare 的对象存储

## 安全说明

- 所有敏感操作都需要 JWT 认证
- 管理员操作需要额外的权限验证
- 文件上传有大小和类型限制
- 所有请求都经过 CORS 验证

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request
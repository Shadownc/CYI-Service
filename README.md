<h1 align="center">CYI-Service</h1>

完全托管在 Cloudflare 的图床服务，包含前端界面和后端 API。

## 项目结构
```bash
CYI-Service/
├── front/ # Vue3 前端项目
└── service/ # Cloudflare Worker 后端项目
```


## 快速开始

### 前置要求

1. Node.js 环境
2. Cloudflare 账号
3. 已创建的 Cloudflare D1 数据库
4. 已创建的 Cloudflare KV 命名空间

### 安装 wrangler
```bash
npm install -g wrangler
npx wrangler login
```

### 自动部署

项目提供两个部署脚本：
- `deploy-front.js`: 部署前端到 Cloudflare Pages
- `deploy-service.js`: 部署后端到 Cloudflare Workers

#### 部署前端
```bash
npm run deploy:front
```

部署过程中需要输入：
- API 地址（你的 Worker 地址）
- Cloudflare Pages 项目名称

#### 部署后端
```bash
npm run deploy:service
```

部署过程中需要输入：
- D1 数据库名称
- D1 数据库 ID
- KV 命名空间 ID
- JWT Secret

#### 一键部署全部
```bash
npm run deploy
```

### 手动部署

如果需要手动部署，可以按以下步骤操作：

#### 前端部署

1. 复制 `front/.env.example` 为 `front/.env.production`
2. 修改 `VITE_AXIOS_BASE_URL` 为你的 API 地址
3. 进入 front 目录：`cd front`
4. 安装依赖：`npm install`
5. 构建项目：`npm run build`
6. 部署到 Pages：`npx wrangler pages deploy dist`

#### 后端部署

1. 复制 `service/wrangler.toml.example` 为 `service/wrangler.toml`
2. 修改配置：
   - `database_name`: D1 数据库名称
   - `database_id`: D1 数据库 ID
   - `id`: KV 命名空间 ID
   - `JWT_SECRET`: 自定义的 JWT 密钥
3. 进入 service 目录：`cd service`
4. 安装依赖：`npm install`
5. 部署：`npx wrangler deploy`

## 环境变量说明

### 前端环境变量 (.env.production)
```ini
VITE_TITLE = '后台管理'
VITE_USE_HASH = 'false'
VITE_PUBLIC_PATH = '/'
VITE_AXIOS_BASE_URL = '你的 Worker 地址'
```

### 后端配置 (wrangler.toml)
```toml
name = "your-worker-name"
main = "src/index.js"
compatibility_date = "2024-09-20"
[[d1_databases]]
binding = "CYI_IMGDB"
database_name = "your-database-name"
database_id = "your-database-id"
[[kv_namespaces]]
binding = "CYI_IMGKV"
id = "your-kv-namespace-id"
[vars]
JWT_SECRET = "your-jwt-secret"
```

## 获取必要的 ID

1. D1 数据库 ID:
   ```bash
   npx wrangler d1 list
   ```

2. KV 命名空间 ID:
   ```bash
   npx wrangler kv:namespace list
   ```

## 注意事项

1. 确保已经通过 `npx wrangler login` 完成 Cloudflare 登录
2. 部署前端前，确保 API 地址正确
3. 部署后端前，确保已创建所需的 D1 数据库和 KV 命名空间
4. 保管好你的 JWT Secret，它用于用户认证

## 许可证

本项目采用 [MIT](LICENSE) 许可证。

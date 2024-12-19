## 部署教程
1. 安装依赖
```
npm install
```
2. 登录到`Cloudflare`
```
npx wrangler login
```
如果全局安装过则执行命令
```
wrangler login
```
此命令将在浏览器中打开一个页面，要求您授权`Wrangler`访问您的`Cloudflare`账户。按照提示完成授权。
`windows`如果跳转到授权后跳转到`localhost`地址则是登录失败 解决方案（windows cmd下）：
```
set NODE_TLS_REJECT_UNAUTHORIZED=0
wrangler login
```
如果是在`PowerShell`执行登录命令：
```
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
wrangler login
```
3. 创建`Workers KV`命名空间
```
npx wrangler kv:namespace create "IMAGE_KV_NAMESPACE"
```
运行此命令后，您将获得一个`Namespace ID`。记下此`ID`，稍后将在`wrangler.toml`中使用。
``` toml
[[kv_namespaces]]
binding = "IMAGE_KV"
id = "YOUR_KV_NAMESPACE_ID" # 替换为上一步生成的 Namespace ID
```
4. 创建`D1`数据库绑定
在`wrangler.toml`中添加`D1`绑定配置：
```
[[d1_databases]]
name = "IMAGE_METADATA"
database_name = "IMAGE_METADATA_D1"
```
初始化`D1`数据库表：
```
wrangler d1 execute --database IMAGE_METADATA --file ../db/create_images_table.sql
```
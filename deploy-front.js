import fs from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import readline from 'readline'
import path from 'path'

const execAsync = promisify(exec)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

async function checkNodeModules() {
  try {
    await fs.access('./front/node_modules')
    return true
  } catch {
    return false
  }
}

async function execCommand(command) {
  try {
    const { stdout, stderr } = await execAsync(command, { encoding: 'utf8' })
    if (stdout) console.log(stdout)
    if (stderr) console.error(stderr)
  } catch (error) {
    throw new Error(`命令执行失败: ${error.message}`)
  }
}

async function checkWrangler() {
  try {
    await execAsync('npx wrangler --version')
    return true
  } catch {
    return false
  }
}

async function deployFront() {
  try {
    // 检查并安装 wrangler
    const hasWrangler = await checkWrangler()
    if (!hasWrangler) {
      console.log('📦 正在安装 wrangler...')
      await execCommand('npm install -D wrangler')
      console.log('✅ wrangler 安装完成')
    }

    // 获取用户输入
    const apiUrl = await question('请输入API地址 (例如: https://api.example.com): ')
    const projectName = await question('请输入Cloudflare Pages项目名称: ')

    // 读取 .env.example 文件
    let envContent = await fs.readFile('./front/.env.example', 'utf8')
    // 替换 VITE_AXIOS_BASE_URL 的值
    envContent = envContent.replace(
      /VITE_AXIOS_BASE_URL\s*=\s*.*$/m,
      `VITE_AXIOS_BASE_URL = '${apiUrl}'`
    )
    // 创建 .env.production 文件
    await fs.writeFile('./front/.env.production', envContent)
    console.log('✅ 已创建 .env.production 文件')

    // 创建 wrangler.toml 文件
    const wranglerContent = `name = "${projectName}"
compatibility_date = "2024-01-01"
workers_dev = true

[site]
bucket = "./dist"

# Pages 配置
pages_build_output_dir = "dist"
`
    await fs.writeFile('./front/wrangler.toml', wranglerContent)
    console.log('✅ 已创建 wrangler.toml 文件')

    // 检查并安装依赖
    const hasNodeModules = await checkNodeModules()
    if (!hasNodeModules) {
      console.log('📦 正在安装依赖...')
      await execCommand('cd front && npm install')
      console.log('✅ 依赖安装完成')
    }

    // 构建前端项目
    console.log('🚀 开始构建前端项目...')
    await execCommand('cd front && npm run build')
    console.log('✅ 前端项目构建完成')

    // 部署到 Cloudflare Pages
    console.log('🚀 开始部署到 Cloudflare Pages...')
    try {
      // 执行部署
      await execCommand(`cd front && npx wrangler pages deploy dist`)
      console.log('✅ 部署完成')
    } catch (error) {
      if (error.message.includes('fetch failed')) {
        console.error('❌ 部署失败：请确保已经运行 "npx wrangler login" 并完成 Cloudflare 登录')
      } else {
        throw error
      }
    }

  } catch (error) {
    console.error('❌ 部署过程中出现错误:', error)
  } finally {
    rl.close()
  }
}

deployFront() 
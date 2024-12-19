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
    await fs.access('./service/node_modules')
    return true
  } catch {
    return false
  }
}

async function execCommand(command, ignoreErrors = false) {
  try {
    const { stdout, stderr } = await execAsync(command, { encoding: 'utf8' })
    if (stdout) console.log(stdout)
    if (stderr) {
      console.log(stderr)
    }
  } catch (error) {
    if (!ignoreErrors) {
      throw new Error(`命令执行失败: ${error.message}`)
    } else {
      console.log('⚠️ ', error.message)
    }
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

async function deployService() {
  try {
    // 检查并安装 wrangler
    const hasWrangler = await checkWrangler()
    if (!hasWrangler) {
      console.log('📦 正在安装 wrangler...')
      await execCommand('npm install -D wrangler')
      console.log('✅ wrangler 安装完成')
    }

    // 检查并安装依赖
    const hasNodeModules = await checkNodeModules()
    if (!hasNodeModules) {
      console.log('📦 正在安装 service 依赖...')
      await execCommand('cd service && npm install')
      console.log('✅ 依赖安装完成')
    }

    // 获取用户输入
    const databaseName = await question('请输入 D1 数据库名称: ')
    const databaseId = await question('请输入 D1 数据库 ID: ')
    const kvNamespaceId = await question('请输入 KV 命名空间 ID: ')
    const jwtSecret = await question('请输入 JWT Secret: ')

    // 读取 wrangler.toml.example 文件
    let wranglerContent = await fs.readFile('./service/wrangler.toml.example', 'utf8')

    // 替换配置值
    wranglerContent = wranglerContent
      // 替换数据库配置
      .replace(
        /database_name = ".*?"/m,
        `database_name = "${databaseName}"`
      )
      .replace(
        /database_id = ".*?"/m,
        `database_id = "${databaseId}"`
      )
      // 替换 KV 配置
      .replace(
        /binding = "CYI_IMGKV"\s*\nid = ".*?"/m,
        `binding = "CYI_IMGKV"\nid = "${kvNamespaceId}"`
      )
      // 替换 JWT 配置
      .replace(
        /JWT_SECRET = ".*?"/m,
        `JWT_SECRET = "${jwtSecret}"`
      )

    // 打印配置内容以便验证
    // console.log('配置文件内容:', wranglerContent)

    // 创建 wrangler.toml 文件
    await fs.writeFile('./service/wrangler.toml', wranglerContent)
    console.log('✅ 已创建 wrangler.toml 文件')

    // 部署 Worker
    console.log('🚀 开始部署 Worker...')
    try {
      // 切换到 service 目录
      process.chdir('./service')
      console.log('📍 当前目录:', process.cwd())
      
      // 使用 ignoreErrors = true 执行部署命令
      await execCommand('npx wrangler deploy', true)
      
      // 检查部署是否成功（可以通过检查输出中是否包含特定字符串）
      console.log('✅ Worker 部署完成')
    } catch (error) {
      if (error.message.includes('fetch failed')) {
        console.error('❌ 部署失败：请确保已经运行 "npx wrangler login" 并完成 Cloudflare 登录')
      } else {
        throw error
      }
    } finally {
      process.chdir('..')  // 切换回原目录
    }

  } catch (error) {
    console.error('❌ 部署过程中出现错误:', error)
  } finally {
    rl.close()
  }
}

deployService() 
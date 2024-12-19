import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';
import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import { ValidationError, AuthenticationError, NotFoundError, PermissionError } from '../utils/errors.js';

// 常量配置
const CONFIG = {
  DEFAULT_EXPIRATION: '1h',
  ENCRYPTION_KEY: 'kJsTun7BRMpLDdQX',
  JWT_ALGORITHM: 'HS256'
};

/**
 * 密码解密工具
 */
const PasswordService = {
  async decrypt(encryptedPassword) {
    const key = CryptoJS.enc.Utf8.parse(CONFIG.ENCRYPTION_KEY);
    const decrypted = CryptoJS.AES.decrypt(encryptedPassword, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  },

  async hash(password) {
    return bcrypt.hash(password, 10);
  },

  async verify(password, hash) {
    return bcrypt.compare(password, hash);
  }
};

/**
 * JWT 相关操作
 */
const TokenService = {
  async verify(token, secret) {
    const secretKey = new TextEncoder().encode(secret);
    return jwtVerify(token, secretKey, {
      algorithms: [CONFIG.JWT_ALGORITHM]
    });
  },

  async generate(payload, secret, expirationTime) {
    const secretKey = new TextEncoder().encode(secret);
    return new SignJWT(payload)
      .setProtectedHeader({ alg: CONFIG.JWT_ALGORITHM })
      .setIssuedAt()
      .setExpirationTime(expirationTime)
      .sign(secretKey);
  },

  async checkBlacklist(token, kv) {
    const blacklist = await kv.get('blacklistTokens', { type: 'json' });
    if (!blacklist) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    return blacklist[token] && blacklist[token] > currentTime;
  }
};

/**
 * 认证用户并返回解码后的 JWT 负载
 */
export async function authenticate(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthenticationError('Unauthorized');
  }

  const token = authHeader.split(' ')[1];

  // 检查黑名单
  if (await TokenService.checkBlacklist(token, env.CYI_IMGKV)) {
    throw new AuthenticationError('Token is blacklisted');
  }

  try {
    const { payload } = await TokenService.verify(token, env.JWT_SECRET);
    return payload;
  } catch (err) {
    throw new AuthenticationError('Invalid token');
  }
}

/**
 * 处理用户注册
 */
export async function handleRegister(request, env) {
  // 检查注册功能是否启用
  const registerSetting = await env.CYI_IMGDB
    .prepare('SELECT value FROM settings WHERE key = ?')
    .bind('enable_register')
    .first();

  if (registerSetting?.value !== 'true') {
    throw new ValidationError('用户注册功能未启用，请联系管理员');
  }

  const { username, email, password } = await request.json();

  // 输入验证
  if (!username || !email || !password) {
    throw new ValidationError('缺少必要字段');
  }

  // 检查用户是否存在
  const existingUser = await env.CYI_IMGDB
    .prepare('SELECT * FROM users WHERE email = ? OR username = ?')
    .bind(email, username)
    .first();

  if (existingUser) {
    throw new ValidationError('用户已存在');
  }

  // 处理密码
  const decryptedPassword = await PasswordService.decrypt(password);
  const passwordHash = await PasswordService.hash(decryptedPassword);

  // 创建用户
  await env.CYI_IMGDB
    .prepare('INSERT INTO users (username, email, password_hash, user_type) VALUES (?, ?, ?, ?)')
    .bind(username, email, passwordHash, 'user')
    .run();

  return { message: '用户注册成功' };
}

/**
 * 处理用户登录
 */
export async function handleLogin(request, env) {
  const { email, password } = await request.json();

  if (!email || !password) {
    throw new ValidationError('缺少必要字段');
  }

  // 解密密码
  const decryptedPassword = await PasswordService.decrypt(password);

  // 查找用户
  const isEmail = email.includes('@');
  const query = isEmail ? 'email = ?' : 'username = ?';
  const user = await env.CYI_IMGDB
    .prepare(`SELECT * FROM users WHERE ${query}`)
    .bind(email)
    .first();

  if (!user || !(await PasswordService.verify(decryptedPassword, user.password_hash))) {
    throw new AuthenticationError('无效的凭证');
  }

  // 获取token过期时间
  const expirationSetting = await env.CYI_IMGDB
    .prepare('SELECT value FROM settings WHERE key = ?')
    .bind('expiration_time')
    .first();

  const expirationTime = expirationSetting?.value 
    ? `${parseInt(expirationSetting.value, 10)}h`
    : CONFIG.DEFAULT_EXPIRATION;

  // 生成token
  const token = await TokenService.generate({
    id: user.id,
    username: user.username,
    email: user.email,
    user_type: user.user_type,
  }, env.JWT_SECRET, expirationTime);

  return { token };
}

/**
 * 处理受保护的路由
 * @param {Request} request - HTTP 请求对象
 * @param {Object} env - 环境变量对象
 * @returns {Object} - 受保护路由的数据对象
 * @throws {AuthenticationError} - 未授权或令牌无效
 */
export async function handleProtected(request, env) {
  console.log('handleProtected called');
  // 认证用户
  const payload = await authenticate(request, env);
  console.log('Authenticated user:', payload);

  return { message: `Hello, ${payload.username}!` };
}

/**
 * 处理获取用户信息的请求
 * @param {Request} request - HTTP 请求对象
 * @param {Object} env - 环境变量对象
 * @returns {Object} - 用户信息的数据对象
 * @throws {AuthenticationError} - 未授权或令牌无效
 * @throws {NotFoundError} - 用户未找到
 */
export async function handleGetUser(request, env) {
  console.log('handleGetUser called');
  // 认证用户
  const payload = await authenticate(request, env);
  console.log('Authenticated user:', payload);

  // 从 D1 数据库中获取用户详细信息
  const user = await env.CYI_IMGDB.prepare('SELECT id, username, email, user_type, created_at FROM users WHERE id = ?')
    .bind(payload.id)
    .first();

  console.log('User fetched from DB:', user);

  if (!user) {
    console.log('User not found');
    throw new NotFoundError('用户未找到');
  }

  // 返回用户信息
  return { data: user };
}

/**
 * 处理仅管理员可访问的路由
 * @param {Request} request - HTTP 请求对象
 * @param {Object} env - 环境变量对象
 * @returns {Object} - 管理员路由的数据对象
 * @throws {AuthenticationError} - 未授权或令牌无效
 * @throws {PermissionError} - 权限不足
 */
export async function handleAdminRoute(request, env) {
  console.log('handleAdminRoute called');
  // 认证用户
  const payload = await authenticate(request, env);
  console.log('Authenticated user:', payload);

  // 检查用户类型
  if (payload.user_type !== 'admin') {
    console.log('Access forbidden: not an admin');
    throw new PermissionError('禁止访问：仅限管理员');
  }

  // 执行管理员相关操作
  return { message: `Welcome, Admin ${payload.username}!` };
}

/**
 * 处理用户注销
 * @param {Request} request - HTTP 请求对象
 * @param {Object} env - 环境变量对象
 * @returns {Object} - 注销结果的数据对象
 * @throws {AuthenticationError} - 未授权或令牌无效
 */
export async function handleLogout(request, env) {
  console.log('handleLogout called');
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Authorization header missing or invalid in logout');
    throw new AuthenticationError('Unauthorized');
  }

  const token = authHeader.split(' ')[1];

  // 解码 token 获取过期时间
  const decoded = decodeJwt(token);
  const expiresIn = decoded && decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600;

  // 从 KV 获取现有的黑名单列表
  let blacklist = await env.CYI_IMGKV.get('blacklistTokens', { type: 'json' });
  if (!blacklist) {
    blacklist = {};
  }

  // 将当前 token 添加到黑名单列表中，设置它的过期时间
  blacklist[token] = Math.floor(Date.now() / 1000) + expiresIn;

  // 将更新后的黑名单列表写入 KV
  await env.CYI_IMGKV.put('blacklistTokens', JSON.stringify(blacklist));

  console.log('Token blacklisted:', token);

  return { message: '注销成功' };
}
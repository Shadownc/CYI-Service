import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';
import { decodeJwt } from 'jose';
import { authenticate } from './auth.js';
import { ValidationError, NotFoundError, PermissionError } from '../utils/errors.js';

// 常量配置
const CONFIG = {
  ENCRYPTION_KEY: 'kJsTun7BRMpLDdQX',
  DEFAULT_EXPIRATION: 3600
};

/**
 * 确保管理员权限的中间件
 */
async function ensureAdmin(request, env) {
  const user = await authenticate(request, env);
  if (user.user_type !== 'admin') {
    throw new PermissionError('禁止访问：仅限管理员');
  }
  return user;
}

/**
 * 密码解密工具
 */
async function decryptPassword(encryptedPassword, secretKey) {
  const key = CryptoJS.enc.Utf8.parse(secretKey);
  const decrypted = CryptoJS.AES.decrypt(encryptedPassword, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * 构建分页查询条件
 */
function buildPaginationQuery(conditions = [], bindParams = [], page = 1, perPage = 10) {
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * perPage;
  return { whereClause, offset, bindParams };
}

/**
 * 获取所有用户的列表（分页）
 */
export async function handleGetAllUsers(request, env) {
  await ensureAdmin(request, env);

  const { 
    pageNo = 1, 
    pageSize = 10, 
    username = '', 
    email = '' 
  } = await request.json().catch(() => {
    throw new ValidationError('请求体必须是有效的 JSON');
  });

  const conditions = [];
  const bindParams = [];

  if (username?.trim()) {
    conditions.push('username LIKE ?');
    bindParams.push(`%${username.trim()}%`);
  }

  if (email?.trim()) {
    conditions.push('email LIKE ?');
    bindParams.push(`%${email.trim()}%`);
  }

  const { whereClause, offset } = buildPaginationQuery(conditions, bindParams, pageNo, pageSize);

  const countResult = await env.CYI_IMGDB
    .prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`)
    .bind(...bindParams)
    .first();

  const users = await env.CYI_IMGDB
    .prepare(`SELECT id, username, email, user_type, created_at FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .bind(...bindParams, pageSize, offset)
    .all();

  return {
    page: pageNo,
    per_page: pageSize,
    total: countResult?.count || 0,
    total_pages: Math.ceil((countResult?.count || 0) / pageSize),
    data: { pageData: users.results, total: countResult?.count || 0 }
  };
}

/**
 * 新增用户
 */
export async function handleCreateUser(request, env) {
  await ensureAdmin(request, env);

  const { username, email, password, user_type = 'user' } = await request.json().catch(() => {
    throw new ValidationError('请求体必须是有效的 JSON');
  });

  if (!username || !email || !password) {
    throw new ValidationError('缺少必要字段');
  }

  const existingUser = await env.CYI_IMGDB
    .prepare('SELECT * FROM users WHERE email = ? OR username = ?')
    .bind(email, username)
    .first();

  if (existingUser) {
    throw new ValidationError('用户已存在');
  }

  const decryptedPassword = await decryptPassword(password, CONFIG.ENCRYPTION_KEY);
  const passwordHash = await bcrypt.hash(decryptedPassword, 10);

  await env.CYI_IMGDB
    .prepare('INSERT INTO users (username, email, password_hash, user_type) VALUES (?, ?, ?, ?)')
    .bind(username, email, passwordHash, user_type)
    .run();

  return { message: '用户创建成功' };
}

/**
 * 更新用户信息
 */
export async function handleUpdateUser(request, env) {
  await ensureAdmin(request, env);

  const { id, username, email, password, user_type } = await request.json().catch(() => {
    throw new ValidationError('请求体必须是有效的 JSON');
  });

  if (!id || (!username && !email && !password && !user_type)) {
    throw new ValidationError('缺少必要的更新字段');
  }

  const user = await env.CYI_IMGDB
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first();

  if (!user) {
    throw new NotFoundError('用户未找到');
  }

  const updates = [];
  const bindParams = [];
  let isPasswordChanged = false;

  if (username) {
    updates.push('username = ?');
    bindParams.push(username);
  }
  if (email) {
    updates.push('email = ?');
    bindParams.push(email);
  }
  if (password) {
    const decryptedPassword = await decryptPassword(password, CONFIG.ENCRYPTION_KEY);
    const passwordHash = await bcrypt.hash(decryptedPassword, 10);
    updates.push('password_hash = ?');
    bindParams.push(passwordHash);
    isPasswordChanged = true;
  }
  if (user_type) {
    updates.push('user_type = ?');
    bindParams.push(user_type);
  }

  const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  bindParams.push(id);

  await env.CYI_IMGDB.prepare(updateQuery).bind(...bindParams).run();

  if (user.user_type === 'admin' && isPasswordChanged) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = decodeJwt(token);
      const expiresIn = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : CONFIG.DEFAULT_EXPIRATION;
      await env.CYI_IMGKV.put(`blacklist:${token}`, 'true', { expirationTtl: expiresIn });
    }
  }

  return { message: '用户信息更新成功' };
}

/**
 * 删除用户
 */
export async function handleDeleteUser(request, env) {
  await ensureAdmin(request, env);

  const id = new URL(request.url).pathname.split('/').pop();
  if (!id) {
    throw new ValidationError('缺少用户 ID');
  }

  const user = await env.CYI_IMGDB
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first();

  if (!user) {
    throw new NotFoundError('用户未找到');
  }

  await env.CYI_IMGDB
    .prepare('DELETE FROM users WHERE id = ?')
    .bind(id)
    .run();

  return { message: '用户删除成功' };
}

/**
 * 分页获取图片列表
 */
export async function handleGetAllImages(request, env) {
  const user = await authenticate(request, env);

  const { 
    pageNo = 1, 
    pageSize = 10, 
    username = '', 
    email = '', 
    isPublic = false 
  } = await request.json().catch(() => {
    throw new ValidationError('请求体必须是有效的 JSON');
  });

  const conditions = [];
  const bindParams = [];

  if (user.user_type !== 'admin') {
    conditions.push('images.user_id = ?');
    bindParams.push(user.id);
  } else if (isPublic) {
    conditions.push('images.user_id IS NULL');
  }

  if (username) {
    conditions.push('users.username LIKE ?');
    bindParams.push(`%${username.trim()}%`);
  }

  if (email) {
    conditions.push('users.email LIKE ?');
    bindParams.push(`%${email.trim()}%`);
  }

  const { whereClause, offset } = buildPaginationQuery(conditions, bindParams, pageNo, pageSize);

  const countResult = await env.CYI_IMGDB
    .prepare(`SELECT COUNT(*) as count FROM images LEFT JOIN users ON images.user_id = users.id ${whereClause}`)
    .bind(...bindParams)
    .first();

  const images = await env.CYI_IMGDB
    .prepare(`
      SELECT images.id, images.user_id, images.filename, images.mime_type, 
             images.upload_date, users.username, users.email
      FROM images
      LEFT JOIN users ON images.user_id = users.id
      ${whereClause}
      ORDER BY images.upload_date DESC
      LIMIT ? OFFSET ?
    `)
    .bind(...bindParams, pageSize, offset)
    .all();

  const origin = new URL(request.url).origin;
  const imageList = images.results.map(img => ({
    id: img.id,
    filename: img.filename,
    mime_type: img.mime_type,
    url: `${origin}/file/${img.id}`,
    upload_date: img.upload_date,
    user: {
      username: img.username,
      email: img.email
    }
  }));

  return {
    page: pageNo,
    per_page: pageSize,
    total: countResult?.count || 0,
    total_pages: Math.ceil((countResult?.count || 0) / pageSize),
    data: { pageData: imageList, total: countResult?.count || 0 }
  };
}

/**
 * 批量删除图片
 */
export async function handleDeleteImages(request, env) {
  const user = await authenticate(request, env);

  const { imageIds } = await request.json().catch(() => {
    throw new ValidationError('请求体必须是有效的 JSON');
  });

  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    throw new ValidationError('缺少图片 ID 列表');
  }

  const queryPlaceholders = imageIds.map(() => '?').join(', ');
  const imagesToDelete = await env.CYI_IMGDB
    .prepare(`SELECT id, kv_key, user_id FROM images WHERE id IN (${queryPlaceholders})`)
    .bind(...imageIds)
    .all();

  if (!imagesToDelete.results.length) {
    throw new NotFoundError('未找到任何图片');
  }

  if (user.user_type !== 'admin') {
    const unauthorizedImages = imagesToDelete.results.filter(image => image.user_id !== user.id);
    if (unauthorizedImages.length) {
      throw new PermissionError('你无权删除其他用户的图片');
    }
  }

  await Promise.all(imagesToDelete.results.map(async (image) => {
    await env.CYI_IMGDB.prepare('DELETE FROM images WHERE id = ?').bind(image.id).run();
    await env.CYI_IMGKV.delete(image.kv_key);
  }));

  return {
    message: '图片删除成功',
    deleted_count: imagesToDelete.results.length,
  };
}

/**
 * 更新配置项
 */
export async function handleUpdateSettings(request, env) {
  await ensureAdmin(request, env);

  const settingsToUpdate = await request.json().catch(() => {
    throw new ValidationError('请求体必须是有效的 JSON');
  });

  if (!settingsToUpdate || typeof settingsToUpdate !== 'object' || !Object.keys(settingsToUpdate).length) {
    throw new ValidationError('请求体无效或为空');
  }

  const queries = Object.entries(settingsToUpdate).map(([key, value]) => {
    let processedValue = value;
    let valueType = 'string';

    if (typeof value === 'object') {
      processedValue = JSON.stringify(value);
      valueType = 'json';
    } else if (typeof value === 'boolean') {
      processedValue = value ? 'true' : 'false';
      valueType = 'boolean';
    } else if (Number.isInteger(value)) {
      processedValue = value.toString();
      valueType = 'integer';
    }

    return env.CYI_IMGDB
      .prepare('UPDATE settings SET value = ?, value_type = ? WHERE key = ?')
      .bind(processedValue, valueType, key)
      .run();
  });

  await Promise.all(queries);

  return { 
    message: '配置更新成功', 
    updatedSettings: settingsToUpdate 
  };
}
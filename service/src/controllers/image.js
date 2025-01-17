import { authenticate } from './auth.js';
import { nanoid } from 'nanoid';
import { ValidationError, NotFoundError } from '../utils/errors.js';

// 常量配置
const CONFIG = {
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  FETCH_HEADERS: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  CACHE_CONTROL: 'public, max-age=31536000' // 缓存一年
};

// 工具函数
const ImageUtils = {
  async validateContentType(request, expectedType) {
    const contentType = request.headers.get('Content-Type') || request.headers.get('content-type') || '';
    if (!contentType.includes(expectedType)) {
      throw new ValidationError(`Content-Type must be ${expectedType}`);
    }
  },

  async moderateContent(env, imageUrl) {
    if (!env.ModerateContentApiKey) {
      console.log('Moderation API key not configured, skipping content moderation');
      return true;
    }

    const moderationApiUrl = `https://api.moderatecontent.com/moderate/?key=${encodeURIComponent(env.ModerateContentApiKey)}&url=${encodeURIComponent(imageUrl)}`;
    const response = await fetch(moderationApiUrl, { method: 'GET' });

    if (!response.ok) {
      throw new Error('Content moderation API request failed');
    }

    const data = await response.json();
    return data.rating_index !== 3;
  },

  buildImageUrl(request, id) {
    return `${new URL(request.url).origin}/file/${id}`;
  }
};

/**
 * 检查上传是否需要认证
 */
async function checkUploadAuthRequired(env) {
  try {
    const setting = await env.CYI_IMGDB
      .prepare('SELECT value FROM settings WHERE key = ?')
      .bind('upload_require_auth')
      .first();
    
    // 直接返回布尔值
    return setting?.value === 'true';
  } catch (error) {
    console.error('Error checking upload auth setting:', error);
    // 默认需要认证，确保安全
    return true;
  }
}

/**
 * 处理图片上传
 * 支持多图上传，区分已登录用户和公共上传 根据配置决定是否需要登录
 */
export async function handleImageUpload(request, env) {
  console.log('handleImageUpload called');
  
  // 检查是否需要认证
  const requireAuth = await checkUploadAuthRequired(env);
  
  // 尝试认证用户
  let user = null;
  try {
    user = await authenticate(request, env);
    console.log('Authenticated user:', user);
  } catch (authError) {
    if (requireAuth) {
      throw new ValidationError('当前配置要求登录后才能上传图片');
    }
    console.log('Unauthenticated upload, treating as public or allowed by configuration');
  }

  await ImageUtils.validateContentType(request, 'multipart/form-data');
  
  const formData = await request.formData();
  const files = formData.getAll('images');

  if (!files?.length) {
    throw new ValidationError('No images provided');
  }

  const savedImages = [];
  const failedImages = [];

  await Promise.all(
    files.map(file => 
      processSingleImage(file, user, env, request, savedImages, failedImages)
    )
  );

  return {
    message: '图片上传完成',
    uploaded: savedImages,
    failed: failedImages
  };
}

async function processSingleImage(file, user, env, request, savedImages, failedImages) {
  if (!(file instanceof File)) {
    failedImages.push({ filename: 'Unknown', reason: 'Invalid file type' });
    return;
  }

  const { name: filename, type: mimeType, size: fileSize } = file;

  // 验证文件类型和大小
  if (!CONFIG.ALLOWED_MIME_TYPES.includes(mimeType)) {
    failedImages.push({ filename, reason: `Unsupported file type: ${mimeType}` });
    return;
  }

  if (fileSize > CONFIG.MAX_FILE_SIZE) {
    failedImages.push({ filename, reason: 'File size exceeds limit (10MB)' });
    return;
  }

  try {
    const uniqueId = nanoid();
    const imageData = new Uint8Array(await file.arrayBuffer());
    
    // 存储图片到 KV
    await env.CYI_IMGKV.put(uniqueId, imageData, {
      metadata: {
        mimeType,
        filename,
        userId: user ? String(user.id) : 'public'
      }
    });

    const imageUrl = ImageUtils.buildImageUrl(request, uniqueId);

    // 内容审核
    if (env.ModerateContentApiKey) {
      const isAppropriate = await ImageUtils.moderateContent(env, imageUrl);
      if (!isAppropriate) {
        await env.CYI_IMGKV.delete(uniqueId);
        failedImages.push({ filename, reason: '图片包含成人内容' });
        return;
      }
    }

    // 保存到数据库
    await env.CYI_IMGDB.prepare(
      'INSERT INTO images (id, user_id, filename, mime_type, kv_key, upload_date) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    ).bind(
      uniqueId,
      user?.id || null,
      filename,
      mimeType,
      uniqueId
    ).run();

    savedImages.push({
      id: uniqueId,
      filename,
      mime_type: mimeType,
      url: imageUrl
    });

    console.log(`Image uploaded successfully: ${filename} (ID: ${uniqueId})`);
  } catch (error) {
    console.error(`Error processing file ${filename}:`, error);
    failedImages.push({
      filename,
      reason: 'Internal processing error'
    });
  }
}

/**
 * 处理获取图片的请求
 */
export async function handleGetImage(request, env) {
    console.log('handleGetImage called');
    
    const { id } = request.params;
    if (!id) {
      throw new ValidationError('ID is required');
    }
  
    console.log(`Retrieving image with key: ${id}`);
    const imageData = await env.CYI_IMGKV.get(id, { type: 'arrayBuffer' });
  
    if (!imageData) {
      throw new NotFoundError('Image not found');
    }
  
    const { metadata } = await env.CYI_IMGKV.getWithMetadata(id);
    
    return {
      body: imageData,
      headers: {
        'Content-Type': metadata.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${metadata.filename || 'unknown.png'}"`,
        'Cache-Control': CONFIG.CACHE_CONTROL,
      },
    };
  }
  
  /**
   * 处理分页获取图片列表的请求
   */
  export async function handleGetImages(request, env) {
    console.log('handleGetImages called');
  
    const { page = 1, pageSize = 10 } = await request.json().catch(() => {
      throw new ValidationError('请求体必须是有效的 JSON');
    });
  
    const validatedPage = Math.max(1, parseInt(page));
    const validatedPerPage = Math.min(100, Math.max(1, parseInt(pageSize)));
    const offset = (validatedPage - 1) * validatedPerPage;
  
    let user = null;
    try {
      user = await authenticate(request, env);
      console.log('Authenticated user:', user);
    } catch (authError) {
      console.log('Unauthenticated request, fetching public images.');
    }
  
    const whereClause = user ? 'user_id = ?' : 'user_id IS NULL';
    const bindParams = user ? [user.id] : [];
  
    try {
      // 获取总数
      const countResult = await env.CYI_IMGDB
        .prepare(`SELECT COUNT(*) as count FROM images WHERE ${whereClause}`)
        .bind(...bindParams)
        .first();
  
      const total = countResult?.count || 0;
      const totalPages = Math.ceil(total / validatedPerPage);
  
      // 获取图片列表
      const images = await env.CYI_IMGDB
        .prepare(`
          SELECT id, filename, mime_type, kv_key, upload_date 
          FROM images 
          WHERE ${whereClause} 
          ORDER BY upload_date DESC 
          LIMIT ? OFFSET ?
        `)
        .bind(...bindParams, validatedPerPage, offset)
        .all();
  
      const origin = new URL(request.url).origin;
      const imageList = images.results.map(img => ({
        id: img.id,
        filename: img.filename,
        mime_type: img.mime_type,
        url: `${origin}/file/${img.id}`,
        upload_date: img.upload_date,
      }));
  
      return {
        page: validatedPage,
        per_page: validatedPerPage,
        total,
        total_pages: totalPages,
        images: imageList,
      };
    } catch (error) {
      console.error('Error fetching images:', error);
      throw new ValidationError('获取图片列表失败');
    }
  }
  
  /**
   * 处理分页获取公共图片列表的请求
   */
  export async function handleGetPublicImages(request, env) {
    console.log('handleGetPublicImages called');
  
    const { page = 1, pageSize = 10 } = await request.json().catch(() => {
      throw new ValidationError('请求体必须是有效的 JSON');
    });
  
    const validatedPage = Math.max(1, parseInt(page));
    const validatedPerPage = Math.min(100, Math.max(1, parseInt(pageSize)));
    const offset = (validatedPage - 1) * validatedPerPage;
  
    try {
      const countResult = await env.CYI_IMGDB
        .prepare('SELECT COUNT(*) as count FROM images WHERE user_id IS NULL')
        .first();
  
      const total = countResult?.count || 0;
      const totalPages = Math.ceil(total / validatedPerPage);
  
      const images = await env.CYI_IMGDB
        .prepare(`
          SELECT id, filename, mime_type, kv_key, upload_date 
          FROM images 
          WHERE user_id IS NULL 
          ORDER BY upload_date DESC 
          LIMIT ? OFFSET ?
        `)
        .bind(validatedPerPage, offset)
        .all();
  
      const origin = new URL(request.url).origin;
      const imageList = (images.results || []).map(img => ({
        id: img.id,
        filename: img.filename,
        mime_type: img.mime_type,
        url: `${origin}/file/${img.id}`,
        upload_date: img.upload_date,
      }));
  
      return {
        page: validatedPage,
        per_page: validatedPerPage,
        total,
        total_pages: totalPages,
        images: imageList,
      };
    } catch (error) {
      console.error('Error fetching public images:', error);
      throw new ValidationError('获取图片列表失败');
    }
  }
  
  /**
   * 处理图片链接上传 根据配置决定是否需要登录
   */
  export async function handleImageLinkUpload(request, env) {
    console.log('handleImageLinkUpload called');
    
    // 检查是否需要认证
    const requireAuth = await checkUploadAuthRequired(env);
    
    // 尝试认证用户
    let user = null;
    try {
      user = await authenticate(request, env);
      console.log('Authenticated user:', user);
    } catch (authError) {
      if (requireAuth) {
        throw new ValidationError('当前配置要求登录后才能上传图片');
      }
      console.log('Unauthenticated upload, treating as public or allowed by configuration');
    }
  
    await ImageUtils.validateContentType(request, 'application/json');
  
    const { imageLinks } = await request.json();
    if (!Array.isArray(imageLinks) || !imageLinks.length) {
      throw new ValidationError('No image links provided');
    }
  
    const savedImages = [];
    const failedImages = [];
  
    await Promise.all(
      imageLinks.map(imageUrl => 
        processImageFromLink(imageUrl, user, env, savedImages, failedImages, request)
      )
    );
  
    return {
      message: '图片链接上传完成',
      uploaded: savedImages,
      failed: failedImages,
    };
  }
  
  async function processImageFromLink(imageUrl, user, env, savedImages, failedImages, request) {
    try {
      console.log(`Processing image from link: ${imageUrl}`);
  
      const response = await fetch(imageUrl, {
        headers: {
          ...CONFIG.FETCH_HEADERS,
          'Referer': imageUrl
        }
      });
  
      if (!response.ok) {
        failedImages.push({ url: imageUrl, reason: 'Failed to fetch image' });
        return;
      }
  
      const mimeType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
  
      if (!CONFIG.ALLOWED_MIME_TYPES.includes(mimeType)) {
        failedImages.push({ url: imageUrl, reason: `Unsupported file type: ${mimeType}` });
        return;
      }
  
      if (contentLength && parseInt(contentLength) > CONFIG.MAX_FILE_SIZE) {
        failedImages.push({ url: imageUrl, reason: 'File size exceeds limit (10MB)' });
        return;
      }
  
      const uniqueId = nanoid();
      const imageData = new Uint8Array(await response.arrayBuffer());
  
      await env.CYI_IMGKV.put(uniqueId, imageData, {
        metadata: {
          mimeType,
          userId: user ? String(user.id) : 'public',
          sourceUrl: imageUrl,
        },
      });
  
      const storedImageUrl = ImageUtils.buildImageUrl(request, uniqueId);
  
      if (env.ModerateContentApiKey) {
        const isAppropriate = await ImageUtils.moderateContent(env, storedImageUrl);
        if (!isAppropriate) {
          await env.CYI_IMGKV.delete(uniqueId);
          failedImages.push({ url: imageUrl, reason: '图片包含成人内容' });
          return;
        }
      }
  
      await env.CYI_IMGDB.prepare(
        'INSERT INTO images (id, user_id, filename, mime_type, kv_key, upload_date) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
      ).bind(
        uniqueId,
        user?.id || null,
        imageUrl.split('/').pop(),
        mimeType,
        uniqueId
      ).run();
  
      savedImages.push({
        id: uniqueId,
        url: storedImageUrl,
        sourceUrl: imageUrl,
        mime_type: mimeType,
      });
  
      console.log(`Image from link uploaded successfully: ${imageUrl}`);
    } catch (error) {
      console.error(`Error processing image from link ${imageUrl}:`, error);
      failedImages.push({
        url: imageUrl,
        reason: 'Internal processing error',
      });
    }
  }

  /**
   * 处理获取随机图片的请求
   * @param {Request} request - 请求对象
   * @param {Object} env - 环境变量
   * @returns {Response} 返回重定向响应
   */
  export async function handleGetRandomImage(request, env) {
    console.log('handleGetRandomImage called');

    // 解析查询参数
    // const url = new URL(request.url);
    // const includePrivate = url.searchParams.get('includePrivate') === 'true';

    // 从环境变量获取配置
    const includePrivate = env.INCLUDE_PRIVATE_IN_RANDOM === 'true';

    try {
      // 构建SQL查询
      const whereClause = includePrivate ? '' : 'WHERE user_id IS NULL';
      
      // 获取随机图片记录
      const randomImage = await env.CYI_IMGDB
        .prepare(`
          SELECT id
          FROM images
          ${whereClause}
          ORDER BY RANDOM()
          LIMIT 1
        `)
        .first();

      if (!randomImage) {
        throw new NotFoundError('No images found');
      }

      // 直接获取图片数据
      const imageData = await env.CYI_IMGKV.get(randomImage.id, { type: 'arrayBuffer' });
      if (!imageData) {
        throw new NotFoundError('Image not found');
      }

      const { metadata } = await env.CYI_IMGKV.getWithMetadata(randomImage.id);
      
      // 返回与 handleGetImage 相同的格式
      return {
        body: imageData,
        headers: {
          'Content-Type': metadata.mimeType || 'application/octet-stream',
          'Content-Disposition': `inline; filename="${metadata.filename || 'unknown.png'}"`,
          'Cache-Control': CONFIG.CACHE_CONTROL,
        },
      };
      
    } catch (error) {
      console.error('Error fetching random image:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new ValidationError('获取随机图片失败');
    }
  }
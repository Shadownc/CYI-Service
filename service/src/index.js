import { createRouter, combineRouters } from './utils/router.js';
import { settingsRoutes } from './routes/settings.js';
import { adminRoutes, adminGlobalRoutes } from './routes/admin.js';
import { authRoutes } from './routes/auth.js';
import { imageRoutes } from './routes/image.js';
import { addCorsHeaders } from './utils/index.js';

// 创建主路由器
const router = createRouter();

/**
 * 处理预检请求（CORS）
 */
async function handleOptions(request) {
  console.log('handleOptions called');
  const response = new Response(null, {
    status: 204,
  });
  return addCorsHeaders(response);
}

// 基础路由
router
  .options('/*', handleOptions)
  .get('/', () => {
    console.log('Welcome route called');
    const response = new Response(JSON.stringify({ 
      code: 200, 
      message: '欢迎使用 CYI-Service'
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json'
      }
    });
    return addCorsHeaders(response);
  })
  .get('/test', () => {
    console.log('Test route handler called');
    const response = new Response(JSON.stringify({ 
      code: 200, 
      message: 'Test route is working!' 
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json'
      }
    });
    return addCorsHeaders(response);
  });

// 合并所有路由
combineRouters(router, [
  settingsRoutes,
  adminRoutes,
  authRoutes,
  imageRoutes,
  adminGlobalRoutes
]);

// 404 处理
router.all('*', () => {
  console.log('404 handler called');
  const response = new Response(JSON.stringify({ 
    code: 404, 
    message: 'Not Found' 
  }), {
    status: 404,
    headers: { 
      'Content-Type': 'application/json'
    }
  });
  return addCorsHeaders(response);
});

export default router;
import { handleGetSettings } from '../controllers/settings.js';
import { withResponseWrapper } from '../middleware/response.middleware.js';

// 导出路由处理器函数
export function settingsRoutes(router) {
  router.get('/settings', withResponseWrapper(handleGetSettings));
}
import { AutoRouter } from 'itty-router';

/**
 * 创建一个新的路由器实例
 * @param {Object} options - 路由器配置选项
 * @returns {AutoRouter} 路由器实例
 */
export function createRouter(options = {}) {
  return AutoRouter(options);
}

/**
 * 合并多个路由器的路由配置
 * @param {AutoRouter} mainRouter - 主路由器
 * @param {Array<Function>} handlers - 路由处理器数组，每个处理器接收 router 参数并定义路由
 * @returns {AutoRouter} 合并后的路由器
 */
export function combineRouters(mainRouter, handlers) {
  // 遍历所有处理器
  handlers.forEach(handler => {
    // 调用处理器，传入主路由器
    handler(mainRouter);
  });
  
  return mainRouter;
} 
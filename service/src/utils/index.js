import { HttpStatus } from './constants.js';

/**
 * CORS 配置常量
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

/**
 * 创建统一的响应格式
 * @param {Object} data - 返回的数据对象
 * @param {number} code - 响应代码
 * @param {number} status - HTTP 状态码
 * @returns {Response} - 响应对象
 */
export function createResponse(data, code = HttpStatus.OK, status = HttpStatus.OK) {
  const responseBody = JSON.stringify({
    code,
    ...data
  });

  return new Response(responseBody, {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * 为响应添加 CORS 头部
 * @param {Response} response - 原始响应对象
 * @returns {Response} - 添加了 CORS 头部的新响应对象
 */
export function addCorsHeaders(response) {
  const headers = new Headers(response.headers);
  
  // 添加所有 CORS 头部
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
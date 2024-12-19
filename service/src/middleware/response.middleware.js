import { createResponse, addCorsHeaders } from '../utils/index.js';
import { AppError } from '../utils/errors.js';
import { HttpStatus } from '../utils/constants.js';

/**
 * 标准响应格式
 * @param {*} data - 响应数据
 * @param {number} statusCode - HTTP状态码
 * @returns {Object} - 格式化的响应对象
 */
const formatResponse = (data, statusCode = HttpStatus.OK) => ({
  success: statusCode >= 200 && statusCode < 300,
  statusCode,
  timestamp: new Date().toISOString(),
  data
});

/**
 * 处理成功响应
 * @param {*} result - 处理函数的返回结果
 * @returns {Response} - 格式化后的响应对象
 */
const handleSuccess = (result) => {
  // 处理特殊响应（如文件流）
  if (result?.body && result?.headers) {
    return new Response(result.body, {
      status: HttpStatus.OK,
      headers: result.headers,
    });
  }
  
  // 标准数据响应
  return createResponse(
    formatResponse(result),
    HttpStatus.OK
  );
};

/**
 * 处理错误响应
 * @param {Error} error - 捕获到的错误
 * @returns {Response} - 格式化后的错误响应
 */
const handleError = (error) => {
  console.error('Handler error:', error);

  if (error instanceof AppError) {
    // 使用 AppError 的 toJSON 方法获取错误详情
    return createResponse(
      formatResponse(error.toJSON(), error.statusCode),
      error.statusCode
    );
  }

  // 处理未预期的错误
  return createResponse(
    formatResponse({
      error: {
        type: 'INTERNAL',
        message: 'Internal Server Error',
        timestamp: new Date().toISOString()
      }
    }, HttpStatus.INTERNAL_SERVER_ERROR),
    HttpStatus.INTERNAL_SERVER_ERROR
  );
};

/**
 * 响应包装器中间件
 * 统一处理成功和错误响应，自动添加 CORS 头
 * @param {Function} handler - 处理函数
 * @returns {Function} - 包装后的处理函数
 */
export function withResponseWrapper(handler) {
  return async (request, env, ctx) => {
    try {
      console.log('withResponseWrapper: handling request');
      const result = await handler(request, env, ctx);
      console.log('withResponseWrapper: got result:', result);
      const response = handleSuccess(result);
      console.log('withResponseWrapper: created response:', response);
      return addCorsHeaders(response);
    } catch (error) {
      console.error('withResponseWrapper: caught error:', error);
      const errorResponse = handleError(error);
      return addCorsHeaders(errorResponse);
    }
  };
}
import { NotFoundError } from '../utils/errors';

/**
 * 配置值类型处理器
 */
const ValueTypeHandlers = {
  boolean: value => value === 'true',
  integer: value => parseInt(value, 10),
  json: value => {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },
  default: value => value
};

/**
 * 获取所有配置项
 * @param {Request} request - HTTP 请求对象
 * @param {Object} env - 环境变量对象
 * @param {Object} ctx - 执行上下文
 * @returns {Object} - 配置信息的对象
 * @throws {NotFoundError} - 如果配置项未找到
 */
export async function handleGetSettings(request, env, ctx) {
  console.log('handleGetSettings called');

  try {
    const result = await env.CYI_IMGDB
      .prepare('SELECT key, value, value_type FROM settings')
      .all();

    console.log('Database query result:', result);

    if (!result?.results?.length) {
      console.log('No settings found');
      throw new NotFoundError('未找到任何配置项');
    }

    const settings = result.results.reduce((acc, { key, value, value_type }) => {
      const handler = ValueTypeHandlers[value_type] || ValueTypeHandlers.default;
      acc[key] = handler(value);
      return acc;
    }, {});

    console.log('Settings processed:', settings);
    return { settings };
  } catch (error) {
    console.error('Error in handleGetSettings:', error);
    throw error;
  }
}
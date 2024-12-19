import { HttpStatus } from './constants.js';

/**
 * 错误类型枚举
 */
export const ErrorType = {
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  PERMISSION: 'PERMISSION',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL: 'INTERNAL'
};

/**
 * 基础自定义错误类
 */
export class AppError extends Error {
  /**
   * @param {string} message - 错误消息
   * @param {number} statusCode - HTTP 状态码
   * @param {string} type - 错误类型
   * @param {Object} [metadata] - 额外的错误元数据
   */
  constructor(message, statusCode, type, metadata = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.type = type;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 序列化错误对象
   */
  toJSON() {
    return {
      error: {
        type: this.type,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
        ...(Object.keys(this.metadata).length && { metadata: this.metadata })
      }
    };
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', metadata = {}) {
    super(
      message, 
      HttpStatus.BAD_REQUEST, 
      ErrorType.VALIDATION,
      metadata
    );
  }

  /**
   * 创建字段验证错误
   * @param {string} field - 验证失败的字段
   * @param {string} reason - 验证失败的原因
   */
  static field(field, reason) {
    return new ValidationError('Validation failed', {
      field,
      reason
    });
  }
}

/**
 * 认证错误
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', metadata = {}) {
    super(
      message, 
      HttpStatus.UNAUTHORIZED, 
      ErrorType.AUTHENTICATION,
      metadata
    );
  }

  /**
   * 创建令牌无效错误
   */
  static invalidToken() {
    return new AuthenticationError('Invalid or expired token');
  }

  /**
   * 创建凭证无效错误
   */
  static invalidCredentials() {
    return new AuthenticationError('Invalid username or password');
  }
}

/**
 * 权限错误
 */
export class PermissionError extends AppError {
  constructor(message = 'Permission denied', metadata = {}) {
    super(
      message, 
      HttpStatus.FORBIDDEN, 
      ErrorType.PERMISSION,
      metadata
    );
  }

  /**
   * 创建资源访问权限错误
   * @param {string} resource - 资源名称
   * @param {string} action - 操作类型
   */
  static resourceAccess(resource, action) {
    return new PermissionError('Permission denied', {
      resource,
      action
    });
  }
}

/**
 * 资源未找到错误
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', metadata = {}) {
    super(
      message, 
      HttpStatus.NOT_FOUND, 
      ErrorType.NOT_FOUND,
      metadata
    );
  }

  /**
   * 创建实体未找到错误
   * @param {string} entity - 实体类型
   * @param {string|number} id - 实体ID
   */
  static entity(entity, id) {
    return new NotFoundError(`${entity} not found`, {
      entity,
      id
    });
  }
}
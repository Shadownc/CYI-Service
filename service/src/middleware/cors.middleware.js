import { CORS_HEADERS } from '../utils/index.js';

export function corsMiddleware() {
  return async (request) => {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }
    return request;
  };
}
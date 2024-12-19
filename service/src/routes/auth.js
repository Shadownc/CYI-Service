import { 
  handleAdminRoute, 
  handleRegister, 
  handleLogin, 
  handleProtected, 
  handleGetUser, 
  handleLogout 
} from '../controllers/auth.js';
import { withResponseWrapper } from '../middleware/response.middleware.js';

export function authRoutes(router) {
  router
    .get('/admin', withResponseWrapper(handleAdminRoute))
    .post('/register', withResponseWrapper(handleRegister))
    .post('/login', withResponseWrapper(handleLogin))
    .get('/protected', withResponseWrapper(handleProtected))
    .get('/userinfo', withResponseWrapper(handleGetUser))
    .post('/logout', withResponseWrapper(handleLogout));
}
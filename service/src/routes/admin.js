import { 
  handleGetAllUsers, 
  handleUpdateUser, 
  handleCreateUser, 
  handleDeleteUser, 
  handleGetAllImages, 
  handleDeleteImages,
  handleUpdateSettings,
} from '../controllers/admin.js';
import { withResponseWrapper } from '../middleware/response.middleware.js';

// 带有 /admin 前缀的路由
export function adminRoutes(router) {
  router
    .post('/admin/userList', withResponseWrapper(handleGetAllUsers))
    .post('/admin/resetPassword', withResponseWrapper(handleUpdateUser))
    .post('/admin/addUser', withResponseWrapper(handleCreateUser))
    .delete('/admin/deleteUser/:userid', withResponseWrapper(handleDeleteUser))
    .post('/admin/imgList', withResponseWrapper(handleGetAllImages))
    .post('/admin/deleteImg', withResponseWrapper(handleDeleteImages));
}

// 不带 /admin 前缀的管理员路由
export function adminGlobalRoutes(router) {
  router
    .post('/updateSetting', withResponseWrapper(handleUpdateSettings));
}
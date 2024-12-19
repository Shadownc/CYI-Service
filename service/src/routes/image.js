import { 
  handleImageUpload, 
  handleGetImage, 
  handleGetImages, 
  handleGetPublicImages, 
  handleImageLinkUpload 
} from '../controllers/image.js';
import { withResponseWrapper } from '../middleware/response.middleware.js';

export function imageRoutes(router) {
  router
    .post('/upload', withResponseWrapper(handleImageUpload))
    .post('/upload-links', withResponseWrapper(handleImageLinkUpload))
    .get('/file/:id', withResponseWrapper(handleGetImage))
    .post('/images', withResponseWrapper(handleGetImages))
    .post('/pubimg', withResponseWrapper(handleGetPublicImages));
}
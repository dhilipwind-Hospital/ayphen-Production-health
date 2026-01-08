import { Router } from 'express';
import { HealthArticleController } from '../controllers/health-article.controller';
import { authenticate } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = Router();

router.get('/categories', errorHandler(HealthArticleController.getCategories));
router.get('/', errorHandler(HealthArticleController.getArticles));
router.get('/:id', errorHandler(HealthArticleController.getArticle));
router.post('/', authenticate, errorHandler(HealthArticleController.createArticle));
router.put('/:id', authenticate, errorHandler(HealthArticleController.updateArticle));
router.delete('/:id', authenticate, errorHandler(HealthArticleController.deleteArticle));

export default router;

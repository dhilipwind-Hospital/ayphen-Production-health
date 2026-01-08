import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { HealthArticle, ArticleCategory } from '../models/HealthArticle';
import { User } from '../models/User';

export class HealthArticleController {
  // Create article
  static createArticle = async (req: Request, res: Response) => {
    try {
      const authorId = (req as any).user?.id;
      const { title, summary, content, category, tags, imageUrl, isPublished } = req.body;

      if (!title || !summary || !content || !category) {
        return res.status(400).json({ message: 'Required fields missing' });
      }

      const articleRepo = AppDataSource.getRepository(HealthArticle);
      const userRepo = AppDataSource.getRepository(User);

      const author = await userRepo.findOne({ where: { id: authorId } });
      if (!author) {
        return res.status(404).json({ message: 'Author not found' });
      }

      const article = articleRepo.create({
        title,
        summary,
        content,
        category,
        tags: tags || [],
        imageUrl,
        isPublished: isPublished !== false,
        author
      });

      await articleRepo.save(article);

      return res.status(201).json({
        message: 'Article created successfully',
        data: article
      });
    } catch (error) {
      console.error('Error creating article:', error);
      return res.status(500).json({ message: 'Error creating article' });
    }
  };

  // Get all articles
  static getArticles = async (req: Request, res: Response) => {
    try {
      const { category, tag, isPublished = 'true' } = req.query;
      const articleRepo = AppDataSource.getRepository(HealthArticle);

      const queryBuilder = articleRepo.createQueryBuilder('article')
        .leftJoinAndSelect('article.author', 'author')
        .orderBy('article.createdAt', 'DESC');

      if (isPublished === 'true') {
        queryBuilder.andWhere('article.isPublished = true');
      }

      if (category) {
        queryBuilder.andWhere('article.category = :category', { category });
      }

      if (tag) {
        queryBuilder.andWhere(':tag = ANY(article.tags)', { tag });
      }

      const articles = await queryBuilder.getMany();

      return res.json({
        data: articles,
        total: articles.length
      });
    } catch (error) {
      console.error('Error fetching articles:', error);
      return res.status(500).json({ message: 'Error fetching articles' });
    }
  };

  // Get article by ID
  static getArticle = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const articleRepo = AppDataSource.getRepository(HealthArticle);

      const article = await articleRepo.findOne({
        where: { id },
        relations: ['author']
      });

      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }

      // Increment view count
      article.viewCount += 1;
      await articleRepo.save(article);

      return res.json({ data: article });
    } catch (error) {
      console.error('Error fetching article:', error);
      return res.status(500).json({ message: 'Error fetching article' });
    }
  };

  // Update article
  static updateArticle = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const articleRepo = AppDataSource.getRepository(HealthArticle);

      const article = await articleRepo.findOne({ where: { id } });
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }

      Object.assign(article, updateData);
      await articleRepo.save(article);

      return res.json({
        message: 'Article updated successfully',
        data: article
      });
    } catch (error) {
      console.error('Error updating article:', error);
      return res.status(500).json({ message: 'Error updating article' });
    }
  };

  // Delete article
  static deleteArticle = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const articleRepo = AppDataSource.getRepository(HealthArticle);

      const article = await articleRepo.findOne({ where: { id } });
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }

      await articleRepo.remove(article);

      return res.json({ message: 'Article deleted successfully' });
    } catch (error) {
      console.error('Error deleting article:', error);
      return res.status(500).json({ message: 'Error deleting article' });
    }
  };

  // Get categories
  static getCategories = async (req: Request, res: Response) => {
    try {
      const categories = Object.values(ArticleCategory);
      return res.json({ data: categories });
    } catch (error) {
      console.error('Error fetching categories:', error);
      return res.status(500).json({ message: 'Error fetching categories' });
    }
  };
}

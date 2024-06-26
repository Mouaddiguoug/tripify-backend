import { NextFunction, Request, Response } from 'express';
import postService from '@/services/post.service';

class postController {
  public postService = new postService();

  public getPopularAlbums = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const popularPosts = await this.postService.getPopularAlbums();

      console.log(popularPosts);
      

      res.status(201).json({ popularPosts });
    } catch (error) {
      next(error);
    }
  };

  public buy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const buyerData = req.body;
      
      await this.postService.buy(buyerData);

      res.status(200);
    } catch (error) {
      next(error);
    }
  };

  public buyPack = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const buyerData = req.body;
      
      await this.postService.buyPack(buyerData);

      res.status(200);
    } catch (error) {
      next(error);
    }
  };

  public getRandomAlbums = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Number(req.params.page);
      const userId = String(req.params.id);
      
      const randomAlbums = await this.postService.getRandomAlbums(page, userId);

      res.status(201).json( randomAlbums );
    } catch (error) {
      next(error);
    }
  };

  public getAlbumByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categoryId = String(req.params.id);
      const AlbumByCategory = await this.postService.getAlbumByCategory(categoryId);

      res.status(201).json({ AlbumByCategory });
    } catch (error) {
      next(error);
    }
  }

  public getPostPictures = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const postId = String(req.params.id);
      const postPictures = await this.postService.getPostPictures(postId);

      res.status(201).json({ data: postPictures });
    } catch (error) {
      next(error);
    }
  };

  public getAllAlbums = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const allAlbums = await this.postService.getAllAlbums();
      

      res.status(201).json({ allAlbums });
    } catch (error) {
      next(error);
    }
  };

  public getSellerAlbum = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = String(req.params.id);
      console.log(userId);
      
      const sellerAlbums = await this.postService.getSellerAlbums(userId);
      
      res.status(201).json(sellerAlbums);
    } catch (error) {
      next(error);
    }
  };

  public getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.postService.getCategories();

      console.log(categories);
      

      res.status(201).json({ categories });
    } catch (error) {
      next(error);
    }
  };

  public updateViews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const postId = String(req.params.id);
      const updatedViews = await this.postService.UpdateViews(postId);

      res.status(201).json({ updatedViews });
    } catch (error) {
      next(error);
    }
  };

  public likePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const albumId = String(req.params.id);
      const userId = req.body.userId;
      await this.postService.likePost(albumId, userId);

      res.status(201).json({ message: "post liked successfully" });
    } catch (error) {
      next(error);
    }
  };

  public getAlbumPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const albumId = String(req.params.id);
      let plan = await this.postService.getAlbumPlan(albumId);

      res.status(200).json(plan);
    } catch (error) {
      next(error);
    }
  };

  public createPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const postData = req.body;
      const createdPost = await this.postService.createPost(postData);

      res.status(201).json({ data: createdPost });
    } catch (error) {
      next(error);
    }
  };

  public createPrivatePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const postData = req.body;
      const createdPost = await this.postService.createPrivatePost(postData);

      res.status(201).json({ data: createdPost });
    } catch (error) {
      next(error);
    }
  };

  public createPack = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const packs = req.body;
      const createdPost = await this.postService.createPack(packs);

      res.status(201).json({ data: createdPost });
    } catch (error) {
      next(error);
    }
  };
  
  public getPacks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const packs = await this.postService.getPacks();

      res.status(201).json({ data: packs });
    } catch (error) {
      next(error);
    }
  };

  public getPrivateTrips = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const privateTrips = await this.postService.getPrivateTrips();

      res.status(201).json({ data: privateTrips });
    } catch (error) {
      next(error);
    }
  };

  public uploadPostPictures = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pictureFiles = req.files;
      const collectionId = String(req.params.id);
      await this.postService.uploadPostPictures(pictureFiles, collectionId);

      res.status(201).json({ message: "post pictures have been uploaded successfully" });
    } catch (error) {
      next(error);
    }
  };
}

export default postController;

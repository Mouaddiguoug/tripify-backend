import { Router } from 'express';
import AuthController from '@controllers/auth.controller';
import { CreateUserDto } from '@dtos/users.dto';
import { Routes } from '@interfaces/routes.interface';
import authMiddleware from '@middlewares/auth.middleware';
import validationMiddleware from '@middlewares/validation.middleware';

class AuthRoute implements Routes {
  public path = '/';
  public router = Router();
  public authController = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}signup`, this.authController.signUp);
    this.router.post(`${this.path}login`, this.authController.logIn);
    this.router.post(`${this.path}refresh`, this.authController.generateRefreshToken);
    this.router.post(`${this.path}logout`, authMiddleware, this.authController.logOut);
    this.router.post(`${this.path}changePassword/:email`, authMiddleware, this.authController.changePassword);
    this.router.post(`${this.path}resendVerificationEmail/:email`, authMiddleware, this.authController.resendVerificationEMail);
  }
}

export default AuthRoute;

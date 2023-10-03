import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { SECRET_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, RequestWithUser } from '@interfaces/auth.interface';
import { initializeDbConnection } from '@/app';

const authMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const Authorization = req.cookies['Authorization'] || (req.header('Authorization') ? req.header('Authorization').split('Bearer ')[1] : null);
    const authMiddlewareSession = initializeDbConnection().session();
    if (Authorization) {
      
      const secretKey: string = SECRET_KEY;
      const verificationResponse = (verify(Authorization, secretKey)) as DataStoredInToken;
      
      const userId = verificationResponse.id;
      console.log(verificationResponse);
      
      const foundUser = await authMiddlewareSession.executeRead(tx => tx.run('match (u:user {id: $userId}) return u', {
        userId: userId
      }));

      if (foundUser.records.length > 0) {
        next();
      } else {
        next(new HttpException(400, 'Wrong authentication token'));
      }
    } else {
      next(new HttpException(400, 'Authentication token missing'));
    }
  } catch (error) {
    console.log(error);
    next(new HttpException(401, 'Wrong authentication token'));
  }
};

export default authMiddleware;

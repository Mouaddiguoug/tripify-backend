import { hash, compare } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { SECRET_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { User } from '@interfaces/users.interface';
import userModel from '@models/users.model';
import { isEmpty } from '@utils/util';
import { initializeDbConnection, stripe } from '@/app';
import { RolesEnum } from '../enums/RolesEnums';
import uid from 'uid';
import moment from 'moment';
import { transporter } from '@/app';

class AuthService {
  public users = userModel;

  public async signup(userData) {
    if (!userData) throw new HttpException(400, 'userData is empty');
    
    const signupSession = initializeDbConnection().session({ database: 'neo4j' });
    const createWalletSession = initializeDbConnection().session({ database: 'neo4j' });

    const email = userData.email;
    try {
      const findUser = await signupSession.executeRead(tx => tx.run('match (u:user {email: $email}) return u', { email: email }));
      if (findUser.records.length > 0) return { message: `This email ${userData.email} already exists` };
      const hashedPassword = await hash(userData.password, 10);
      if ( !userData.firstName || !userData.lastName || !userData.email || !userData.phoneNumber) return { message: 'mlissing data' };
          const createdUserBuyer = await 
          
          signupSession.executeWrite(tx =>
            tx.run(
              'create (u:user {id: $userId, name: $name, email: $email, phone: $phoneNumber, createdAt: $createdAt}) return u',
              {
                userId: uid.uid(40),
                createdAt: moment().format('MMMM DD, YYYY'),
                email: email,
                phoneNumber: userData.phoneNumber,
                name: `${userData.firstName} ${userData.lastName}`,
              },
            ),
          );

          const buyerToken = this.createToken(process.env.EMAIL_SECRET, createdUserBuyer.records.map(record => record.get('u').properties.id)[0]);
          this.sendSignUpEmail(email);

          return { tokenData: buyerToken, data: createdUserBuyer.records.map(record => record.get('u').properties)[0] };
         
    } catch (error) {
      console.log(error);
    } finally {
      await signupSession.close();
      await createWalletSession.close();
    }
  }

  public async sendSignUpEmail(email: string) {
    try {
      const mailOptions = {
        template: 'verifying_email',
        from: process.env.USER_EMAIL,
        to: process.env.USER_EMAIL,
        subject: 'Signup alert',
        context: {
          email: email,
        },
      };

      transporter.sendMail(mailOptions, (error: any, data: any) => {
        if (error) console.log(error);
        if (!error) console.log('sent');
      });
    } catch (error) {
      console.log(error);
    }
  }

  public async resendVerificationEmail(email: string) {
    const getUserByEmailSession = initializeDbConnection().session();

    try {
      const user = await getUserByEmailSession.executeRead(tx => tx.run("match (u:user {email: $email})-[:IS_A]->(b:buyer) return u, b", {
        email: email
      }));
  
      const tokenData = this.createToken(process.env.EMAIL_SECRET, user.records.map(record => record.get('u').properties.id)[0])
  

      const mailOptions = {
        template: 'verifying_email',
        from: process.env.USER,
        to: email,
        subject: 'Verifying Email',
        context: {
          userName: user.records.map(record => record.get('u').properties.userName)[0],
          token: tokenData.token,
          domain: process.env.DOMAIN,
          role: user.records.map(record => record.get('b').properties).length == 0 ? "Seller" : "Buyer",
        },
      };

      transporter.sendMail(mailOptions, (error: any, data: any) => {
        if (error) console.log(error);
        if (!error) console.log('sent');
      });
    } catch (error) {
      console.log(error);
    }
  }

  public async changePassword(email: String, userData: any) {
    const checkUserSession = initializeDbConnection().session();
    const changePasswordSession = initializeDbConnection().session();
    try {

      const findUser = await checkUserSession.executeRead(tx => tx.run('match (u:user {email: $email}) return u', { email: email }));
      if (findUser.records.length == 0) return { message: `old password is incorrect` };

      const password = findUser.records.map(record => record.get('u').properties.password)[0];
      const isPasswordMatching = await compare(userData.data.oldPassword, password);
      if (!isPasswordMatching) return { message: 'old password is incorrect' };
      const hashedPassword = await hash(userData.data.newPassword, 10);
      const changedPassword = await changePasswordSession.executeWrite(tx =>
        tx.run('match (u {email: $email}) set u.password = $newPassword return u', {
          email: email,
          newPassword: hashedPassword,
        }),
      );

      return changedPassword.records.map(record => record.get('u').properties)[0];
    } catch (error) {
      console.log(error);
    } finally {
      changePasswordSession.close();
    }
  }

  public async login(userData) {
    if (isEmpty(userData)) throw new HttpException(400, 'userData is empty');
    const loginSession = initializeDbConnection().session({ database: 'neo4j' });

    try {
      const email = userData.data.email;

      const findUser = await loginSession.executeRead(tx => tx.run('match (u:user {email: $email}) return u', { email: email }));
      if (findUser.records.length == 0) return { message: `password or email is incorrect` };

      const password = findUser.records.map(record => record.get('u').properties.password)[0];
      const isPasswordMatching = await compare(userData.data.password, password);
      const userId = findUser.records.map(record => record.get('u').properties.id)[0];

      if (!isPasswordMatching) return { message: 'password or email is incorrect' };

      const tokenData = this.createToken(
        process.env.SECRET_KEY,
        userId,
      );

      return { tokenData, data: findUser.records.map(record => record.get('u').properties)[0]};
    } catch (error) {
      console.log(error);
    } finally {
      loginSession.close();
    }
  }  
  

  public async refreshToken(id: string) {

    if (!id) return { message: 'missing token' };
    const refreshSession = initializeDbConnection().session({ database: 'neo4j' });
    try {
      const tokenData = this.createRefreshToken(id);

      return { tokenData };
    } catch (error) {
      console.log(error);
    } finally {
      refreshSession.close();
    }
  }

  public async logout(userData: User): Promise<User> {
    if (isEmpty(userData)) throw new HttpException(400, 'userData is empty');

    const findUser: User = this.users.find(user => user.email === userData.email && user.password === userData.password);
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    return findUser;
  }

  public createToken(secret: string, data: any) {
    try {
      const dataStoredInToken = { id: data };
      const secretKey: string = secret;
      const expiresAt: string = '280s';
      const expiresIn: Date = new Date();
      console.log(expiresIn);
      expiresIn.setTime(expiresIn.getTime() + 60000);

      console.log(expiresIn);


      return { token: sign(dataStoredInToken, secretKey, { expiresIn: expiresAt }), expiresIn: moment(expiresIn).format("YYYY-MM-DD HH:mm:ss.ms") };
    } catch (error) {
      console.log(error);
    }
  }

  public createRefreshToken(data) {
    try {
      const dataStoredInToken = { id: data, refresh: true };

      const secretKey: string = SECRET_KEY;
      const expiresAt: string = '280s';
      const expiresIn: Date = new Date();
      expiresIn.setTime(expiresIn.getTime() + 60);

      return { token: sign(dataStoredInToken, secretKey, { expiresIn: expiresAt }), expiresIn: moment(expiresIn).format("YYYY-MM-DD hh:mm:ss.ms") };
    } catch (error) {
      console.log(error);
    }
  }

  public createCookie(tokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
  }
}

export default AuthService;

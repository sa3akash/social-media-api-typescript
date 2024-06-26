import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import HTTP_STATUS from 'http-status-codes';
// custom files
import { joiValidation } from '@globals/decorators/joiValidationDecorators';
import { config } from '@root/config';
import { loginSchema } from '@auth/schemas/signinSchemaJoi';
import { authService } from '@services/db/auth.services';
import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { BadRequestError } from '@globals/helpers/errorHandler';
import { emailQueue } from '@services/queues/email-queue';
import { forgotPasswordTemplate } from '@services/emails/template/forgotPassword/forgotPasswordTemplate';

export class SigninController {
  @joiValidation(loginSchema)
  /**
   *
   * main sign up function
   *
   */
  public async read(req: Request, res: Response) {
    const { email, password } = req.body;
    // console.log(req.headers['user-agent']);
    // const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    // console.log(ip);

    const existingUser: IAuthDocument = await authService.getUserByEmailOrUsername(email);
    if (!existingUser) throw new BadRequestError('Invalid credentials.');

    const passwordMatch: boolean = await existingUser.comparePassword(password);
    if (!passwordMatch) throw new BadRequestError('Invalid credentials.');

    const token: string = SigninController.prototype.signToken(existingUser);
    // email
    const template: string = forgotPasswordTemplate.forgotEmailTemplate(existingUser.username, 'link');

    const emailData = {
      receiverEmail: existingUser.email,
      template: template,
      subject: 'test development'
    };
    emailQueue.addEmailJob('addEmailNotification', emailData);
    // response user
    req.session = { token };
    res.status(HTTP_STATUS.OK).json({
      message: 'User login successfully',
      user: {
        name: existingUser.name,
        profilePicture: existingUser.profilePicture,
        coverPicture: existingUser.coverPicture,
        authId: existingUser._id,
        username: existingUser.username,
        uId: existingUser.uId,
        email: existingUser.email,
        avatarColor: existingUser.avatarColor,
        quote: existingUser.quote,
        createdAt: existingUser.createdAt
      }
    });
  }
  /**
   *
   * sign token
   *
   */

  private signToken(data: IAuthDocument): string {
    return jwt.sign(
      {
        id: data._id,
        email: data.email,
        username: data.username,
        avatarColor: data.avatarColor,
        name: data.name,
        uId: data.uId,
        coverPicture: data.coverPicture,
        profilePicture: data.profilePicture,
        createdAt: data.createdAt
      },
      config.JWT_SEC!
    );
  }
}

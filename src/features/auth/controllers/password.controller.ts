// internal modules
import crypto from 'crypto';
// external libraries
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
// custom files
import { emailSchema, passwordSchema } from '@auth/schemas/passwordSchemaJoi';
import { joiValidation } from '@globals/decorators/joiValidationDecorators';
import { BadRequestError } from '@globals/helpers/errorHandler';
import { authService } from '@services/db/auth.services';
import { config } from '@root/config';
import { forgotPasswordTemplate } from '@services/emails/template/forgotPassword/forgotPasswordTemplate';
import { emailQueue } from '@services/queues/email-queue';
import { IResetPasswordParams } from '@user/interfaces/user.interface';
import { resetPassword } from '@services/emails/template/resetPassword/resetPasswordTemplate';

export class PasswordController {
  @joiValidation(emailSchema)
  public async resetPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    const existingUser = await authService.getAuthUserByEmail(email);
    if (!existingUser) throw new BadRequestError('User not found.');

    const randomToken: string = (await Promise.resolve(crypto.randomBytes(20))).toString('hex');
    await authService.updatePasswordToken(`${existingUser._id}`, randomToken, Date.now() + 60 * 60 * 1000);

    const resetLink: string = `${config.CLIENT_URL}/reset-password?token=${randomToken}`;
    const template: string = forgotPasswordTemplate.forgotEmailTemplate(`${existingUser.username}`, resetLink);
    // send email
    emailQueue.addEmailJob('forgotPasswordEmail', {
      receiverEmail: email,
      subject: 'Reset your password',
      template: template
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Password reset email send, please check your email.' });
  }

  @joiValidation(passwordSchema)
  public async changePassword(req: Request, res: Response): Promise<void> {
    const { password } = req.body;
    const { token } = req.params;

    const existingUser = await authService.getAuthByPasswordToken(token);
    if (!existingUser) throw new BadRequestError('Token is expired');

    existingUser.password = password;
    existingUser.passwordResetExpires = undefined;
    existingUser.passwordResetToken = undefined;
    await existingUser.save();

    // send email
    const templateParams: IResetPasswordParams = {
      date: `${new Date()}`,
      email: existingUser.email,
      ipaddress: '',
      username: existingUser.username
    };
    const template: string = resetPassword.passwordResetTemplate(templateParams);
    // send email
    emailQueue.addEmailJob('changePassword', {
      subject: 'Password changed successfully.',
      template: template,
      receiverEmail: existingUser.email
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Password changed successfull.' });
  }
}

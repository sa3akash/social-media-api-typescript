import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { joiValidation } from '@globals/decorators/joiValidationDecorators';
import { BadRequestError } from '@globals/helpers/errorHandler';
import { authService } from '@services/db/auth.services';
import { userService } from '@services/db/user.services';
import { resetPassword } from '@services/emails/template/resetPassword/resetPasswordTemplate';
import { emailQueue } from '@services/queues/email-queue';
import { IResetPasswordParams } from '@user/interfaces/user.interface';
import { changePasswordSchema } from '@user/schemas/info';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import moment from 'moment';
import publicIP from 'ip';

export class UpdatePasswordController {
  @joiValidation(changePasswordSchema)
  public async password(req: Request, res: Response): Promise<void> {
    const { currentPassword, newPassword } = req.body;

    const existingUser: IAuthDocument = await authService.getAuthUserByAuthId(req.currentUser!.id);

    const passwordsMatch: boolean = await existingUser.comparePassword(currentPassword);
    if (!passwordsMatch) {
      throw new BadRequestError('Invalid credentials');
    }
    const hashedPassword: string = await existingUser.hashPassword(newPassword);
    // upate password in mongodb database
    userService.updatePassword(`${req.currentUser!.id}`, hashedPassword);

    const templateParams: IResetPasswordParams = {
      username: existingUser.name.first!,
      email: existingUser.email!,
      ipaddress: publicIP.address(),
      date: moment().format('DD//MM//YYYY HH:mm')
    };
    const template: string = resetPassword.passwordResetTemplate(templateParams);
    emailQueue.addEmailJob('changePasswordWithApp', {
      template,
      receiverEmail: existingUser.email!,
      subject: 'Password update confirmation'
    });

    res.status(HTTP_STATUS.OK).json({
      message: 'Password updated successfully. You will be redirected shortly to the login page.'
    });
  }
}

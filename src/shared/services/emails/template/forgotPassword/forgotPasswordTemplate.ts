import fs from 'fs';
import ejs from 'ejs';

class ForgotPasswordTemplate {
  public forgotEmailTemplate(username: string, resetLink: string): string {
    return ejs.render(fs.readFileSync(__dirname + '/forgotPasswordTemplate.ejs', 'utf8'), {
      username: username,
      resetLink: resetLink,
      image_url: 'https://w7.pngwing.com/pngs/120/102/png-transparent-padlock-logo-computer-icons-padlock-technic-logo-password-lock.png'
    });
  }
}
// image_url

export const forgotPasswordTemplate: ForgotPasswordTemplate = new ForgotPasswordTemplate();

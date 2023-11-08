import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { AuthModel } from '@auth/models/auth.model';

class AuthService {
  public async getUserByEmailOrUsername(text: string): Promise<IAuthDocument> {
    const query = {
      $or: [{ username: text }, { email: text }]
    };
    const user: IAuthDocument = (await AuthModel.findOne(query).exec()) as IAuthDocument;
    return user;
  }
  /**
   *
   * validate username
   *
   */
  public async createAuthUser(data: IAuthDocument): Promise<void> {
    await AuthModel.create(data);
  }

  /**
   *
   * validate username
   *
   */
  public async validateUsername(username: string): Promise<string> {
    let a = false;
    do {
      const check = await AuthModel.findOne({ username });
      if (check) {
        username += (+new Date() * Math.random()).toString().substring(0, 5);
        a = true;
      } else {
        a = false;
      }
    } while (a);
    return username;
  }
}

export const authService: AuthService = new AuthService();

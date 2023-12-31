import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { AuthModel } from '@auth/models/auth.db.model';

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
   * validate create auth user
   *
   */
  public async createAuthUser(data: IAuthDocument): Promise<void> {
    await AuthModel.create(data);
  }
  /**
   *
   * get auth user by email
   *
   */
  public async getAuthUserByEmail(email: string): Promise<IAuthDocument> {
    return (await AuthModel.findOne({ email: email.toLowerCase() })) as IAuthDocument;
  }

  public async getAuthUserByAuthId(authId: string): Promise<IAuthDocument> {
    return (await AuthModel.findById(authId)) as IAuthDocument;
  }
  public async getAuthUserByUsername(username: string): Promise<IAuthDocument> {
    return (await AuthModel.findOne({ username: username })) as IAuthDocument;
  }

  public async updatePasswordToken(authId: string, token: string, tokenExpiration: number): Promise<void> {
    await AuthModel.updateOne(
      { _id: authId },
      {
        passwordResetToken: token,
        passwordResetExpires: tokenExpiration
      }
    );
  }
  public async getAuthByPasswordToken(token: string): Promise<IAuthDocument> {
    return (await AuthModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    })) as IAuthDocument;
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
  /**
   *
   * update images in user
   *
   */
  public async updateProfilePicture(authId: string, imageURl: string): Promise<void> {
    await AuthModel.findByIdAndUpdate(authId, { $set: { profilePicture: imageURl } });
  }
  public async updateCoverPicture(authId: string, imageURl: string): Promise<void> {
    await AuthModel.findByIdAndUpdate(authId, { $set: { coverPicture: imageURl } });
  }

  public async updateUsernamePicture(authId: string, username: string): Promise<void> {
    await AuthModel.findByIdAndUpdate(authId, { $set: { username: username } });
  }
}

export const authService: AuthService = new AuthService();

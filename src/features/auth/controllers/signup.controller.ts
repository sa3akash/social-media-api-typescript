// external libraries
import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import HTTP_STATUS from 'http-status-codes';
// custom files
import { joiValidation } from '@globals/decorators/joiValidationDecorators';
import { signupSchema } from '@auth/schemas/signupSchemaJoi';
import { IAuthDocument, ISignUpData } from '@auth/interfaces/auth.interface';
import { authService } from '@services/db/auth.services';
import { BadRequestError } from '@globals/helpers/errorHandler';
import { Utils } from '@globals/helpers/utils';
import { IUserDocument } from '@user/interfaces/user.interface';
import { userCache } from '@services/cache/user.cache';
import { authQueue } from '@services/queues/auth.queue';
import { userQueue } from '@services/queues/user.queue';
import { config } from '@root/config';

export class SignupController {
  @joiValidation(signupSchema)
  /**
   *
   * main sign up function
   *
   */
  public async signup(req: Request, res: Response): Promise<void> {
    const { firstname, lastname, password, email, gender } = req.body;
    const checkUser: IAuthDocument = await authService.getUserByEmailOrUsername(email);
    if (checkUser) {
      throw new BadRequestError('This user already exists.');
    }

    const authObjectId: ObjectId = new ObjectId();
    const userObjectId: ObjectId = new ObjectId();
    // prepire auth data for db
    const authData: IAuthDocument = SignupController.prototype.signupData({
      _id: authObjectId,
      name: {
        first: firstname,
        last: lastname,
        nick: ''
      },
      email,
      password
    });
    // prepire user data for db
    const userData = SignupController.prototype.userData(authObjectId, userObjectId, gender);
    // save full user data in redis cache
    await userCache.saveUserToCache(authData, userData);
    // save to database
    authQueue.addAuthUserJob('addAuthDataInDB', { value: authData });
    userQueue.addUserDataJob('addUserDataInDB', { value: userData });
    // jsonwebtoken
    const token: string = SignupController.prototype.signToken(authData);
    // response user
    req.session = { token };
    res.status(HTTP_STATUS.CREATED).json({
      message: 'User created successfully.',
      user: {
        name: authData.name,
        profilePicture: authData.profilePicture,
        coverPicture: authData.coverPicture,
        _id: authData._id,
        username: authData.username,
        uId: authData.uId,
        email: authData.email,
        avatarColor: authData.avatarColor,
        quote: authData.quote,
        createdAt: authData.createdAt
      }
    });
  }

  private signupData(data: ISignUpData): IAuthDocument {
    const { _id, name, email, password } = data;
    return {
      _id,
      uId: `${Utils.generateRandomIntegers(12)}`,
      name,
      username: Utils.generateRandomString(8),
      // username: await authService.validateUsername(name.first + name.last),
      email: email.toLowerCase(),
      password,
      profilePicture: {
        url: '',
        hash: ''
      },
      coverPicture: {
        url: '',
        hash: ''
      },
      quote: '',
      avatarColor: Utils.generateColor(),
      createdAt: new Date()
    } as unknown as IAuthDocument;
  }

  private userData(authObjectId: ObjectId, userObjectId: ObjectId, gender: string): IUserDocument {
    return {
      _id: userObjectId,
      authId: authObjectId,
      blocked: [],
      blockedBy: [],
      work: '',
      school: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      website: '',
      gender: gender,
      createdAt: new Date(),
      notifications: {
        messages: true,
        reactions: true,
        comments: true,
        follows: true
      },
      social: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: ''
      },
      address: {
        street: '',
        city: '',
        zipcode: '',
        local: '',
        country: ''
      },
      dob: {
        day: '',
        month: '',
        year: ''
      }
    } as unknown as IUserDocument;
  }

  private signToken(data: IAuthDocument): string {
    return jwt.sign(
      {
        id: data._id,
        email: data.email,
        username: data.username,
        avatarColor: data.avatarColor
      },
      config.JWT_SEC!
    );
  }
}

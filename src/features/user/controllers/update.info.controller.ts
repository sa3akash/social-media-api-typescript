import { IUpdateUserInfoDoc } from '@auth/interfaces/auth.interface';
import { joiValidation } from '@globals/decorators/joiValidationDecorators';
import { userCache } from '@services/cache/user.cache';
import { userQueue } from '@services/queues/user.queue';
import { basicInfoSchema } from '@user/schemas/info';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class EditBasicInfo {
  /**
   *
   * edit basic info
   *
   */
  @joiValidation(basicInfoSchema)
  public editInfo(req: Request, res: Response): void {
    const data: IUpdateUserInfoDoc = EditBasicInfo.prototype.prepireData(req);

    userCache.updateUserInfoFromCache(`${req.currentUser!.id}`, data);

    userQueue.updateUserDataJob('updateBasicInfoInDB', {
      key: `${req.currentUser!.id}`,
      value: data
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Updated successfully' });
  }

  private prepireData(req: Request): IUpdateUserInfoDoc {
    return {
      work: req.body.work || '',
      school: req.body.school || '',
      website: req.body.website || '',
      gender: req.body.gender || '',
      quote: req.body.quote || '',
      social: {
        facebook: req.body.facebook || '',
        instagram: req.body.instagram || '',
        twitter: req.body.twitter || '',
        youtube: req.body.youtube || ''
      },
      relationShip: {
        type: req.body.relationShipType || '',
        partner: req.body.relationShipPartner || ''
      },
      address: {
        street: req.body.addStreet || '',
        city: req.body.addcity || '',
        zipcode: req.body.addZipcode || '',
        local: req.body.addLocal || '',
        country: req.body.addCountry || ''
      },

      dob: {
        day: req.body.dobDay || '',
        month: req.body.dobMonth || '',
        year: req.body.dobYear || ''
      }
    } as IUpdateUserInfoDoc;
  }
}

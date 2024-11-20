
import { model, Model, Schema } from 'mongoose';
import { IGoLive } from '../interfaces/goLive.interface';
import { Utils } from '@globals/helpers/utils';

const GoLiveModel: Schema = new Schema<IGoLive>({
  streamKey: {
    type: String,
    unique: true,
    index: true,
    default: Utils.generateStreamKey(),
  },
  authId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  isLive: {
    type: Boolean,
    default: false,
  },
  privacy: {
    type: String,
  }

    
});

const GoLive: Model<IGoLive> = model<IGoLive>('GoLive', GoLiveModel, 'GoLive');
export { GoLive };

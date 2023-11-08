import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from 'cloudinary';
import { config } from '@root/config';
import { BadRequestError } from '@globals/helpers/errorHandler';

class UploadService {
  private upload: multer.Multer;

  constructor() {
    // Configure Cloudinary
    cloudinary.v2.config({
      cloud_name: config.CLOUD_NAME,
      api_key: config.CLOUD_API_KEY,
      api_secret: config.CLOUD_API_SEC
    });

    // Configure Multer storage using Cloudinary
    const storage = new CloudinaryStorage({
      cloudinary: cloudinary.v2,
      //   req, file
      params: () => {
        return {
          folder: 'social-media', // Specify the desired folder name
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          quality: 'auto:good' // Set the desired quality level (e.g., auto:low, auto:good, auto:best)
        };
      }
    });

    // Create Multer instance
    this.upload = multer({ storage, limits: { fileSize: 1000000 * 2 } });
  }

  getSingleUploadMiddleware() {
    return this.upload.single('image');
  }

  getMultipleUploadMiddleware() {
    return this.upload.array('images', 5); // Limit to 5 images per request
  }

  async deleteFile(publicId: string) {
    try {
      return await cloudinary.v2.uploader.destroy(publicId);
    } catch (error) {
      throw new BadRequestError('file upload failed.');
    }
  }

  async updateFile(publicId: string, newFile: Express.Multer.File) {
    try {
      await cloudinary.v2.uploader.destroy(publicId);
      const result = await cloudinary.v2.uploader.upload(newFile.path, {
        folder: 'social-media', // Specify the desired folder name
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        quality: 'auto:good', // Set the desired quality level (e.g., auto:low, auto:good, auto:best)
        public_id: publicId
      });
      return result;
    } catch (error) {
      throw new BadRequestError('file upload failed.');
    }
  }

  getFileUrl(publicId: string) {
    return cloudinary.v2.url(publicId);
  }

  getPublicId(imageUrl: string) {
    return imageUrl.split('/').pop()?.split('.')[0] as string;
  }
}

export const uploadService: UploadService = new UploadService();

// ==================================

// import { config } from '@root/config';
// import cloudinary from 'cloudinary';
// import { CloudinaryStorage } from 'multer-storage-cloudinary';
// import { BadRequestError } from '@globals/helpers/errorHandler';

// import multer from 'multer';

// cloudinary.v2.config({
//   cloud_name: config.CLOUD_NAME,
//   api_key: config.CLOUD_API_KEY,
//   api_secret: config.CLOUD_API_SEC
// });

// // Configure Multer storage using Cloudinary
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary.v2,
//   params: () => {
//     return {
//       folder: 'social-media', // Specify the desired folder name
//       allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
//       quality: 'auto:good' // Set the desired quality level (e.g., auto:low, auto:good, auto:best)
//     };
//   }
// });

// // Create Multer instance
// export const upload = multer({ storage });

// export const deleteFile = async (publicId: string) => {
//   try {
//     return await cloudinary.v2.uploader.destroy(publicId);
//   } catch (error) {
//     throw new BadRequestError('file upload failed.');
//   }
// };

// export const getFileUrl = async (publicId: string) => {
//   try {
//     return await cloudinary.v2.url(publicId);
//   } catch (error) {
//     throw new BadRequestError('file upload failed.');
//   }
// };

// export const getPublicId = (imageUrl: string) => {
//   return imageUrl.split('/').pop()?.split('.')[0] as string;
// };

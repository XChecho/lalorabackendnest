import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
}

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(
    file: string | Buffer,
    folder: string = 'products',
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder,
        resource_type: 'image' as const,
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto:good' },
        ],
      };

      if (typeof file === 'string' && file.startsWith('http')) {
        cloudinary.uploader.upload(file, uploadOptions, (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              publicId: result.public_id,
              url: result.url,
              secureUrl: result.secure_url,
            });
          }
        });
      } else {
        cloudinary.uploader
          .upload_stream(uploadOptions, (error, result) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve({
                publicId: result.public_id,
                url: result.url,
                secureUrl: result.secure_url,
              });
            }
          })
          .end(file as Buffer);
      }
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

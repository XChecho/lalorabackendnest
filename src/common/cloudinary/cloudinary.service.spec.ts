import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService, UploadResult } from './cloudinary.service';

// Mock de cloudinary.v2
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

import { v2 as cloudinary } from 'cloudinary';

describe('CloudinaryService', () => {
  let service: CloudinaryService;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    // Arrange: limpiar mocks y configurar módulo de testing
    jest.clearAllMocks();

    mockConfigService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    // Configurar valores de config para Cloudinary
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'CLOUDINARY_CLOUD_NAME':
          return 'test-cloud';
        case 'CLOUDINARY_API_KEY':
          return 'test-key';
        case 'CLOUDINARY_API_SECRET':
          return 'test-secret';
        default:
          return undefined;
      }
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  it('debería estar definido', () => {
    // Assert: verificar que el servicio se instancia
    expect(service).toBeDefined();
  });

  it('debería configurar cloudinary con las credenciales del ConfigService en el constructor', () => {
    // Assert: verificar que cloudinary.config fue llamado con los valores correctos
    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'test-cloud',
      api_key: 'test-key',
      api_secret: 'test-secret',
    });
  });

  describe('uploadImage', () => {
    it('debería subir una imagen por URL a Cloudinary', async () => {
      // Arrange: preparar URL de imagen y mock del uploader
      const imageUrl = 'https://example.com/image.jpg';
      const mockResult = {
        public_id: 'products/abc123',
        url: 'http://res.cloudinary.com/test-cloud/image.jpg',
        secure_url: 'https://res.cloudinary.com/test-cloud/image.jpg',
      };

      (cloudinary.uploader.upload as jest.Mock).mockImplementation(
        (_url: string, _options: any, callback: Function) => {
          callback(null, mockResult);
        },
      );

      // Act: llamar a uploadImage con URL
      const result: UploadResult = await service.uploadImage(imageUrl);

      // Assert: verificar que el uploader fue llamado y el resultado es correcto
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        imageUrl,
        expect.objectContaining({
          folder: 'products',
          resource_type: 'image',
        }),
        expect.any(Function),
      );
      expect(result).toEqual({
        publicId: 'products/abc123',
        url: 'http://res.cloudinary.com/test-cloud/image.jpg',
        secureUrl: 'https://res.cloudinary.com/test-cloud/image.jpg',
      });
    });

    it('debería subir una imagen por Buffer a Cloudinary usando upload_stream', async () => {
      // Arrange: preparar Buffer y mock del upload_stream
      const imageBuffer = Buffer.from('fake-image-data');
      const mockResult = {
        public_id: 'products/buffer123',
        url: 'http://res.cloudinary.com/test-cloud/buffer.jpg',
        secure_url: 'https://res.cloudinary.com/test-cloud/buffer.jpg',
      };

      const mockStream = {
        end: jest.fn().mockImplementation(function (this: any, _buffer: Buffer) {
          // Simular callback del stream
          this._callback(null, mockResult);
          return this;
        }),
      };

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options: any, callback: Function) => {
          mockStream._callback = callback;
          return mockStream;
        },
      );

      // Act: llamar a uploadImage con Buffer
      const result: UploadResult = await service.uploadImage(imageBuffer);

      // Assert: verificar que upload_stream fue usado
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'products',
          resource_type: 'image',
        }),
        expect.any(Function),
      );
      expect(result).toEqual({
        publicId: 'products/buffer123',
        url: 'http://res.cloudinary.com/test-cloud/buffer.jpg',
        secureUrl: 'https://res.cloudinary.com/test-cloud/buffer.jpg',
      });
    });

    it('debería usar un folder personalizado cuando se especifica', async () => {
      // Arrange: preparar URL y folder custom
      const imageUrl = 'https://example.com/banner.jpg';
      const mockResult = {
        public_id: 'banners/banner1',
        url: 'http://res.cloudinary.com/test-cloud/banner.jpg',
        secure_url: 'https://res.cloudinary.com/test-cloud/banner.jpg',
      };

      (cloudinary.uploader.upload as jest.Mock).mockImplementation(
        (_url: string, _options: any, callback: Function) => {
          callback(null, mockResult);
        },
      );

      // Act: llamar con folder personalizado
      await service.uploadImage(imageUrl, 'banners');

      // Assert: verificar que el folder custom se usa
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        imageUrl,
        expect.objectContaining({
          folder: 'banners',
        }),
        expect.any(Function),
      );
    });

    it('debería rechazar cuando cloudinary retorna error', async () => {
      // Arrange: preparar error de cloudinary
      const imageUrl = 'https://example.com/fail.jpg';
      const mockError = new Error('Upload failed');

      (cloudinary.uploader.upload as jest.Mock).mockImplementation(
        (_url: string, _options: any, callback: Function) => {
          callback(mockError, null);
        },
      );

      // Act & Assert: verificar que la promesa rechaza
      await expect(service.uploadImage(imageUrl)).rejects.toThrow(
        'Upload failed',
      );
    });

    it('debería aplicar transformación de imagen por defecto', async () => {
      // Arrange: preparar imagen
      const imageUrl = 'https://example.com/photo.jpg';
      const mockResult = {
        public_id: 'products/photo1',
        url: 'http://res.cloudinary.com/test-cloud/photo.jpg',
        secure_url: 'https://res.cloudinary.com/test-cloud/photo.jpg',
      };

      (cloudinary.uploader.upload as jest.Mock).mockImplementation(
        (_url: string, _options: any, callback: Function) => {
          callback(null, mockResult);
        },
      );

      // Act: subir imagen
      await service.uploadImage(imageUrl);

      // Assert: verificar que las transformaciones se aplican
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        imageUrl,
        expect.objectContaining({
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto:good' },
          ],
        }),
        expect.any(Function),
      );
    });
  });

  describe('deleteImage', () => {
    it('debería eliminar una imagen de Cloudinary por publicId', async () => {
      // Arrange: preparar publicId y mock del destroy
      const publicId = 'products/abc123';

      (cloudinary.uploader.destroy as jest.Mock).mockImplementation(
        (_publicId: string, callback: Function) => {
          callback(null, { result: 'ok' });
        },
      );

      // Act: llamar a deleteImage
      await service.deleteImage(publicId);

      // Assert: verificar que destroy fue llamado con el publicId correcto
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        publicId,
        expect.any(Function),
      );
    });

    it('debería rechazar cuando cloudinary retorna error al eliminar', async () => {
      // Arrange: preparar error de cloudinary
      const publicId = 'products/nonexistent';
      const mockError = new Error('Resource not found');

      (cloudinary.uploader.destroy as jest.Mock).mockImplementation(
        (_publicId: string, callback: Function) => {
          callback(mockError);
        },
      );

      // Act & Assert: verificar que la promesa rechaza
      await expect(service.deleteImage(publicId)).rejects.toThrow(
        'Resource not found',
      );
    });
  });
});

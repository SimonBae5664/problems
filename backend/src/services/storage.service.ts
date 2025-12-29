import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

export interface StorageConfig {
  type: 's3' | 'r2' | 'gcs';
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint?: string;
  region?: string;
}

export class StorageService {
  private s3: AWS.S3;
  private bucket: string;

  constructor(config: StorageConfig) {
    this.bucket = config.bucket;

    const s3Config: AWS.S3.ClientConfiguration = {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region || 'ap-northeast-2',
    };

    // R2나 다른 S3 호환 서비스의 경우 endpoint 설정
    if (config.endpoint) {
      s3Config.endpoint = config.endpoint;
      s3Config.s3ForcePathStyle = true;
    }

    this.s3 = new AWS.S3(s3Config);
  }

  /**
   * 파일 업로드
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'problems'
  ): Promise<string> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucket,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // 또는 버킷 정책으로 설정
    };

    await this.s3.putObject(params).promise();

    // URL 생성
    if (this.s3.config.endpoint) {
      // 커스텀 엔드포인트인 경우
      return `${this.s3.config.endpoint}/${this.bucket}/${fileName}`;
    } else {
      // 표준 S3 URL
      return `https://${this.bucket}.s3.${this.s3.config.region || 'ap-northeast-2'}.amazonaws.com/${fileName}`;
    }
  }

  /**
   * 파일 삭제
   */
  async deleteFile(fileUrl: string): Promise<void> {
    // URL에서 키 추출
    const key = this.extractKeyFromUrl(fileUrl);
    
    if (!key) {
      throw new Error('Invalid file URL');
    }

    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: this.bucket,
      Key: key,
    };

    await this.s3.deleteObject(params).promise();
  }

  /**
   * URL에서 S3 키 추출
   */
  private extractKeyFromUrl(url: string): string | null {
    try {
      // 표준 S3 URL: https://bucket.s3.region.amazonaws.com/key
      const s3Match = url.match(/https?:\/\/[^\/]+\/(.+)$/);
      if (s3Match) {
        return s3Match[1];
      }

      // 커스텀 엔드포인트: https://endpoint/bucket/key
      const customMatch = url.match(/https?:\/\/[^\/]+\/[^\/]+\/(.+)$/);
      if (customMatch) {
        return customMatch[1];
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * 파일 존재 여부 확인
   */
  async fileExists(fileUrl: string): Promise<boolean> {
    try {
      const key = this.extractKeyFromUrl(fileUrl);
      if (!key) {
        return false;
      }

      const params: AWS.S3.HeadObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };

      await this.s3.headObject(params).promise();
      return true;
    } catch {
      return false;
    }
  }
}

// 싱글톤 인스턴스 생성
let storageServiceInstance: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!storageServiceInstance) {
    const config: StorageConfig = {
      type: (process.env.STORAGE_TYPE as 's3' | 'r2' | 'gcs') || 's3',
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || '',
      bucket: process.env.STORAGE_BUCKET || '',
      endpoint: process.env.STORAGE_ENDPOINT,
      region: process.env.STORAGE_REGION,
    };

    if (!config.accessKeyId || !config.secretAccessKey || !config.bucket) {
      throw new Error('Storage configuration is incomplete');
    }

    storageServiceInstance = new StorageService(config);
  }

  return storageServiceInstance;
}


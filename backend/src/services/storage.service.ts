import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export interface StorageConfig {
  type: 's3' | 'r2' | 'gcs' | 'supabase';
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket: string;
  endpoint?: string;
  region?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export class StorageService {
  private s3?: S3Client;
  private supabase?: SupabaseClient;
  private storageType: 's3' | 'r2' | 'gcs' | 'supabase';
  private bucket: string;
  private endpoint?: string;
  private region?: string;

  constructor(config: StorageConfig) {
    this.storageType = config.type;
    this.bucket = config.bucket;
    this.endpoint = config.endpoint;
    this.region = config.region || 'ap-northeast-2';

    if (config.type === 'supabase') {
      if (!config.supabaseUrl || !config.supabaseKey) {
        throw new Error('Supabase configuration is required for Supabase Storage');
      }
      this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    } else {
      if (!config.accessKeyId || !config.secretAccessKey) {
        throw new Error('S3 credentials are required for S3-compatible storage');
      }

      const s3Config: any = {
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
        region: this.region,
      };

      // R2나 다른 S3 호환 서비스의 경우 endpoint 설정
      if (config.endpoint) {
        s3Config.endpoint = config.endpoint;
        s3Config.forcePathStyle = true;
      }

      this.s3 = new S3Client(s3Config);
    }
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

    if (this.storageType === 'supabase') {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new Error(`Failed to upload file to Supabase: ${error.message}`);
      }

      // Return the path (not public URL since bucket is private)
      return data.path;
    } else {
      if (!this.s3) {
        throw new Error('S3 client not initialized');
      }

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // 또는 버킷 정책으로 설정
      });

      await this.s3.send(command);

      // URL 생성
      if (this.endpoint) {
        // 커스텀 엔드포인트인 경우
        return `${this.endpoint}/${this.bucket}/${fileName}`;
      } else {
        // 표준 S3 URL
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileName}`;
      }
    }
  }

  /**
   * Create signed URL for file download (Supabase Storage)
   */
  async createSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    if (this.storageType !== 'supabase') {
      throw new Error('Signed URLs are only supported for Supabase Storage');
    }

    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    if (!data) {
      throw new Error('No signed URL data returned');
    }

    return data.signedUrl;
  }

  /**
   * Create signed URL for file upload (Supabase Storage)
   */
  async createSignedUploadUrl(
    path: string,
    fileType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    if (this.storageType !== 'supabase') {
      throw new Error('Signed upload URLs are only supported for Supabase Storage');
    }

    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Supabase doesn't have a direct signed upload URL API
    // We'll return a token-based upload URL instead
    // For now, return the path - the client will upload directly
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed upload URL: ${error.message}`);
    }

    // Note: Supabase signed URLs are for download, not upload
    // For upload, we need to use the service role key directly
    // This is a limitation - we'll handle uploads server-side instead
    return data.signedUrl;
  }

  /**
   * 파일 삭제
   */
  async deleteFile(fileUrlOrPath: string): Promise<void> {
    if (this.storageType === 'supabase') {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      // For Supabase, fileUrlOrPath is the storage path
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .remove([fileUrlOrPath]);

      if (error) {
        throw new Error(`Failed to delete file from Supabase: ${error.message}`);
      }
    } else {
      if (!this.s3) {
        throw new Error('S3 client not initialized');
      }

      // URL에서 키 추출
      const key = this.extractKeyFromUrl(fileUrlOrPath);
      
      if (!key) {
        throw new Error('Invalid file URL');
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3.send(command);
    }
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
      if (this.storageType === 'supabase') {
        if (!this.supabase) {
          return false;
        }
        const key = fileUrl; // For Supabase, fileUrl is the path
        const { data, error } = await this.supabase.storage
          .from(this.bucket)
          .list(key.split('/').slice(0, -1).join('/'), {
            search: key.split('/').pop(),
          });
        return !error && (data?.length || 0) > 0;
      } else {
        if (!this.s3) {
          return false;
        }
        const key = this.extractKeyFromUrl(fileUrl);
        if (!key) {
          return false;
        }

        const command = new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        });

        await this.s3.send(command);
        return true;
      }
    } catch {
      return false;
    }
  }
}

// 싱글톤 인스턴스 생성
let storageServiceInstance: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!storageServiceInstance) {
    const storageType = (process.env.STORAGE_TYPE as 's3' | 'r2' | 'gcs' | 'supabase') || 's3';
    
    const config: StorageConfig = {
      type: storageType,
      bucket: process.env.STORAGE_BUCKET || '',
      endpoint: process.env.STORAGE_ENDPOINT,
      region: process.env.STORAGE_REGION,
    };

    if (storageType === 'supabase') {
      config.supabaseUrl = process.env.SUPABASE_URL;
      config.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!config.supabaseUrl || !config.supabaseKey || !config.bucket) {
        throw new Error('Supabase Storage configuration is incomplete');
      }
    } else {
      config.accessKeyId = process.env.STORAGE_ACCESS_KEY_ID || '';
      config.secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY || '';
      
      if (!config.accessKeyId || !config.secretAccessKey || !config.bucket) {
        throw new Error('Storage configuration is incomplete');
      }
    }

    storageServiceInstance = new StorageService(config);
  }

  return storageServiceInstance;
}


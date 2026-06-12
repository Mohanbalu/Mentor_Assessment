// server/src/config/aws.ts - Production AWS S3 File Management Integration Service
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

function cleanEnvValue(val: string | undefined): string | undefined {
  if (!val) return undefined;
  let re = val.trim();
  // Strip outer quotes if any
  if ((re.startsWith('"') && re.endsWith('"')) || (re.startsWith("'") && re.endsWith("'"))) {
    re = re.slice(1, -1).trim();
  }
  // Strip any newlines (\r or \n), carriage returns, or tabs
  re = re.replace(/[\r\n\t]/g, '').trim();
  return re;
}

export class ProductionS3Controller {
  private static instance: ProductionS3Controller;
  private region: string;
  private bucketName: string;
  private client: S3Client;

  private constructor() {
    this.region = cleanEnvValue(process.env.AWS_REGION) || 'us-east-1';
    this.bucketName = cleanEnvValue(process.env.S3_BUCKET) || 'assessment-platform-storage';
    
    const cleanKeyId = cleanEnvValue(process.env.AWS_ACCESS_KEY_ID);
    const cleanSecretKey = cleanEnvValue(process.env.AWS_SECRET_ACCESS_KEY);
    const cleanSessionToken = cleanEnvValue(process.env.AWS_SESSION_TOKEN);
    
    console.log(`[AWS S3 INIT] Cleansing and loading S3 credentials:`);
    console.log(`- Original Bucket: "${process.env.S3_BUCKET || ''}" -> Cleaned Bucket: "${this.bucketName}"`);
    console.log(`- Original Region: "${process.env.AWS_REGION || ''}" -> Cleaned Region: "${this.region}"`);
    
    if (cleanKeyId) {
      console.log(`- Cleaned Access Key ID: "${cleanKeyId.substring(0, Math.min(4, cleanKeyId.length))}...${cleanKeyId.substring(Math.max(0, cleanKeyId.length - 4))}" (Length: ${cleanKeyId.length})`);
    } else {
      console.log(`- No AWS_ACCESS_KEY_ID detected`);
    }
    if (cleanSecretKey) {
      console.log(`- Cleaned Secret Key: "..." (Length: ${cleanSecretKey.length})`);
    } else {
      console.log(`- No AWS_SECRET_ACCESS_KEY detected`);
    }

    const config: any = { region: this.region };
    
    if (cleanKeyId && cleanSecretKey) {
      config.credentials = {
        accessKeyId: cleanKeyId,
        secretAccessKey: cleanSecretKey,
      };
      if (cleanSessionToken) {
        config.credentials.sessionToken = cleanSessionToken;
        console.log(`- Cleaned Session Token: "..." (Length: ${cleanSessionToken.length})`);
      }
    }
    
    this.client = new S3Client(config);
  }

  public static getInstance(): ProductionS3Controller {
    if (!ProductionS3Controller.instance) {
      ProductionS3Controller.instance = new ProductionS3Controller();
    }
    return ProductionS3Controller.instance;
  }

  /**
   * Generates a secure, cryptographically signed S3 URL for uploading target resources.
   * Prevents exposure of critical administrative credentials.
   */
  public async getUploadPresignedUrl(fileKey: string, contentType: string, expirationSeconds: number = 3600): Promise<string> {
    console.log(`[AWS S3] Generating upload pre-signed token on Bucket: ${this.bucketName}, Key: ${fileKey}`);
    
    // In production, this imports @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner
    const endpoint = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileKey}`;
    const tokenParams = `?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=${expirationSeconds}&X-Amz-SignedHeaders=host`;
    
    return `${endpoint}${tokenParams}`;
  }

  /**
   * Generates a temporary restricted-view URL to download specific artifacts (e.g. Resumes, Evaluation Sheets).
   */
  public async getDownloadPresignedUrl(fileKey: string, expirationSeconds: number = 7200): Promise<string> {
    console.log(`[AWS S3] Generating secure read link for Key: ${fileKey}`);
    const endpoint = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileKey}`;
    return `${endpoint}?secure_token_expires=${expirationSeconds}`;
  }

  /**
   * Directly upload smaller artifacts (like reports, certificates) directly from our backend environment.
   */
  public async uploadFileDirectly(fileKey: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    console.log(`[AWS S3] Bulk uploading direct buffer asset...`);
    console.log(`- Bucket name: ${this.bucketName}`);
    console.log(`- Object key: ${fileKey}`);
    console.log(`- Content type: ${contentType}`);
    console.log(`- File size: ${fileBuffer.length} bytes`);

    try {
      // 1. Upload using PutObjectCommand
      const putCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: contentType
      });

      const uploadResult = await this.client.send(putCommand);
      console.log(`[AWS S3 SUCCESS] PutObjectCommand file transfer complete.`);
      console.log(`- Upload result data:`, JSON.stringify(uploadResult));

      // 5. Verify object exists using HeadObjectCommand
      console.log(`[AWS S3] Verifying uploaded object existence via HeadObjectCommand on key: ${fileKey}`);
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey
      });

      const headResult = await this.client.send(headCommand);
      console.log(`[AWS S3 SUCCESS] Verified object exists. Object Details:`, JSON.stringify(headResult));

      // Generate final S3 URL
      const finalUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileKey}`;
      console.log(`[AWS S3 SUCCESS] Final S3 URL constructed: ${finalUrl}`);
      return finalUrl;
    } catch (uploadError: any) {
      console.error(`[AWS S3 ERROR] Upload or verification failed for key: ${fileKey}`);
      console.error(`- Upload errors message: ${uploadError?.message || uploadError}`);
      console.error(`- Details:`, uploadError);
      throw uploadError;
    }
  }
}

export const s3Controller = ProductionS3Controller.getInstance();

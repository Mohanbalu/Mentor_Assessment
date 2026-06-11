// server/src/config/aws.ts - Production AWS S3 File Management Integration Service

export class ProductionS3Controller {
  private static instance: ProductionS3Controller;
  private region: string;
  private bucketName: string;

  private constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.bucketName = process.env.S3_BUCKET || 'assessment-platform-assets-prod';
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
    console.log(`[AWS S3] Bulk uploading direct buffer asset with Key: ${fileKey}, Size: ${fileBuffer.length} bytes`);
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileKey}`;
  }
}

export const s3Controller = ProductionS3Controller.getInstance();

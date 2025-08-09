import crypto from 'crypto';

export class CCAvenueService {
  private merchantId: string;
  private accessCode: string;
  private workingKey: string;

  constructor(merchantId: string, accessCode: string, workingKey: string) {
    this.merchantId = merchantId;
    this.accessCode = accessCode;
    this.workingKey = workingKey;
  }

  encrypt(plainText: string): string {
    try {
      const key = crypto.createHash('md5').update(this.workingKey).digest();
      const iv = Buffer.alloc(16, 0); // 16 bytes of 0x00
      const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
      
      let encrypted = cipher.update(plainText, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decrypt(encryptedText: string): string {
    try {
      const key = crypto.createHash('md5').update(this.workingKey).digest();
      const iv = Buffer.alloc(16, 0); // 16 bytes of 0x00
      const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
      
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  stringify(data: Record<string, any>): string {
    const params: string[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null && value !== '') {
        params.push(`${key}=${encodeURIComponent(value)}`);
      }
    }
    return params.join('&');
  }

  parse(queryString: string): Record<string, string> {
    const params: Record<string, string> = {};
    const pairs = queryString.split('&');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[key] = decodeURIComponent(value);
      }
    }
    
    return params;
  }

  generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `HKT${timestamp}${random}`;
  }

  validateMandatoryFields(data: Record<string, any>): { valid: boolean; missing: string[] } {
    const mandatoryFields = [
      'merchant_id',
      'order_id',
      'amount',
      'currency',
      'redirect_url',
      'billing_name',
      'billing_tel',
      'billing_email'
    ];

    const missing: string[] = [];
    
    for (const field of mandatoryFields) {
      if (!data[field] || data[field] === '') {
        missing.push(field);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  formatAmount(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return numAmount.toFixed(2);
  }

  isSuccessful(orderStatus: string): boolean {
    return orderStatus?.toLowerCase() === 'success';
  }

  isFailed(orderStatus: string): boolean {
    const failedStatuses = ['failure', 'aborted', 'invalid'];
    return failedStatuses.includes(orderStatus?.toLowerCase());
  }

  isCancelled(orderStatus: string): boolean {
    return orderStatus?.toLowerCase() === 'cancelled';
  }

  getResponseUrl(baseUrl: string): string {
    return `${baseUrl}/api/payments/response`;
  }

  getCancelUrl(baseUrl: string): string {
    return `${baseUrl}/api/payments/cancel`;
  }
}
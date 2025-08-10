// OTP utility functions
export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  
  return otp;
}

export function isOTPExpired(createdAt: Date, expiryMinutes: number = 10): boolean {
  const now = new Date();
  const expiryTime = new Date(createdAt.getTime() + (expiryMinutes * 60 * 1000));
  return now > expiryTime;
}

export function validateOTPFormat(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}
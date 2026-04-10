import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

export class MFAService {
  /**
   * Generates a 2FA secret and a QR code data URL for a user.
   */
  async generateMFASecret(userEmail: string) {
    const secret = generateSecret();
    const otpauth = generateURI({
      issuer: "Workflex Assessment",
      label: userEmail,
      secret,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    return {
      secret,
      qrCodeDataUrl,
    };
  }

  /**
   * Verifies a TOTP token against a secret.
   */
  async verifyMFAToken(secret: string, token: string): Promise<boolean> {
    try {
      const result = await verify({ token, secret });
      return result.valid;
    } catch (error) {
      console.error("MFA verification error:", error);
      return false;
    }
  }
}

export const mfaService = new MFAService();

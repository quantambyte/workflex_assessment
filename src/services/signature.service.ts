import crypto from "crypto";
import { ElectronicSignature, User } from "@/src/types";

class SignatureService {
  private signatures: ElectronicSignature[] = [];

  /**
   * Captures a digital signature and stores audit trail metadata.
   */
  async captureSignature(
    user: User,
    documentId: string,
    metadata: { ipAddress: string; userAgent: string },
  ): Promise<ElectronicSignature> {
    // Generate a mock signature hash
    const signatureHash = crypto
      .createHash("sha256")
      .update(`${user.email}:${documentId}:${Date.now()}`)
      .digest("hex");

    const newSignature: ElectronicSignature = {
      id: `sig-${crypto.randomBytes(4).toString("hex")}`,
      documentId,
      signerId: user.id,
      signerName: user.name,
      signerEmail: user.email,
      signatureHash,
      timestamp: new Date(),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      isVerified: true, // In this mock, we mark it as verified immediately
    };

    this.signatures.push(newSignature);
    return newSignature;
  }

  async getSignatureById(id: string): Promise<ElectronicSignature | undefined> {
    return this.signatures.find((s) => s.id === id);
  }

  async getSignaturesByDocument(
    documentId: string,
  ): Promise<ElectronicSignature[]> {
    return this.signatures.filter((s) => s.documentId === documentId);
  }
}

export const signatureService = new SignatureService();

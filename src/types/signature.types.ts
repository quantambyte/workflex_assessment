export interface ElectronicSignature {
  id: string;
  documentId: string;
  signerId: number;
  signerName: string;
  signerEmail: string;
  signatureHash: string; // Cryptographic hash of the document+signer
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  isVerified: boolean;
}

export interface SignatureCaptureRequest {
  documentId: string;
  consent: boolean;
  drawnSignature?: string; // Optional base64 of a drawn signature
}

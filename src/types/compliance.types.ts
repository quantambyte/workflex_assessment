import { Region } from "./rbac.types";

export type HeatmapStatus = "Green" | "Yellow" | "Red";

export interface ComplianceRecord {
  id: string;
  userId: number;
  userName: string;
  companyName: string;
  region: Region;
  type: "visa" | "work_permit" | "tax_document";
  status: "active" | "expired" | "expiring_soon";
  expiryDate: Date;
}

export interface ComplianceAlertPayload {
  record: ComplianceRecord;
  daysRemaining: number;
  priority: "High" | "Normal";
}

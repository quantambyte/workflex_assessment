import { notificationService } from "./notification.service";
import { ComplianceRecord, Region, HeatmapStatus } from "../types";

class ComplianceService {
  private records: ComplianceRecord[] = [
    {
      id: "comp-001",
      userId: 1,
      userName: "John Doe",
      companyName: "The Bluth Company",
      region: Region.US,
      type: "work_permit",
      status: "active",
      expiryDate: new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000), // Expiring in 15 days
    },
    {
      id: "comp-002",
      userId: 2,
      userName: "Jane Smith",
      companyName: "Soyuz GmbH",
      region: Region.DE,
      type: "visa",
      status: "active",
      expiryDate: new Date(new Date().getTime() + 45 * 24 * 60 * 60 * 1000), // Expiring in 45 days
    },
    {
      id: "comp-003",
      userId: 1,
      userName: "John Doe",
      companyName: "Tyrell Corp.",
      region: Region.US,
      type: "visa",
      status: "active",
      expiryDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000), // Expiring in 5 days
    },
  ];

  async getAllRecords(): Promise<ComplianceRecord[]> {
    return this.records;
  }

  async addRecord(
    record: Omit<ComplianceRecord, "status">,
  ): Promise<ComplianceRecord> {
    const status = this.calculateStatus(record.expiryDate);
    const newRecord: ComplianceRecord = {
      ...record,
      status,
    };
    this.records.push(newRecord);

    const diffDays = this.getDaysToExpiry(record.expiryDate);
    if (status !== "active") {
      await this.triggerAlert(newRecord, diffDays);
    }

    return newRecord;
  }

  private getDaysToExpiry(expiryDate: Date): number {
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateStatus(
    expiryDate: Date,
  ): "active" | "expired" | "expiring_soon" {
    const diffDays = this.getDaysToExpiry(expiryDate);
    if (diffDays <= 0) return "expired";
    if (diffDays <= 30) return "expiring_soon";
    return "active";
  }

  private async triggerAlert(
    record: ComplianceRecord,
    daysRemaining: number,
  ): Promise<void> {
    const highPriorityCompanies = [
      "The Bluth Company",
      "Soyuz GmbH",
      "Tyrell Corp.",
    ];
    const priority =
      highPriorityCompanies.includes(record.companyName) ||
      record.status === "expired"
        ? "High"
        : "Normal";

    await notificationService.sendComplianceAlert({
      record,
      daysRemaining,
      priority,
    });
  }

  async checkExpirations(): Promise<ComplianceRecord[]> {
    const relevantRecords: ComplianceRecord[] = [];

    for (const record of this.records) {
      const diffDays = this.getDaysToExpiry(record.expiryDate);
      const newStatus = this.calculateStatus(record.expiryDate);

      if (newStatus !== "active") {
        relevantRecords.push(record);

        // Only alert if status has changed to something more critical
        // OR if it was active and now it's not.
        if (record.status !== newStatus) {
          record.status = newStatus;
          await this.triggerAlert(record, diffDays);
        }
      } else {
        record.status = "active";
      }
    }

    return relevantRecords;
  }

  async getDashboardData(regionFilter?: Region) {
    const isGlobal = !regionFilter || regionFilter === Region.GLOBAL;

    const records = isGlobal
      ? this.records
      : this.records.filter((r) => r.region === regionFilter);

    const regionsToInclude = isGlobal
      ? [Region.US, Region.UK, Region.DE, Region.FR]
      : [regionFilter];

    const regionMetrics: Record<string, any> = {};

    regionsToInclude.forEach((region) => {
      const regionRecords = this.records.filter((r) => r.region === region);
      const total = regionRecords.length;

      const expired = regionRecords.filter(
        (r) => r.status === "expired",
      ).length;
      const expiringSoon = regionRecords.filter(
        (r) => r.status === "expiring_soon",
      ).length;
      const active = regionRecords.filter((r) => r.status === "active").length;

      let status: HeatmapStatus = "Green";
      if (expired > 0) status = "Red";
      else if (total > 0 && expiringSoon / total > 0.2) status = "Yellow";

      if (total > 0 || !isGlobal) {
        regionMetrics[region] = {
          total,
          active,
          expiringSoon,
          expired,
          status,
          complianceRate:
            total > 0 ? ((active + expiringSoon) / total) * 100 : 100,
        };
      }
    });

    return {
      summary: {
        total: records.length,
        expired: records.filter((r) => r.status === "expired").length,
        expiringSoon: records.filter((r) => r.status === "expiring_soon")
          .length,
        active: records.filter((r) => r.status === "active").length,
      },
      heatmap: regionMetrics,
    };
  }
}

export const complianceService = new ComplianceService();

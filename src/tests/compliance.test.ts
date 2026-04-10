import request from "supertest";
import app from "@/src/app";
import { complianceService } from "@/src/services/compliance.service";
import { Region } from "@/src/types";
import { notificationService } from "@/src/services/notification.service";

// Mock otplib to avoid ESM transformation issues in the test runner
jest.mock("otplib", () => ({
  generateSecret: jest.fn(() => "mock_secret"),
  generateURI: jest.fn(
    () =>
      "otpauth://totp/Workflex%20Assessment:john@example.com?secret=mock_secret&issuer=Workflex%20Assessment",
  ),
  verify: jest.fn(async ({ token, secret }) => {
    if (token === "valid_token" && secret === "mock_secret")
      return { valid: true };
    return { valid: false };
  }),
  generate: jest.fn(async ({ secret }) => "valid_token"),
}));

// Mock NotificationService
jest.mock("@/src/services/notification.service", () => ({
  notificationService: {
    sendComplianceAlert: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("Compliance Expiration Alerts Integration Tests", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it("TC-COMP-01: Should add a new compliance record", async () => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 20); // 20 days from now

    const res = await request(app)
      .post("/compliance/records")
      .set("x-user-id", "1")
      .send({
        id: "test-comp-01",
        userId: 101,
        userName: "Test User",
        companyName: "Test Co",
        type: "visa",
        expiryDate: expiryDate.toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe("test-comp-01");
    expect(res.body.data.status).toBe("expiring_soon");
  });

  it("TC-COMP-02: Should trigger alerts for expiring records", async () => {
    // Ensure we have an expiring record
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 10); // 10 days from now

    await complianceService.addRecord({
      id: "test-comp-02",
      userId: 102,
      userName: "Expiring User",
      companyName: "The Bluth Company",
      region: Region.US,
      type: "work_permit",
      expiryDate,
    });

    const res = await request(app)
      .post("/compliance/check")
      .set("x-user-id", "1");

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe("Compliance check completed");

    // Check if notificationService was called
    expect(notificationService.sendComplianceAlert).toHaveBeenCalled();

    // Check priority logic (Bluth Company should be High)
    const lastCall = (
      notificationService.sendComplianceAlert as jest.Mock
    ).mock.calls.find(
      (call) => call[0].record.companyName === "The Bluth Company",
    );
    expect(lastCall).toBeDefined();
    expect(lastCall[0].priority).toBe("High");
  });

  it("TC-COMP-03: Should NOT trigger alerts for records expiring in > 30 days", async () => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 40); // 40 days from now

    await complianceService.addRecord({
      id: "test-comp-03",
      userId: 103,
      userName: "Safe User",
      companyName: "Standard Corp",
      region: Region.US,
      type: "tax_document",
      expiryDate,
    });

    const res = await request(app)
      .post("/compliance/check")
      .set("x-user-id", "1");

    expect(res.status).toBe(200);

    // Check if notificationService was NOT called for this record
    const safeCall = (
      notificationService.sendComplianceAlert as jest.Mock
    ).mock.calls.find((call) => call[0].record.id === "test-comp-03");
    expect(safeCall).toBeUndefined();
  });

  it("TC-COMP-04: Should trigger alert immediately when adding an expiring record", async () => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 5); // 5 days from now

    await request(app).post("/compliance/records").set("x-user-id", "1").send({
      id: "test-comp-04",
      userId: 104,
      userName: "Immediate Alert User",
      companyName: "Standard Corp",
      type: "visa",
      expiryDate: expiryDate.toISOString(),
    });

    // Check if notificationService was called during the POST request
    const immediateCall = (
      notificationService.sendComplianceAlert as jest.Mock
    ).mock.calls.find((call) => call[0].record.id === "test-comp-04");
    expect(immediateCall).toBeDefined();
  });

  it("TC-COMP-05: Should return all relevant records on manual check even if already alert sent", async () => {
    // Add two expiring records
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 10);

    await complianceService.addRecord({
      id: "test-comp-05a",
      userId: 105,
      userName: "User A",
      companyName: "Standard Corp",
      region: Region.US,
      type: "visa",
      expiryDate,
    });

    // First check
    const res1 = await request(app)
      .post("/compliance/check")
      .set("x-user-id", "1");
    expect(
      res1.body.data.expiringRecords.some((r: any) => r.id === "test-comp-05a"),
    ).toBe(true);

    // Second check - should still include it
    const res2 = await request(app)
      .post("/compliance/check")
      .set("x-user-id", "1");
    expect(
      res2.body.data.expiringRecords.some((r: any) => r.id === "test-comp-05a"),
    ).toBe(true);
  });

  it("TC-COMP-06: Should trigger high priority alert for expired documents", async () => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - 2); // 2 days ago (expired)

    await request(app).post("/compliance/records").set("x-user-id", "1").send({
      id: "test-comp-06",
      userId: 106,
      userName: "Expired User",
      companyName: "Standard Corp",
      type: "tax_document",
      expiryDate: expiryDate.toISOString(),
    });

    const expiredCall = (
      notificationService.sendComplianceAlert as jest.Mock
    ).mock.calls.find((call) => call[0].record.id === "test-comp-06");

    expect(expiredCall).toBeDefined();
    expect(expiredCall[0].priority).toBe("High");
    expect(expiredCall[0].record.status).toBe("expired");
  });

  describe("Compliance Dashboard & Heatmap Tests", () => {
    it("TC-COMP-07: Should return global dashboard data with heatmap for all regions", async () => {
      // Add records in different regions
      await complianceService.addRecord({
        id: "dash-us",
        userId: 201,
        userName: "US User",
        companyName: "US Co",
        region: Region.US,
        type: "visa",
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // Active
      });

      await complianceService.addRecord({
        id: "dash-de",
        userId: 202,
        userName: "DE User",
        companyName: "DE Co",
        region: Region.DE,
        type: "work_permit",
        expiryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired
      });

      const res = await request(app)
        .get("/compliance/dashboard")
        .set("x-user-id", "1");

      expect(res.status).toBe(200);
      expect(res.body.data.summary.total).toBeGreaterThanOrEqual(2);
      expect(res.body.data.heatmap[Region.DE].status).toBe("Red");
      expect(res.body.data.heatmap[Region.US]).toBeDefined();
    });

    it("TC-COMP-08: Should return filtered dashboard data for a specific region", async () => {
      // Mock a Regional Manager for UK
      const res = await request(app)
        .get("/compliance/dashboard")
        .set("x-user-id", "2"); // UK Manager (see userService)

      expect(res.status).toBe(200);
      // Heatmap should only contain UK or be restricted
      const heatmapRegions = Object.keys(res.body.data.heatmap);
      expect(heatmapRegions).toContain(Region.UK);
      expect(heatmapRegions.length).toBe(1);
    });

    it("TC-COMP-09: Should correctly calculate Yellow status for heatmap", async () => {
      // Add 5 records for FR, 2 expiring soon (2/5 = 40% > 20%)
      const regions = [Region.FR];
      for (let i = 0; i < 3; i++) {
        await complianceService.addRecord({
          id: `fr-active-${i}`,
          userId: 300 + i,
          userName: `FR User ${i}`,
          companyName: "FR Co",
          region: Region.FR,
          type: "visa",
          expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        });
      }
      for (let i = 0; i < 2; i++) {
        await complianceService.addRecord({
          id: `fr-soon-${i}`,
          userId: 310 + i,
          userName: `FR Soon ${i}`,
          companyName: "FR Co",
          region: Region.FR,
          type: "visa",
          expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        });
      }

      const res = await request(app)
        .get("/compliance/dashboard")
        .set("x-user-id", "1");
      expect(res.body.data.heatmap[Region.FR].status).toBe("Yellow");
    });
  });
});

import request from "supertest";
import app from "@/src/app";
import { complianceService } from "@/src/services/compliance.service";
import { Region } from "@/src/types";

// Mock otplib to avoid ESM transformation issues in the test runner
jest.mock("otplib", () => ({
  generateSecret: jest.fn(() => "mock_secret"),
  generateURI: jest.fn(() => "otpauth://uri"),
  verify: jest.fn(async () => ({ valid: true })),
  generate: jest.fn(async () => "valid_token"),
}));

describe("Compliance Dashboard & Heatmap Integration Tests", () => {
  beforeAll(async () => {
    // Add an expired record to US to trigger Red status
    await complianceService.addRecord({
      id: "comp-expired-01",
      userId: 10,
      userName: "Expired User",
      companyName: "Cyberdyne",
      region: Region.US,
      type: "visa",
      expiryDate: new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000), // Expired 5 days ago
    });
  });

  it("TC-DASH-01: HR_ADMIN should see global metrics and heatmap for all regions", async () => {
    const res = await request(app)
      .get("/compliance/dashboard")
      .set("x-user-id", "1"); // ID 1 is John Admin (HR_ADMIN)

    expect(res.status).toBe(200);
    expect(res.body.data.summary.total).toBeGreaterThanOrEqual(4);
    expect(res.body.data.heatmap.US).toBeDefined();
    expect(res.body.data.heatmap.DE).toBeDefined();

    // US should be Red because of the expired record we added
    expect(res.body.data.heatmap.US.status).toBe("Red");
  });

  it("TC-DASH-02: Regional Manager (DE) should only see their region's metrics", async () => {
    const res = await request(app)
      .get("/compliance/dashboard")
      .set("x-user-id", "3"); // ID 3 is Bob DE Manager (REGIONAL_MANAGER, DE)

    expect(res.status).toBe(200);

    // Summary should only include DE records
    // Bob has 1 record in DE (comp-002) in ComplianceService
    expect(res.body.data.summary.total).toBe(1);

    expect(res.body.data.heatmap.DE).toBeDefined();
    expect(res.body.data.heatmap.DE.status).toBe("Green");
  });

  it("TC-DASH-03: Should reject access for regular Employees", async () => {
    const res = await request(app)
      .get("/compliance/dashboard")
      .set("x-user-id", "4"); // ID 4 is Alice Employee

    expect(res.status).toBe(403); // Forbidden
  });
});

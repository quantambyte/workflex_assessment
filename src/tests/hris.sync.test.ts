import request from "supertest";
import app from "@/src/app";
import { userService } from "@/src/services/user.service";

// Mock otplib to avoid ESM transformation issues
jest.mock("otplib", () => ({
  generateSecret: jest.fn(() => "mock_secret"),
  generateURI: jest.fn(() => "otpauth://uri"),
  verify: jest.fn(async () => ({ valid: true })),
  generate: jest.fn(async () => "valid_token"),
}));

describe("HRIS Sync & Public API Integration Tests", () => {
  const validApiKey = "wf_test_key_workday_123";

  it("TC-HRIS-01: Should reject sync with missing API Key", async () => {
    const res = await request(app)
      .post("/public-api/v1/hris/sync")
      .send({ employees: [] });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain("API Key is required");
  });

  it("TC-HRIS-02: Should reject sync with invalid API Key", async () => {
    const res = await request(app)
      .post("/public-api/v1/hris/sync")
      .set("x-api-key", "invalid_key")
      .send({ employees: [] });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid API Key");
  });

  it("TC-HRIS-03: Should sync multiple employees successfully", async () => {
    const employees = [
      {
        name: "New Sync User",
        email: "sync.new@example.com",
        role: "EMPLOYEE",
        region: "US",
      },
      {
        name: "John Updated",
        email: "admin@hooli.com", // Existing user
        role: "HR_ADMIN",
        region: "GLOBAL",
      },
    ];

    const res = await request(app)
      .post("/public-api/v1/hris/sync")
      .set("x-api-key", validApiKey)
      .send({ employees });

    expect(res.status).toBe(200);
    expect(res.body.data.createdCount).toBe(1);
    expect(res.body.data.updatedCount).toBe(1);

    // Verify user was updated
    const user = await userService.findUserByEmail("admin@hooli.com");
    expect(user?.name).toBe("John Updated");

    // Verify new user was created
    const newUser = await userService.findUserByEmail("sync.new@example.com");
    expect(newUser).toBeDefined();
    expect(newUser?.name).toBe("New Sync User");
  });

  it("TC-HRIS-04: Should return 400 if employees is not an array", async () => {
    const res = await request(app)
      .post("/public-api/v1/hris/sync")
      .set("x-api-key", validApiKey)
      .send({ employees: "not-an-array" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Employees must be an array");
  });
});

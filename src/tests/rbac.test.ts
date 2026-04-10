import request from "supertest";
import app from "@/src/app";

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

describe("RBAC Integration Tests", () => {
  describe("GET /users (Regional Filtering & Permissions)", () => {
    it("TC-RBAC-01: Should allow HR_ADMIN to see all users across all regions", async () => {
      const res = await request(app).get("/users").set("x-user-id", "1"); // John Admin

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4);
      const regions = res.body.data.map((u: any) => u.region);
      expect(regions).toContain("UK");
      expect(regions).toContain("DE");
      expect(regions).toContain("US");
    });

    it("TC-RBAC-02: Should allow REGIONAL_MANAGER (UK) to see only UK users", async () => {
      const res = await request(app).get("/users").set("x-user-id", "2"); // Jane UK Manager

      expect(res.status).toBe(200);
      expect(res.body.data.every((u: any) => u.region === "UK")).toBe(true);
      expect(res.body.data.some((u: any) => u.name.includes("UK"))).toBe(true);
    });

    it("TC-RBAC-03: Should allow REGIONAL_MANAGER (DE) to see only DE users", async () => {
      const res = await request(app).get("/users").set("x-user-id", "3"); // Bob DE Manager

      expect(res.status).toBe(200);
      expect(res.body.data.every((u: any) => u.region === "DE")).toBe(true);
    });

    it("TC-RBAC-04: Should forbid REGULAR_EMPLOYEE from viewing the user list", async () => {
      const res = await request(app).get("/users").set("x-user-id", "4"); // Alice Employee

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("Insufficient permissions");
    });
  });

  describe("POST /users (Manage Permissions)", () => {
    it("TC-RBAC-05: Should allow HR_ADMIN to create new users", async () => {
      const res = await request(app)
        .post("/users")
        .set("x-user-id", "1")
        .send({ name: "New User", email: "new@example.com" });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("New User");
    });

    it("TC-RBAC-06: Should forbid REGIONAL_MANAGER from creating new users", async () => {
      const res = await request(app)
        .post("/users")
        .set("x-user-id", "2")
        .send({ name: "Rogue User", email: "rogue@example.com" });

      expect(res.status).toBe(403);
    });
  });

  describe("Authentication Checks", () => {
    it("TC-RBAC-07: Should reject requests without x-user-id header", async () => {
      const res = await request(app).get("/users");
      expect(res.status).toBe(401);
      expect(res.body.error).toContain("header missing");
    });

    it("TC-RBAC-08: Should reject requests with invalid user ID", async () => {
      const res = await request(app).get("/users").set("x-user-id", "999");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("User not found");
    });
  });
});

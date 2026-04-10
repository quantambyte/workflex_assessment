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

describe("MFA (2FA) Security Integration Tests", () => {
  const testEmail = "admin@hooli.com";

  it("TC-MFA-01: Should generate MFA secret and QR code for a user", async () => {
    const res = await request(app)
      .get("/auth/2fa/setup")
      .query({ email: testEmail });

    expect(res.status).toBe(200);
    expect(res.body.data.secret).toBe("mock_secret");
    expect(res.body.data.qrCodeDataUrl).toContain("data:image/png;base64");
  });

  it("TC-MFA-02: Should verify a valid TOTP token and enable MFA", async () => {
    const res = await request(app)
      .post("/auth/2fa/verify")
      .send({ email: testEmail, token: "valid_token" });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe("MFA enabled successfully");

    // Verify user is marked as MFA enabled
    const userRes = await request(app).get("/users").set("x-user-id", "1");
    const john = userRes.body.data.find((u: any) => u.email === testEmail);
    expect(john.isMfaEnabled).toBe(true);
  });

  it("TC-MFA-03: Should reject an invalid TOTP token", async () => {
    const res = await request(app)
      .post("/auth/2fa/verify")
      .send({ email: testEmail, token: "invalid_token" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid MFA token");
  });

  it("TC-MFA-04: Should fail for non-existent user", async () => {
    const res = await request(app)
      .get("/auth/2fa/setup")
      .query({ email: "nonexistent@example.com" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });
});

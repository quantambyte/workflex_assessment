import request from "supertest";
import app from "@/src/app";

// Mock otplib to avoid ESM transformation issues
jest.mock("otplib", () => ({
  generateSecret: jest.fn(() => "mock_secret"),
  generateURI: jest.fn(() => "otpauth://uri"),
  verify: jest.fn(async () => ({ valid: true })),
  generate: jest.fn(async () => "valid_token"),
}));

describe("SAML SSO Integration Tests", () => {
  const mockMetadata = "<EntityDescriptor>Mock IdP</EntityDescriptor>";

  it("TC-SAML-01: Should upload IdP metadata successfully", async () => {
    const res = await request(app)
      .post("/auth/saml/metadata")
      .send({ metadata: mockMetadata });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe("SAML Metadata uploaded successfully");
    expect(res.body.data.config.ssoUrl).toBeDefined();
  });

  it("TC-SAML-02: Should initiate SSO and provide redirect URL", async () => {
    const res = await request(app).get("/auth/saml/login");

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe("Redirecting to IdP");
    expect(res.body.data.redirectUrl).toContain(
      "https://idp.example.com/saml/sso",
    );
    expect(res.body.data.redirectUrl).toContain("SAMLRequest=");
  });

  it("TC-SAML-03: Should reject invalid SAML response", async () => {
    const res = await request(app)
      .post("/auth/saml/callback")
      .send({ SAMLResponse: "invalid_token" });

    // Based on our mock logic, this should trigger an error
    expect(res.status).toBe(500); // Global error handler catch-all for now
    expect(res.body.error).toBe("Invalid SAML Response signature.");
  });

  it("TC-SAML-04: Should auto-provision user on valid SAML response", async () => {
    const res = await request(app)
      .post("/auth/saml/callback")
      .send({ SAMLResponse: "valid_mock_token" });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe("SSO Login Successful");
    expect(res.body.data.user.email).toBe("sso-user@hooli.com");

    // Verify user is actually in the system
    const userRes = await request(app).get("/users").set("x-user-id", "1");
    const users = userRes.body.data;
    const ssoUser = users.find((u: any) => u.email === "sso-user@hooli.com");
    expect(ssoUser).toBeDefined();
    expect(ssoUser.name).toBe("SAML User");
  });
});

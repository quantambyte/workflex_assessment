import request from "supertest";
import app from "@/src/app";

// Mock otplib to avoid ESM transformation issues in the test runner
jest.mock("otplib", () => ({
  generateSecret: jest.fn(() => "mock_secret"),
  generateURI: jest.fn(() => "otpauth://uri"),
  verify: jest.fn(async () => ({ valid: true })),
  generate: jest.fn(async () => "valid_token"),
}));

describe("Internationalization (i18n) Integration Tests", () => {
  it("TC-I18N-01: Should return English messages by default", async () => {
    const res = await request(app)
      .get("/auth/2fa/setup")
      .query({ email: "nonexistent@example.com" });

    // Should return "User not found" (English default)
    expect(res.body.error).toBe("User not found");
    expect(res.status).toBe(404);
  });

  it("TC-I18N-02: Should return Japanese messages for Nakatomi (Accept-Language: ja)", async () => {
    const res = await request(app)
      .get("/auth/2fa/setup")
      .set("Accept-Language", "ja")
      .query({ email: "nonexistent@example.com" });

    // Should return "ユーザーが見つかりません"
    expect(res.body.error).toBe("ユーザーが見つかりません");
  });

  it("TC-I18N-03: Should return German messages for Umbrella Corp (Accept-Language: de)", async () => {
    const res = await request(app)
      .get("/auth/2fa/setup")
      .set("Accept-Language", "de")
      .query({ email: "nonexistent@example.com" });

    // Should return "Benutzer nicht gefunden"
    expect(res.body.error).toBe("Benutzer nicht gefunden");
  });

  it("TC-I18N-04: Should return French messages for Umbrella Corp (Accept-Language: fr)", async () => {
    const res = await request(app)
      .get("/auth/2fa/setup")
      .set("Accept-Language", "fr")
      .query({ email: "nonexistent@example.com" });

    // Should return "Utilisateur non trouvé"
    expect(res.body.error).toBe("Utilisateur non trouvé");
  });

  it("TC-I18N-05: Should translate success messages (e.g., MFA enable)", async () => {
    // 1. Setup MFA for existing admin
    const email = "admin@hooli.com";
    await request(app).get("/auth/2fa/setup").query({ email });

    // 2. Verify with JA header
    const res = await request(app)
      .post("/auth/2fa/verify")
      .set("Accept-Language", "ja")
      .send({ email, token: "valid_token" });

    expect(res.body.data.message).toBe("MFAが正常に有効化されました");
  });

  it("TC-I18N-06: Should fallback to English for unsupported language", async () => {
    const res = await request(app)
      .get("/auth/2fa/setup")
      .set("Accept-Language", "it") // Italian not supported
      .query({ email: "nonexistent@example.com" });

    expect(res.body.error).toBe("User not found");
  });
});

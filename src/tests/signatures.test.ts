import request from "supertest";
import app from "@/src/app";

// Mock otplib to avoid ESM transformation issues
jest.mock("otplib", () => ({
  generateSecret: jest.fn(() => "mock_secret"),
  generateURI: jest.fn(() => "otpauth://uri"),
  verify: jest.fn(async () => ({ valid: true })),
  generate: jest.fn(async () => "valid_token"),
}));

describe("Electronic Signatures Integration Tests", () => {
  let signatureId: string;

  it("TC-SIG-01: Should be able to sign a document with consent", async () => {
    const res = await request(app)
      .post("/signatures/sign")
      .set("x-user-id", "1") // John Admin
      .send({
        documentId: "doc-999",
        consent: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.signerName).toBe("John Admin");
    expect(res.body.data.signatureHash).toBeDefined();
    expect(res.body.data.ipAddress).toBeDefined();
    signatureId = res.body.data.id;
  });

  it("TC-SIG-02: Should reject signing without consent", async () => {
    const res = await request(app)
      .post("/signatures/sign")
      .set("x-user-id", "1")
      .send({
        documentId: "doc-999",
        consent: false,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Consent is required");
  });

  it("TC-SIG-03: Should be able to verify a signature", async () => {
    const res = await request(app)
      .get(`/signatures/verify/${signatureId}`)
      .set("x-user-id", "1");

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(signatureId);
    expect(res.body.data.isVerified).toBe(true);
  });

  it("TC-SIG-04: Should return 404 for non-existent signature", async () => {
    const res = await request(app)
      .get("/signatures/verify/non-existent")
      .set("x-user-id", "1");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Signature not found");
  });
});

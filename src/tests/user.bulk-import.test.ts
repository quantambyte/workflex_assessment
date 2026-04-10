import request from "supertest";
import app from "@/src/app";
import { userService } from "@/src/services";

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

describe("Bulk Employee Import Integration Tests", () => {
  it("TC-BULK-01: Should bulk import users successfully", async () => {
    const payload = {
      users: [
        { name: "Alice Blue", email: "alice@example.com" },
        { name: "Bob Red", email: "bob@example.com" },
      ],
    };

    const res = await request(app)
      .post("/users/bulk")
      .set("x-user-id", "1")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].name).toBe("Alice Blue");
    expect(res.body.data[1].name).toBe("Bob Red");

    // Verify users are in the system
    const usersRes = await request(app).get("/users").set("x-user-id", "1");
    const emails = usersRes.body.data.map((u: any) => u.email);
    expect(emails).toContain("alice@example.com");
    expect(emails).toContain("bob@example.com");
  });

  it("TC-BULK-02: Should reject payload if users is not an array", async () => {
    const res = await request(app)
      .post("/users/bulk")
      .set("x-user-id", "1")
      .send({ users: "not an array" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Users must be an array");
  });

  it("TC-BULK-03: Should reject if a user is missing required fields", async () => {
    const payload = {
      users: [{ name: "Missing Email" }],
    };

    const res = await request(app)
      .post("/users/bulk")
      .set("x-user-id", "1")
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Each user must have a name and an email");
  });

  it("TC-BULK-04: Should handle large batch import (e.g., 100 users)", async () => {
    const largePayload = {
      users: Array.from({ length: 100 }, (_, i) => ({
        name: `User ${i}`,
        email: `user${i}@example.com`,
      })),
    };

    const res = await request(app)
      .post("/users/bulk")
      .set("x-user-id", "1")
      .send(largePayload);

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(100);

    const usersRes = await request(app).get("/users").set("x-user-id", "1");
    // Initial 2 users + Alice + Bob + 100 = 104
    // (Note: In-memory store persists across tests if not cleared)
    expect(usersRes.body.data.length).toBeGreaterThanOrEqual(100);
  });
});

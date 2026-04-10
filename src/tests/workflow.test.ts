import request from "supertest";
import app from "@/src/app";

// Mock otplib to avoid ESM transformation issues
jest.mock("otplib", () => ({
  generateSecret: jest.fn(() => "mock_secret"),
  generateURI: jest.fn(() => "otpauth://uri"),
  verify: jest.fn(async () => ({ valid: true })),
  generate: jest.fn(async () => "valid_token"),
}));

describe("Configurable Approval Workflows Integration Tests", () => {
  let requestId: string;

  it("TC-WF-01: Employee should be able to create an approval request", async () => {
    const res = await request(app)
      .post("/workflows/request")
      .set("x-user-id", "4") // Alice Employee
      .send({
        workflowId: "visa-approval",
        data: { documentId: "doc-123", docType: "VISA" },
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("PENDING");
    expect(res.body.data.currentStageIndex).toBe(0);
    requestId = res.body.data.id;
  });

  it("TC-WF-02: Manager should see the pending task", async () => {
    // Stage 0 for visa-approval is MANAGER
    // No one has MANAGER role in UserService right now? Wait.
    // Let's check UserService seed data again.
    // John Admin (HR_ADMIN) can see everything.
    const res = await request(app)
      .get("/workflows/tasks")
      .set("x-user-id", "1"); // John Admin

    expect(res.status).toBe(200);
    expect(res.body.data.some((t: any) => t.id === requestId)).toBe(true);
  });

  it("TC-WF-03: Stage 1 approver should NOT be able to approve Stage 0", async () => {
    // Stage 1 is HR_ADMIN. (John Admin is HR_ADMIN).
    // Wait, by my logic HR_ADMIN can approve anything.
    // Let's test a Regional Manager (ID 3) trying to approve Stage 0 (MANAGER).
    const res = await request(app)
      .post(`/workflows/${requestId}/approve`)
      .set("x-user-id", "3") // Bob DE Manager (REGIONAL_MANAGER)
      .send({ comments: "Wrong role" });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Current stage requires MANAGER");
  });

  it("TC-WF-04: HR_ADMIN should be able to approve any stage", async () => {
    // John Admin approves Stage 0
    const res = await request(app)
      .post(`/workflows/${requestId}/approve`)
      .set("x-user-id", "1")
      .send({ comments: "HR override" });

    expect(res.status).toBe(200);
    expect(res.body.data.currentStageIndex).toBe(1);
    expect(res.body.data.status).toBe("PENDING");
  });

  it("TC-WF-05: Final stage approval should mark request as APPROVED", async () => {
    // John Admin approves Stage 1
    const res = await request(app)
      .post(`/workflows/${requestId}/approve`)
      .set("x-user-id", "1")
      .send({ comments: "Final check" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("APPROVED");
  });

  it("TC-WF-06: Should be able to reject a request", async () => {
    // Create new request
    const createRes = await request(app)
      .post("/workflows/request")
      .set("x-user-id", "4")
      .send({
        workflowId: "work-permit-approval",
        data: { documentId: "doc-456" },
      });

    const newId = createRes.body.data.id;

    // Reject it
    const res = await request(app)
      .post(`/workflows/${newId}/reject`)
      .set("x-user-id", "1")
      .send({ reason: "Incomplete" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("REJECTED");
  });
});

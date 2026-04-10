import {
  WorkflowDefinition,
  WorkflowRequest,
  WorkflowStatus,
  Role,
  User,
} from "@/src/types";

class WorkflowService {
  private definitions: WorkflowDefinition[] = [
    {
      id: "visa-approval",
      name: "Visa Approval Workflow",
      stages: [
        { role: Role.MANAGER, label: "Manager Approval" },
        { role: Role.HR_ADMIN, label: "Final HR Approval" },
      ],
    },
    {
      id: "work-permit-approval",
      name: "Work Permit Workflow",
      stages: [
        { role: Role.REGIONAL_MANAGER, label: "Regional Manager Review" },
        { role: Role.HR_ADMIN, label: "Final HR Approval" },
      ],
    },
  ];

  private requests: WorkflowRequest[] = [];

  async getDefinitions(): Promise<WorkflowDefinition[]> {
    return this.definitions;
  }

  async createRequest(
    requesterId: number,
    workflowId: string,
    data: any,
  ): Promise<WorkflowRequest> {
    const definition = this.definitions.find((d) => d.id === workflowId);
    if (!definition) {
      throw new Error(`Workflow definition ${workflowId} not found`);
    }

    const newRequest: WorkflowRequest = {
      id: `wf-${Date.now()}`,
      workflowId,
      requesterId,
      data,
      status: WorkflowStatus.PENDING,
      currentStageIndex: 0,
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.requests.push(newRequest);
    return newRequest;
  }

  async approveRequest(
    requestId: string,
    approver: User,
    comments?: string,
  ): Promise<WorkflowRequest> {
    const request = this.requests.find((r) => r.id === requestId);
    if (!request) throw new Error("Request not found");

    if (request.status !== WorkflowStatus.PENDING) {
      throw new Error("Request is not in PENDING state");
    }

    const definition = this.definitions.find(
      (d) => d.id === request.workflowId,
    )!;
    const currentStage = definition.stages[request.currentStageIndex];

    // Check if approver has the required role for the current stage
    // For HR_ADMIN, they can approve any stage (optional: could be stricter)
    if (
      approver.role !== currentStage.role &&
      approver.role !== Role.HR_ADMIN
    ) {
      throw new Error(`Current stage requires ${currentStage.role} role`);
    }

    // Record history
    request.history.push({
      stage: request.currentStageIndex,
      approverId: approver.id,
      action: "APPROVE",
      timestamp: new Date(),
      comments,
    });

    // Move to next stage or finalize
    if (request.currentStageIndex < definition.stages.length - 1) {
      request.currentStageIndex++;
    } else {
      request.status = WorkflowStatus.APPROVED;
    }

    request.updatedAt = new Date();
    return request;
  }

  async rejectRequest(
    requestId: string,
    approver: User,
    reason: string,
  ): Promise<WorkflowRequest> {
    const request = this.requests.find((r) => r.id === requestId);
    if (!request) throw new Error("Request not found");

    if (request.status !== WorkflowStatus.PENDING) {
      throw new Error("Request is not in PENDING state");
    }

    request.status = WorkflowStatus.REJECTED;
    request.history.push({
      stage: request.currentStageIndex,
      approverId: approver.id,
      action: "REJECT",
      timestamp: new Date(),
      comments: reason,
    });

    request.updatedAt = new Date();
    return request;
  }

  async getPendingTasks(user: User): Promise<WorkflowRequest[]> {
    return this.requests.filter((req) => {
      if (req.status !== WorkflowStatus.PENDING) return false;

      const definition = this.definitions.find((d) => d.id === req.workflowId)!;
      const currentStage = definition.stages[req.currentStageIndex];

      return user.role === currentStage.role || user.role === Role.HR_ADMIN;
    });
  }

  async getRequestById(id: string): Promise<WorkflowRequest | undefined> {
    return this.requests.find((r) => r.id === id);
  }
}

export const workflowService = new WorkflowService();

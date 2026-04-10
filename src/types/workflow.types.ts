import { Role } from "./rbac.types";

export enum WorkflowStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export interface WorkflowStage {
  role: Role;
  label: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  stages: WorkflowStage[];
}

export interface WorkflowRequest {
  id: string;
  workflowId: string;
  requesterId: number;
  data: any;
  status: WorkflowStatus;
  currentStageIndex: number;
  history: {
    stage: number;
    approverId: number;
    action: "APPROVE" | "REJECT";
    timestamp: Date;
    comments?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

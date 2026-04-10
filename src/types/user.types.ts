import { Role, Region } from "./rbac.types";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  region: Region;
  department?: string;
  mfaSecret?: string;
  isMfaEnabled: boolean;
}

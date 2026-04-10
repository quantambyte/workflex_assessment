import { userService } from "./user.service";
import { User, Role, Region } from "@/src/types";

export interface HrisSyncEmployee {
  name: string;
  email: string;
  role?: Role;
  region?: Region;
}

export interface SyncResult {
  totalCount: number;
  createdCount: number;
  updatedCount: number;
  results: {
    email: string;
    status: "created" | "updated" | "failed";
    error?: string;
  }[];
}

class HrisService {
  /**
   * Syncs employees from an external HRIS system.
   * If user exists (by email), updates them. Otherwise creates.
   */
  async syncEmployees(employees: HrisSyncEmployee[]): Promise<SyncResult> {
    const results: SyncResult["results"] = [];
    let createdCount = 0;
    let updatedCount = 0;

    for (const emp of employees) {
      try {
        const existingUser = await userService.findUserByEmail(emp.email);

        if (existingUser) {
          await userService.updateUser(existingUser.id, {
            name: emp.name,
            role: emp.role || existingUser.role,
            region: emp.region || existingUser.region,
          });
          results.push({ email: emp.email, status: "updated" });
          updatedCount++;
        } else {
          await userService.createUser(emp);
          results.push({ email: emp.email, status: "created" });
          createdCount++;
        }
      } catch (error: any) {
        results.push({
          email: emp.email,
          status: "failed",
          error: error.message,
        });
      }
    }

    return {
      totalCount: employees.length,
      createdCount,
      updatedCount,
      results,
    };
  }
}

export const hrisService = new HrisService();

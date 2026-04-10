import { Request, Response, NextFunction } from "express";
import { RolePermissions, Permission, User } from "@/src/types";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const checkPermission = (requiredPermission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.error("Unauthorized: No user found", 401);
    }

    const permissions = RolePermissions[user.role] || [];
    if (!permissions.includes(requiredPermission)) {
      return res.error(
        `Forbidden: Insufficient permissions. Required: ${requiredPermission}`,
        403,
      );
    }

    next();
  };
};

export const checkRegion = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = req.user;

  if (!user) {
    return res.error("Unauthorized", 401);
  }

  // HR_ADMIN can see everything
  if (user.role === "HR_ADMIN") {
    return next();
  }

  // For other roles, we might want to attach a filter to the request
  // so the service knows what to filter by.
  (req as any).regionFilter = user.region;
  next();
};

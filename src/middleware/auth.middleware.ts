import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";

/**
 * Mock Auth Middleware for testing RBAC.
 * In a real application, this would verify a JWT or Session.
 * Here, we use a simple header 'x-user-id'.
 */
export const mockAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.headers["x-user-id"];

  if (!userId) {
    return res.error("Authentication required (x-user-id header missing)", 401);
  }

  const user = await userService.getUserById(Number(userId));
  if (!user) {
    return res.error("User not found", 401);
  }

  req.user = user;
  next();
};

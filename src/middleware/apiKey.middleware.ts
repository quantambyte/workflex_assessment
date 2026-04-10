import { Request, Response, NextFunction } from "express";

/**
 * Middleware to verify API Keys for Public API access.
 * In a real-world scenario, keys would be hashed and stored in a database.
 * For this challenge, we use a simple set of valid keys.
 */
const VALID_API_KEYS = new Set([
  "wf_test_key_workday_123",
  "wf_test_key_bamboohr_456",
  "wf_prod_key_umbrella_789",
]);

export const apiKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey) {
    return res.error("API Key is required (x-api-key header missing)", 401);
  }

  if (!VALID_API_KEYS.has(apiKey)) {
    return res.error("Invalid API Key", 401);
  }

  // Attach the client name or identifier if needed
  (req as any).apiClient = apiKey.includes("workday") ? "Workday" : "External";

  next();
};

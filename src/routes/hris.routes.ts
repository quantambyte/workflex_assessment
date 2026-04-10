import { Router } from "express";
import { hrisService } from "../services/hris.service";
import { apiKeyMiddleware } from "../middleware/apiKey.middleware";

const router = Router();

// Apply API Key Middleware to all HRIS Public API routes
router.use(apiKeyMiddleware);

/**
 * @swagger
 * /public-api/v1/hris/sync:
 *   post:
 *     summary: Bulk sync employees from external HRIS (Workday/BambooHR)
 *     tags: [HRIS]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employees:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     region:
 *                       type: string
 *     responses:
 *       200:
 *         description: Sync completed
 */
router.post("/v1/hris/sync", async (req, res) => {
  const { employees } = req.body;

  if (!Array.isArray(employees)) {
    return res.error("Employees must be an array", 400);
  }

  const result = await hrisService.syncEmployees(employees);
  res.success(result);
});

export default router;

import { Router } from "express";
import { complianceService } from "../services";
import { checkPermission } from "../middleware/rbac.middleware";
import { mockAuth } from "../middleware/auth.middleware";
import { Permission, Region } from "../types";

const router = Router();
router.use(mockAuth);

/**
 * @swagger
 * /compliance/dashboard:
 *   get:
 *     summary: Get global compliance dashboard and heatmap
 *     tags: [Compliance]
 *     responses:
 *       200:
 *         description: Dashboard metrics and heatmap data
 */
router.get(
  "/dashboard",
  checkPermission(Permission.VIEW_REPORTS),
  async (req, res) => {
    const user = (req as any).user;
    const regionFilter = user?.role === "HR_ADMIN" ? undefined : user?.region;
    const data = await complianceService.getDashboardData(regionFilter);
    res.success(data);
  },
);

/**
 * @swagger
 * /compliance/records:
 *   post:
 *     summary: Add a new compliance record
 *     tags: [Compliance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               userId:
 *                 type: number
 *               userName:
 *                 type: string
 *               companyName:
 *                 type: string
 *               region:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [visa, work_permit, tax_document]
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Compliance record added
 */
router.post("/records", async (req, res) => {
  const { id, userId, userName, companyName, type, expiryDate, region } =
    req.body;
  const user = (req as any).user;

  const record = await complianceService.addRecord({
    id,
    userId,
    userName,
    companyName,
    region: region || user?.region || Region.US,
    type,
    expiryDate: new Date(expiryDate),
  });
  res.success(record, 201);
});

/**
 * @swagger
 * /compliance/check:
 *   post:
 *     summary: Trigger manual compliance check and send alerts
 *     tags: [Compliance]
 *     responses:
 *       200:
 *         description: Compliance check completed
 */
router.post("/check", async (req, res) => {
  const expiringSoon = await complianceService.checkExpirations();
  res.success({
    message: "Compliance check completed",
    alertsSent: expiringSoon.length,
    expiringRecords: expiringSoon,
  });
});

/**
 * @swagger
 * /compliance/records:
 *   get:
 *     summary: Get all compliance records
 *     tags: [Compliance]
 *     responses:
 *       200:
 *         description: List of compliance records
 */
router.get("/records", async (req, res) => {
  const records = await complianceService.getAllRecords();
  res.success(records);
});

export default router;

import { Router } from "express";
import { workflowService } from "../services/workflow.service";
import { mockAuth } from "../middleware/auth.middleware";

const router = Router();
router.use(mockAuth);

/**
 * @swagger
 * /workflows/definitions:
 *   get:
 *     summary: Get all available workflow definitions
 *     tags: [Workflows]
 *     responses:
 *       200:
 *         description: List of workflow definitions
 */
router.get("/definitions", async (req, res) => {
  const definitions = await workflowService.getDefinitions();
  res.success(definitions);
});

/**
 * @swagger
 * /workflows/request:
 *   post:
 *     summary: Create a new approval request
 *     tags: [Workflows]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workflowId:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       201:
 *         description: Request created
 */
router.post("/request", async (req, res) => {
  const { workflowId, data } = req.body;
  const user = (req as any).user;

  try {
    const request = await workflowService.createRequest(
      user.id,
      workflowId,
      data,
    );
    res.success(request, 201);
  } catch (error: any) {
    res.error(error.message, 400);
  }
});

/**
 * @swagger
 * /workflows/tasks:
 *   get:
 *     summary: Get pending tasks for the current user
 *     tags: [Workflows]
 *     responses:
 *       200:
 *         description: List of pending approval requests
 */
router.get("/tasks", async (req, res) => {
  const user = (req as any).user;
  const tasks = await workflowService.getPendingTasks(user);
  res.success(tasks);
});

/**
 * @swagger
 * /workflows/:id/approve:
 *   post:
 *     summary: Approve an approval request
 *     tags: [Workflows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request approved
 */
router.post("/:id/approve", async (req, res) => {
  const { id } = req.params;
  const { comments } = req.body;
  const user = (req as any).user;

  try {
    const request = await workflowService.approveRequest(id, user, comments);
    res.success(request);
  } catch (error: any) {
    res.error(error.message, 403);
  }
});

/**
 * @swagger
 * /workflows/:id/reject:
 *   post:
 *     summary: Reject an approval request
 *     tags: [Workflows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request rejected
 */
router.post("/:id/reject", async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const user = (req as any).user;

  try {
    const request = await workflowService.rejectRequest(id, user, reason);
    res.success(request);
  } catch (error: any) {
    res.error(error.message, 403);
  }
});

export default router;

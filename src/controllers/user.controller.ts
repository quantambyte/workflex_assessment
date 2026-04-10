import { Request, Response, NextFunction } from "express";
import { userService } from "@/src/services";

class UserController {
  /**
   * @openapi
   * /users:
   *   get:
   *     summary: Retrieve a list of all users
   *     responses:
   *       200:
   *         description: A list of users.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AppResponse'
   */
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const regionFilter = (req as any).regionFilter;
      const users = await userService.getAllUsers(regionFilter);
      res.success(users);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @openapi
   * /users/{id}:
   *   get:
   *     summary: Get a user by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: User found.
   *       404:
   *         description: User not found.
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.error("Invalid user ID", 400);
      }

      const user = await userService.getUserById(id);
      if (!user) {
        return res.error("User not found", 404);
      }

      res.success(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @openapi
   * /users:
   *   post:
   *     summary: Create a new user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name: { type: string }
   *               email: { type: string }
   *     responses:
   *       201:
   *         description: User created.
   */
  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email } = req.body;
      if (!name || !email) {
        return res.error(["Name is required", "Email is required"], 400);
      }

      const newUser = await userService.createUser({ name, email });
      res.success(newUser, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @openapi
   * /users/bulk:
   *   post:
   *     summary: Bulk import users
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               users:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     name: { type: string }
   *                     email: { type: string }
   *     responses:
   *       201:
   *         description: Users imported.
   */
  async bulkImport(req: Request, res: Response, next: NextFunction) {
    try {
      const { users } = req.body;
      if (!Array.isArray(users)) {
        return res.error("Users must be an array", 400);
      }

      for (const user of users) {
        if (!user.name || !user.email) {
          return res.error("Each user must have a name and an email", 400);
        }
      }

      const newUsers = await userService.bulkCreateUsers(users);
      res.success(newUsers, 201);
    } catch (error) {
      next(error);
    }
  }

  // Example to test unhandled exception
  async testError(req: Request, res: Response, next: NextFunction) {
    throw new Error("This is a simulated uncaught error");
  }
}

export const userController = new UserController();

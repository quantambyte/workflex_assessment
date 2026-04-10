import express from "express";
import { responseMiddleware, errorHandler } from "@/src/middleware";
import { userRoutes, authRoutes, complianceRoutes } from "@/src/routes";
import hrisRoutes from "./routes/hris.routes";
import workflowRoutes from "./routes/workflow.routes";
import signatureRoutes from "./routes/signatures.routes";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import { i18nMiddleware } from "./config/i18n";

const app = express();
const PORT = process.env.PORT || 3000;

// Add uncaughtException hook to prevent the app from crashing
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Ideally, perform cleanup here if needed
  // In a production app, you might want to restart the process gracefully
  // process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

app.use(express.json());

// Uniform response formatting middleware
app.use(i18nMiddleware);
app.use(responseMiddleware);

// Static files
app.use(express.static("public"));

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/compliance", complianceRoutes);
app.use("/public-api", hrisRoutes);
app.use("/workflows", workflowRoutes);
app.use("/signatures", signatureRoutes);

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;

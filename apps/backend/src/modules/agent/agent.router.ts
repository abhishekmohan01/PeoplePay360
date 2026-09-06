import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth";
import { requireRoles } from "../../middleware/rbac";
import {
  runAgent,
  executeApprovedAction,
  AGENT_TOOLS_DEFINITIONS,
} from "agent";

export const agentRouter = Router();

agentRouter.use(authenticateJWT);

// GET /api/agent/tools - list registered tool definitions
agentRouter.get("/tools", (_req, res) => {
  res.json({
    success: true,
    tools: AGENT_TOOLS_DEFINITIONS,
  });
});

// POST /api/agent/chat - interactive copilot reasoning & tool execution
agentRouter.post(
  "/chat",
  requireRoles("ADMIN", "HR_MANAGER", "PAYROLL_USER"),
  async (req, res, next) => {
    try {
      const { prompt, date } = req.body || {};
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: true, message: "Prompt string is required." });
      }

      const response = await runAgent(prompt, {
        companyId: req.user?.companyId || undefined,
        userRole: req.user?.roles?.[0],
        date,
      });

      return res.json({
        success: true,
        data: response,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/agent/execute-action - confirm and execute pending agent proposal
agentRouter.post(
  "/execute-action",
  requireRoles("ADMIN", "HR_MANAGER"),
  async (req, res, next) => {
    try {
      const { action } = req.body || {};
      if (!action || !action.actionType) {
        return res.status(400).json({ error: true, message: "Valid action proposal object is required." });
      }

      const result = await executeApprovedAction(action);
      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorHandler } from "./src/middleware/errorHandler";
import { authRouter } from "./src/modules/auth/auth.router";
import { userRouter } from "./src/modules/user/user.router";
import { companyRouter } from "./src/modules/company/company.router";
import { departmentRouter } from "./src/modules/department/department.router";
import { employeeRouter } from "./src/modules/employee/employee.router";
import { contractRouter } from "./src/modules/contract/contract.router";
import { workingScheduleRouter } from "./src/modules/working-schedule/working-schedule.router";
import { attendanceRouter } from "./src/modules/attendance/attendance.router";
import { timeOffRouter } from "./src/modules/time-off/time-off.router";
import { salaryStructureRouter } from "./src/modules/payroll/salary-structure.router";
import { salaryRuleRouter } from "./src/modules/payroll/salary-rule.router";
import { payrunRouter } from "./src/modules/payroll/payrun.router";
import { payslipRouter } from "./src/modules/payroll/payslip.router";
import { dashboardRouter } from "./src/modules/dashboard/dashboard.router";
import { agentRouter } from "./src/modules/agent/agent.router";
import { seedDatabase } from "./src/seed";

const app = express();
const PORT = process.env.PORT || 4000;
// Reload trigger: 2026-09-06T09:28:00

// Global Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), service: "PeoplePay360 Backend" });
});

// Seed Endpoint (For instant testing/reset)
app.post("/api/seed", async (_req, res, next) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: "Database seeded successfully with dummy users and records!" });
  } catch (err) {
    next(err);
  }
});

// Mount Routers
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/companies", companyRouter);
app.use("/api/departments", departmentRouter);
app.use("/api/employees", employeeRouter);
app.use("/api/contracts", contractRouter);
app.use("/api/working-schedules", workingScheduleRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/time-off", timeOffRouter);
app.use("/api/salary-structures", salaryStructureRouter);
app.use("/api/salary-rules", salaryRuleRouter);
app.use("/api/payruns", payrunRouter);
app.use("/api/payslips", payslipRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/agent", agentRouter);

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 PeoplePay360 Backend running at http://localhost:${PORT}`);
});

export default app;
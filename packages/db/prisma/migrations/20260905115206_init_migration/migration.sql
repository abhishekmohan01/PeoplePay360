-- CreateEnum
CREATE TYPE "EmployeeType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('RUNNING', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EARLY_CHECKOUT', 'MISSING_CHECKOUT', 'CORRECTED');

-- CreateEnum
CREATE TYPE "TimeOffUnit" AS ENUM ('DAYS', 'HOURS');

-- CreateEnum
CREATE TYPE "TimeOffAllocationStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'REFUSED');

-- CreateEnum
CREATE TYPE "TimeOffRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REFUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SalaryRuleCategory" AS ENUM ('BASIC', 'ALLOWANCE', 'DEDUCTION', 'GROSS', 'NET', 'OTHER');

-- CreateEnum
CREATE TYPE "SalaryComputationType" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE_OF_WAGE', 'PYTHON_CODE');

-- CreateEnum
CREATE TYPE "PayrunStatus" AS ENUM ('DRAFT', 'COMPUTED', 'VALIDATED', 'PAID');

-- CreateEnum
CREATE TYPE "PayslipStatus" AS ENUM ('DRAFT', 'COMPUTED', 'VALIDATED', 'PAID');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('EMPLOYEE', 'HR_MANAGER', 'TIME_OFF_ADMIN', 'PAYROLL_USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PayrollWarningType" AS ENUM ('MISSING_BANK_ACCOUNT', 'DUPLICATE_PAYSLIP', 'MISSING_INFORMATION', 'EXPIRING_CONTRACT', 'UNVALIDATED_PAYRUN', 'OTHER');

-- CreateEnum
CREATE TYPE "PayrollWarningSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR');

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "workEmail" TEXT,
    "workPhone" TEXT,
    "companyId" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "managerId" UUID,
    "jobPosition" TEXT NOT NULL,
    "employeeType" "EmployeeType" NOT NULL,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "wage" DECIMAL(12,2) NOT NULL,
    "jobPosition" TEXT NOT NULL,
    "contractType" TEXT NOT NULL,
    "workingScheduleId" UUID NOT NULL,
    "salaryStructureId" UUID NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'RUNNING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "working_schedules" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "daysPerWeek" DECIMAL(4,2) NOT NULL,
    "hoursPerWeek" DECIMAL(6,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "working_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "working_schedule_days" (
    "id" UUID NOT NULL,
    "workingScheduleId" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "hours" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "working_schedule_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3),
    "workedHours" DECIMAL(6,2) NOT NULL,
    "overtime" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_off_types" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "unit" "TimeOffUnit" NOT NULL,
    "requiresAllocation" BOOLEAN NOT NULL DEFAULT true,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
    "payrollWorkEntry" BOOLEAN NOT NULL DEFAULT false,
    "displayColor" TEXT,
    "configurationNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_off_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_off_allocations" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "timeOffTypeId" UUID NOT NULL,
    "allocated" DECIMAL(8,2) NOT NULL,
    "taken" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "remaining" DECIMAL(8,2) NOT NULL,
    "validityStart" DATE NOT NULL,
    "validityEnd" DATE,
    "status" "TimeOffAllocationStatus" NOT NULL DEFAULT 'DRAFT',
    "approverId" UUID,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_off_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_off_requests" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "timeOffTypeId" UUID NOT NULL,
    "allocationId" UUID,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "duration" DECIMAL(8,2) NOT NULL,
    "status" "TimeOffRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "approverId" UUID,
    "allocationUsed" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_off_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_structures" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_rules" (
    "id" UUID NOT NULL,
    "salaryStructureId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" "SalaryRuleCategory" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "computationType" "SalaryComputationType" NOT NULL,
    "computationValue" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payruns" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "salaryStructureId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "status" "PayrunStatus" NOT NULL DEFAULT 'DRAFT',
    "employeeCount" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3),
    "validatedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payruns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payrun_employees" (
    "id" UUID NOT NULL,
    "payrunId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payrun_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" UUID NOT NULL,
    "payrunId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "salaryStructureId" UUID NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "basicSalary" DECIMAL(12,2) NOT NULL,
    "grossSalary" DECIMAL(12,2) NOT NULL,
    "totalDeductions" DECIMAL(12,2) NOT NULL,
    "netSalary" DECIMAL(12,2) NOT NULL,
    "status" "PayslipStatus" NOT NULL DEFAULT 'DRAFT',
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "pdfPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslip_lines" (
    "id" UUID NOT NULL,
    "payslipId" UUID NOT NULL,
    "salaryRuleId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" "SalaryRuleCategory" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payslip_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "employeeId" UUID,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" "RoleCode" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_warnings" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "payrunId" UUID,
    "payslipId" UUID,
    "employeeId" UUID,
    "type" "PayrollWarningType" NOT NULL,
    "severity" "PayrollWarningSeverity" NOT NULL DEFAULT 'WARNING',
    "message" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_warnings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "companies_isActive_idx" ON "companies"("isActive");

-- CreateIndex
CREATE INDEX "departments_companyId_idx" ON "departments"("companyId");

-- CreateIndex
CREATE INDEX "departments_companyId_isActive_idx" ON "departments"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "departments_companyId_code_key" ON "departments"("companyId", "code");

-- CreateIndex
CREATE INDEX "employees_companyId_idx" ON "employees"("companyId");

-- CreateIndex
CREATE INDEX "employees_departmentId_idx" ON "employees"("departmentId");

-- CreateIndex
CREATE INDEX "employees_managerId_idx" ON "employees"("managerId");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- CreateIndex
CREATE UNIQUE INDEX "employees_companyId_employeeCode_key" ON "employees"("companyId", "employeeCode");

-- CreateIndex
CREATE INDEX "contracts_employeeId_idx" ON "contracts"("employeeId");

-- CreateIndex
CREATE INDEX "contracts_companyId_idx" ON "contracts"("companyId");

-- CreateIndex
CREATE INDEX "contracts_departmentId_idx" ON "contracts"("departmentId");

-- CreateIndex
CREATE INDEX "contracts_workingScheduleId_idx" ON "contracts"("workingScheduleId");

-- CreateIndex
CREATE INDEX "contracts_salaryStructureId_idx" ON "contracts"("salaryStructureId");

-- CreateIndex
CREATE INDEX "contracts_startDate_endDate_idx" ON "contracts"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_companyId_contractNumber_key" ON "contracts"("companyId", "contractNumber");

-- CreateIndex
CREATE INDEX "working_schedules_companyId_idx" ON "working_schedules"("companyId");

-- CreateIndex
CREATE INDEX "working_schedules_companyId_isActive_idx" ON "working_schedules"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "working_schedules_companyId_name_key" ON "working_schedules"("companyId", "name");

-- CreateIndex
CREATE INDEX "working_schedule_days_workingScheduleId_idx" ON "working_schedule_days"("workingScheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "working_schedule_days_workingScheduleId_dayOfWeek_key" ON "working_schedule_days"("workingScheduleId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "attendances_employeeId_idx" ON "attendances"("employeeId");

-- CreateIndex
CREATE INDEX "attendances_checkIn_idx" ON "attendances"("checkIn");

-- CreateIndex
CREATE INDEX "attendances_employeeId_checkIn_idx" ON "attendances"("employeeId", "checkIn");

-- CreateIndex
CREATE INDEX "attendances_status_idx" ON "attendances"("status");

-- CreateIndex
CREATE INDEX "time_off_types_companyId_idx" ON "time_off_types"("companyId");

-- CreateIndex
CREATE INDEX "time_off_types_companyId_isActive_idx" ON "time_off_types"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "time_off_types_companyId_name_key" ON "time_off_types"("companyId", "name");

-- CreateIndex
CREATE INDEX "time_off_allocations_employeeId_idx" ON "time_off_allocations"("employeeId");

-- CreateIndex
CREATE INDEX "time_off_allocations_timeOffTypeId_idx" ON "time_off_allocations"("timeOffTypeId");

-- CreateIndex
CREATE INDEX "time_off_allocations_employeeId_timeOffTypeId_idx" ON "time_off_allocations"("employeeId", "timeOffTypeId");

-- CreateIndex
CREATE INDEX "time_off_allocations_status_idx" ON "time_off_allocations"("status");

-- CreateIndex
CREATE INDEX "time_off_allocations_approverId_idx" ON "time_off_allocations"("approverId");

-- CreateIndex
CREATE INDEX "time_off_requests_employeeId_idx" ON "time_off_requests"("employeeId");

-- CreateIndex
CREATE INDEX "time_off_requests_timeOffTypeId_idx" ON "time_off_requests"("timeOffTypeId");

-- CreateIndex
CREATE INDEX "time_off_requests_allocationId_idx" ON "time_off_requests"("allocationId");

-- CreateIndex
CREATE INDEX "time_off_requests_approverId_idx" ON "time_off_requests"("approverId");

-- CreateIndex
CREATE INDEX "time_off_requests_status_idx" ON "time_off_requests"("status");

-- CreateIndex
CREATE INDEX "time_off_requests_startDate_endDate_idx" ON "time_off_requests"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "salary_structures_companyId_idx" ON "salary_structures"("companyId");

-- CreateIndex
CREATE INDEX "salary_structures_companyId_isActive_idx" ON "salary_structures"("companyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "salary_structures_companyId_code_key" ON "salary_structures"("companyId", "code");

-- CreateIndex
CREATE INDEX "salary_rules_salaryStructureId_idx" ON "salary_rules"("salaryStructureId");

-- CreateIndex
CREATE INDEX "salary_rules_salaryStructureId_sequence_idx" ON "salary_rules"("salaryStructureId", "sequence");

-- CreateIndex
CREATE INDEX "salary_rules_category_idx" ON "salary_rules"("category");

-- CreateIndex
CREATE UNIQUE INDEX "salary_rules_salaryStructureId_code_key" ON "salary_rules"("salaryStructureId", "code");

-- CreateIndex
CREATE INDEX "payruns_companyId_idx" ON "payruns"("companyId");

-- CreateIndex
CREATE INDEX "payruns_salaryStructureId_idx" ON "payruns"("salaryStructureId");

-- CreateIndex
CREATE INDEX "payruns_periodStart_periodEnd_idx" ON "payruns"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "payruns_status_idx" ON "payruns"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payruns_companyId_periodStart_periodEnd_salaryStructureId_key" ON "payruns"("companyId", "periodStart", "periodEnd", "salaryStructureId");

-- CreateIndex
CREATE INDEX "payrun_employees_payrunId_idx" ON "payrun_employees"("payrunId");

-- CreateIndex
CREATE INDEX "payrun_employees_employeeId_idx" ON "payrun_employees"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "payrun_employees_payrunId_employeeId_key" ON "payrun_employees"("payrunId", "employeeId");

-- CreateIndex
CREATE INDEX "payslips_payrunId_idx" ON "payslips"("payrunId");

-- CreateIndex
CREATE INDEX "payslips_employeeId_idx" ON "payslips"("employeeId");

-- CreateIndex
CREATE INDEX "payslips_contractId_idx" ON "payslips"("contractId");

-- CreateIndex
CREATE INDEX "payslips_salaryStructureId_idx" ON "payslips"("salaryStructureId");

-- CreateIndex
CREATE INDEX "payslips_status_idx" ON "payslips"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_employeeId_periodStart_periodEnd_key" ON "payslips"("employeeId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "payslip_lines_payslipId_idx" ON "payslip_lines"("payslipId");

-- CreateIndex
CREATE INDEX "payslip_lines_salaryRuleId_idx" ON "payslip_lines"("salaryRuleId");

-- CreateIndex
CREATE INDEX "payslip_lines_payslipId_sequence_idx" ON "payslip_lines"("payslipId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "payslip_lines_payslipId_salaryRuleId_key" ON "payslip_lines"("payslipId", "salaryRuleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "user_roles_userId_idx" ON "user_roles"("userId");

-- CreateIndex
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON "user_roles"("userId", "roleId");

-- CreateIndex
CREATE INDEX "payroll_warnings_companyId_idx" ON "payroll_warnings"("companyId");

-- CreateIndex
CREATE INDEX "payroll_warnings_payrunId_idx" ON "payroll_warnings"("payrunId");

-- CreateIndex
CREATE INDEX "payroll_warnings_payslipId_idx" ON "payroll_warnings"("payslipId");

-- CreateIndex
CREATE INDEX "payroll_warnings_employeeId_idx" ON "payroll_warnings"("employeeId");

-- CreateIndex
CREATE INDEX "payroll_warnings_type_idx" ON "payroll_warnings"("type");

-- CreateIndex
CREATE INDEX "payroll_warnings_isResolved_idx" ON "payroll_warnings"("isResolved");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_workingScheduleId_fkey" FOREIGN KEY ("workingScheduleId") REFERENCES "working_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_salaryStructureId_fkey" FOREIGN KEY ("salaryStructureId") REFERENCES "salary_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_schedules" ADD CONSTRAINT "working_schedules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "working_schedule_days" ADD CONSTRAINT "working_schedule_days_workingScheduleId_fkey" FOREIGN KEY ("workingScheduleId") REFERENCES "working_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_types" ADD CONSTRAINT "time_off_types_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_allocations" ADD CONSTRAINT "time_off_allocations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_allocations" ADD CONSTRAINT "time_off_allocations_timeOffTypeId_fkey" FOREIGN KEY ("timeOffTypeId") REFERENCES "time_off_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_allocations" ADD CONSTRAINT "time_off_allocations_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_timeOffTypeId_fkey" FOREIGN KEY ("timeOffTypeId") REFERENCES "time_off_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "time_off_allocations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_rules" ADD CONSTRAINT "salary_rules_salaryStructureId_fkey" FOREIGN KEY ("salaryStructureId") REFERENCES "salary_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payruns" ADD CONSTRAINT "payruns_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payruns" ADD CONSTRAINT "payruns_salaryStructureId_fkey" FOREIGN KEY ("salaryStructureId") REFERENCES "salary_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrun_employees" ADD CONSTRAINT "payrun_employees_payrunId_fkey" FOREIGN KEY ("payrunId") REFERENCES "payruns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrun_employees" ADD CONSTRAINT "payrun_employees_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payrunId_fkey" FOREIGN KEY ("payrunId") REFERENCES "payruns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_salaryStructureId_fkey" FOREIGN KEY ("salaryStructureId") REFERENCES "salary_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip_lines" ADD CONSTRAINT "payslip_lines_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "payslips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip_lines" ADD CONSTRAINT "payslip_lines_salaryRuleId_fkey" FOREIGN KEY ("salaryRuleId") REFERENCES "salary_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_warnings" ADD CONSTRAINT "payroll_warnings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_warnings" ADD CONSTRAINT "payroll_warnings_payrunId_fkey" FOREIGN KEY ("payrunId") REFERENCES "payruns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_warnings" ADD CONSTRAINT "payroll_warnings_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "payslips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_warnings" ADD CONSTRAINT "payroll_warnings_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

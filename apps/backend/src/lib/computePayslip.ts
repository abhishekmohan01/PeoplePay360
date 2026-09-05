import { prisma } from "db/client";

export interface ComputeContext {
  wage: number;
  basic: number;
  gross: number;
  deductions: number;
  net: number;
  workedHours: number;
  overtime: number;
  workedDays: number;
  unpaidDays: number;
  employee: any;
  contract: any;
  lines: Record<string, number>;
}

export async function computePayslip(payslipId: string) {
  const payslip = await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: {
      employee: true,
      contract: true,
      salaryStructure: {
        include: {
          rules: {
            where: { isActive: true },
            orderBy: { sequence: "asc" },
          },
        },
      },
      payrun: true,
    },
  });

  if (!payslip) {
    throw new Error(`Payslip not found: ${payslipId}`);
  }

  const { employee, contract, salaryStructure, payrun } = payslip;
  const wage = Number(contract.wage || 0);

  // Compute attendance stats in this period
  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId: employee.id,
      checkIn: {
        gte: payslip.periodStart,
        lte: payslip.periodEnd,
      },
    },
  });

  const workedHours = attendances.reduce((sum, a) => sum + Number(a.workedHours || 0), 0);
  const overtime = attendances.reduce((sum, a) => sum + Number(a.overtime || 0), 0);
  const workedDays = attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE" || a.status === "EARLY_CHECKOUT" || a.status === "CORRECTED").length;

  // Unpaid leaves in this period
  const timeOffs = await prisma.timeOffRequest.findMany({
    where: {
      employeeId: employee.id,
      status: "APPROVED",
      startDate: { lte: payslip.periodEnd },
      endDate: { gte: payslip.periodStart },
      timeOffType: { payrollWorkEntry: false },
    },
  });
  const unpaidDays = timeOffs.reduce((sum, r) => sum + Number(r.duration || 0), 0);

  const ctx: ComputeContext = {
    wage,
    basic: 0,
    gross: 0,
    deductions: 0,
    net: 0,
    workedHours,
    overtime,
    workedDays,
    unpaidDays,
    employee,
    contract,
    lines: {},
  };

  const linesToCreate: {
    ruleId: string;
    name: string;
    code: string;
    category: any;
    sequence: number;
    amount: number;
  }[] = [];

  for (const rule of salaryStructure.rules) {
    let amount = 0;

    if (rule.computationType === "FIXED_AMOUNT") {
      amount = Number(parseFloat(rule.computationValue)) || 0;
    } else if (rule.computationType === "PERCENTAGE_OF_WAGE") {
      const pct = Number(parseFloat(rule.computationValue)) || 0;
      amount = (pct / 100) * wage;
    } else if (rule.computationType === "PYTHON_CODE") {
      try {
        const val = rule.computationValue.trim();
        const fnBody = val.includes("return") ? val : `return (${val});`;
        const executor = new Function(
          "ctx",
          "wage",
          "basic",
          "gross",
          "deductions",
          "workedHours",
          "overtime",
          "workedDays",
          "unpaidDays",
          fnBody
        );
        const result = executor(
          ctx,
          ctx.wage,
          ctx.basic,
          ctx.gross,
          ctx.deductions,
          ctx.workedHours,
          ctx.overtime,
          ctx.workedDays,
          ctx.unpaidDays
        );
        amount = Number(result) || 0;
      } catch (err: any) {
        console.error(`Error evaluating rule ${rule.code}:`, err.message);
        amount = 0;
      }
    }

    // Keep amount formatted to 2 decimals
    amount = Math.round(amount * 100) / 100;
    ctx.lines[rule.code] = amount;

    if (rule.category === "BASIC") {
      ctx.basic += amount;
      ctx.gross += amount;
    } else if (rule.category === "ALLOWANCE") {
      ctx.gross += amount;
    } else if (rule.category === "DEDUCTION") {
      ctx.deductions += Math.abs(amount);
    } else if (rule.category === "GROSS") {
      // If rule specifically calculates or overrides gross
      if (amount > 0) ctx.gross = amount;
    }

    linesToCreate.push({
      ruleId: rule.id,
      name: rule.name,
      code: rule.code,
      category: rule.category,
      sequence: rule.sequence,
      amount,
    });
  }

  // Net salary = Gross - Deductions
  ctx.net = Math.max(0, Math.round((ctx.gross - ctx.deductions) * 100) / 100);

  // Warning checks
  const warningsToCreate: {
    companyId: string;
    payrunId: string;
    payslipId: string;
    employeeId: string;
    type: "MISSING_BANK_ACCOUNT" | "DUPLICATE_PAYSLIP" | "EXPIRING_CONTRACT" | "MISSING_INFORMATION" | "OTHER";
    severity: "INFO" | "WARNING" | "ERROR";
    message: string;
  }[] = [];

  if (!employee.bankAccountNumber) {
    warningsToCreate.push({
      companyId: payrun.companyId,
      payrunId: payrun.id,
      payslipId: payslip.id,
      employeeId: employee.id,
      type: "MISSING_BANK_ACCOUNT",
      severity: "WARNING",
      message: `Employee ${employee.firstName} ${employee.lastName} (${employee.employeeCode}) has no bank account configured.`,
    });
  }

  if (contract.endDate) {
    const daysUntilEnd = (contract.endDate.getTime() - payslip.periodEnd.getTime()) / (1000 * 3600 * 24);
    if (daysUntilEnd <= 30 && daysUntilEnd >= -30) {
      warningsToCreate.push({
        companyId: payrun.companyId,
        payrunId: payrun.id,
        payslipId: payslip.id,
        employeeId: employee.id,
        type: "EXPIRING_CONTRACT",
        severity: "INFO",
        message: `Contract ${contract.contractNumber} expires on ${contract.endDate.toISOString().split("T")[0]}.`,
      });
    }
  }

  // Check duplicate payslips in other payruns for the same period
  const otherPayslips = await prisma.payslip.count({
    where: {
      employeeId: employee.id,
      payrunId: { not: payrun.id },
      periodStart: payslip.periodStart,
      periodEnd: payslip.periodEnd,
    },
  });
  if (otherPayslips > 0) {
    warningsToCreate.push({
      companyId: payrun.companyId,
      payrunId: payrun.id,
      payslipId: payslip.id,
      employeeId: employee.id,
      type: "DUPLICATE_PAYSLIP",
      severity: "WARNING",
      message: `Another payslip exists for this employee in the same period.`,
    });
  }

  // Database transaction: update lines, warnings, and payslip totals
  await prisma.$transaction(async (tx) => {
    // Delete existing lines
    await tx.payslipLine.deleteMany({ where: { payslipId } });
    // Delete existing warnings for this payslip
    await tx.payrollWarning.deleteMany({ where: { payslipId } });

    // Create lines
    for (const l of linesToCreate) {
      await tx.payslipLine.create({
        data: {
          payslipId,
          salaryRuleId: l.ruleId,
          name: l.name,
          code: l.code,
          category: l.category,
          sequence: l.sequence,
          amount: l.amount,
        },
      });
    }

    // Create warnings
    for (const w of warningsToCreate) {
      await tx.payrollWarning.create({
        data: w,
      });
    }

    // Update payslip record
    await tx.payslip.update({
      where: { id: payslipId },
      data: {
        basicSalary: ctx.basic,
        grossSalary: ctx.gross,
        totalDeductions: ctx.deductions,
        netSalary: ctx.net,
        status: "COMPUTED",
        warningCount: warningsToCreate.length,
      },
    });
  });

  return {
    basic: ctx.basic,
    gross: ctx.gross,
    deductions: ctx.deductions,
    net: ctx.net,
    warningCount: warningsToCreate.length,
  };
}

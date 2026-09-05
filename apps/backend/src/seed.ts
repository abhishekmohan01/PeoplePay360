import bcrypt from "bcryptjs";
import { prisma } from "db/client";

export async function seedDatabase() {
  console.log("🌱 Starting database seed...");

  // 1. Seed Roles
  const rolesData = [
    { code: "ADMIN" as const, name: "System Administrator", description: "Full system access & user management" },
    { code: "HR_MANAGER" as const, name: "HR Manager", description: "Manages employees, contracts, and departments" },
    { code: "TIME_OFF_ADMIN" as const, name: "Time Off Administrator", description: "Approves and manages leaves and allocations" },
    { code: "PAYROLL_USER" as const, name: "Payroll Specialist", description: "Calculates payruns and generates payslips" },
    { code: "EMPLOYEE" as const, name: "Employee", description: "Self-service attendance and leave requests" },
  ];

  for (const r of rolesData) {
    await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description },
      create: r,
    });
  }
  console.log("✅ Roles created/updated");

  // 2. Company
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "Acme PeoplePay Corp",
        currency: "USD",
        timezone: "UTC",
        isActive: true,
      },
    });
  }
  console.log(`✅ Company ready: ${company.name}`);

  // 3. Departments
  const deptData = [
    { name: "Engineering", code: "ENG" },
    { name: "Human Resources", code: "HR" },
    { name: "Finance & Payroll", code: "FIN" },
    { name: "Sales & Marketing", code: "SALES" },
  ];

  const departments: Record<string, any> = {};
  for (const d of deptData) {
    const dept = await prisma.department.upsert({
      where: { companyId_code: { companyId: company.id, code: d.code } },
      update: { name: d.name },
      create: { companyId: company.id, name: d.name, code: d.code, isActive: true },
    });
    departments[d.code] = dept;
  }
  console.log("✅ Departments created");

  // 4. Working Schedule
  let schedule = await prisma.workingSchedule.findFirst({
    where: { companyId: company.id, name: "Standard Full-Time (40h)" },
  });

  if (!schedule) {
    schedule = await prisma.workingSchedule.create({
      data: {
        companyId: company.id,
        name: "Standard Full-Time (40h)",
        timezone: "UTC",
        daysPerWeek: 5,
        hoursPerWeek: 40,
        isActive: true,
        days: {
          create: [1, 2, 3, 4, 5].map((day) => ({
            dayOfWeek: day,
            startTime: new Date("1970-01-01T09:00:00Z"),
            endTime: new Date("1970-01-01T18:00:00Z"),
            breakMinutes: 60,
            hours: 8,
          })),
        },
      },
    });
  }
  console.log("✅ Working Schedule created");

  // 5. Time Off Types
  const leaveTypesData = [
    { name: "Paid Time Off (PTO)", unit: "DAYS" as const, requiresAllocation: true, approvalRequired: true, payrollWorkEntry: true, displayColor: "#3B82F6" },
    { name: "Sick Leave", unit: "DAYS" as const, requiresAllocation: true, approvalRequired: true, payrollWorkEntry: true, displayColor: "#EF4444" },
    { name: "Unpaid Leave", unit: "DAYS" as const, requiresAllocation: false, approvalRequired: true, payrollWorkEntry: false, displayColor: "#F59E0B" },
  ];

  const leaveTypes: Record<string, any> = {};
  for (const lt of leaveTypesData) {
    const type = await prisma.timeOffType.upsert({
      where: { companyId_name: { companyId: company.id, name: lt.name } },
      update: lt,
      create: { companyId: company.id, ...lt },
    });
    leaveTypes[lt.name] = type;
  }
  console.log("✅ Time Off Types created");

  // 6. Salary Structure & Rules
  let salaryStructure = await prisma.salaryStructure.findFirst({
    where: { companyId: company.id, code: "REGULAR_2026" },
  });

  if (!salaryStructure) {
    salaryStructure = await prisma.salaryStructure.create({
      data: {
        companyId: company.id,
        name: "Regular Full-Time Structure",
        code: "REGULAR_2026",
        description: "Standard executive & engineering monthly salary structure",
        isActive: true,
      },
    });

    const rules = [
      { name: "Basic Salary", code: "BASIC", category: "BASIC" as const, sequence: 1, computationType: "PERCENTAGE_OF_WAGE" as const, computationValue: "50" },
      { name: "House Rent Allowance", code: "HRA", category: "ALLOWANCE" as const, sequence: 10, computationType: "PERCENTAGE_OF_WAGE" as const, computationValue: "20" },
      { name: "Standard Allowance", code: "STD", category: "ALLOWANCE" as const, sequence: 20, computationType: "FIXED_AMOUNT" as const, computationValue: "1000" },
      { name: "Performance Bonus", code: "BONUS", category: "ALLOWANCE" as const, sequence: 30, computationType: "FIXED_AMOUNT" as const, computationValue: "500" },
      { name: "Gross Salary", code: "GROSS", category: "GROSS" as const, sequence: 60, computationType: "PYTHON_CODE" as const, computationValue: "return basic + (wage * 0.20) + 1500;" },
      { name: "Provident Fund", code: "PF", category: "DEDUCTION" as const, sequence: 80, computationType: "PERCENTAGE_OF_WAGE" as const, computationValue: "12" },
      { name: "Professional Tax", code: "PT", category: "DEDUCTION" as const, sequence: 100, computationType: "FIXED_AMOUNT" as const, computationValue: "200" },
      { name: "Overtime Pay", code: "OT", category: "ALLOWANCE" as const, sequence: 105, computationType: "PYTHON_CODE" as const, computationValue: "return overtime * 30;" },
      { name: "Net Salary", code: "NET", category: "NET" as const, sequence: 110, computationType: "PYTHON_CODE" as const, computationValue: "return gross - deductions + (overtime * 30);" },
    ];

    for (const r of rules) {
      await prisma.salaryRule.create({
        data: {
          salaryStructureId: salaryStructure.id,
          ...r,
        },
      });
    }
  }
  console.log("✅ Salary Structure and Rules created");

  // 7. Seed Employees & Dummy Users
  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  const usersToSeed = [
    {
      email: "admin@peoplepay360.com",
      roleCodes: ["ADMIN"],
      emp: {
        code: "EMP-001",
        firstName: "Alex",
        lastName: "Rivera",
        deptCode: "HR",
        job: "Chief People Officer & Admin",
        wage: 15000,
        bankAccount: "US89370400440532013000",
        bankName: "JPMorgan Chase",
        bankIdentifierCode: "CHASUS33",
      },
    },
    {
      email: "hrmanager@peoplepay360.com",
      roleCodes: ["HR_MANAGER"],
      emp: {
        code: "EMP-002",
        firstName: "Sarah",
        lastName: "Connor",
        deptCode: "HR",
        job: "Senior HR Manager",
        wage: 11000,
        bankAccount: "US89370400440532013001",
        bankName: "Bank of America",
        bankIdentifierCode: "BOFAUS3N",
      },
    },
    {
      email: "timeoff@peoplepay360.com",
      roleCodes: ["TIME_OFF_ADMIN"],
      emp: {
        code: "EMP-003",
        firstName: "David",
        lastName: "Miller",
        deptCode: "HR",
        job: "Leave & Benefits Administrator",
        wage: 8500,
        bankAccount: "US89370400440532013002",
        bankName: "Wells Fargo",
        bankIdentifierCode: "WFBIUS6S",
      },
    },
    {
      email: "payroll@peoplepay360.com",
      roleCodes: ["PAYROLL_USER"],
      emp: {
        code: "EMP-004",
        firstName: "Rachel",
        lastName: "Green",
        deptCode: "FIN",
        job: "Payroll Lead Specialist",
        wage: 9500,
        bankAccount: "US89370400440532013003",
        bankName: "Citigroup",
        bankIdentifierCode: "CITIUS33",
      },
    },
    {
      email: "employee@peoplepay360.com",
      roleCodes: ["EMPLOYEE"],
      emp: {
        code: "EMP-005",
        firstName: "John",
        lastName: "Doe",
        deptCode: "ENG",
        job: "Senior Software Engineer",
        wage: 12000,
        bankAccount: "US89370400440532013004",
        bankName: "Silicon Valley Bank",
        bankIdentifierCode: "SVBKUS6S",
      },
    },
    {
      email: "emma@peoplepay360.com",
      roleCodes: ["EMPLOYEE"],
      emp: {
        code: "EMP-006",
        firstName: "Emma",
        lastName: "Watson",
        deptCode: "ENG",
        job: "Frontend Engineer",
        wage: 9000,
        bankAccount: "US89370400440532013005",
        bankName: "Barclays",
        bankIdentifierCode: "BARCUS33",
      },
    },
    {
      email: "michael@peoplepay360.com",
      roleCodes: ["EMPLOYEE"],
      emp: {
        code: "EMP-007",
        firstName: "Michael",
        lastName: "Scott",
        deptCode: "SALES",
        job: "Regional Sales Manager",
        wage: 10500,
        bankAccount: null, // Intentionally null to test MISSING_BANK_ACCOUNT payroll warning!
        bankName: null,
        bankIdentifierCode: null,
      },
    },
  ];

  for (const u of usersToSeed) {
    // 1. Create or find employee
    let employee = await prisma.employee.findUnique({
      where: { companyId_employeeCode: { companyId: company.id, employeeCode: u.emp.code } },
    });

    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          companyId: company.id,
          departmentId: departments[u.emp.deptCode].id,
          employeeCode: u.emp.code,
          firstName: u.emp.firstName,
          lastName: u.emp.lastName,
          workEmail: u.email,
          jobPosition: u.emp.job,
          employeeType: "FULL_TIME",
          status: "ACTIVE",
          bankAccountNumber: u.emp.bankAccount,
          bankName: u.emp.bankName,
          bankIdentifierCode: u.emp.bankIdentifierCode,
        },
      });

      // Contract
      await prisma.contract.create({
        data: {
          companyId: company.id,
          employeeId: employee.id,
          departmentId: departments[u.emp.deptCode].id,
          contractNumber: `CON/2026/${u.emp.code.replace("EMP-", "")}`,
          startDate: new Date("2026-01-01"),
          wage: u.emp.wage,
          jobPosition: u.emp.job,
          contractType: "FULL_TIME",
          workingScheduleId: schedule.id,
          salaryStructureId: salaryStructure.id,
          status: "RUNNING",
        },
      });

      // Allocations
      if (leaveTypes["Paid Time Off (PTO)"]) {
        await prisma.timeOffAllocation.create({
          data: {
            employeeId: employee.id,
            timeOffTypeId: leaveTypes["Paid Time Off (PTO)"].id,
            allocated: 20,
            taken: 0,
            remaining: 20,
            validityStart: new Date("2026-01-01"),
            status: "CONFIRMED",
            description: "Annual PTO allowance",
          },
        });
      }
    }

    // 2. Create User account
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: u.email,
          passwordHash: defaultPasswordHash,
          employeeId: employee.id,
          status: "ACTIVE",
        },
      });

      for (const rCode of u.roleCodes) {
        const role = await prisma.role.findUnique({ where: { code: rCode } });
        if (role) {
          await prisma.userRole.create({
            data: { userId: user.id, roleId: role.id },
          });
        }
      }
    }
  }

  console.log("✅ All dummy users and employees seeded successfully!");
  console.log(`
=====================================================
👥 DUMMY CREDENTIALS FOR TESTING (Password: password123)
=====================================================
• Admin:            admin@peoplepay360.com
• HR Manager:       hrmanager@peoplepay360.com
• Time Off Admin:   timeoff@peoplepay360.com
• Payroll User:     payroll@peoplepay360.com
• Employee (John):  employee@peoplepay360.com
• Employee (Emma):  emma@peoplepay360.com
• Employee (Michael - No Bank A/C): michael@peoplepay360.com
=====================================================
  `);
}

// Allow direct CLI execution: bun src/seed.ts
if (import.meta.main) {
  seedDatabase()
    .catch((err) => {
      console.error("Seed error:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

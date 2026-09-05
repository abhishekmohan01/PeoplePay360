import PDFDocument from "pdfkit";
import { prisma } from "db/client";

export async function generatePayslipPdf(payslipId: string): Promise<Buffer> {
  const payslip = await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: {
      employee: {
        include: {
          department: true,
          company: true,
        },
      },
      contract: true,
      payrun: true,
      lines: {
        orderBy: { sequence: "asc" },
      },
    },
  });

  if (!payslip) {
    throw new Error("Payslip not found");
  }

  const { employee, payrun, lines } = payslip;
  const company = employee.company;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const buffers: Buffer[] = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // Colors
    const primaryColor = "#1E3A8A";
    const darkColor = "#1F2937";
    const lightGray = "#F3F4F6";
    const textMuted = "#6B7280";

    // Header Banner
    doc.rect(40, 40, 515, 60).fill(primaryColor);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(20).text("PEOPLEPAY 360", 60, 52);
    doc.font("Helvetica").fontSize(10).text(company.name.toUpperCase(), 60, 78);
    doc.font("Helvetica-Bold").fontSize(15).text("PAYSLIP", 350, 52, { width: 190, align: "right" });
    doc.font("Helvetica").fontSize(9).text(`Payrun: ${payrun.name}`, 250, 76, { width: 290, align: "right" });

    // Helper date formatter
    const formatDate = (d: Date | string) =>
      new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    // Mask bank account number
    const rawBankAcct = employee.bankAccountNumber || "";
    const maskedBankAcct =
      rawBankAcct.length > 4
        ? `•••• •••• ${rawBankAcct.slice(-4)}`
        : rawBankAcct || "Not configured";

    // Details Grid
    const startY = 120;
    doc.rect(40, startY, 515, 85).fill(lightGray);

    doc.fillColor(darkColor).fontSize(9);
    // Left Column
    doc.font("Helvetica-Bold").text("Employee:", 55, startY + 12);
    doc.font("Helvetica").text(`${employee.firstName} ${employee.lastName} (${employee.employeeCode})`, 130, startY + 12);

    doc.font("Helvetica-Bold").text("Department:", 55, startY + 30);
    doc.font("Helvetica").text(`${employee.department?.name || "General"}`, 130, startY + 30);

    doc.font("Helvetica-Bold").text("Job Position:", 55, startY + 48);
    doc.font("Helvetica").text(`${employee.jobPosition || "Staff"}`, 130, startY + 48);

    doc.font("Helvetica-Bold").text("Bank A/C:", 55, startY + 66);
    doc.font("Helvetica").text(maskedBankAcct, 130, startY + 66);

    // Right Column
    doc.font("Helvetica-Bold").text("Pay Period:", 320, startY + 12);
    doc.font("Helvetica").text(`${formatDate(payslip.periodStart)} – ${formatDate(payslip.periodEnd)}`, 395, startY + 12);

    doc.font("Helvetica-Bold").text("Status:", 320, startY + 30);
    doc.font("Helvetica").text(`${payslip.status}`, 395, startY + 30);

    doc.font("Helvetica-Bold").text("Currency:", 320, startY + 48);
    doc.font("Helvetica").text(company.currency || "INR", 395, startY + 48);

    doc.font("Helvetica-Bold").text("Generated:", 320, startY + 66);
    doc.font("Helvetica").text(formatDate(new Date()), 395, startY + 66);

    // Filter out redundant summary totals from itemized breakdown lines
    const printableLines = lines.filter(
      (l) => l.category !== "GROSS" && l.category !== "NET"
    );

    // Earnings and Deductions Table
    let tableY = 225;
    doc.rect(40, tableY, 515, 24).fill(primaryColor);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);
    doc.text("CODE", 50, tableY + 7);
    doc.text("SALARY COMPONENT", 110, tableY + 7);
    doc.text("CATEGORY", 320, tableY + 7);
    doc.text("AMOUNT (INR)", 440, tableY + 7, { align: "right", width: 100 });

    tableY += 24;
    let isOdd = false;
    for (const line of printableLines) {
      if (isOdd) {
        doc.rect(40, tableY, 515, 20).fill("#F9FAFB");
      }
      isOdd = !isOdd;

      const isDeduction = line.category === "DEDUCTION";
      const displayCategory =
        line.category === "DEDUCTION"
          ? "Deduction"
          : line.category === "BASIC"
          ? "Basic"
          : "Allowance";

      doc.fillColor(darkColor).font("Helvetica").fontSize(9);
      doc.text(line.code, 50, tableY + 5);
      doc.text(line.name, 110, tableY + 5);
      doc.text(displayCategory, 320, tableY + 5);

      const amtNum = Math.abs(Number(line.amount));
      const amtStr = `${isDeduction ? "-" : ""}INR ${amtNum.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

      doc.fillColor(isDeduction ? "#DC2626" : darkColor);
      doc.text(amtStr, 440, tableY + 5, { align: "right", width: 100 });

      tableY += 20;
    }

    // Totals Box
    tableY += 15;
    doc.rect(295, tableY, 260, 95).fill(lightGray);

    const currencyCode = company.currency || "INR";

    doc.fillColor(darkColor).font("Helvetica").fontSize(9);
    doc.text("Basic Salary:", 310, tableY + 12);
    doc.text(
      `${currencyCode} ${Number(payslip.basicSalary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      430,
      tableY + 12,
      { align: "right", width: 110 }
    );

    doc.text("Gross Earnings:", 310, tableY + 28);
    doc.text(
      `${currencyCode} ${Number(payslip.grossSalary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      430,
      tableY + 28,
      { align: "right", width: 110 }
    );

    doc.text("Total Deductions:", 310, tableY + 44);
    doc.fillColor("#DC2626");
    doc.text(
      `-${currencyCode} ${Number(payslip.totalDeductions).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      430,
      tableY + 44,
      { align: "right", width: 110 }
    );

    doc.rect(295, tableY + 62, 260, 33).fill(primaryColor);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(11).text("NET PAYABLE:", 310, tableY + 73);
    doc.text(
      `${currencyCode} ${Number(payslip.netSalary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      420,
      tableY + 73,
      { align: "right", width: 120 }
    );

    // Footer
    doc.fillColor(textMuted).font("Helvetica").fontSize(8);
    doc.text(
      "This is a computer-generated payslip from PeoplePay360. No physical signature required.",
      40,
      750,
      {
        align: "center",
        width: 515,
      }
    );

    doc.end();
  });
}

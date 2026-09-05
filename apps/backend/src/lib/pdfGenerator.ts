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
    doc.font("Helvetica").fontSize(11).text(company.name.toUpperCase(), 60, 78);
    doc.font("Helvetica-Bold").fontSize(14).text("PAYSLIP", 450, 52, { align: "right" });
    doc.font("Helvetica").fontSize(9).text(`Payrun: ${payrun.name}`, 380, 78, { align: "right" });

    // Details Grid
    const startY = 120;
    doc.rect(40, startY, 515, 85).fill(lightGray);

    doc.fillColor(darkColor).fontSize(10);
    // Left Column
    doc.font("Helvetica-Bold").text(`Employee:`, 55, startY + 12);
    doc.font("Helvetica").text(`${employee.firstName} ${employee.lastName} (${employee.employeeCode})`, 130, startY + 12);

    doc.font("Helvetica-Bold").text(`Department:`, 55, startY + 30);
    doc.font("Helvetica").text(`${employee.department.name}`, 130, startY + 30);

    doc.font("Helvetica-Bold").text(`Job Position:`, 55, startY + 48);
    doc.font("Helvetica").text(`${employee.jobPosition}`, 130, startY + 48);

    doc.font("Helvetica-Bold").text(`Bank A/C:`, 55, startY + 66);
    doc.font("Helvetica").text(`${employee.bankAccountNumber || "Not configured"}`, 130, startY + 66);

    // Right Column
    const periodStartStr = new Date(payslip.periodStart).toLocaleDateString();
    const periodEndStr = new Date(payslip.periodEnd).toLocaleDateString();
    doc.font("Helvetica-Bold").text(`Pay Period:`, 330, startY + 12);
    doc.font("Helvetica").text(`${periodStartStr} - ${periodEndStr}`, 410, startY + 12);

    doc.font("Helvetica-Bold").text(`Status:`, 330, startY + 30);
    doc.font("Helvetica").text(`${payslip.status}`, 410, startY + 30);

    doc.font("Helvetica-Bold").text(`Currency:`, 330, startY + 48);
    doc.font("Helvetica").text(`${company.currency}`, 410, startY + 48);

    doc.font("Helvetica-Bold").text(`Generated:`, 330, startY + 66);
    doc.font("Helvetica").text(`${new Date().toLocaleDateString()}`, 410, startY + 66);

    // Earnings and Deductions Table
    let tableY = 225;
    doc.rect(40, tableY, 515, 24).fill(primaryColor);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);
    doc.text("CODE", 50, tableY + 7);
    doc.text("SALARY COMPONENT", 110, tableY + 7);
    doc.text("CATEGORY", 320, tableY + 7);
    doc.text("AMOUNT", 460, tableY + 7, { align: "right", width: 85 });

    tableY += 24;
    let isOdd = false;
    for (const line of lines) {
      if (isOdd) {
        doc.rect(40, tableY, 515, 20).fill("#F9FAFB");
      }
      isOdd = !isOdd;

      doc.fillColor(darkColor).font("Helvetica").fontSize(9);
      doc.text(line.code, 50, tableY + 5);
      doc.text(line.name, 110, tableY + 5);
      doc.text(line.category, 320, tableY + 5);

      const isDeduction = line.category === "DEDUCTION";
      const amtStr = `${isDeduction ? "-" : ""}${company.currency} ${Number(line.amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
      doc.fillColor(isDeduction ? "#DC2626" : darkColor);
      doc.text(amtStr, 460, tableY + 5, { align: "right", width: 85 });

      tableY += 20;
    }

    // Totals Box
    tableY += 15;
    doc.rect(295, tableY, 260, 95).fill(lightGray);

    doc.fillColor(darkColor).font("Helvetica").fontSize(9);
    doc.text("Basic Salary:", 310, tableY + 12);
    doc.text(`${company.currency} ${Number(payslip.basicSalary).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 440, tableY + 12, { align: "right", width: 100 });

    doc.text("Gross Earnings:", 310, tableY + 28);
    doc.text(`${company.currency} ${Number(payslip.grossSalary).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 440, tableY + 28, { align: "right", width: 100 });

    doc.text("Total Deductions:", 310, tableY + 44);
    doc.fillColor("#DC2626");
    doc.text(`-${company.currency} ${Number(payslip.totalDeductions).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 440, tableY + 44, { align: "right", width: 100 });

    doc.rect(295, tableY + 62, 260, 33).fill(primaryColor);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(11).text("NET PAYABLE:", 310, tableY + 73);
    doc.text(`${company.currency} ${Number(payslip.netSalary).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 430, tableY + 73, { align: "right", width: 110 });

    // Footer
    doc.fillColor(textMuted).font("Helvetica").fontSize(8);
    doc.text("This is a computer-generated payslip from PeoplePay360. No physical signature required.", 40, 750, {
      align: "center",
      width: 515,
    });

    doc.end();
  });
}

import type {
  AgentResponse,
  AgentStepLog,
  AgentActionProposal,
} from "./types";
import {
  auditWfhAndGeolocation,
  batchResolveWfhWarnings,
  getLiveAttendancePulse,
  getAttendanceMapData,
} from "./tools/attendance.tools";
import { runPayrollPreflight, getPayrollOverview } from "./tools/payroll.tools";

/**
 * Tool definitions exposed to the agent
 */
export const AGENT_TOOLS_DEFINITIONS = [
  {
    name: "auditWfhAndGeolocation",
    description:
      "Audits employee attendance records for a given date, extracts GPS coordinates, calculates Haversine distance from company HQ, and classifies punches into Verified Office, Verified WFH, or Suspicious Out-of-Bounds.",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "Target date in YYYY-MM-DD format (defaults to today)" },
        companyId: { type: "string", description: "Optional company ID filter" },
      },
    },
  },
  {
    name: "batchResolveWfhWarnings",
    description:
      "Batch resolves pending HR review warnings for verified remote/WFH check-ins and appends AI verification tags to attendance records.",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "Target date in YYYY-MM-DD format (defaults to today)" },
        companyId: { type: "string", description: "Optional company ID filter" },
      },
    },
  },
  {
    name: "getLiveAttendancePulse",
    description:
      "Returns real-time headcount: total active check-ins, office vs remote breakdown, and overdue punches (>9h without check out).",
    parameters: {
      type: "object",
      properties: {
        companyId: { type: "string", description: "Optional company ID filter" },
      },
    },
  },
  {
    name: "getPayrollOverview",
    description:
      "Retrieves current payroll data, recent payruns, and pre-flight readiness audit for a specific month and year. Always use this when the user asks about payroll data or 'this month's payroll'.",
    parameters: {
      type: "object",
      properties: {
        month: { type: "number", description: "Month number 1-12 (defaults to current month if omitted)" },
        year: { type: "number", description: "4-digit year (defaults to current year if omitted)" },
        companyId: { type: "string", description: "Optional company ID filter" },
      },
    },
  },
  {
    name: "runPayrollPreflight",
    description:
      "Performs a pre-flight audit before generating payroll, checking for missing check-outs, unresolved attendance warnings, and expiring contracts. Defaults to current month and year.",
    parameters: {
      type: "object",
      properties: {
        month: { type: "number", description: "Month number 1-12 (defaults to current month if omitted)" },
        year: { type: "number", description: "4-digit year e.g. 2026 (defaults to current year if omitted)" },
        companyId: { type: "string", description: "Optional company ID filter" },
      },
    },
  },
  {
    name: "getAttendanceMapData",
    description:
      "Generates interactive map radar pins with GPS coordinates, distance, and status colors (green for verified, red for out-of-bounds anomaly) for visual map plotting.",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "Target date in YYYY-MM-DD format (defaults to today)" },
        companyId: { type: "string", description: "Optional company ID filter" },
      },
    },
  },
];

/**
 * Executes a specific tool by name
 */
export async function executeTool(name: string, args: Record<string, any> = {}): Promise<any> {
  switch (name) {
    case "auditWfhAndGeolocation":
      return await auditWfhAndGeolocation(args);
    case "batchResolveWfhWarnings":
      return await batchResolveWfhWarnings(args);
    case "getLiveAttendancePulse":
      return await getLiveAttendancePulse(args);
    case "runPayrollPreflight":
      return await runPayrollPreflight(args);
    case "getPayrollOverview":
      return await getPayrollOverview(args);
    case "getAttendanceMapData":
      return await getAttendanceMapData(args);
    default:
      throw new Error(`Unknown agent tool: ${name}`);
  }
}

/**
 * Commits a user-confirmed proposal action
 */
export async function executeApprovedAction(
  action: AgentActionProposal
): Promise<{ success: boolean; result: any }> {
  if (action.actionType === "BATCH_RESOLVE_WFH_WARNINGS") {
    const result = await batchResolveWfhWarnings(action.payload);
    return { success: true, result };
  }
  throw new Error(`Unsupported action type: ${action.actionType}`);
}

/**
 * Main Agent Runner: Supports Gemini function calling with a deterministic fallback engine
 */
export async function runAgent(
  prompt: string,
  context?: { companyId?: string; userRole?: string; date?: string }
): Promise<AgentResponse> {
  const steps: AgentStepLog[] = [];
  const addStep = (step: string, toolCalled?: string, details?: string) => {
    steps.push({
      timestamp: new Date().toISOString(),
      step,
      toolCalled,
      details,
    });
  };

  addStep("Agent received prompt and initialized context.", undefined, `Role: ${context?.userRole || "HR_MANAGER"}`);

  const geminiApiKey = process.env.GEMINI_API_KEY;

  // Mode A: Google Gemini API (if key present)
  if (geminiApiKey) {
    try {
      addStep("Contacting Gemini Engine with registered tool declarations...", "Gemini 2.5 Flash");
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

      const geminiTools = [
        {
          functionDeclarations: AGENT_TOOLS_DEFINITIONS.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        },
      ];

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const monthName = now.toLocaleString("en-US", { month: "long" });
      const currentDateFormatted = now.toISOString().split("T")[0];

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          tools: geminiTools,
          systemInstruction: {
            parts: [
              {
                text: `You are the PeoplePay360 Agentic HR Copilot. You specialize in attendance geolocation audits, WFH verification, and payroll pre-flight checks.

CURRENT SYSTEM CONTEXT:
- Today's date: ${currentDateFormatted}
- Current Month: ${currentMonth} (${monthName})
- Current Year: ${currentYear}

CRITICAL RULES:
1. When the user asks about "this month", "today", "current payroll", "payroll data", or omits dates, AUTOMATICALLY assume the current month (${currentMonth}) and current year (${currentYear}).
2. NEVER decline the request or tell the user to provide the month and year when they say "this month" or "today". Immediately execute the appropriate tool:
   - For general payroll queries, "this month payroll data", or payruns: invoke getPayrollOverview with month=${currentMonth}, year=${currentYear}.
   - For pre-flight audits or payroll readiness: invoke runPayrollPreflight with month=${currentMonth}, year=${currentYear}.
   - For attendance audits or GPS checks: invoke auditWfhAndGeolocation with date="${currentDateFormatted}".
3. Always inspect real database data through your declared tools. Maintain an executive, clear, concise tone. Format key stats with bullet points.`,
              },
            ],
          },
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        const candidate = data?.candidates?.[0]?.content?.parts?.[0];

        if (candidate?.functionCall) {
          const fnName = candidate.functionCall.name;
          const fnArgs = candidate.functionCall.args || {};

          addStep(`Gemini decided to execute tool: ${fnName}`, fnName, JSON.stringify(fnArgs));
          const toolResult = await executeTool(fnName, { ...fnArgs, companyId: context?.companyId });
          addStep(`Tool execution completed successfully.`, fnName);

          // Second pass: Send tool response back to Gemini for natural language synthesis
          const followupRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: prompt }] },
                { role: "model", parts: [{ functionCall: candidate.functionCall }] },
                {
                  role: "function",
                  parts: [
                    {
                      functionResponse: {
                        name: fnName,
                        response: toolResult,
                      },
                    },
                  ],
                },
              ],
            }),
          });

          let finalAnswer = "Audit completed successfully.";
          if (followupRes.ok) {
            const followupData: any = await followupRes.json();
            finalAnswer =
              followupData?.candidates?.[0]?.content?.parts?.[0]?.text || finalAnswer;
          }

          let actionProposal: AgentActionProposal | null = null;
          if (fnName === "auditWfhAndGeolocation" && toolResult.pendingWfhWarnings > 0) {
            actionProposal = {
              actionId: `action_${Date.now()}`,
              actionType: "BATCH_RESOLVE_WFH_WARNINGS",
              title: "Batch-Approve Verified WFH Check-Ins",
              description: `Approve ${toolResult.verifiedWfh} verified remote check-ins and dismiss ${toolResult.pendingWfhWarnings} pending HR review warnings.`,
              targetCount: toolResult.verifiedWfh,
              payload: { date: toolResult.date, companyId: context?.companyId },
              requiresConfirmation: true,
            };
          }

          return {
            answer: finalAnswer,
            steps,
            toolResults: { [fnName]: toolResult },
            actionProposal,
          };
        } else if (candidate?.text) {
          return {
            answer: candidate.text,
            steps,
          };
        }
      }
    } catch (geminiError) {
      addStep("Gemini API call failed or timed out. Gracefully switching to Deterministic Engine fallback.");
    }
  }

  // Mode B: Deterministic Intelligent Fallback Engine
  addStep("Using Local Agentic Reasoning Engine.", "Deterministic Planner");
  const lowerPrompt = prompt.toLowerCase();
  const isPayrollQuery =
    /payr?o+l+/i.test(lowerPrompt) ||
    /pay\s*runs?/i.test(lowerPrompt) ||
    /salar(y|ies)/i.test(lowerPrompt) ||
    lowerPrompt.includes("preflight") ||
    lowerPrompt.includes("readiness") ||
    (lowerPrompt.includes("this month") && (lowerPrompt.includes("data") || lowerPrompt.includes("pay")));

  // 1. Payroll Overview & Pre-flight Intent
  if (isPayrollQuery) {
    addStep("Intent detected: Payroll Overview & Pre-Flight.", "getPayrollOverview");
    const overview = await getPayrollOverview({
      companyId: context?.companyId,
    });
    addStep(`Payroll data retrieved: ${overview.recentPayruns.length} payrun(s), readiness score ${overview.preflightReadiness.score}/100.`);

    let recentPayrunsText = "No previous payruns on record.";
    if (overview.recentPayruns.length > 0) {
      recentPayrunsText = overview.recentPayruns
        .map(
          (p) =>
            `- **${p.name}** (\`${p.status}\`): ${p.employeeCount} employees, ${p.warningCount} warnings (${p.period})`
        )
        .join("\n");
    }

    const preflight = overview.preflightReadiness;
    const answer = `### Payroll Data & Readiness Overview (${overview.targetPeriod})

**Readiness Status:** \`${preflight.status}\` (${preflight.score}% Score)

#### Recent Payruns:
${recentPayrunsText}

#### Current Month Metrics (${overview.targetPeriod}):
- **Active Employees:** ${preflight.activeEmployees}
- **Unresolved Attendance Gaps:** ${preflight.unresolvedAttendanceGaps}
- **Pending WFH Warnings:** ${preflight.pendingWfhWarnings}

${
  preflight.blockers.length > 0
    ? `#### 🚫 Critical Blockers:\n${preflight.blockers.map((b) => `- ${b}`).join("\n")}`
    : `✅ **Zero Critical Blockers:** Payroll run can be safely processed.`
}

${
  preflight.warnings.length > 0
    ? `\n#### ⚠️ Advisory Warnings:\n${preflight.warnings.map((w) => `- ${w}`).join("\n")}`
    : ""
}

#### 💡 Recommended Actions:
${preflight.recommendedActions.map((a) => `- ${a}`).join("\n")}`;

    return {
      answer,
      steps,
      toolResults: { getPayrollOverview: overview },
    };
  }

  // 2. Interactive Map / Radar Intent
  if (
    lowerPrompt.includes("map") ||
    lowerPrompt.includes("radar") ||
    lowerPrompt.includes("pin") ||
    lowerPrompt.includes("plot") ||
    lowerPrompt.includes("visualize")
  ) {
    addStep("Intent detected: Interactive Attendance Map Radar.", "getAttendanceMapData");
    const mapData = await getAttendanceMapData({
      date: context?.date,
      companyId: context?.companyId,
    });
    addStep(`Generated radar data: ${mapData.totalPins} pins (${mapData.verifiedCount} verified, ${mapData.anomalyCount} anomalies).`);

    const answer = `### Attendance Map & Radar Coordinates (${mapData.date})

- **Total Map Pins Plotted:** ${mapData.totalPins}
- **Verified Locations:** ${mapData.verifiedCount} 🟢
- **Flagged Anomalies:** ${mapData.anomalyCount} 🔴
- **Company HQ Base:** [GPS: ${mapData.companyHq.latitude.toFixed(4)}, ${mapData.companyHq.longitude.toFixed(4)}]

#### Pin Breakdown:
${mapData.pins
  .map(
    (p) =>
      `- **${p.employeeName}** [${p.workMode}]: ${p.distanceFromHqKm ?? 0}km from HQ — \`${p.classification}\` (Pin Color: \`${p.pinColor}\`)`
  )
  .join("\n")}

${
  mapData.anomalyCount > 0
    ? `\n⚠️ **Visual Alert:** Red pins indicate punches that violate company perimeter policies.`
    : `\n✅ **All Clear:** All plotted pins are within compliant regions.`
}`;

    return {
      answer,
      steps,
      toolResults: { getAttendanceMapData: mapData },
    };
  }

  // 3. Audit / Geolocation / WFH Intent
  if (
    lowerPrompt.includes("audit") ||
    lowerPrompt.includes("attendance") ||
    lowerPrompt.includes("punch") ||
    lowerPrompt.includes("wfh") ||
    lowerPrompt.includes("remote") ||
    lowerPrompt.includes("geo") ||
    lowerPrompt.includes("gps") ||
    lowerPrompt.includes("perimeter") ||
    lowerPrompt.includes("location")
  ) {
    addStep("Intent detected: Geolocation & WFH Attendance Audit.", "auditWfhAndGeolocation");
    const audit = await auditWfhAndGeolocation({
      date: context?.date,
      companyId: context?.companyId,
    });
    addStep(
      `Audited ${audit.totalPunches} punches: ${audit.verifiedOffice} Office, ${audit.verifiedWfh} WFH, ${audit.suspiciousPunches} Suspicious, ${audit.pendingWfhWarnings} Warnings.`
    );

    let proposal: AgentActionProposal | null = null;
    if (audit.pendingWfhWarnings > 0 && audit.verifiedWfh > 0) {
      proposal = {
        actionId: `act_${Date.now()}`,
        actionType: "BATCH_RESOLVE_WFH_WARNINGS",
        title: "Batch-Approve Verified WFH Punches",
        description: `Auto-verify ${audit.verifiedWfh} legitimate remote attendance punches and dismiss ${audit.pendingWfhWarnings} pending HR review warning(s).`,
        targetCount: audit.verifiedWfh,
        payload: { date: audit.date, companyId: context?.companyId },
        requiresConfirmation: true,
      };
      addStep("Formulated interactive Human-in-the-Loop Action Proposal.", "Proposal Formulator");
    }

    const answer = `### Attendance & Geolocation Audit Report (${audit.date})

- **Total Punches Audited:** ${audit.totalPunches}
- **Verified In-Office (<500m from HQ):** ${audit.verifiedOffice}
- **Verified Remote (Valid WFH Coordinates):** ${audit.verifiedWfh}
- **Suspicious / Out-of-Bounds:** ${audit.suspiciousPunches}
- **Missing GPS Tags:** ${audit.missingGps}
- **Pending HR Warnings:** ${audit.pendingWfhWarnings}

${
  audit.suspiciousPunches > 0
    ? `⚠️ **Flagged Anomalies:** Found ${audit.suspiciousPunches} punch(es) requiring manual review.`
    : `✅ **Perimeter Check:** All analyzed check-ins comply with company location policies.`
}

${
  proposal
    ? `I have prepared a batch-resolution proposal below to auto-approve the ${audit.verifiedWfh} verified WFH records and clear their HR warnings.`
    : `No pending WFH review warnings found.`
}`;

    return {
      answer,
      steps,
      toolResults: { auditWfhAndGeolocation: audit },
      actionProposal: proposal,
    };
  }

  // 2. Batch Resolve Warnings Intent
  if (
    lowerPrompt.includes("batch") ||
    lowerPrompt.includes("approve") ||
    lowerPrompt.includes("clear") ||
    lowerPrompt.includes("resolve")
  ) {
    addStep("Intent detected: Batch Resolve WFH Warnings.", "batchResolveWfhWarnings");
    const result = await batchResolveWfhWarnings({
      date: context?.date,
      companyId: context?.companyId,
    });
    addStep(`Batch resolution complete: ${result.resolvedCount} records verified, ${result.clearedWarningIds.length} warnings deleted.`);

    return {
      answer: `### WFH Batch Resolution Completed\n\n${result.message}`,
      steps,
      toolResults: { batchResolveWfhWarnings: result },
      executedAction: {
        actionType: "BATCH_RESOLVE_WFH_WARNINGS",
        result,
      },
    };
  }


  // 4. Live Pulse Intent
  if (
    lowerPrompt.includes("pulse") ||
    lowerPrompt.includes("live") ||
    lowerPrompt.includes("who is in") ||
    lowerPrompt.includes("clocked") ||
    lowerPrompt.includes("headcount")
  ) {
    addStep("Intent detected: Live Attendance Headcount Pulse.", "getLiveAttendancePulse");
    const pulse = await getLiveAttendancePulse({ companyId: context?.companyId });
    addStep(`Live pulse checked: ${pulse.activePunchesCount} active (${pulse.officeCount} Office, ${pulse.wfhCount} WFH).`);

    const answer = `### Real-Time Attendance Pulse

- **Currently Clocked In:** ${pulse.activePunchesCount}
- **In Office:** ${pulse.officeCount}
- **Working From Home (WFH):** ${pulse.wfhCount}
- **Overdue Punches (>9h Active):** ${pulse.overduePunchesCount}

${
  pulse.activeEmployees.length > 0
    ? `#### Active Check-Ins:\n${pulse.activeEmployees
        .slice(0, 5)
        .map(
          (e) =>
            `- **${e.name}** (${e.isWfh ? "Remote" : "Office"}): ${Math.floor(
              e.durationMinutes / 60
            )}h ${e.durationMinutes % 60}m elapsed`
        )
        .join("\n")}${pulse.activeEmployees.length > 5 ? `\n- *...and ${pulse.activeEmployees.length - 5} more*` : ""}`
    : "No active check-ins recorded right now."
}`;

    return {
      answer,
      steps,
      toolResults: { getLiveAttendancePulse: pulse },
    };
  }

  // Default Help / Overview
  addStep("Prompt did not match a specific tool. Providing capabilities menu.");
  return {
    answer: `Hello! I am your **PeoplePay360 Agentic Copilot**. Here are the automated operations I can perform:

1. **Audit Remote & GPS Attendance:**  
   *"Audit today's remote check-ins and check for any out-of-perimeter GPS coordinates"*
2. **Batch-Approve WFH Warnings:**  
   *"Batch-approve verified remote check-ins and clear pending HR review alerts"*
3. **Run Payroll Pre-Flight:**  
   *"Run payroll preflight audit to check for missing check-outs and expiring contracts"*
4. **Live Headcount Pulse:**  
   *"Who is clocked in right now and how many are working from home?"*`,
    steps,
  };
}

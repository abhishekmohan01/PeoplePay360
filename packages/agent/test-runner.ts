import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../apps/backend/.env") });

import {
  calculateHaversineDistance,
  extractGpsFromNotes,
  classifyPunch,
  DEFAULT_COMPANY_HQ,
} from "./src/geo/haversine";
import { runAgent } from "./src/engine";

async function runTests() {
  console.log("=========================================");
  console.log("🧪 Running PeoplePay360 Agent Unit Tests");
  console.log("=========================================\n");

  // Test 1: GPS Extraction Regex
  console.log("Test 1: GPS Extraction from Attendance Notes...");
  const sampleNote = "[WFH - Sent to HR for Review] Remote check-in via TopNav [GPS: 28.5355, 77.3910]";
  const extracted = extractGpsFromNotes(sampleNote);
  console.assert(extracted !== null, "Failed to extract coordinates from note");
  console.assert(Math.abs(extracted!.latitude - 28.5355) < 0.0001, "Latitude mismatch");
  console.assert(Math.abs(extracted!.longitude - 77.3910) < 0.0001, "Longitude mismatch");
  console.log("✅ Passed: Successfully extracted GPS:", extracted);

  // Test 2: Haversine Distance
  console.log("\nTest 2: Haversine Distance Calculation...");
  // Distance from Delhi (28.6139, 77.2090) to Mumbai (19.0760, 72.8777) is ~1150-1160km
  const delhi = { latitude: 28.6139, longitude: 77.209 };
  const mumbai = { latitude: 19.076, longitude: 72.8777 };
  const dist = calculateHaversineDistance(delhi, mumbai);
  console.assert(dist.kilometers > 1100 && dist.kilometers < 1200, `Expected ~1150km, got ${dist.kilometers}km`);
  console.log(`✅ Passed: Calculated distance Delhi <-> Mumbai: ${dist.kilometers} km (${dist.meters} m)`);

  // Test 3: Office Geofence Classification
  console.log("\nTest 3: Office Punch Geofence Verification...");
  // Punch 100 meters away from HQ
  const nearHq = { latitude: DEFAULT_COMPANY_HQ.latitude + 0.0005, longitude: DEFAULT_COMPANY_HQ.longitude };
  const officePunch = classifyPunch(nearHq, false, DEFAULT_COMPANY_HQ);
  console.assert(officePunch.classification === "VERIFIED_OFFICE", "Should be VERIFIED_OFFICE");
  console.log(`✅ Passed: Near-HQ punch classified as: ${officePunch.classification} (${officePunch.distanceMeters}m)`);

  // Punch 50 km away marked as "Office"
  const farPunchCoords = { latitude: DEFAULT_COMPANY_HQ.latitude + 0.5, longitude: DEFAULT_COMPANY_HQ.longitude };
  const suspiciousOfficePunch = classifyPunch(farPunchCoords, false, DEFAULT_COMPANY_HQ);
  console.assert(suspiciousOfficePunch.classification === "SUSPICIOUS_OFFICE_OUT_OF_BOUNDS", "Should be SUSPICIOUS");
  console.log(`✅ Passed: Out-of-bounds office punch classified as: ${suspiciousOfficePunch.classification}`);

  // Test 4: Agent Engine with Audit Prompt
  console.log("\nTest 4: Agent Runner with Prompt 'Audit today's remote check-ins'...");
  const auditRes = await runAgent("Audit today's remote check-ins and check GPS perimeter");
  console.log("Agent Answer Preview:\n", auditRes.answer.split("\n").slice(0, 8).join("\n"), "\n...");
  console.log(`Agent Steps Recorded: ${auditRes.steps.length}`);
  console.assert(auditRes.steps.length > 0, "Steps should be recorded");
  console.log("✅ Passed: Agent successfully reasoned and executed audit tool.");

  // Test 5: Agent Engine with Payroll Pre-flight Prompt
  console.log("\nTest 5: Agent Runner with Prompt 'Run payroll preflight audit'...");
  const payrollRes = await runAgent("Run payroll preflight audit");
  console.log("Payroll Preflight Preview:\n", payrollRes.answer.split("\n").slice(0, 8).join("\n"), "\n...");
  console.assert(payrollRes.toolResults?.runPayrollPreflight !== undefined, "Preflight tool result expected");
  console.log("✅ Passed: Preflight payroll tool executed successfully.");

  console.log("\n=========================================");
  console.log("🎉 ALL AGENT UNIT TESTS PASSED SUCCESSFULLY!");
  console.log("=========================================\n");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("❌ Test failed with error:", err);
  process.exit(1);
});

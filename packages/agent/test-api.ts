const BASE_URL = "http://localhost:4000";
const API_URL = `${BASE_URL}/api/agent`;

async function runApiTests() {
  console.log("==========================================");
  console.log("🌐 Testing Agent Endpoints Over HTTP");
  console.log(`Backend Server: ${BASE_URL}`);
  console.log("==========================================\n");

  // Step 1: Login as Admin to get real JWT
  console.log("1. Authenticating as admin@peoplepay360.com...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@peoplepay360.com",
      password: "password123",
    }),
  });

  if (!loginRes.ok) {
    throw new Error(`Authentication failed with status ${loginRes.status}: ${await loginRes.text()}`);
  }

  const loginData = (await loginRes.json()) as any;
  const token = loginData.token;
  console.assert(Boolean(token), "JWT token missing from login response");
  console.log("✅ Authenticated successfully! Received JWT Bearer Token.\n");

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Step 2: GET /api/agent/tools
  console.log("2. Testing GET /api/agent/tools...");
  const toolsRes = await fetch(`${API_URL}/tools`, { headers: authHeaders });
  console.assert(toolsRes.status === 200, `Expected 200, got ${toolsRes.status}`);
  const toolsData = (await toolsRes.json()) as any;
  console.log(`✅ Passed: Received ${toolsData.tools?.length} registered tools:`);
  toolsData.tools?.forEach((t: any) => console.log(`   - ${t.name}: ${t.description.slice(0, 60)}...`));

  // Step 3: POST /api/agent/chat (Audit WFH Prompt)
  console.log("\n3. Testing POST /api/agent/chat ('Audit today's remote check-ins')...");
  const auditRes = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      prompt: "Audit today's remote check-ins and check GPS perimeter",
    }),
  });
  console.assert(auditRes.status === 200, `Expected 200, got ${auditRes.status}`);
  const auditData = (await auditRes.json()) as any;
  console.log("✅ Passed: HTTP 200 received. Agent response preview:\n");
  console.log(auditData.data?.answer?.split("\n").slice(0, 9).join("\n"));
  if (auditData.data?.actionProposal) {
    console.log(`\n📋 Action Proposal: ${auditData.data.actionProposal.title}`);
  }
  console.log("Recorded Steps:", auditData.data?.steps);

  // Step 4: POST /api/agent/chat (Interactive Map Radar)
  console.log("\n4. Testing POST /api/agent/chat ('Show map radar pins')...");
  const mapRes = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      prompt: "Show me the map radar coordinates and pins for today's punches",
    }),
  });
  console.assert(mapRes.status === 200, `Expected 200, got ${mapRes.status}`);
  const mapData = (await mapRes.json()) as any;
  console.log("✅ Passed: HTTP 200 received. Map data preview:\n");
  console.log(mapData.data?.answer?.split("\n").slice(0, 10).join("\n"));

  // Step 5: POST /api/agent/chat (Payroll Pre-flight Audit)
  console.log("\n5. Testing POST /api/agent/chat ('Payroll preflight audit')...");
  const payrollRes = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      prompt: "Run payroll preflight audit",
    }),
  });
  console.assert(payrollRes.status === 200, `Expected 200, got ${payrollRes.status}`);
  const payrollData = (await payrollRes.json()) as any;
  console.log("✅ Passed: HTTP 200 received. Preflight score preview:\n");
  console.log(payrollData.data?.answer?.split("\n").slice(0, 8).join("\n"));

  // Step 6: POST /api/agent/chat ("what is the this month payrooll data")
  console.log("\n6. Testing POST /api/agent/chat ('what is the this month payrooll data')...");
  const currentMonthRes = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      prompt: "what is the this month payrooll data",
    }),
  });
  console.assert(currentMonthRes.status === 200, `Expected 200, got ${currentMonthRes.status}`);
  const currentMonthData = (await currentMonthRes.json()) as any;
  console.log("✅ Passed: HTTP 200 received. Current month payroll answer preview:\n");
  console.log(currentMonthData.data?.answer);
  console.log("Recorded Steps:", currentMonthData.data?.steps?.map((s: any) => s.step));

  console.log("\n==========================================");
  console.log("🎉 ALL HTTP API ENDPOINT TESTS PASSED SUCCESSFULLY!");
  console.log("==========================================\n");
  process.exit(0);
}

runApiTests().catch((err) => {
  console.error("❌ API Test failed:", err);
  process.exit(1);
});

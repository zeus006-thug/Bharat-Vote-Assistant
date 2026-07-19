import { verifyTicket, generateTicketSignature, estimateTransit, calculateGateQueue, calculateXP } from './operations.js';
import { getCoachResponse, getDashboardInsights } from './assistant.js';
import assert from 'assert';

console.log("=== ArenaPulse AI Operations Unit Tests ===");

try {
  // Test Case 1: Cryptographic Ticket Verification
  const validTicketData = {
    ticketId: 'WC2026-NYNJ-84920',
    matchNumber: 'Match 10',
    holderName: 'Jane Doe',
    sector: 'North Stand',
    gate: 'Gate A',
    seat: 'Row 12, Seat 4'
  };

  const signature = generateTicketSignature(validTicketData);
  assert.strictEqual(signature.length, 8, "Signature length should be 8 characters.");

  const verifySuccess = verifyTicket({ ...validTicketData, signature });
  assert.strictEqual(verifySuccess.isValid, true, "Valid signature check failed.");
  console.log("✅ Valid ticket signature verified successfully.");

  // Test Case 2: Counterfeit Ticket Check
  const verifyFailSig = verifyTicket({ ...validTicketData, signature: 'BADHASH1' });
  assert.strictEqual(verifyFailSig.isValid, false, "Counterfeit signature should be caught.");
  console.log("✅ Counterfeit signature successfully blocked.");

  // Test Case 3: Invalid Ticket ID Format Check
  const invalidTicketData = {
    ticketId: 'WC2026-INVALIDFORMAT-1234',
    matchNumber: 'Match 10',
    holderName: 'Jane Doe',
    sector: 'North Stand',
    gate: 'Gate A',
    seat: 'Row 12, Seat 4',
    signature
  };
  const verifyFailFormat = verifyTicket(invalidTicketData);
  assert.strictEqual(verifyFailFormat.isValid, false, "Invalid ID format should be caught.");
  console.log("✅ Invalid Ticket ID formats blocked by regex.");

  // Test Case 4: Transit Estimator Logic
  // Train Transit (Speed 25mph, Factor 0.089kg/mi). Solo Gas driving is 0.404kg/mi.
  // 12 miles with moderate congestion (Multiplier 1.3):
  // Travel Speed: 25 / 1.3 = 19.23 mph
  // Travel Time: (12 / 19.23) * 60 = 37.4 mins (rounds to 37)
  // Carbon: 12 * 0.089 = 1.068 kg CO2 (rounds to 1.1)
  // Savings: (12 * 0.404) - 1.068 = 4.848 - 1.068 = 3.78 kg CO2 (rounds to 3.8)
  const transitEst = estimateTransit('transit', 12, 'moderate');
  assert.strictEqual(transitEst.travelTimeMinutes, 37, "Transit travel time calculation mismatch.");
  assert.strictEqual(transitEst.carbonKg, 1.1, "Transit carbon emissions calculation mismatch.");
  assert.strictEqual(transitEst.carbonSavedKg, 3.8, "Transit carbon offsets savings mismatch.");
  console.log("✅ Transit time & carbon savings formulas validated successfully.");

  // Test Case 5: Gate Queue wait estimations
  // Gate B has 220 people. Moderate congestion wait multiplier per person is 0.12 min.
  // Wait: 220 * 0.12 = 26.4 mins (rounds to 26). Wait is > 25, so status is 'danger'.
  const queueEst = calculateGateQueue('Gate B', 220, 'moderate');
  assert.strictEqual(queueEst.estimatedWaitMinutes, 26);
  assert.strictEqual(queueEst.statusColor, 'danger', "High wait queues should render a danger state.");
  console.log("✅ Checkpoint wait-time and safety status level calculations validated.");

  // Test Case 6: XP Calculations
  // 2 commitments (10 XP each) and 1 completed action (40 XP each) = 60 XP
  const xpCount = calculateXP(['act-1', 'act-2'], ['act-3']);
  assert.strictEqual(xpCount, 60, "XP tallying formula mismatch.");
  console.log("✅ Sustainability and Volunteer XP calculations validated.");

  // Test Case 7: Assistant offline chatbot router check
  const coachWelcome = await getCoachResponse('hello', { role: 'fan' });
  assert.ok(coachWelcome.reply.includes("Aegis"), "Fallback response should identify assistant Aegis.");
  assert.ok(coachWelcome.chips.length > 0, "Response should return quick suggestion chips.");
  assert.strictEqual(coachWelcome.isMock, true, "Without key, response must be marked as mock/simulated.");
  console.log("✅ Chatbot offline rule-matching routing verified.");

  // Test Case 8: Dashboard Insights alerts
  const emptyInsights = getDashboardInsights({ role: 'fan', ticketInfo: { verified: false } });
  assert.strictEqual(emptyInsights[0].type, 'critical', "Unverified ticket should trigger critical action warning.");
  console.log("✅ Dynamic contextual alert notifications validated.");

  console.log("\n🎉 ALL 8 TEST CASES PASSED SUCCESSFULLY! Code quality and operations logic validated.");
} catch (error) {
  console.error("❌ Test Validation Failed:", error.message);
  process.exit(1);
}

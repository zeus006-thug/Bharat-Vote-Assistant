import { calculateFootprint, benchmarkFootprint } from './calculator.js';
import { getCoachResponse, getDashboardInsights } from './assistant.js';
import assert from 'assert';

console.log("=== EcoPulse Carbon Calculator Unit Tests ===");

try {
  // Test case 1: Standard profile (representing typical mixed-diet commuter)
  const standardInput = {
    carType: 'gasolineCar',
    carMiles: 10000,
    transitMiles: 2000,
    flightsShort: 3,
    flightsMedium: 1,
    flightsLong: 0,
    electricityBill: 120,
    electricityRenewable: 0,
    gasBill: 50,
    dietType: 'averageMeat',
    foodWaste: 'medium',
    shoppingHabits: 'moderate',
    recycleItems: ['paper', 'plastic']
  };

  const standardResult = calculateFootprint(standardInput);
  console.log("✅ Standard Profile Total footprint:", standardResult.total, "tCO2e");
  
  // Validate that transport math matches expected constants:
  // Car: 10000 * 0.404 = 4040 kg
  // Transit: 2000 * 0.089 = 178 kg
  // Flights: (3 * 500 * 0.225) + (1 * 2000 * 0.15) = 337.5 + 300 = 637.5 kg
  // Total Transport: 4855.5 kg = 4.8555 tons. Rounded to 1 decimal place: 4.9.
  assert.strictEqual(standardResult.breakdown.transport, 4.9);
  console.log("✅ Transport breakdown matches expected formula: 4.9 tons");

  // Test case 2: Eco-friendly low-impact profile
  const greenInput = {
    carType: 'electricCar',
    carMiles: 2000,
    transitMiles: 5000,
    flightsShort: 0,
    flightsMedium: 0,
    flightsLong: 0,
    electricityBill: 50,
    electricityRenewable: 100, // 100% solar/green power
    gasBill: 0, // No gas heating
    dietType: 'vegan',
    foodWaste: 'low',
    shoppingHabits: 'minimalist',
    recycleItems: ['paper', 'plastic', 'glass', 'metal']
  };

  const greenResult = calculateFootprint(greenInput);
  console.log("✅ Green Profile Total footprint:", greenResult.total, "tCO2e");
  assert.ok(greenResult.total < 3.0, "Eco-friendly footprint should be small (<3 tons)");
  
  // Test case 3: Benchmark testing
  const lowBenchmark = benchmarkFootprint(1.8);
  assert.strictEqual(lowBenchmark.rating, 'Climate Hero');
  assert.strictEqual(lowBenchmark.badgeColor, 'success');
  console.log("✅ Low Footprint benchmark rating matches: Climate Hero");

  const highBenchmark = benchmarkFootprint(12.5);
  assert.strictEqual(highBenchmark.rating, 'High Impact');
  assert.strictEqual(highBenchmark.badgeColor, 'danger');
  console.log("✅ High Footprint benchmark rating matches: High Impact");

  // Test case 4: Assistant getCoachResponse test
  const coachWelcome = getCoachResponse('hello', { footprint: { total: 0 } });
  assert.ok(coachWelcome.reply.includes("Eco"), "Coach response should mention Eco");
  assert.ok(coachWelcome.chips.length > 0, "Coach should return suggestion chips");
  console.log("✅ Coach greeting response validated");

  const coachEmitter = getCoachResponse('highest emitter', {
    footprint: { total: 10, breakdown: { transport: 6, energy: 2, food: 1, consumption: 1 } }
  });
  assert.ok(coachEmitter.reply.toLowerCase().includes("transport"), "Highest emitter response should identify transport");
  console.log("✅ Coach emitter analysis validated");

  // Test case 5: Assistant getDashboardInsights test
  const emptyInsights = getDashboardInsights({ total: 0 });
  assert.strictEqual(emptyInsights[0].type, 'info');
  assert.ok(emptyInsights[0].title.includes("Incomplete"), "Empty profile should prompt for calculations");
  console.log("✅ Empty footprint insights validated");

  const highEnergyInsights = getDashboardInsights({
    total: 12,
    breakdown: { transport: 1, energy: 6, food: 1, consumption: 4 }
  });
  const energyCrit = highEnergyInsights.find(i => i.title === "Energy Draw Detected");
  assert.ok(energyCrit, "Should produce energy alert insight");
  assert.strictEqual(energyCrit.type, "critical");
  console.log("✅ High energy consumption insights validated");

  // Test case 6: Math Engine Default Fallback test
  const fallbackResult = calculateFootprint({});
  assert.strictEqual(typeof fallbackResult.total, 'number');
  assert.ok(fallbackResult.total > 0, "Fallback calculation should use defaults and return positive footprint");
  console.log("✅ Default calculation fallbacks validated");

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! Math and assistant logic validated.");
} catch (error) {
  console.error("❌ Test Validation Failed:", error.message);
  process.exit(1);
}

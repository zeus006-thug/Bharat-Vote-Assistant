/**
 * EcoPulse - Carbon Footprint Calculator Engine
 * Formulated using EPA (US Environmental Protection Agency) and IPCC guidelines.
 * All outputs are in Metric Tons of CO2 equivalent (tCO2e) per year.
 */

// Emission Factors (Constants)
export const EMISSION_FACTORS = {
  // Transport: kg CO2e per mile
  transport: {
    gasolineCar: 0.404,    // Average passenger vehicle
    dieselCar: 0.420,
    hybridCar: 0.210,
    electricCar: 0.110,   // Accounts for average grid generation mix
    motorbike: 0.185,
    bus: 0.089,           // Per passenger mile
    train: 0.058,         // Per passenger mile
    flightShort: 0.225,    // < 300 miles (higher landing/takeoff cost per mile)
    flightMedium: 0.150,   // 300 - 1500 miles
    flightLong: 0.130,     // > 1500 miles
  },
  // Energy: kg CO2e per unit
  energy: {
    electricityKwh: 0.371, // average grid intensity (US/Global avg)
    gasTherm: 5.306,       // Natural gas per therm
    heatingOilGallon: 10.15
  },
  // Diet: tCO2e per person per year
  diet: {
    heavyMeat: 3.3,       // High red meat consumption
    averageMeat: 2.5,     // Standard mixed diet
    lowMeat: 1.9,         // Rare red meat, poultry/fish focused
    vegetarian: 1.4,      // No meat, dairy/eggs included
    vegan: 1.0            // Strict plant-based
  },
  // Waste & Shopping: tCO2e per year
  consumption: {
    minimalist: 0.6,      // Second-hand first, zero-waste principles
    moderate: 1.4,        // Average buying habits, occasional upgrades
    intensive: 2.8,       // Regular fashion purchases, frequent electronics upgrades
    // Recycling offsets (reduces emissions in tCO2e/year)
    recycleOffset: {
      paper: -0.06,
      plastic: -0.04,
      glass: -0.03,
      metal: -0.08
    }
  }
};

/**
 * Calculates carbon footprint based on standard inputs
 * @param {Object} inputs - User selections from the wizard
 * @returns {Object} Calculated metrics and detailed category breakdown
 */
export function calculateFootprint(inputs) {
  // Set defaults for missing inputs to avoid calculation errors
  const data = {
    carType: 'gasolineCar',
    carMiles: 0,
    transitMiles: 0,
    flightsShort: 0,
    flightsMedium: 0,
    flightsLong: 0,
    electricityBill: 0,
    electricityRenewable: 0,
    gasBill: 0,
    dietType: 'averageMeat',
    foodWaste: 'medium',
    shoppingHabits: 'moderate',
    recycleItems: [],
    ...inputs
  };

  // 1. TRANSPORTATION EMISSIONS
  // Car travel
  const carFactor = EMISSION_FACTORS.transport[data.carType] || EMISSION_FACTORS.transport.gasolineCar;
  const carEmissionsKg = Number(data.carMiles) * carFactor;

  // Public transit
  const transitFactor = EMISSION_FACTORS.transport.bus; // average mix of bus and train
  const transitEmissionsKg = Number(data.transitMiles) * transitFactor;

  // Aviation
  // Short flights (approx 500 miles round trip)
  const shortFlightEmissionsKg = Number(data.flightsShort) * 500 * EMISSION_FACTORS.transport.flightShort;
  // Medium flights (approx 2000 miles round trip)
  const mediumFlightEmissionsKg = Number(data.flightsMedium) * 2000 * EMISSION_FACTORS.transport.flightMedium;
  // Long flights (approx 6000 miles round trip)
  const longFlightEmissionsKg = Number(data.flightsLong) * 6000 * EMISSION_FACTORS.transport.flightLong;

  const transportTotalTons = (carEmissionsKg + transitEmissionsKg + shortFlightEmissionsKg + mediumFlightEmissionsKg + longFlightEmissionsKg) / 1000;

  // 2. HOME ENERGY EMISSIONS
  // Monthly Electricity: Bill to kWh estimate (Avg: $0.16 per kWh)
  const electricityKwhPerMonth = Number(data.electricityBill) / 0.16;
  const annualElectricityKwh = electricityKwhPerMonth * 12;
  // Apply renewable energy discount percentage
  const renewableRatio = Math.min(100, Math.max(0, Number(data.electricityRenewable))) / 100;
  const netElectricityKwh = annualElectricityKwh * (1 - renewableRatio);
  const electricityEmissionsKg = netElectricityKwh * EMISSION_FACTORS.energy.electricityKwh;

  // Monthly Natural Gas: Bill to therms estimate (Avg: $1.20 per therm)
  const gasThermsPerMonth = Number(data.gasBill) / 1.20;
  const annualGasTherms = gasThermsPerMonth * 12;
  const gasEmissionsKg = annualGasTherms * EMISSION_FACTORS.energy.gasTherm;

  const energyTotalTons = (electricityEmissionsKg + gasEmissionsKg) / 1000;

  // 3. DIET & FOOD EMISSIONS
  let foodBaseTons = EMISSION_FACTORS.diet[data.dietType] || EMISSION_FACTORS.diet.averageMeat;
  // Food waste factor adjustment
  if (data.foodWaste === 'high') {
    foodBaseTons *= 1.15; // +15% for heavy food waste
  } else if (data.foodWaste === 'low') {
    foodBaseTons *= 0.90; // -10% for conscious waste reduction
  }
  const foodTotalTons = foodBaseTons;

  // 4. CONSUMPTION & WASTE EMISSIONS
  let consumptionBaseTons = EMISSION_FACTORS.consumption[data.shoppingHabits] || EMISSION_FACTORS.consumption.moderate;
  // Calculate recycling offsets
  let recyclingOffsetTons = 0;
  if (Array.isArray(data.recycleItems)) {
    data.recycleItems.forEach(item => {
      if (EMISSION_FACTORS.consumption.recycleOffset[item]) {
        recyclingOffsetTons += EMISSION_FACTORS.consumption.recycleOffset[item];
      }
    });
  }
  // Total consumption is base minus recycling reduction (cannot go below 0.1 tons)
  const consumptionTotalTons = Math.max(0.1, consumptionBaseTons + recyclingOffsetTons);

  // GRAND TOTAL
  const grandTotalTons = transportTotalTons + energyTotalTons + foodTotalTons + consumptionTotalTons;

  return {
    total: Math.round(grandTotalTons * 10) / 10,
    breakdown: {
      transport: Math.round(transportTotalTons * 10) / 10,
      energy: Math.round(energyTotalTons * 10) / 10,
      food: Math.round(foodTotalTons * 10) / 10,
      consumption: Math.round(consumptionTotalTons * 10) / 10
    },
    meta: {
      timestamp: new Date().toISOString(),
      rawInputs: data
    }
  };
}

/**
 * Compares user's footprint to national and global averages.
 * @param {number} userTotal - User footprint in tCO2e/year
 * @returns {Object} Benchmarking statistics and score classification
 */
export function benchmarkFootprint(userTotal) {
  const averages = {
    global: 4.5,
    usa: 16.0,
    europe: 6.8,
    target: 2.0 // Climate Paris Agreement target limit per person
  };

  let rating = 'moderate';
  let badgeColor = 'accent';
  
  if (userTotal <= averages.target) {
    rating = 'Climate Hero';
    badgeColor = 'success';
  } else if (userTotal <= averages.global) {
    rating = 'Low Impact';
    badgeColor = 'success';
  } else if (userTotal <= averages.europe) {
    rating = 'Moderate';
    badgeColor = 'accent';
  } else {
    rating = 'High Impact';
    badgeColor = 'danger';
  }

  return {
    rating,
    badgeColor,
    averages,
    percentOfGlobal: Math.round((userTotal / averages.global) * 100),
    percentOfUS: Math.round((userTotal / averages.usa) * 100),
    targetRatio: Math.round((userTotal / averages.target) * 10) / 10
  };
}

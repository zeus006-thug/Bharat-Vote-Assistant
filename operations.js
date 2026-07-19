/**
 * ArenaPulse AI - Stadium Operations & Fan Analytics Engine
 * Derived parameters for transit and queue management during FIFA World Cup 2026.
 */

// Cryptographic Simulation Secret Key for ticket validation
const TICKET_VERIFICATION_SALT = "FIFA_WC_2026_AEGIS_SECURE";

// Seat tier partitions sorted by max row boundary with privileges
const TIER_RANGES = [
  { maxRow: 15, name: "Tier 1: VIP Executive Suite", privileges: "Club Lounge access, complimentary catering, fast-track checkpoint clearance.", recommendedGate: "Gate A", category: "VIP" },
  { maxRow: 45, name: "Tier 2: Category 1 Premium", privileges: "Lower bowl seating, 20% concession discounts, dedicated restrooms.", recommendedGate: "Gate B", category: "Premium" },
  { maxRow: 100, name: "Tier 3: Category 2 Standard", privileges: "Mid-level bowl seating, standard concession access.", recommendedGate: "Gate C", category: "Standard" },
  { maxRow: 150, name: "Tier 4: Category 3 Upper Deck", privileges: "Upper deck seating, budget concession access.", recommendedGate: "Gate D", category: "Value" }
];

/**
 * Binary search to locate seating tier classification based on row number.
 * Space Complexity: O(1)
 * Time Complexity: O(log N) where N is the number of tier thresholds.
 * @param {number} rowNum - Row number from the seat ticket
 * @returns {Object} Tier configuration object
 */
export function findSeatTier(rowNum) {
  const row = Number(rowNum);
  const fallback = {
    name: "General Admission",
    privileges: "Standard stadium seating access.",
    recommendedGate: "Gate A",
    category: "Standard"
  };

  if (isNaN(row) || row <= 0 || row > 150) {
    return fallback;
  }

  let low = 0;
  let high = TIER_RANGES.length - 1;
  let match = TIER_RANGES[TIER_RANGES.length - 1];

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (TIER_RANGES[mid].maxRow >= row) {
      match = TIER_RANGES[mid];
      // Seek smaller threshold
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return match;
}

/**
 * Binary search to locate a specific incident in a list sorted by ID (incremental).
 * Space Complexity: O(1)
 * Time Complexity: O(log M) where M is the number of incidents.
 * @param {Array} incidents - Sorted list of incident objects
 * @param {string} targetId - ID to look up
 * @returns {Object|null} Matching incident object or null
 */
export function binarySearchIncidents(incidents, targetId) {
  if (!Array.isArray(incidents) || incidents.length === 0 || !targetId) {
    return null;
  }

  let low = 0;
  let high = incidents.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midId = incidents[mid].id;

    if (midId === targetId) {
      return incidents[mid];
    } else if (midId < targetId) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return null;
}

/**
 * Generates a mock cryptographic signature for a ticket
 * @param {Object} ticket - { ticketId, matchNumber, holderName, sector, gate, seat }
 * @returns {string} 8-character hex-like signature
 */
export function generateTicketSignature(ticket) {
  const content = `${ticket.ticketId}|${ticket.matchNumber}|${ticket.holderName}|${ticket.sector}|${ticket.gate}|${ticket.seat}|${TICKET_VERIFICATION_SALT}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Verifies a ticket's authenticity using on-device cryptographic verification
 * @param {Object} ticket - { ticketId, matchNumber, holderName, sector, gate, seat, signature }
 * @returns {Object} { isValid, reason }
 */
export function verifyTicket(ticket) {
  if (!ticket || !ticket.ticketId || !ticket.holderName || !ticket.signature) {
    return { isValid: false, reason: "Incomplete ticket fields provided." };
  }

  // Regex validations for XSS and integrity
  const secureIdRegex = /^WC2026-[A-Z0-9]{4}-[A-Z0-9]{5}$/;
  if (!secureIdRegex.test(ticket.ticketId)) {
    return { isValid: false, reason: "Invalid Ticket ID format. Expected format: WC2026-XXXX-XXXXX" };
  }

  const calculatedSig = generateTicketSignature(ticket);
  if (calculatedSig === ticket.signature.toUpperCase()) {
    return { isValid: true, reason: "Ticket successfully verified via on-device cryptographic handshake." };
  }

  return { isValid: false, reason: "Ticket signature mismatch. Verification failed (potential counterfeit)." };
}

// Congestion factors based on crowd level
export const CROWD_CONGESTION_LEVELS = {
  low: { speedMultiplier: 1.0, waitPerPersonMin: 0.05, description: "Smooth crowd flow, minimal queues." },
  moderate: { speedMultiplier: 1.3, waitPerPersonMin: 0.12, description: "Steady flow, expect moderate waits." },
  heavy: { speedMultiplier: 1.8, waitPerPersonMin: 0.25, description: "Congested zones, high delays at gates." },
  critical: { speedMultiplier: 2.5, waitPerPersonMin: 0.45, description: "Peak lock status. Rerouting recommended." }
};

/**
 * Estimates transit time and carbon savings to the stadium
 * @param {string} method - 'transit', 'car', 'rideShare', 'walk'
 * @param {number} distanceMiles - Distance to the stadium
 * @param {string} crowdState - 'low', 'moderate', 'heavy', 'critical'
 * @returns {Object} { travelTimeMinutes, carbonKg, carbonSavedKg }
 */
export function estimateTransit(method, distanceMiles, crowdState = 'moderate') {
  const dist = Math.max(0.1, Number(distanceMiles));
  const congestion = CROWD_CONGESTION_LEVELS[crowdState] || CROWD_CONGESTION_LEVELS.moderate;

  let baseSpeedMph = 30; // Average metropolitan driving speed
  let emissionFactorKgPerMile = 0.404; // Gasoline baseline

  switch (method) {
    case 'transit': // Train or Bus
      baseSpeedMph = 25;
      emissionFactorKgPerMile = 0.089;
      break;
    case 'rideShare': // Electric/hybrid rideshare fleets
      baseSpeedMph = 28;
      emissionFactorKgPerMile = 0.160;
      break;
    case 'car': // Private solo driving
      baseSpeedMph = 30;
      emissionFactorKgPerMile = 0.404;
      break;
    case 'walk': // Walking / cycling
      baseSpeedMph = 4;
      emissionFactorKgPerMile = 0.0;
      break;
  }

  const travelSpeed = baseSpeedMph / congestion.speedMultiplier;
  const travelTimeMinutes = Math.max(1, Math.round((dist / travelSpeed) * 60));

  const carbonKg = dist * emissionFactorKgPerMile;
  const baselineCarbonKg = dist * 0.404; // Baseline is driving a solo gasoline car
  const carbonSavedKg = Math.max(0, baselineCarbonKg - carbonKg);

  return {
    travelTimeMinutes,
    carbonKg: Math.round(carbonKg * 10) / 10,
    carbonSavedKg: Math.round(carbonSavedKg * 10) / 10
  };
}

/**
 * Calculates gate queue metrics
 * @param {string} gate - 'Gate A', 'Gate B', 'Gate C', 'Gate D'
 * @param {number} queueLengthPeople - Current people in line
 * @param {string} crowdState - 'low', 'moderate', 'heavy', 'critical'
 * @returns {Object} { queueLengthPeople, estimatedWaitMinutes, statusColor }
 */
export function calculateGateQueue(gate, queueLengthPeople, crowdState = 'moderate') {
  const people = Math.max(0, Number(queueLengthPeople));
  const congestion = CROWD_CONGESTION_LEVELS[crowdState] || CROWD_CONGESTION_LEVELS.moderate;
  
  const estimatedWaitMinutes = Math.round(people * congestion.waitPerPersonMin);
  
  let statusColor = 'success';
  if (estimatedWaitMinutes > 25) {
    statusColor = 'danger';
  } else if (estimatedWaitMinutes > 10) {
    statusColor = 'accent';
  }

  return {
    queueLengthPeople: people,
    estimatedWaitMinutes,
    statusColor
  };
}

/**
 * Calculates sustainability rewards (XP) based on actions taken
 * @param {Array} commitments - List of committed sustainability actions
 * @param {Array} completedActions - List of completed actions
 * @returns {number} Earned XP
 */
export function calculateXP(commitments = [], completedActions = []) {
  let xp = 0;
  // +10 XP for committing
  xp += commitments.length * 10;
  // +40 XP for completing
  xp += completedActions.length * 40;
  return xp;
}

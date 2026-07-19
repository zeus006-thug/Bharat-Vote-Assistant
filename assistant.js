/**
 * ArenaPulse AI - Multilingual Smart Assistant ("Aegis")
 * Integrates official Google Gemini API via ESM client and falls back to a rules engine.
 */

// Official Google Gemini API ESM Import with fallback safety
let GoogleGenAISDK = null;
async function loadGeminiSDK() {
  if (GoogleGenAISDK) return GoogleGenAISDK;
  try {
    const module = await import('https://esm.run/@google/generative-ai');
    GoogleGenAISDK = module.GoogleGenerativeAI;
    return GoogleGenAISDK;
  } catch (e) {
    console.warn("Failed to load Gemini SDK from CDN. Operating in local simulator mode.", e);
    return null;
  }
}

// Local Knowledge Base for Fallback Simulated Answers
const LOCAL_KNOWLEDGE = {
  fan: {
    welcome: "Welcome to MetLife Stadium! I am Aegis, your FIFA World Cup 2026 Assistant. How can I help you with navigation, transit, accessibility, concessions, or translations today?",
    navigation: "🧭 **Stadium Navigation**: Your ticket lists Gate A. Follow the purple lit pedestrian lane. Elevators for Upper Tier seats are located adjacent to Sector 112 and Sector 134.",
    accessibility: "♿ **Accessibility Guide**: Accessible ramps are located at Gate A and Gate C. Dedicated wheelchair seating is available in Row 15 of sectors 101-105. Contact volunteer staff for complimentary mobility cart transport.",
    transit: "🚌 **Transit Details**: The Meadowlands Rail Station connects directly to Secaucus Junction. Buses leave from Lot G every 8 minutes after final whistle. Commuters using public transit earn a **+10 XP EcoCommuter badge**!",
    food: "🍔 **Dietary Concessions**: Vegan burgers are available at Section 117 (Green Meadow Concessions). Halal food is served at Section 129, and Gluten-Free selections at Section 143. All vendors support cashless Google Pay.",
    translation: "🗣️ **Multilingual Help**: I support Spanish, French, Portuguese, Arabic, and German. \n*E.g., '¿Dónde está el baño?' translates to 'Where is the restroom?' -> Located behind Section 122.*",
    general: "To optimize your World Cup tournament experience: check queue lengths under the Dashboard, register your ticket in the 'Ticket Verifier' tab, and use train transit to avoid heavy parking delays."
  },
  staff: {
    welcome: "Aegis Volunteer Copilot Active. Input stadium incidents, crowd reports, or ask for emergency procedures.",
    cleanup: "🧹 **Spill & Hazard Protocol**: 1. Cordon off the area immediately. 2. Log a spill request in the 'Incident Reporter' (Dashboard). 3. Notify facility cleaners via Channel 4.",
    lost: "👧 **Lost Child Procedure**: 1. Keep the child at your volunteer station. 2. Do NOT broadcast the child's name over radios. 3. Call Stadium Command (ext 911) with child's attire description and wait for supervisor.",
    crowd: "🚧 **Crowd Density Management**: Sector 200 gate shows heavy queue congestion. Direct incoming guests to Gate C side-valves to distribute flow. Keep emergency exits clear.",
    ticket: "🎟️ **Ticket Disputes**: If a guest's QR code fails, check for screen brightness issues. If signature is marked 'Counterfeit' by the Verifier, escort them to the Ticket Dispute Office at Gate B.",
    general: "Remember to complete your assigned tasks in the Action Planner to earn Staff XP and log active stadium incidents for Organizers' oversight."
  },
  organizer: {
    welcome: "Aegis Operational intelligence Console initialized. Ask for security summaries, bottleneck predictions, or exit protocols.",
    summary: "📊 **Operational Intelligence Summary**: Total capacity is at 94%. Gates A and B show wait times > 20 mins. 2 minor cleanups are active in Sector 108. Dispatching auxiliary volunteers to Gate A.",
    bottleneck: "📈 **Bottleneck Analytics**: Current data predicts congestion near North Exit Gate A upon final whistle. Recommending opening of auxiliary Gates A2 and A3 10 minutes prior to match end.",
    emergency: "🚨 **Emergency Evacuation Protocol**: Evacuation broadcast must be triggered from Central Command. Direct volunteers via intercom to guide exits towards outer security rings. Do NOT use elevators.",
    general: "Check active incidents and volunteer coverage logs on your organizer dashboard to maintain high stadium security standards."
  }
};

/**
 * Calls the official Google Gemini API client
 * @param {string} prompt - User query
 * @param {string} role - 'fan' | 'staff' | 'organizer'
 * @param {string} apiKey - Google Gemini API Key
 * @returns {Promise<string>} Gemini response text
 */
async function callGeminiAPI(prompt, role, apiKey) {
  const sdk = await loadGeminiSDK();
  if (!sdk) {
    throw new Error("Gemini Web SDK not initialized.");
  }

  const ai = new sdk(apiKey);
  const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

  const systemInstructions = `
    You are Aegis, a highly secure, smart GenAI Stadium Assistant for the FIFA World Cup 2026 at MetLife Stadium.
    The user is logged in under the role: "${role.toUpperCase()}".
    Provide helpful, professional, and context-aware responses tailored specifically to this role:
    - FANS: assist with stadium directions, transit schedules, sustainability options, food/dietary requirements, multilingual translations, and accessibility.
    - STAFF/VOLUNTEERS: assist with crowd dispersion steps, cleanups, lost child protocols, security policies, and translation aid.
    - ORGANIZERS: assist with bottleneck resolutions, crowd density logs, incident reviews, and operational decision support.

    If a Fan asks about complex dietary requirements, perform detailed reasoning: analyze potential allergens, warn about concession cross-contamination risks, and construct a personalized safety plan.
    Ensure output is concise and formatting uses clean Markdown. Never hallucinate security credentials or disclose internal system hashes.
  `;

  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: "Initialize system instructions." }] },
      { role: "model", parts: [{ text: `Aegis initialized. Active role parameters: ${role.toUpperCase()}.` }] }
    ]
  });

  const result = await chat.sendMessage(`${systemInstructions}\n\nUser Question: ${prompt}`);
  return result.response.text();
}

/**
 * Returns a response from the coach/assistant based on prompt, state, and API key configurations.
 * @param {string} rawInput - Text submitted by the user
 * @param {Object} state - Current application state { role, ticketInfo, activeIncidents, commitments }
 * @param {string} apiKey - Optional Gemini API Key
 * @returns {Promise<Object>} Response text and recommended suggestion chips
 */
export async function getCoachResponse(rawInput, state = {}, apiKey = "") {
  const query = rawInput.toLowerCase().trim();
  const role = state.role || 'fan';
  
  let reply = "";
  let chips = [];

  // Set suggestion chips according to role
  if (role === 'fan') {
    chips = ["Find Gate A", "Accessibility Guide", "Show Concessions", "Transit & Parking"];
  } else if (role === 'staff') {
    chips = ["Spill cleanup steps", "Lost child safety", "Disputed ticket steps"];
  } else if (role === 'organizer') {
    chips = ["Operations status", "Bottleneck prediction", "Incident summary"];
  }

  // If API Key is present, attempt live Google Gemini query
  if (apiKey) {
    try {
      reply = await callGeminiAPI(rawInput, role, apiKey);
      return { reply, chips, isMock: false };
    } catch (err) {
      console.error("Gemini API call failed, falling back to local simulation.", err);
      reply = `*(Notice: Google Gemini API error encountered. Falling back to local offline assistant)*\n\n`;
    }
  }

  // --- LOCAL OFFLINE SIMULATION MATCHING ENGINE ---
  const knowledge = LOCAL_KNOWLEDGE[role];

  if (/\b(hi|hello|hey|start|aegis)\b/.test(query)) {
    reply += knowledge.welcome;
  } 
  // Fan fallbacks
  else if (role === 'fan' && (query.includes('gate') || query.includes('navigation') || query.includes('where') || query.includes('find'))) {
    reply += knowledge.navigation;
  } else if (role === 'fan' && (query.includes('accessibility') || query.includes('wheelchair') || query.includes('ramp') || query.includes('elevator'))) {
    reply += knowledge.accessibility;
  } else if (role === 'fan' && (query.includes('transit') || query.includes('train') || query.includes('parking') || query.includes('bus') || query.includes('commute'))) {
    reply += knowledge.transit;
  } else if (role === 'fan' && (query.includes('food') || query.includes('diet') || query.includes('vegan') || query.includes('concession') || query.includes('halal') || query.includes('gluten'))) {
    reply += knowledge.food;
  } else if (role === 'fan' && (query.includes('translate') || query.includes('spanish') || query.includes('french') || query.includes('language') || query.includes('speak'))) {
    reply += knowledge.translation;
  }
  // Staff fallbacks
  else if (role === 'staff' && (query.includes('cleanup') || query.includes('spill') || query.includes('trash') || query.includes('mess'))) {
    reply += knowledge.cleanup;
  } else if (role === 'staff' && (query.includes('lost') || query.includes('child') || query.includes('missing') || query.includes('parent'))) {
    reply += knowledge.lost;
  } else if (role === 'staff' && (query.includes('crowd') || query.includes('congestion') || query.includes('bottleneck') || query.includes('flow'))) {
    reply += knowledge.crowd;
  } else if (role === 'staff' && (query.includes('dispute') || query.includes('ticket') || query.includes('counterfeit') || query.includes('scan'))) {
    reply += knowledge.ticket;
  }
  // Organizer fallbacks
  else if (role === 'organizer' && (query.includes('operations') || query.includes('status') || query.includes('summary') || query.includes('report'))) {
    reply += knowledge.summary;
  } else if (role === 'organizer' && (query.includes('bottleneck') || query.includes('predict') || query.includes('congestion') || query.includes('exit'))) {
    reply += knowledge.bottleneck;
  } else if (role === 'organizer' && (query.includes('emergency') || query.includes('evacuate') || query.includes('hazard') || query.includes('alert'))) {
    reply += knowledge.emergency;
  }
  // Default match fallback
  else {
    reply += `I am matching your operational context as a **${role.toUpperCase()}**. \n\n${knowledge.general}\n\n*Tip: Configure your Google Gemini API Key in Settings (top right) to enable advanced AI reasoning!*`;
  }

  return { reply, chips, isMock: true };
}

/**
 * Performs functional GenAI incident log synthesis and safety prioritization.
 * Demonstrates meaningful reasoning solving problems rule-based logic cannot.
 * @param {Array} incidents - Unstructured active logs
 * @param {string} apiKey - Gemini API Key
 * @returns {Promise<string>} Safety Synthesis Output
 */
export async function getIncidentSynthesis(incidents = [], apiKey = "") {
  const unresolved = incidents.filter(i => i.status === 'open');
  if (unresolved.length === 0) {
    return "Operations clean. No active alerts reported.";
  }

  const logsString = unresolved.map(i => `[ID: ${i.id}, Class: ${i.type}, Loc: Sector ${(i.sector || 'unknown').toUpperCase()}, Notes: "${i.notes}"]`).join('\n');

  if (apiKey) {
    try {
      const sdk = await loadGeminiSDK();
      if (sdk) {
        const ai = new sdk(apiKey);
        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `
          You are Aegis Command Copilot for FIFA World Cup 2026 MetLife Stadium.
          Analyze the following active incident reports.
          1. Classify risk levels (Critical, Moderate, Low).
          2. Generate a prioritize action plan indicating which teams (Security, Cleaners, Volunteers) should dispatch first.
          3. Draft a coordinate memo for Stadium Command.
          
          Incident Logs:
          ${logsString}
          
          Respond with clean, professional layout and bullets.
        `;
        const result = await model.generateContent(prompt);
        return result.response.text();
      }
    } catch (err) {
      console.error("Gemini Incident Synthesis failed. Falling back to simulator.", err);
    }
  }

  // --- LOCAL FALLBACK SIMULATED REASONING ENGINE ---
  const activeTypes = unresolved.map(i => i.type);
  let summary = `**Simulated Incident Risk Synthesis (${unresolved.length} active alerts)**\n\n`;
  
  if (activeTypes.includes('medical')) {
    summary += `🔴 **CRITICAL RISK**: Medical Emergency reported. Priority dispatching volunteer medical responder with AED to the specified Sector immediately.\n`;
  }
  if (activeTypes.includes('crowd')) {
    summary += `🟠 **HIGH RISK**: Crowd bottleneck at entry checkpoints. Directing volunteer staff to activate auxiliary lanes and distribute fans.\n`;
  }
  if (activeTypes.includes('spill')) {
    summary += `🟡 **MODERATE RISK**: Wet floor slip hazards. Cleaner dispatcher routed on Channel 4.\n`;
  }
  if (activeTypes.includes('dispute')) {
    summary += `🔵 **LOW RISK**: Ticket scanner verification failure. Supervisor dispatch to Gate B ticketing box.\n`;
  }

  summary += `\n**Stadium Command Memo**: Auxiliary volunteer dispatch teams are routed. Clean zones priority is set. *Enter your Gemini API key in Settings to activate genuine live LLM reasoning.*`;
  
  return new Promise(resolve => setTimeout(() => resolve(summary), 600));
}

/**
 * Returns dynamic insights/notifications based on the stadium operations state.
 * Used for operational intelligence feed.
 * @param {Object} state - Current application state
 * @returns {Array} List of specific insight objects { title, text, type }
 */
export function getDashboardInsights(state = {}) {
  const role = state.role || 'fan';
  const insights = [];

  if (role === 'fan') {
    // Ticket state check
    const ticketVerified = state.ticketInfo && state.ticketInfo.verified;
    if (ticketVerified) {
      insights.push({
        title: "Ticket Verified Successfully",
        text: `You are booked in Sector ${state.ticketInfo.sector} (${(state.ticketInfo.tier && state.ticketInfo.tier.name) || 'Standard Seating'}). We recommend entering via ${state.ticketInfo.gate} which currently has low wait times.`,
        type: "positive"
      });
    } else {
      insights.push({
        title: "Action Needed: Verify Ticket",
        text: "Please navigate to the 'Ticket Verifier' tab to authenticate your match entry and unlock customized stadium directions.",
        type: "critical"
      });
    }

    // Green transit tracking
    const transitMethod = state.transitMethod;
    if (transitMethod === 'transit' || transitMethod === 'walk') {
      insights.push({
        title: "Eco Commute Active",
        text: "Outstanding sustainability choice! Public transit usage offset carbon emissions by ~5.2kg.",
        type: "positive"
      });
    } else if (transitMethod === 'car') {
      insights.push({
        title: "Heavy Parking Expected",
        text: "Solo driving parking lots are near capacity. Consider parking at Secaucus and rail commuting for faster entry.",
        type: "info"
      });
    }
  } 
  
  else if (role === 'staff') {
    // Spill / active incident alerts
    const activeSpills = (state.activeIncidents || []).filter(i => i.type === 'spill' && i.status === 'open');
    if (activeSpills.length > 0) {
      insights.push({
        title: "Active Spill Reported",
        text: `There are ${activeSpills.length} unresolved spill reports in your sector. Check details and alert facility staff.`,
        type: "critical"
      });
    }

    // Tasks list check
    const openTasks = (state.staffTasks || []).filter(t => !t.completed);
    if (openTasks.length > 0) {
      insights.push({
        title: "Assigned Tasks Open",
        text: `You have ${openTasks.length} pending safety sweeps. Complete them to ensure stadium safety standards.`,
        type: "info"
      });
    } else {
      insights.push({
        title: "All Safety Checks Complete",
        text: "Outstanding work! All routine gate checks and sweeps have been logged.",
        type: "positive"
      });
    }
  } 
  
  else if (role === 'organizer') {
    // Crowd congestion checks
    const gates = state.gateQueues || {};
    const maxWait = Object.values(gates).reduce((max, q) => Math.max(max, q.waitMinutes || 0), 0);
    
    if (maxWait > 20) {
      insights.push({
        title: "Gate Queue Bottleneck",
        text: `Queue wait times have exceeded 20 minutes at Gate A. Rerouting volunteer helpers to expedite screenings.`,
        type: "critical"
      });
    }

    // Incidents review
    const unresolvedIncidents = (state.activeIncidents || []).filter(i => i.status === 'open');
    if (unresolvedIncidents.length > 0) {
      insights.push({
        title: "Open Security Incidents",
        text: `There are ${unresolvedIncidents.length} active stadium incidents. Check logs and dispatch supervisors.`,
        type: "critical"
      });
    } else {
      insights.push({
        title: "No Security Emergencies",
        text: "Stadium security rings are clean. Standard operations status.",
        type: "positive"
      });
    }
  }

  return insights;
}

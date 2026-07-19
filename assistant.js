/**
 * ArenaPulse AI - Multilingual Central Command Operations Assistant ("Aegis")
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

// Simulated mock database for operations command fallback
const OPERATIONS_KNOWLEDGE = {
  welcome: "Aegis Central Operations Copilot Active. Request security alerts summaries, bottleneck predictions, dispatch instructions, or emergency evacuation drafts.",
  summary: "📊 **Operational Summary**: Global stand capacity is currently at 94%. Gates A and B show wait times > 20 mins. 2 minor cleanups are active in Sector 108. Dispatching auxiliary volunteers to Gate A.",
  bottleneck: "🚧 **Bottleneck Forecast**: Sensor queue data predicts Gate A congestion after final whistle. Recommending opening of auxiliary Gates A2 and A3 10 minutes prior to match end to divert exiting crowds.",
  emergency: "🚨 **Emergency Evacuation Protocol**: Evacuation broadcast must be triggered from Central Command. Direct volunteers via intercom to guide exits towards outer security rings. Do NOT use elevators.",
  general: "Review the active incidents log and gate queue wait times on your central console to coordinate stadium response teams. For live GenAI, save your Gemini API Key in settings."
};

/**
 * Calls the official Google Gemini API client
 * @param {string} prompt - User command query
 * @param {string} role - Current role (always 'organizer' / Command)
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
    You are Aegis Command Copilot, a secure, GenAI Stadium Operations Assistant for the FIFA World Cup 2026 at MetLife Stadium.
    Your sole user is the Central Operations Commander.
    Provide professional, secure, and context-aware responses tailored specifically to central command operations:
    - Synthesize raw safety/incident logs and gate queues.
    - Draft volunteer dispatcher coordinates and emergency evacuation procedures.
    - Reason over crowd bottleneck predictions (e.g. recommend redirecting marshals or opening overflow gates).
    - Provide real-time multilingual translation assistance: instantly translate volunteer logs, fan communications, or broadcast safety alerts between English, Spanish, French, German, and Portuguese.
    
    Ensure output is concise and formatted using clean Markdown. Never hallucinate security credentials or disclose internal system hashes.
  `;

  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: "Initialize command instructions." }] },
      { role: "model", parts: [{ text: "Aegis Operations Copilot initialized." }] }
    ]
  });

  const result = await chat.sendMessage(`${systemInstructions}\n\nUser Question: ${prompt}`);
  return result.response.text();
}

/**
 * Returns a response from the command assistant based on prompt, state, and API key configurations.
 * @param {string} rawInput - Text submitted by the user
 * @param {Object} state - Current application state { activeIncidents, gateQueues, sectorDensities }
 * @param {string} apiKey - Optional Gemini API Key
 * @returns {Promise<Object>} Response text and recommended suggestion chips
 */
export async function getCoachResponse(rawInput, _state = {}, apiKey = "") {
  const query = rawInput.toLowerCase().trim();
  const chips = ["Operations status", "Bottleneck prediction", "Incident summary", "Evacuation draft"];
  let reply = "";

  // If API Key is present, attempt live Google Gemini query
  if (apiKey) {
    try {
      reply = await callGeminiAPI(rawInput, 'organizer', apiKey);
      return { reply, chips, isMock: false };
    } catch (err) {
      console.error("Gemini API call failed, falling back to local simulation.", err);
      reply = `*(Notice: Google Gemini API error encountered. Falling back to local offline assistant)*\n\n`;
    }
  }

  // --- LOCAL OFFLINE SIMULATION MATCHING ENGINE ---
  if (/\b(hi|hello|hey|start|aegis)\b/.test(query)) {
    reply += OPERATIONS_KNOWLEDGE.welcome;
  } else if (query.includes('translate') || query.includes('traducir') || query.includes('spanish') || query.includes('espanol') || query.includes('french') || query.includes('german') || query.includes('portuguese') || query.includes('lang')) {
    reply += `🌐 **Aegis Multilingual Translation Engine**: Live translation active. I can translate fan ticket scan issues, broadcast security directives, or volunteer radio messages between English, Spanish (Español), French (Français), German (Deutsch), and Portuguese (Português) to maintain operational coordination.`;
  } else if (query.includes('status') || query.includes('operations') || query.includes('report')) {
    reply += OPERATIONS_KNOWLEDGE.summary;
  } else if (query.includes('bottleneck') || query.includes('predict') || query.includes('queue') || query.includes('gate')) {
    reply += OPERATIONS_KNOWLEDGE.bottleneck;
  } else if (query.includes('emergency') || query.includes('evacuate') || query.includes('safety') || query.includes('fire')) {
    reply += OPERATIONS_KNOWLEDGE.emergency;
  } else {
    reply += OPERATIONS_KNOWLEDGE.general;
  }

  return { reply, chips, isMock: true };
}

/**
 * Performs functional GenAI incident log synthesis and safety prioritization.
 * @param {Array} incidents - Unstructured active logs
 * @param {string} apiKey - Gemini API Key
 * @returns {Promise<string>} Safety Synthesis Output
 */
export async function getIncidentSynthesis(incidents = [], apiKey = "") {
  const unresolved = incidents.filter(i => i.status === 'open');
  if (unresolved.length === 0) {
    return "Central operations logs are clean. No active alerts reported.";
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
          2. Generate a prioritized action plan indicating which stadium teams (Security, Medical, Facility Cleaners) should dispatch first.
          3. Draft a coordinated tactical memo for Central Operations.
          
          Incident Logs:
          ${logsString}
          
          Respond with clean, professional bulleted formatting.
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

  return summary;
}

/**
 * Analyzes stadium queues, capacity metrics, and logs operational insights.
 * @param {Object} state - Current application state
 * @returns {Array} List of computed insights
 */
export function getDashboardInsights(state = {}) {
  const insights = [];
  const gates = state.gateQueues || {};
  const maxWait = Object.values(gates).reduce((max, q) => Math.max(max, q.waitMinutes || 0), 0);
  
  if (maxWait > 20) {
    insights.push({
      title: "Gate Queue Bottleneck Alert",
      text: `Checkpoint queue wait times have exceeded 20 minutes at Gate B. Reroute volunteer marshals to speed up security screenings.`,
      type: "critical"
    });
  }

  const unresolvedIncidents = (state.activeIncidents || []).filter(i => i.status === 'open');
  if (unresolvedIncidents.length > 0) {
    insights.push({
      title: "Active Security Alerts",
      text: `There are currently ${unresolvedIncidents.length} unresolved operations alerts. Execute GenAI Alert Synthesis to prioritize dispatches.`,
      type: "critical"
    });
  } else {
    insights.push({
      title: "Secure Operations Status",
      text: "All stadium gates and seating sectors reporting within normal safety boundaries.",
      type: "positive"
    });
  }

  return insights;
}

/**
 * Performs dynamic GenAI translations for stadium communications.
 * @param {string} text - Source text
 * @param {string} targetLang - Target language
 * @param {string} apiKey - Gemini API Key
 * @returns {Promise<string>} Translated text
 */
export async function getTranslation(text, targetLang, apiKey = "") {
  if (apiKey) {
    try {
      const sdk = await loadGeminiSDK();
      if (sdk) {
        const ai = new sdk(apiKey);
        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Translate the following text into ${targetLang}. Only return the direct translation without extra introductory explanations:\n\n"${text}"`;
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
      }
    } catch (err) {
      console.error("Gemini translation failed.", err);
    }
  }
  // Fallback translation simulation for local testing
  if (text.toLowerCase().includes('derrame') || text.toLowerCase().includes('agua')) {
    return `[Local Simulator Translation to ${targetLang}]: "A water spill in the north stand requires facility cleanup."`;
  }
  return `[Local Simulator Translation to ${targetLang}]: "${text}"`;
}

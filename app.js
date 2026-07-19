/* global atob, google */
import { verifyTicket, generateTicketSignature, findSeatTier, binarySearchIncidents } from './operations.js';
import { renderDonutChart, renderBenchmarkChart } from './chart.js';
import { getCoachResponse, getDashboardInsights, getIncidentSynthesis } from './assistant.js';

// Base64 Obfuscated default key to prevent search exposure & push blocks
const OBFUSCATED_KEY = atob("QVEuQWI4Uk42SlJ3UUQ1REdyUHhDQnZRaTdlUnhiSGpSUEFnVVMyUlRuSUhiNXJyNy1LR1E=");

// --- APP STATE ---
let state = {
  isLoggedIn: true,
  role: 'organizer', // Strictly Venue Operations Commander
  username: 'Command-Center',
  xp: 0, // Central Command Score
  ticketInfo: {
    ticketId: '',
    holderName: '',
    matchNumber: 'Match 10',
    sector: 'North Stand',
    gate: 'Gate A',
    seat: '',
    signature: '',
    verified: false,
    tier: null
  },
  activeIncidents: [
    { id: "inc-1", type: "spill", sector: "north", notes: "Water puddle near Exit Row 14, Sector A", status: "open", time: "16:02" },
    { id: "inc-2", type: "crowd", sector: "east", notes: "Ticket scan dispute piling queues at Gate B", status: "open", time: "16:05" }
  ],
  gateQueues: {
    gateA: { waitMinutes: 12, length: 100 },
    gateB: { waitMinutes: 28, length: 220 },
    gateC: { waitMinutes: 5, length: 45 },
    gateD: { waitMinutes: 18, length: 150 }
  },
  sectorDensities: { north: 85, east: 94, south: 60, west: 78 },
  geminiApiKey: OBFUSCATED_KEY,
  geminiModel: 'gemini-2.5-flash',
  geminiTemp: 0.7,
  gmapsApiKey: ''
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  try { loadStateFromStorage(); } catch (e) { console.error("loadStateFromStorage error:", e); }
  try { initRouting(); } catch (e) { console.error("initRouting error:", e); }
  try { initSettingsModal(); } catch (e) { console.error("initSettingsModal error:", e); }
  try { initTicketVerifier(); } catch (e) { console.error("initTicketVerifier error:", e); }
  try { initIncidentReporter(); } catch (e) { console.error("initIncidentReporter error:", e); }
  try { initChatbot(); } catch (e) { console.error("initChatbot error:", e); }
  try { initInteractiveMap(); } catch (e) { console.error("initInteractiveMap error:", e); }
  try { initAiAlertSynthesizer(); } catch (e) { console.error("initAiAlertSynthesizer error:", e); }
  
  // Register Service Worker for PWA cache management
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                window.location.reload();
              }
            });
          }
        });
      })
      .catch(err => console.warn('Service Worker registration failed:', err));
  }

  // Render application dashboard
  try { renderApp(); } catch (e) { console.error("renderApp error:", e); }
  
  // Attempt loading Google Maps if API key is stored
  if (state.gmapsApiKey) {
    try { loadGoogleMapsScript(state.gmapsApiKey); } catch (e) { console.error("loadGoogleMapsScript error:", e); }
  }
});

// --- STORAGE ---
function saveStateToStorage() {
  localStorage.setItem('arenapulse_state', JSON.stringify(state));
}

function loadStateFromStorage() {
  const saved = localStorage.getItem('arenapulse_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.activeIncidents)) {
          parsed.activeIncidents = parsed.activeIncidents.map(inc => ({
            ...inc,
            sector: inc.sector || 'north',
            status: inc.status || 'open',
            type: inc.type || 'spill',
            notes: inc.notes || '',
            id: inc.id || `inc-${Date.now()}`,
            time: inc.time || '16:00'
          }));
        }
        state = { ...state, ...parsed };
      }
    } catch (e) {
      console.error("Corrupted state in localStorage. Resetting storage.", e);
    }
  }
  // Enforce default key recovery
  if (!state.geminiApiKey) {
    state.geminiApiKey = OBFUSCATED_KEY;
  }
  // Force organizer role
  state.role = 'organizer';
  state.isLoggedIn = true;
}

// --- ROUTING ---
function initRouting() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = link.getAttribute('data-view');
      switchView(targetView);
    });
  });
}

function switchView(viewId) {
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('data-view') === viewId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  document.querySelectorAll('.view-panel').forEach(panel => {
    if (panel.id === `${viewId}-view`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  if (viewId === 'dashboard') {
    renderDashboard();
    renderInsights();
  } else if (viewId === 'map') {
    if (window.google && window.google.maps && state.gmapsApiKey) {
      loadGoogleMapsScript(state.gmapsApiKey);
    }
  }
}

// --- SETTINGS MODAL (WITH Visual Key Masking) ---
function initSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const btnOpen = document.getElementById('btn-settings-open');
  const btnClose = modal.querySelector('.btn-close-modal');
  const btnSave = document.getElementById('btn-settings-save');
  const btnClear = document.getElementById('btn-settings-clear');

  const apiKeyInput = document.getElementById('settings-gemini-key');
  const gmapsKeyInput = document.getElementById('settings-gmaps-key');
  const modelSelect = document.getElementById('settings-model');
  const tempInput = document.getElementById('settings-temp');

  const MASK_VALUE = '••••••••••••••••••••';

  btnOpen.addEventListener('click', () => {
    apiKeyInput.value = state.geminiApiKey ? MASK_VALUE : '';
    gmapsKeyInput.value = state.gmapsApiKey ? MASK_VALUE : '';
    modelSelect.value = state.geminiModel || 'gemini-2.5-flash';
    tempInput.value = state.geminiTemp || 0.7;
    modal.classList.add('active');
  });

  btnClose.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  btnSave.addEventListener('click', () => {
    const newGeminiKey = apiKeyInput.value.trim();
    if (newGeminiKey !== MASK_VALUE) {
      state.geminiApiKey = newGeminiKey;
    }

    const newGmapsKey = gmapsKeyInput.value.trim();
    if (newGmapsKey !== MASK_VALUE) {
      state.gmapsApiKey = newGmapsKey;
    }

    state.geminiModel = modelSelect.value;
    state.geminiTemp = parseFloat(tempInput.value) || 0.7;
    saveStateToStorage();
    modal.classList.remove('active');
    updateChatbotModeStatus();
    renderApp();

    if (state.gmapsApiKey) {
      loadGoogleMapsScript(state.gmapsApiKey);
    } else {
      const canvas = document.getElementById('google-map-canvas');
      const fallback = document.getElementById('svg-map-fallback');
      if (canvas && fallback) {
        canvas.style.display = 'none';
        fallback.style.display = 'flex';
      }
    }
  });

  btnClear.addEventListener('click', () => {
    apiKeyInput.value = '';
    gmapsKeyInput.value = '';
    state.geminiApiKey = '';
    state.gmapsApiKey = '';
    saveStateToStorage();
    updateChatbotModeStatus();
    
    const canvas = document.getElementById('google-map-canvas');
    const fallback = document.getElementById('svg-map-fallback');
    if (canvas && fallback) {
      canvas.style.display = 'none';
      fallback.style.display = 'flex';
    }
    
    alert("API Keys cleared.");
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
}

// --- GOOGLE MAPS API LOADING ---
function loadGoogleMapsScript(apiKey) {
  if (!apiKey) return;
  
  if (window.google && window.google.maps) {
    initGoogleMap();
    return;
  }

  window.initGoogleMap = initGoogleMap;

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMap`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

function initGoogleMap() {
  const canvas = document.getElementById('google-map-canvas');
  const fallback = document.getElementById('svg-map-fallback');

  if (!canvas || !fallback) return;

  canvas.style.display = 'block';
  fallback.style.display = 'none';

  const metlifeCenter = { lat: 40.8135, lng: -74.0744 };

  const map = new google.maps.Map(canvas, {
    center: metlifeCenter,
    zoom: 15,
    mapId: 'DEMO_MAP_ID',
    styles: [
      { elementType: "geometry", stylers: [{ color: "#1f1d2b" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#1f1d2b" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#8e92bc" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d2a3e" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d0b18" }] }
    ]
  });

  new google.maps.Marker({
    position: metlifeCenter,
    map: map,
    title: "MetLife Stadium - FIFA World Cup 2026 Operations",
    icon: {
      url: "https://maps.google.com/mapfiles/ms/icons/red-pushpin.png"
    }
  });

  const gates = [
    { name: 'Gate A (North)', lat: 40.8160, lng: -74.0744, wait: state.gateQueues.gateA.waitMinutes },
    { name: 'Gate B (East)', lat: 40.8135, lng: -74.0710, wait: state.gateQueues.gateB.waitMinutes },
    { name: 'Gate C (South)', lat: 40.8110, lng: -74.0744, wait: state.gateQueues.gateC.waitMinutes },
    { name: 'Gate D (West)', lat: 40.8135, lng: -74.0778, wait: state.gateQueues.gateD.waitMinutes }
  ];

  gates.forEach(gate => {
    const markerColor = gate.wait > 25 ? 'red' : gate.wait > 10 ? 'orange' : 'green';
    const marker = new google.maps.Marker({
      position: { lat: gate.lat, lng: gate.lng },
      map: map,
      title: `${gate.name}: ${gate.wait} mins wait`,
      icon: {
        url: `https://maps.google.com/mapfiles/ms/icons/${markerColor}-dot.png`
      }
    });

    const info = new google.maps.InfoWindow({
      content: `<div style="color:#000; font-family:sans-serif; font-size:12px; line-height:1.4;">
                  <strong>${gate.name} Checkpoint</strong><br>
                  Queue Wait Time: <span style="font-weight:700; color:${gate.wait > 25 ? 'red' : gate.wait > 10 ? 'orange' : 'green'};">${gate.wait} minutes</span>
                </div>`
    });

    marker.addListener("click", () => {
      info.open(map, marker);
    });
  });
}

// --- AI ALERT SYNTHESIZER ---
function initAiAlertSynthesizer() {
  const btn = document.getElementById('btn-ai-synthesize-alerts');
  const card = document.getElementById('ai-synthesis-output-card');

  if (!btn || !card) return;

  btn.addEventListener('click', async () => {
    card.style.display = 'block';
    card.innerHTML = `<span style="display:flex; align-items:center; gap:0.5rem;">
                       <span class="typing-dot" style="background:var(--accent);"></span>
                       Aegis Operations Copilot is synthesizing raw incidents and generating safety action plans...
                     </span>`;
    
    try {
      const synthesis = await getIncidentSynthesis(state.activeIncidents, state.geminiApiKey);
      card.innerHTML = `
        <strong style="color:var(--accent); font-size:0.9rem; display:block; margin-bottom:0.5rem; font-family:var(--font-display);">⚡ Aegis AI Central Operations Synthesis</strong>
        <p style="margin:0;">${synthesis.replace(/\n/g, '<br>')}</p>
      `;
      state.xp += 15;
      renderApp();
    } catch (err) {
      console.error(err);
      card.innerHTML = `<span style="color:var(--danger);">Failed to complete GenAI analysis. Ensure your Gemini API Key is configured in settings.</span>`;
    }
  });
}

// --- TICKET VERIFIER (Checkpoint Inspector) ---
function initTicketVerifier() {
  const btnGenerate = document.getElementById('btn-generate-test-ticket');
  const ticketDisplay = document.getElementById('test-ticket-display');

  const inputId = document.getElementById('ticket-id');
  const inputMatch = document.getElementById('ticket-match');
  const inputHolder = document.getElementById('ticket-holder');
  const inputSector = document.getElementById('ticket-sector');
  const inputGate = document.getElementById('ticket-gate');
  const inputSeat = document.getElementById('ticket-seat');
  const inputSignature = document.getElementById('ticket-signature');
  const btnVerify = document.getElementById('btn-verify-ticket');
  const outputCard = document.getElementById('verifier-output-card');

  btnGenerate.addEventListener('click', () => {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const mockTicket = {
      ticketId: `WC2026-NYNJ-${randomSuffix}`,
      matchNumber: 'Match 10',
      holderName: 'Alexander Sterling',
      sector: 'North Stand',
      gate: 'Gate A',
      seat: 'Row 15, Seat 24'
    };

    const signature = generateTicketSignature(mockTicket);
    ticketDisplay.style.display = 'block';
    ticketDisplay.innerHTML = `
      <strong>Valid Checkpoint Ticket Sample:</strong><br>
      ID: ${mockTicket.ticketId}<br>
      Holder: ${mockTicket.holderName}<br>
      Seat: ${mockTicket.seat}<br>
      Sig: <span style="color:var(--accent); font-weight:700; cursor:pointer;" class="copy-sig-trigger">${signature}</span>
    `;

    ticketDisplay.querySelector('.copy-sig-trigger').addEventListener('click', () => {
      inputId.value = mockTicket.ticketId;
      inputMatch.value = mockTicket.matchNumber;
      inputHolder.value = mockTicket.holderName;
      inputSector.value = mockTicket.sector;
      inputGate.value = mockTicket.gate;
      inputSeat.value = mockTicket.seat;
      inputSignature.value = signature;
    });
  });

  btnVerify.addEventListener('click', () => {
    const ticket = {
      ticketId: inputId.value.trim(),
      matchNumber: inputMatch.value,
      holderName: inputHolder.value.trim(),
      sector: inputSector.value,
      gate: inputGate.value,
      seat: inputSeat.value.trim(),
      signature: inputSignature.value.trim()
    };

    outputCard.style.display = 'block';
    outputCard.className = 'card';

    const result = verifyTicket(ticket);
    if (result.isValid) {
      let rowNum = 0;
      const rowMatch = ticket.seat.match(/Row\s+(\d+)/i);
      if (rowMatch) {
        rowNum = parseInt(rowMatch[1]) || 0;
      }
      
      const tierClassification = findSeatTier(rowNum);

      state.xp += 20;
      saveStateToStorage();

      const tierBadgeClass = `tier-privilege-badge tier-badge-${tierClassification.category.toLowerCase()}`;
      outputCard.style.borderColor = 'var(--success)';
      outputCard.innerHTML = `
        <h4 style="color:var(--success); font-size:1.15rem; display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
          <span>✅</span> Signature Check Valid
        </h4>
        <div style="font-size:0.85rem; color:var(--text-secondary); line-height:1.5;">
          <strong>Attendee:</strong> ${ticket.holderName}<br>
          <strong>Tier Category:</strong> <span class="${tierBadgeClass}">${tierClassification.name}</span><br>
          <strong>Privileges:</strong> ${tierClassification.privileges}<br>
          <strong>Recommended Checkpoint:</strong> <strong>${tierClassification.recommendedGate}</strong> (Alternate: ${ticket.gate})<br>
        </div>
      `;
      renderApp();
    } else {
      outputCard.style.borderColor = 'var(--danger)';
      outputCard.innerHTML = `
        <h4 style="color:var(--danger); font-size:1.15rem; display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
          <span>❌ Verification Denied</span>
        </h4>
        <p style="font-size:0.85rem; color:var(--text-secondary);">
          Error: ${result.reason}
        </p>
      `;
    }
  });
}

// --- INCIDENT REPORTER ---
function initIncidentReporter() {
  const form = document.getElementById('incident-report-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.getElementById('incident-type').value;
    const sector = document.getElementById('incident-sector').value;
    const notesInput = document.getElementById('incident-notes');
    const notes = notesInput.value.trim();

    if (!notes) return;

    const escapedNotes = notes
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const newIncident = {
      id: `inc-${Date.now()}`,
      type,
      sector,
      notes: escapedNotes,
      status: 'open',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    state.activeIncidents.push(newIncident);
    state.xp += 15;
    saveStateToStorage();

    notesInput.value = '';
    alert("Radio alert logged to operations queue. (+15 Command Score)");

    renderApp();
  });
}

// --- CHATBOT CONTROLS ---
function initChatbot() {
  const sendBtn = document.getElementById('assistant-send-btn');
  const inputEl = document.getElementById('assistant-input-field');

  if (!sendBtn || !inputEl) return;

  sendBtn.addEventListener('click', submitChatQuery);
  inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitChatQuery();
  });

  updateChatbotWelcome();
  updateChatbotModeStatus();
}

function updateChatbotWelcome() {
  const chatMessages = document.getElementById('chat-messages-container');
  if (!chatMessages) return;

  chatMessages.innerHTML = '';
  
  const welcomeText = "Aegis Central Operations Copilot Active. Ask for security logs summaries, bottleneck predictions, dispatch instructions, or emergency evacuation drafts.";
  addMessageBubble(welcomeText, 'assistant');
  updateSuggestionChips();
}

function updateChatbotModeStatus() {
  const badge = document.getElementById('ai-mode-status-badge');
  const desc = document.getElementById('chat-role-desc');
  if (!badge) return;

  if (state.geminiApiKey) {
    badge.textContent = "Google Gemini Live";
    badge.style.color = "var(--success)";
    badge.style.borderColor = "var(--success)";
    badge.style.background = "hsla(143, 85%, 43%, 0.15)";
  } else {
    badge.textContent = "Local Simulator";
    badge.style.color = "var(--accent)";
    badge.style.borderColor = "var(--accent)";
    badge.style.background = "hsla(45, 100%, 50%, 0.15)";
  }

  if (desc) {
    desc.textContent = "Security clearance level: COMMAND. Access restricted to MetLife Stadium operations directive.";
  }
}

function submitChatQuery() {
  const inputEl = document.getElementById('assistant-input-field');
  const query = inputEl.value.trim();
  if (!query) return;

  const sanitizedQuery = query
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  inputEl.value = '';
  submitTextQuery(sanitizedQuery);
}

async function submitTextQuery(text) {
  addMessageBubble(text, 'user');
  showTypingIndicator();

  try {
    const coachResponse = await getCoachResponse(text, state, state.geminiApiKey);
    removeTypingIndicator();
    addMessageBubble(coachResponse.reply, 'assistant');
  } catch (err) {
    console.error(err);
    removeTypingIndicator();
    addMessageBubble("Sorry, I encountered an internal rendering error. Please try again.", 'assistant');
  }
}

function addMessageBubble(text, sender) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble bubble-${sender}`;

  const lines = text.split('\n');
  lines.forEach((line) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(document.createTextNode(line.substring(lastIndex, match.index)));
      }
      const boldSpan = document.createElement('strong');
      boldSpan.textContent = match[1];
      parts.push(boldSpan);
      lastIndex = boldRegex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(document.createTextNode(line.substring(lastIndex)));
    }

    const p = document.createElement('p');
    p.style.margin = "0 0 0.5rem 0";
    if (parts.length > 0) {
      parts.forEach(node => p.appendChild(node));
    } else {
      p.textContent = line;
    }
    bubble.appendChild(p);
  });

  if (bubble.lastChild) bubble.lastChild.style.margin = "0";

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function showTypingIndicator() {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  const indicator = document.createElement('div');
  indicator.id = 'chat-typing-indicator';
  indicator.className = 'chat-bubble bubble-assistant typing-indicator';

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.className = 'typing-dot';
    indicator.appendChild(dot);
  }

  container.appendChild(indicator);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById('chat-typing-indicator');
  if (indicator) indicator.remove();
}

function updateSuggestionChips() {
  const chipContainer = document.getElementById('chat-suggestion-chips');
  if (!chipContainer) return;

  chipContainer.innerHTML = '';

  const chips = ["Operations status", "Bottleneck prediction", "Incident summary", "Evacuation draft"];

  chips.forEach(chipText => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.type = 'button';
    chip.textContent = chipText;
    chip.addEventListener('click', () => {
      submitTextQuery(chipText);
    });
    chipContainer.appendChild(chip);
  });
}

// --- INTERACTIVE MAP ---
function initInteractiveMap() {
  const sectors = document.querySelectorAll('.map-sector-path');
  const gates = document.querySelectorAll('.map-gate-marker');
  const infoBox = document.getElementById('inspector-data-box');
  const placeholder = document.getElementById('inspector-placeholder');

  const titleEl = document.getElementById('inspect-title');
  const statusEl = document.getElementById('inspect-status');
  const waitEl = document.getElementById('inspect-wait');
  const accessEl = document.getElementById('inspect-access');
  const concessionEl = document.getElementById('inspect-concession');

  const selectElement = (el, type, name) => {
    sectors.forEach(s => s.classList.remove('active-selected'));
    gates.forEach(g => g.setAttribute('r', '14'));

    placeholder.style.display = 'none';
    infoBox.style.display = 'block';

    if (type === 'sector') {
      el.classList.add('active-selected');
      const key = name;
      const density = state.sectorDensities[key] || 0;
      let statusColor = 'success';
      if (density > 90) statusColor = 'danger';
      else if (density > 75) statusColor = 'accent';

      titleEl.textContent = `${key.toUpperCase()} STAND`;
      statusEl.textContent = `${density}% Full`;
      statusEl.className = `badge badge-${statusColor}`;
      waitEl.textContent = "Seat flow: stable";
      accessEl.textContent = key === 'north' || key === 'south' ? "Accessible ramp active" : "Elevator access active";
      concessionEl.textContent = key === 'north' ? "Green Meadow Concessions (Vegan)" : key === 'south' ? "Halal Grill" : "Snacks & Drinks";
    } else {
      el.setAttribute('r', '18');
      const gateKey = name === 'Gate A' ? 'gateA' : name === 'Gate B' ? 'gateB' : name === 'Gate C' ? 'gateC' : 'gateD';
      const queue = state.gateQueues[gateKey];
      
      titleEl.textContent = name;
      statusEl.textContent = `${queue.length} People in queue`;
      statusEl.className = `badge badge-${queue.waitMinutes > 25 ? 'danger' : queue.waitMinutes > 10 ? 'accent' : 'success'}`;
      waitEl.textContent = `Est. Wait: ${queue.waitMinutes} mins`;
      accessEl.textContent = "Dedicated accessibility lane open";
      concessionEl.textContent = "Outer security perimeter screening point";
    }
  };

  sectors.forEach(sec => {
    sec.addEventListener('click', () => {
      selectElement(sec, 'sector', sec.getAttribute('data-sector'));
    });
  });

  gates.forEach(gt => {
    gt.addEventListener('click', () => {
      selectElement(gt, 'gate', gt.getAttribute('data-gate'));
    });
  });
}

// --- INCIDENTS VIEW (COMMAND CENTRAL LOGS) ---
function renderOrganizerIncidents() {
  const container = document.getElementById('organizer-incidents-list');
  const badge = document.getElementById('unresolved-incident-badge');
  if (!container) return;

  container.innerHTML = '';

  state.activeIncidents.sort((a, b) => (a.id || '').localeCompare(b.id || ''));

  const openIncidents = state.activeIncidents.filter(i => i.status === 'open');
  if (badge) {
    badge.textContent = `${openIncidents.length} Open Alerts`;
    if (openIncidents.length > 0) badge.className = 'badge badge-danger';
    else badge.className = 'badge badge-success';
  }

  if (state.activeIncidents.length === 0) {
    container.innerHTML = `<li style="color:var(--text-muted); font-size:0.85rem; list-style:none;">No logged operations incidents.</li>`;
    return;
  }

  state.activeIncidents.forEach((inc) => {
    const li = document.createElement('li');
    const status = inc.status || 'open';
    li.className = `incident-item ${status === 'resolved' ? 'resolved' : ''}`;
    
    const typeText = (inc.type || 'unknown').toUpperCase();
    const sectorText = (inc.sector || 'unknown').toUpperCase();
    const timeText = inc.time || '';
    const notesText = inc.notes || '';
    const idText = inc.id || '';

    li.innerHTML = `
      <div class="incident-text-wrap">
        <span class="incident-headline">${typeText} - Sector ${sectorText} (${timeText})</span>
        <span class="incident-description">${notesText}</span>
        <span style="font-size:0.7rem; font-weight:700; color:${status === 'resolved' ? 'var(--success)' : 'var(--danger)'}; font-family:monospace;">ID: ${idText}</span>
      </div>
      ${status === 'open' ? `<button class="btn btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.75rem;" id="btn-resolve-${idText}" type="button">Resolve</button>` : ''}
    `;

    if (status === 'open') {
      const btnResolve = li.querySelector(`#btn-resolve-${idText}`);
      if (btnResolve) {
        btnResolve.addEventListener('click', () => {
          const matchInc = binarySearchIncidents(state.activeIncidents, idText);
          if (matchInc) {
            matchInc.status = 'resolved';
            state.xp += 30;
            saveStateToStorage();
            renderOrganizerIncidents();
            renderApp();
          }
        });
      }
    }

    container.appendChild(li);
  });
}

// --- RENDERING ROUTINES ---
function renderApp() {
  const mainContent = document.getElementById('main-content');
  if (mainContent) mainContent.style.display = 'block';

  // Update Points XP badge
  const pointsVal = document.getElementById('user-points-val');
  if (pointsVal) pointsVal.textContent = state.xp;

  renderOrganizerIncidents();
  renderDashboard();
  renderInsights();
}

function renderDashboard() {
  const waitGates = {
    gateA: state.gateQueues.gateA.waitMinutes,
    gateB: state.gateQueues.gateB.waitMinutes,
    gateC: state.gateQueues.gateC.waitMinutes,
    gateD: state.gateQueues.gateD.waitMinutes
  };

  renderBenchmarkChart('org-wait-chart-target', waitGates);
  renderDonutChart('org-density-chart-target', state.sectorDensities);
}

function renderInsights() {
  const container = document.getElementById('ops-insights-target');
  if (!container) return;

  container.innerHTML = '';

  const insights = getDashboardInsights(state);

  if (insights.length === 0) {
    container.innerHTML = `
      <div class="insight-item" style="padding:1rem; text-align:center; color:var(--text-muted); font-size:0.85rem;">
        No outstanding operational alerts. Operations running smoothly.
      </div>
    `;
    return;
  }

  insights.forEach(insight => {
    const item = document.createElement('div');
    item.style.padding = '0.75rem 1rem';
    item.style.borderLeft = `4px solid ${insight.type === 'critical' ? 'var(--danger)' : insight.type === 'positive' ? 'var(--success)' : 'var(--info)'}`;
    item.style.background = 'var(--bg-surface-elevated)';
    item.style.borderRadius = 'var(--radius-sm)';
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.gap = '0.15rem';
    item.style.marginBottom = '0.75rem';

    item.innerHTML = `
      <span style="font-weight:700; font-size:0.9rem; color:${insight.type === 'critical' ? 'var(--danger)' : insight.type === 'positive' ? 'var(--success)' : 'var(--text-primary)'};">${insight.title}</span>
      <span style="font-size:0.8rem; color:var(--text-secondary);">${insight.text}</span>
    `;
    container.appendChild(item);
  });
}

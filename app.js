import { verifyTicket, generateTicketSignature, estimateTransit, calculateGateQueue, calculateXP } from './operations.js';
import { renderDonutChart, renderBenchmarkChart } from './chart.js';
import { getCoachResponse, getDashboardInsights } from './assistant.js';

// --- STADIUM ACTIONS LIST ---
const STADIUM_ACTIONS = {
  fan: [
    { id: 'act-fan-transit', title: 'Eco Rail Transit', desc: 'Commute to the stadium via train instead of a private vehicle.', xp: 40, category: 'sustainability' },
    { id: 'act-fan-sort', title: 'Zero-Waste Sorting', desc: 'Correctly separate compostables, recyclables, and trash at concession bins.', xp: 20, category: 'sustainability' },
    { id: 'act-fan-cashless', title: 'Cashless Pay', desc: 'Use contactless digital cards or Google Pay to expedite concession queues.', xp: 15, category: 'operations' },
    { id: 'act-fan-carpool', title: 'Carpool Share', desc: 'Travel in a group of 4 or more to reduce traffic density around lots.', xp: 25, category: 'sustainability' }
  ],
  staff: [
    { id: 'act-staff-sweep', title: 'Complete Safety Sweep', desc: 'Conduct a thorough walk-through patrol of your sector to report hazards.', xp: 30, category: 'safety' },
    { id: 'act-staff-wheelchair', title: 'Accessibility Navigation', desc: 'Assist a guest requiring wheelchair routing to Sector 112 seats.', xp: 35, category: 'accessibility' },
    { id: 'act-staff-dispersal', title: 'Crowd Side-Valve Guide', desc: 'Direct crowds at Gate A to open side valves during peak congestion.', xp: 30, category: 'crowd' }
  ],
  organizer: [
    { id: 'act-org-dispatch', title: 'Dispatch Aux Volunteers', desc: 'Redirect 15 standby volunteers from Sector C to Gate A entry lines.', xp: 50, category: 'operations' },
    { id: 'act-org-bottleneck', title: 'Deploy Gate Congestion Warning', desc: 'Broadcast queue alerts to fan mobile devices suggesting Gate C entry.', xp: 40, category: 'operations' }
  ]
};

// --- APP STATE ---
let state = {
  role: 'fan', // fan, staff, organizer
  xp: 0,
  ticketInfo: {
    ticketId: '',
    holderName: '',
    matchNumber: 'Match 10',
    sector: 'North Stand',
    gate: 'Gate A',
    seat: '',
    signature: '',
    verified: false
  },
  transitMethod: 'transit',
  transitDistance: 12,
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
  staffTasks: [
    { id: 'task-spill', title: 'Sector Spill Sweep', desc: 'Perform visual check for wet floors or slip hazards.', completed: false },
    { id: 'task-esc', title: 'Escalator Sensor Check', desc: 'Verify safety indicators and exit landing grids are clear.', completed: false },
    { id: 'task-gate', title: 'Accessibility Lane Patrol', desc: 'Ensure wheelchair ramps are clean and free of baggage.', completed: false }
  ],
  commitments: [], // active committed action IDs
  completedActions: [], // completed action IDs
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  geminiTemp: 0.7
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  loadStateFromStorage();
  initRouting();
  initSettingsModal();
  initRoleSwitcher();
  initTicketVerifier();
  initTransitPlanner();
  initIncidentReporter();
  initChatbot();
  initActionPlanner();
  initInteractiveMap();
  
  // Render application
  renderApp();
});

// --- STORAGE ---
function saveStateToStorage() {
  localStorage.setItem('arenapulse_state', JSON.stringify(state));
}

function loadStateFromStorage() {
  const saved = localStorage.getItem('arenapulse_state');
  if (saved) {
    try {
      state = { ...state, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Corrupted state in localStorage. Resetting storage.", e);
    }
  }
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

  // Re-run specific renders for updated analytics
  if (viewId === 'dashboard') {
    renderDashboard();
    renderInsights();
  } else if (viewId === 'planner') {
    initActionPlanner();
  }
}

// --- SETTINGS MODAL ---
function initSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const btnOpen = document.getElementById('btn-settings-open');
  const btnClose = modal.querySelector('.btn-close-modal');
  const btnSave = document.getElementById('btn-settings-save');
  const btnClear = document.getElementById('btn-settings-clear');

  const apiKeyInput = document.getElementById('settings-gemini-key');
  const modelSelect = document.getElementById('settings-model');
  const tempInput = document.getElementById('settings-temp');

  btnOpen.addEventListener('click', () => {
    // Populate fields
    apiKeyInput.value = state.geminiApiKey || '';
    modelSelect.value = state.geminiModel || 'gemini-2.5-flash';
    tempInput.value = state.geminiTemp || 0.7;
    modal.classList.add('active');
  });

  btnClose.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  btnSave.addEventListener('click', () => {
    state.geminiApiKey = apiKeyInput.value.trim();
    state.geminiModel = modelSelect.value;
    state.geminiTemp = parseFloat(tempInput.value) || 0.7;
    saveStateToStorage();
    modal.classList.remove('active');
    updateChatbotModeStatus();
    renderApp();
  });

  btnClear.addEventListener('click', () => {
    apiKeyInput.value = '';
    state.geminiApiKey = '';
    saveStateToStorage();
    updateChatbotModeStatus();
    alert("API Key cleared.");
  });

  // Close modal when clicking outside of it
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
}

// --- ROLE SWITCHER ---
function initRoleSwitcher() {
  const select = document.getElementById('role-theme-select');
  if (!select) return;

  select.value = state.role;
  select.addEventListener('change', (e) => {
    state.role = e.target.value;
    saveStateToStorage();
    
    // Reset view to dashboard when role switches to prevent state overlap
    switchView('dashboard');
    updateChatbotWelcome();
    renderApp();
  });
}

// --- TICKET VERIFIER ---
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

  // Generator Helper
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
      <strong>Valid Code Sample:</strong><br>
      ID: ${mockTicket.ticketId}<br>
      Holder: ${mockTicket.holderName}<br>
      Seat: ${mockTicket.seat}<br>
      Sig: <span style="color:var(--accent); font-weight:700; cursor:pointer;" title="Click to copy" class="copy-sig-trigger">${signature}</span>
    `;

    // Click to auto-fill
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

  // Verify Action
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

    // Clean outputs
    outputCard.style.display = 'block';
    outputCard.className = 'card';

    const result = verifyTicket(ticket);
    if (result.isValid) {
      // Save ticket in state
      state.ticketInfo = { ...ticket, verified: true };
      state.xp += 50; // Verification XP award
      saveStateToStorage();

      outputCard.style.borderColor = 'var(--success)';
      outputCard.innerHTML = `
        <h4 style="color:var(--success); font-size:1.15rem; display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
          <span>✅</span> Authenticity Verified
        </h4>
        <p style="font-size:0.85rem; color:var(--text-secondary);">
          Welcome, ${ticket.holderName}! Ticket successfully authenticated.<br>
          <strong>Your Seat:</strong> ${ticket.seat} (${ticket.sector})<br>
          <strong>Allocated Gate:</strong> ${ticket.gate}<br>
          <em>* Custom stadium navigation has been unlocked in your dashboard. (+50 XP Earned)*</em>
        </p>
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

// --- TRANSIT PLANNER ---
function initTransitPlanner() {
  const methodSelect = document.getElementById('commute-transit-method');
  const distanceInput = document.getElementById('commute-distance');
  const distanceVal = document.getElementById('commute-distance-val');

  if (!methodSelect || !distanceInput) return;

  distanceInput.addEventListener('input', () => {
    distanceVal.textContent = distanceInput.value;
    state.transitDistance = parseInt(distanceInput.value) || 1;
    updateTransitEstimations();
  });

  methodSelect.addEventListener('change', () => {
    state.transitMethod = methodSelect.value;
    updateTransitEstimations();
  });
}

function updateTransitEstimations() {
  const timeEl = document.getElementById('transit-calc-time');
  const savingsEl = document.getElementById('transit-calc-savings');

  if (!timeEl || !savingsEl) return;

  // Derive traffic multiplier based on largest queue wait time
  const maxWait = Math.max(state.gateQueues.gateA.waitMinutes, state.gateQueues.gateB.waitMinutes, state.gateQueues.gateC.waitMinutes, state.gateQueues.gateD.waitMinutes);
  let crowdState = 'moderate';
  if (maxWait > 25) crowdState = 'critical';
  else if (maxWait > 15) crowdState = 'heavy';
  else if (maxWait < 8) crowdState = 'low';

  const estimates = estimateTransit(state.transitMethod, state.transitDistance, crowdState);
  timeEl.textContent = `${estimates.travelTimeMinutes} mins`;
  savingsEl.textContent = `${estimates.carbonSavedKg} kg`;

  saveStateToStorage();
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

    // Escaping to prevent XSS
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
    state.xp += 15; // Incident reporting XP
    saveStateToStorage();

    notesInput.value = '';
    alert("Incident successfully reported to Stadium central command. (+15 XP logged)");

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
  
  let welcomeText = "";
  if (state.role === 'fan') welcomeText = "Welcome to MetLife Stadium! I am Aegis, your FIFA World Cup 2026 Assistant. How can I help you with navigation, transit, accessibility, concessions, or translations today?";
  else if (state.role === 'staff') welcomeText = "Aegis Volunteer Copilot Active. Input stadium incidents, crowd reports, or ask for emergency procedures.";
  else welcomeText = "Aegis Operational intelligence Console initialized. Ask for security summaries, bottleneck predictions, or exit protocols.";

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
    desc.textContent = `You are interacting as a ${state.role.toUpperCase()}. Aegis aligns responses to your selected view context.`;
  }
}

function submitChatQuery() {
  const inputEl = document.getElementById('assistant-input-field');
  const query = inputEl.value.trim();
  if (!query) return;

  // Escape query
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
    // Keep standard suggestion chips
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

  // Formatting markdown-style tags carefully
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

  // Remove final margin
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

  let chips = [];
  if (state.role === 'fan') {
    chips = ["Find Gate A", "Accessibility Guide", "Show Concessions", "Transit & Parking"];
  } else if (state.role === 'staff') {
    chips = ["Spill cleanup steps", "Lost child safety", "Disputed ticket steps"];
  } else {
    chips = ["Operations status", "Bottleneck prediction", "Incident summary"];
  }

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
    // Clear selection styles
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
      accessEl.textContent = key === 'north' || key === 'south' ? "Accessible ramp available" : "Elevator access only";
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

// --- ACTION PLANNER ---
function initActionPlanner() {
  const container = document.getElementById('planner-action-list');
  const sidebar = document.getElementById('commitments-list-sidebar');

  if (!container || !sidebar) return;

  container.innerHTML = '';
  sidebar.innerHTML = '';

  const currentActions = STADIUM_ACTIONS[state.role] || [];
  
  if (currentActions.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);">No action goals available for this role.</p>`;
    return;
  }

  currentActions.forEach(action => {
    const isCommitted = state.commitments.includes(action.id);
    const isCompleted = state.completedActions.includes(action.id);

    const card = document.createElement('div');
    card.className = `action-card ${isCommitted ? 'committed-active' : ''}`;

    card.innerHTML = `
      <div class="action-header">
        <h4 class="action-title">${action.title}</h4>
        <span class="action-impact">+${action.xp} XP</span>
      </div>
      <p class="action-desc">${action.desc}</p>
      <div class="action-footer">
        <span class="action-category">${action.category}</span>
        <button class="action-btn ${isCommitted ? 'committed' : ''}" type="button" id="btn-act-${action.id}">
          ${isCompleted ? 'Completed 🎉' : isCommitted ? 'Committed' : 'Commit'}
        </button>
      </div>
    `;

    // Actions button
    const btn = card.querySelector(`#btn-act-${action.id}`);
    if (isCompleted) {
      btn.disabled = true;
      btn.style.opacity = '0.6';
    } else {
      btn.addEventListener('click', () => {
        toggleActionCommitment(action.id, action.xp);
      });
    }

    container.appendChild(card);
  });

  // Render Sidebar commitments
  const committedDetails = currentActions.filter(a => state.commitments.includes(a.id));
  if (committedDetails.length === 0) {
    sidebar.innerHTML = `<li style="color:var(--text-muted); font-size:0.85rem; list-style:none;">No active goals committed. Browse goals list!</li>`;
  } else {
    committedDetails.forEach(action => {
      const li = document.createElement('li');
      li.className = 'commitment-item';
      li.innerHTML = `
        <div class="commitment-info">
          <span class="commitment-title">${action.title}</span>
          <span class="commitment-savings">+${action.xp} XP</span>
        </div>
        <button class="commitment-complete-btn" title="Complete Action" type="button" id="btn-done-${action.id}">✓</button>
      `;
      li.querySelector(`#btn-done-${action.id}`).addEventListener('click', () => {
        completeAction(action.id, action.xp);
      });
      sidebar.appendChild(li);
    });
  }
}

function toggleActionCommitment(id, xpGains) {
  if (state.commitments.includes(id)) {
    state.commitments = state.commitments.filter(c => c !== id);
  } else {
    state.commitments.push(id);
    state.xp += 10; // Commitment minor bonus
  }
  saveStateToStorage();
  initActionPlanner();
  renderApp();
}

function completeAction(id, xpGains) {
  state.commitments = state.commitments.filter(c => c !== id);
  if (!state.completedActions.includes(id)) {
    state.completedActions.push(id);
    state.xp += xpGains; // Complete bonus
  }
  saveStateToStorage();
  initActionPlanner();
  renderApp();
}

// --- STAFF TASKS (VOLUNTEER VIEW ONLY) ---
function renderStaffTasks() {
  const container = document.getElementById('staff-tasks-list');
  const countSpan = document.getElementById('staff-tasks-count');

  if (!container) return;

  container.innerHTML = '';
  
  const openCount = state.staffTasks.filter(t => !t.completed).length;
  if (countSpan) countSpan.textContent = openCount;

  state.staffTasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = `staff-task-item ${task.completed ? 'task-done' : ''}`;
    li.innerHTML = `
      <input type="checkbox" class="staff-checkbox" id="chk-task-${index}" ${task.completed ? 'checked' : ''}>
      <div style="flex-grow:1; display:flex; flex-direction:column;">
        <span style="font-weight:600; font-size:0.9rem;">${task.title}</span>
        <span style="font-size:0.75rem; color:var(--text-secondary);">${task.desc}</span>
      </div>
    `;

    li.querySelector(`#chk-task-${index}`).addEventListener('change', (e) => {
      state.staffTasks[index].completed = e.target.checked;
      if (e.target.checked) {
        state.xp += 20; // 20 XP for volunteer safety sweep
      } else {
        state.xp = Math.max(0, state.xp - 20);
      }
      saveStateToStorage();
      renderStaffTasks();
      renderApp();
    });

    container.appendChild(li);
  });
}

// --- INCIDENTS VIEW (ORGANIZER LOGS) ---
function renderOrganizerIncidents() {
  const container = document.getElementById('organizer-incidents-list');
  const badge = document.getElementById('unresolved-incident-badge');
  if (!container) return;

  container.innerHTML = '';

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

  state.activeIncidents.forEach((inc, index) => {
    const li = document.createElement('li');
    li.className = `incident-item ${inc.status === 'resolved' ? 'resolved' : ''}`;
    
    li.innerHTML = `
      <div class="incident-text-wrap">
        <span class="incident-headline">${inc.type.toUpperCase()} - Sector ${inc.sector.toUpperCase()} (${inc.time})</span>
        <span class="incident-description">${inc.notes}</span>
        <span style="font-size:0.7rem; font-weight:700; color:${inc.status === 'resolved' ? 'var(--success)' : 'var(--danger)'};">Status: ${inc.status.toUpperCase()}</span>
      </div>
      ${inc.status === 'open' ? `<button class="btn btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.75rem;" id="btn-resolve-inc-${index}" type="button">Resolve</button>` : ''}
    `;

    if (inc.status === 'open') {
      li.querySelector(`#btn-resolve-inc-${index}`).addEventListener('click', () => {
        state.activeIncidents[index].status = 'resolved';
        state.xp += 30; // Organizer resolution XP
        saveStateToStorage();
        renderOrganizerIncidents();
        renderApp();
      });
    }

    container.appendChild(li);
  });
}

// --- RENDERING ROUTINES ---
function renderApp() {
  // Update Points XP badge
  const pointsVal = document.getElementById('user-points-val');
  if (pointsVal) pointsVal.textContent = state.xp;

  // Manage role active dashboard panel visibility
  document.querySelectorAll('.role-dash').forEach(el => {
    el.style.display = 'none';
  });

  if (state.role === 'fan') {
    document.getElementById('fan-dash-layout').style.display = 'grid';
  } else if (state.role === 'staff') {
    document.getElementById('staff-dash-layout').style.display = 'grid';
    renderStaffTasks();
  } else if (state.role === 'organizer') {
    document.getElementById('organizer-dash-layout').style.display = 'grid';
    renderOrganizerIncidents();
  }

  // Update layout transit inputs
  const commuteDist = document.getElementById('commute-distance');
  const commuteMethod = document.getElementById('commute-transit-method');
  if (commuteDist && commuteMethod) {
    commuteDist.value = state.transitDistance;
    document.getElementById('commute-distance-val').textContent = state.transitDistance;
    commuteMethod.value = state.transitMethod;
  }

  // Update Fan match ticket displays
  const ticketSummaryEl = document.getElementById('fan-ticket-summary');
  if (ticketSummaryEl) {
    if (state.ticketInfo && state.ticketInfo.verified) {
      ticketSummaryEl.innerHTML = `
        <div style="background: hsla(143, 85%, 43%, 0.1); padding:0.8rem; border-radius:var(--radius-sm); border:1px solid var(--success);">
          <strong style="color:var(--success); font-size:0.95rem; display:block; margin-bottom:0.25rem;">✓ Verified - ${state.ticketInfo.matchNumber}</strong>
          <span style="font-size:0.8rem; color:var(--text-secondary); display:block;">
            <strong>Holder:</strong> ${state.ticketInfo.holderName}<br>
            <strong>Seat:</strong> ${state.ticketInfo.seat} | ${state.ticketInfo.sector}<br>
            <strong>Gate:</strong> Entry via ${state.ticketInfo.gate}
          </span>
        </div>
      `;
    } else {
      ticketSummaryEl.innerHTML = `
        <div style="background: hsla(220, 20%, 25%, 0.2); padding:0.8rem; border-radius:var(--radius-sm); border:1px dashed var(--border-color); text-align:center;">
          <span style="font-size:0.8rem; color:var(--text-muted); display:block; margin-bottom:0.5rem;">No Verified Ticket Registered</span>
          <button class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.75rem;" onclick="document.getElementById('nav-btn-verifier').click()" type="button">Register Ticket</button>
        </div>
      `;
    }
  }

  // Re-render dashboard components
  renderDashboard();
  renderInsights();
  updateTransitEstimations();
}

function renderDashboard() {
  const waitGates = {
    gateA: state.gateQueues.gateA.waitMinutes,
    gateB: state.gateQueues.gateB.waitMinutes,
    gateC: state.gateQueues.gateC.waitMinutes,
    gateD: state.gateQueues.gateD.waitMinutes
  };

  // Render queue wait time bar chart on fan/organizer dashboards
  if (state.role === 'fan') {
    renderBenchmarkChart('fan-queue-chart-target', waitGates);
  } else if (state.role === 'organizer') {
    renderBenchmarkChart('org-wait-chart-target', waitGates);
    renderDonutChart('org-density-chart-target', state.sectorDensities);
  }
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
    // Map custom colors
    const borderClass = insight.type === 'critical' ? 'critical-border' : insight.type === 'positive' ? 'positive-border' : '';
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

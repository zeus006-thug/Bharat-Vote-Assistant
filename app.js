import { calculateFootprint, benchmarkFootprint } from './calculator.js';
import { renderDonutChart, renderBenchmarkChart } from './chart.js';
import { getCoachResponse, getDashboardInsights } from './assistant.js';

// --- APPLICATION ACTIONS LIST ---
const ECO_ACTIONS = [
  { id: 'action-transit', title: 'Transit Commuting', desc: 'Swap daily solo driving with train or bus travel.', savings: 1.2, category: 'transport' },
  { id: 'action-bike', title: 'Bike & Walk Short Trips', desc: 'Use active transit for commutes under 2 miles.', savings: 0.5, category: 'transport' },
  { id: 'action-led', title: 'LED Bulb Upgrade', desc: 'Replace traditional lighting with power-efficient LED bulbs.', savings: 0.3, category: 'energy' },
  { id: 'action-green-tariff', title: '100% Green Tariff', desc: 'Enroll in your utility provider\'s renewable electricity plan.', savings: 1.5, category: 'energy' },
  { id: 'action-meatless', title: 'Meatless Mondays', desc: 'Go vegetarian for at least one day per week.', savings: 0.4, category: 'food' },
  { id: 'action-veg-shift', title: 'Vegetarian Transition', desc: 'Eliminate red and white meats from your primary diet.', savings: 1.1, category: 'food' },
  { id: 'action-compost', title: 'Zero Food Waste', desc: 'Compost scraps and match cooking portions perfectly.', savings: 0.3, category: 'food' },
  { id: 'action-minimalist', title: 'Conscious Wardrobe', desc: 'Purchase only second-hand or essential apparel.', savings: 0.8, category: 'consumption' },
  { id: 'action-metal-recycle', title: 'Metal & Can Sorting', desc: 'Ensure 100% of household metal cans are recycled.', savings: 0.1, category: 'consumption' }
];

// --- APP STATE ---
let state = {
  userInputs: {},
  footprint: { total: 0, breakdown: { transport: 0, energy: 0, food: 0, consumption: 0 } },
  commitments: [], // array of committed action IDs
  completedActions: [], // array of completed action IDs
  xp: 0,
  unlockedBadges: [],
  wizardStep: 1
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  loadStateFromStorage();
  initRouting();
  initWizard();
  initAssistant();
  initActionPlanner();
  initThemeSwitcher();
  initDataSovereignty();
  initScenarioSimulator();
  updateBadgeDisplay();
  renderApp();
});

// --- STATE MANAGEMENT ---
function saveStateToStorage() {
  localStorage.setItem('ecopulse_state', JSON.stringify(state));
}

function loadStateFromStorage() {
  const saved = localStorage.getItem('ecopulse_state');
  if (saved) {
    try {
      state = { ...state, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Corrupted state in localStorage. Resetting storage.", e);
    }
  }
}

// --- SPA VIEW ROUTING ---
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
  // Update nav active states
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('data-view') === viewId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Switch view panel elements
  document.querySelectorAll('.view-panel').forEach(panel => {
    if (panel.id === `${viewId}-view`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Rerender analytics when switching to dashboard
  if (viewId === 'dashboard') {
    renderCharts();
    renderInsights();
    renderCommitmentsSummary();
  }
}

// --- WIZARD CONTROL ---
function initWizard() {
  const rangeInputs = document.querySelectorAll('input[type="range"]');
  rangeInputs.forEach(input => {
    const valSpan = document.getElementById(`${input.id}-val`);
    if (valSpan) {
      input.addEventListener('input', () => {
        valSpan.textContent = input.value;
      });
    }
  });

  // Handle Radio Card option clicks
  const radioCards = document.querySelectorAll('.radio-card');
  radioCards.forEach(card => {
    card.addEventListener('click', () => {
      const radio = card.querySelector('input[type="radio"]');
      const name = radio.name;
      
      // Deselect siblings
      document.querySelectorAll(`input[name="${name}"]`).forEach(sibling => {
        sibling.closest('.radio-card').classList.remove('selected');
      });

      radio.checked = true;
      card.classList.add('selected');
    });
  });

  // Checkbox styling active states
  const checkCards = document.querySelectorAll('.check-card');
  checkCards.forEach(card => {
    card.addEventListener('change', () => {
      if (card.querySelector('input').checked) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
  });

  // Wizard navigation buttons
  document.getElementById('next-step-btn').addEventListener('click', handleWizardNext);
  document.getElementById('prev-step-btn').addEventListener('click', handleWizardPrev);
}

function updateWizardUI() {
  const steps = document.querySelectorAll('.calc-step');
  const progressBar = document.getElementById('wizard-progress-bar');
  const prevBtn = document.getElementById('prev-step-btn');
  const nextBtn = document.getElementById('next-step-btn');

  steps.forEach(step => {
    if (Number(step.getAttribute('data-step')) === state.wizardStep) {
      step.classList.add('active');
    } else {
      step.classList.remove('active');
    }
  });

  const percentage = ((state.wizardStep - 1) / (steps.length - 1)) * 100;
  progressBar.style.width = `${percentage}%`;

  prevBtn.disabled = state.wizardStep === 1;

  if (state.wizardStep === steps.length) {
    nextBtn.textContent = 'Calculate & Save';
    nextBtn.classList.remove('btn-secondary');
    nextBtn.classList.add('btn-primary');
  } else {
    nextBtn.textContent = 'Continue';
    nextBtn.classList.add('btn-secondary');
    nextBtn.classList.remove('btn-primary');
  }
}

function handleWizardNext() {
  const totalSteps = document.querySelectorAll('.calc-step').length;
  if (state.wizardStep < totalSteps) {
    state.wizardStep++;
    updateWizardUI();
  } else {
    // Process form inputs
    saveCalculatorInputs();
    switchView('dashboard');
  }
}

function handleWizardPrev() {
  if (state.wizardStep > 1) {
    state.wizardStep--;
    updateWizardUI();
  }
}

function saveCalculatorInputs() {
  const inputs = {};

  // Transportation
  const selectedCarRadio = document.querySelector('input[name="carType"]:checked');
  inputs.carType = selectedCarRadio ? selectedCarRadio.value : 'gasolineCar';
  inputs.carMiles = document.getElementById('carMiles').value;
  inputs.transitMiles = document.getElementById('transitMiles').value;
  inputs.flightsShort = document.getElementById('flightsShort').value;
  inputs.flightsMedium = document.getElementById('flightsMedium').value;
  inputs.flightsLong = document.getElementById('flightsLong').value;

  // Energy
  inputs.electricityBill = document.getElementById('electricityBill').value;
  inputs.electricityRenewable = document.getElementById('electricityRenewable').value;
  inputs.gasBill = document.getElementById('gasBill').value;

  // Diet
  const selectedDietRadio = document.querySelector('input[name="dietType"]:checked');
  inputs.dietType = selectedDietRadio ? selectedDietRadio.value : 'averageMeat';
  const selectedWasteRadio = document.querySelector('input[name="foodWaste"]:checked');
  inputs.foodWaste = selectedWasteRadio ? selectedWasteRadio.value : 'medium';

  // Shopping & Waste
  const selectedShoppingRadio = document.querySelector('input[name="shoppingHabits"]:checked');
  inputs.shoppingHabits = selectedShoppingRadio ? selectedShoppingRadio.value : 'moderate';
  
  const recycleItems = [];
  document.querySelectorAll('input[name="recycleItems"]:checked').forEach(item => {
    recycleItems.push(item.value);
  });
  inputs.recycleItems = recycleItems;

  // Calculate carbon emissions
  state.userInputs = inputs;
  state.footprint = calculateFootprint(inputs);

  // Awards/XP System checks
  awardXP(50, 'Calculator Completion');
  unlockBadge('first-steps', 'First Steps', '🌱');
  
  if (state.footprint.total <= 4.5) {
    unlockBadge('eco-warrior', 'Eco Warrior', '🛡️');
  }
  if (state.footprint.total <= 2.0) {
    unlockBadge('climate-hero', 'Climate Hero', '🥇');
  }

  saveStateToStorage();
  renderApp();
}

// --- ACTION PLANNER CONTROL ---
function initActionPlanner() {
  const actionListContainer = document.getElementById('planner-action-list');
  if (!actionListContainer) return;

  actionListContainer.innerHTML = '';
  
  ECO_ACTIONS.forEach(action => {
    const isCommitted = state.commitments.includes(action.id);
    const isCompleted = state.completedActions.includes(action.id);
    
    const card = document.createElement('div');
    card.className = `action-card ${isCommitted ? 'committed-active' : ''}`;
    
    const header = document.createElement('div');
    header.className = 'action-header';
    
    const title = document.createElement('h4');
    title.className = 'action-title';
    title.textContent = action.title;
    
    const impact = document.createElement('span');
    impact.className = 'action-impact';
    impact.textContent = `-${action.savings.toFixed(1)} tCO2e`;

    header.appendChild(title);
    header.appendChild(impact);

    const desc = document.createElement('p');
    desc.className = 'action-desc';
    desc.textContent = action.desc;

    const footer = document.createElement('div');
    footer.className = 'action-footer';

    const cat = document.createElement('span');
    cat.className = 'action-category';
    cat.textContent = action.category;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `action-btn ${isCommitted ? 'committed' : ''}`;
    
    if (isCompleted) {
      btn.textContent = 'Completed 🎉';
      btn.disabled = true;
      btn.style.opacity = '0.6';
    } else if (isCommitted) {
      btn.textContent = 'Committed';
      btn.addEventListener('click', () => toggleCommitment(action.id));
    } else {
      btn.textContent = 'Commit to Action';
      btn.addEventListener('click', () => toggleCommitment(action.id));
    }

    footer.appendChild(cat);
    footer.appendChild(btn);

    card.appendChild(header);
    card.appendChild(desc);
    card.appendChild(footer);
    
    actionListContainer.appendChild(card);
  });

  renderCommitmentsSummary();
}

function toggleCommitment(actionId) {
  if (state.commitments.includes(actionId)) {
    state.commitments = state.commitments.filter(id => id !== actionId);
  } else {
    state.commitments.push(actionId);
    awardXP(10, 'Action Commitment');
    unlockBadge('carbon-saver', 'Carbon Saver', '♻️');
  }
  saveStateToStorage();
  initActionPlanner();
  renderApp();
}

function completeCommitment(actionId) {
  state.commitments = state.commitments.filter(id => id !== actionId);
  if (!state.completedActions.includes(actionId)) {
    state.completedActions.push(actionId);
    const action = ECO_ACTIONS.find(a => a.id === actionId);
    if (action) {
      awardXP(40, `Completed Action: ${action.title}`);
    }
  }
  saveStateToStorage();
  initActionPlanner();
  renderApp();
}

function renderCommitmentsSummary() {
  const list = document.getElementById('commitments-list-items');
  const sidebarList = document.getElementById('commitments-list-sidebar');
  const countSpan = document.getElementById('committed-actions-count');
  
  if (list) list.innerHTML = '';
  if (sidebarList) sidebarList.innerHTML = '';
  
  const committedDetails = ECO_ACTIONS.filter(a => state.commitments.includes(a.id));
  
  if (countSpan) {
    countSpan.textContent = String(committedDetails.length);
  }

  if (committedDetails.length === 0) {
    const emptyMsg = '<li style="color: var(--text-muted); font-size: 0.9rem; list-style: none;">No current active commitments. Browse the Action Planner!</li>';
    if (list) list.innerHTML = emptyMsg;
    if (sidebarList) sidebarList.innerHTML = emptyMsg;
    return;
  }

  committedDetails.forEach(action => {
    const createItem = () => {
      const li = document.createElement('li');
      li.className = 'commitment-item';
      
      const info = document.createElement('div');
      info.className = 'commitment-info';
      
      const title = document.createElement('span');
      title.className = 'commitment-title';
      title.textContent = action.title;

      const savings = document.createElement('span');
      savings.className = 'commitment-savings';
      savings.textContent = `-${action.savings.toFixed(1)} tCO2e/year`;

      info.appendChild(title);
      info.appendChild(savings);

      const checkBtn = document.createElement('button');
      checkBtn.className = 'commitment-complete-btn';
      checkBtn.title = 'Mark as Completed';
      checkBtn.innerHTML = '✓';
      checkBtn.addEventListener('click', () => completeCommitment(action.id));

      li.appendChild(info);
      li.appendChild(checkBtn);
      return li;
    };

    if (list) list.appendChild(createItem());
    if (sidebarList) sidebarList.appendChild(createItem());
  });
}

// --- ASSISTANT CONTROL ---
function initAssistant() {
  const sendBtn = document.getElementById('assistant-send-btn');
  const inputEl = document.getElementById('assistant-input-field');

  if (!sendBtn || !inputEl) return;

  sendBtn.addEventListener('click', submitChatQuery);
  inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitChatQuery();
  });

  // Setup prompt chips click handlers
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      submitTextQuery(chip.textContent);
    });
  });

  // Initial welcome message if chat is empty
  const chatMessages = document.getElementById('chat-messages-container');
  if (chatMessages && chatMessages.children.length === 0) {
    addMessageBubble("Hello! I'm Eco, your personalized carbon coaching assistant. Complete the Carbon Calculator tab first, or ask me any question about carbon reduction, transport, diet, energy, or standard benchmarks!", 'assistant');
  }
}

function submitChatQuery() {
  const inputEl = document.getElementById('assistant-input-field');
  const query = inputEl.value.trim();
  if (!query) return;

  // High Security: Escape characters to prevent XSS
  const sanitizedQuery = query
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  inputEl.value = '';
  submitTextQuery(sanitizedQuery);
}

function submitTextQuery(text) {
  addMessageBubble(text, 'user');
  showTypingIndicator();

  // Simulate thinking duration
  setTimeout(() => {
    removeTypingIndicator();
    const coachResponse = getCoachResponse(text, state);
    addMessageBubble(coachResponse.reply, 'assistant');
    updateSuggestionChips(coachResponse.chips);
  }, 600);
}

function addMessageBubble(text, sender) {
  const container = document.getElementById('chat-messages-container');
  if (!container) return;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble bubble-${sender}`;
  
  // Format bold structures and clean line breaks securely
  const lines = text.split('\n');
  lines.forEach((line) => {
    const formattedText = line;
    const boldRegex = /\*\*(.*?)\*\*/g;
    
    // Replace **bold** tags carefully in text context
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = boldRegex.exec(line)) !== null) {
      // text before bold
      if (match.index > lastIndex) {
        parts.push(document.createTextNode(line.substring(lastIndex, match.index)));
      }
      // bold element
      const boldSpan = document.createElement('strong');
      boldSpan.textContent = match[1];
      parts.push(boldSpan);
      lastIndex = boldRegex.lastIndex;
    }
    
    if (lastIndex < line.length) {
      parts.push(document.createTextNode(line.substring(lastIndex)));
    }

    const p = document.createElement('p');
    if (parts.length > 0) {
      parts.forEach(node => p.appendChild(node));
    } else {
      p.textContent = formattedText;
    }
    
    bubble.appendChild(p);
  });

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
  if (indicator) {
    indicator.remove();
  }
}

function updateSuggestionChips(chips) {
  const chipContainer = document.getElementById('chat-suggestion-chips');
  if (!chipContainer) return;

  chipContainer.innerHTML = '';
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

// --- CORE RENDER SYSTEM ---
function renderApp() {
  // Update header points indicators
  const pointsVal = document.getElementById('user-points-val');
  if (pointsVal) {
    pointsVal.textContent = String(state.xp);
  }

  const rewardsXp = document.getElementById('rewards-xp-badge');
  if (rewardsXp) {
    rewardsXp.textContent = String(state.xp);
  }

  // Update calculator wizard state
  updateWizardUI();

  // Metric displays
  const scoreNum = document.getElementById('score-numeric-val');
  const classificationSpan = document.getElementById('score-classification-badge');
  const targetDesc = document.getElementById('benchmarking-details-desc');
  
  if (scoreNum && classificationSpan) {
    if (state.footprint.total > 0) {
      // Calculate committed savings reduction
      const committedSavings = ECO_ACTIONS
        .filter(a => state.commitments.includes(a.id))
        .reduce((sum, act) => sum + act.savings, 0);

      const completedSavings = ECO_ACTIONS
        .filter(a => state.completedActions.includes(a.id))
        .reduce((sum, act) => sum + act.savings, 0);

      const netTotal = Math.max(0.1, state.footprint.total - committedSavings - completedSavings);

      scoreNum.textContent = netTotal.toFixed(1);
      
      const benchmark = benchmarkFootprint(netTotal);
      classificationSpan.textContent = benchmark.rating;
      classificationSpan.className = `badge badge-${benchmark.badgeColor}`;
      
      targetDesc.textContent = `Your starting footprint is ${state.footprint.total.toFixed(1)} t. Incorporating actions reduced it to ${netTotal.toFixed(1)} t, which represents ${benchmark.percentOfGlobal}% of global average footprint, and ${benchmark.percentOfUS}% of US average footprint.`;
    } else {
      scoreNum.textContent = '--';
      classificationSpan.textContent = 'No Data';
      classificationSpan.className = 'badge';
      targetDesc.textContent = 'Complete the calculator step to render current metrics.';
    }
  }

  // Render sub elements
  renderCharts();
  renderInsights();
  renderCommitmentsSummary();
  updateSimulation();
}

function renderCharts() {
  if (state.footprint.total > 0) {
    const committedSavings = ECO_ACTIONS
      .filter(a => state.commitments.includes(a.id))
      .reduce((sum, act) => sum + act.savings, 0);

    const completedSavings = ECO_ACTIONS
      .filter(a => state.completedActions.includes(a.id))
      .reduce((sum, act) => sum + act.savings, 0);

    const netTotal = Math.max(0.1, state.footprint.total - committedSavings - completedSavings);

    renderDonutChart('donut-chart-target', state.footprint.breakdown);
    renderBenchmarkChart('benchmark-chart-target', netTotal);
  }
}

function renderInsights() {
  const container = document.getElementById('coach-insights-target');
  const sidebarContainer = document.getElementById('coach-insights-sidebar');
  
  if (container) container.innerHTML = '';
  if (sidebarContainer) sidebarContainer.innerHTML = '';
  
  const insights = getDashboardInsights(state.footprint);

  insights.forEach(insight => {
    const createInsightNode = () => {
      const div = document.createElement('div');
      div.className = `insight-item ${insight.type === 'critical' ? 'critical' : insight.type === 'positive' ? 'positive' : ''}`;

      const textWrap = document.createElement('div');
      
      const head = document.createElement('div');
      head.className = 'insight-header';
      head.textContent = insight.title;

      const text = document.createElement('p');
      text.className = 'insight-text';
      text.textContent = insight.text;

      textWrap.appendChild(head);
      textWrap.appendChild(text);
      div.appendChild(textWrap);
      return div;
    };

    if (container) container.appendChild(createInsightNode());
    if (sidebarContainer) sidebarContainer.appendChild(createInsightNode());
  });
}

// --- REWARDS & XP SYSTEM ---
function awardXP(amount, reason) {
  state.xp += amount;
  
  // Show standard notification in console
  console.log(`[EcoPulse Rewards] Earned +${amount} XP for ${reason}. Total XP: ${state.xp}`);
}

function unlockBadge(badgeId, badgeName, badgeEmoji) {
  if (!state.unlockedBadges.includes(badgeId)) {
    state.unlockedBadges.push(badgeId);
    updateBadgeDisplay();
    console.log(`[EcoPulse Rewards] Unlocked Badge: ${badgeEmoji} ${badgeName}`);
  }
}

function updateBadgeDisplay() {
  const badgeContainers = document.querySelectorAll('.badge-item');
  badgeContainers.forEach(container => {
    const id = container.getAttribute('data-badge-id');
    if (state.unlockedBadges.includes(id)) {
      container.classList.add('unlocked');
    }
  });
}

// --- BIOME THEME SYSTEM ---
function initThemeSwitcher() {
  const themeSelect = document.getElementById('biome-theme-select');
  if (themeSelect) {
    const savedTheme = localStorage.getItem('ecopulse_theme') || 'forest';
    themeSelect.value = savedTheme;
    applyTheme(savedTheme);
    
    themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      applyTheme(theme);
      localStorage.setItem('ecopulse_theme', theme);
    });
  }
}

function applyTheme(themeName) {
  document.documentElement.className = '';
  if (themeName !== 'forest') {
    document.documentElement.classList.add(`theme-${themeName}`);
  }
  // Re-draw benchmarks or SVG components
  renderCharts();
}

// --- DATA SOVEREIGNTY BACKUP & RESTORE ---
function initDataSovereignty() {
  const btnExport = document.getElementById('btn-export-profile');
  const btnImportTrigger = document.getElementById('btn-import-trigger');
  const fileInput = document.getElementById('file-import-profile');

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const dataStr = JSON.stringify(state, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecopulse_profile_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      awardXP(10, 'Exported Backup Profile');
      renderApp();
    });
  }

  if (btnImportTrigger && fileInput) {
    btnImportTrigger.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          
          if (parsed && typeof parsed === 'object' && parsed.footprint && typeof parsed.footprint.total === 'number') {
            state = { ...state, ...parsed };
            saveStateToStorage();
            updateBadgeDisplay();
            renderApp();
            
            // Notification in chatbot interface
            addMessageBubble("✅ Local backup profile successfully imported. Welcome back!", 'assistant');
          } else {
            alert("Invalid profile file structure. Could not restore backup.");
          }
        } catch (err) {
          console.error(err);
          alert("Error parsing file. Please select a valid EcoPulse backup JSON.");
        }
      };
      reader.readAsText(file);
    });
  }
}

// --- CARBON REDUCTION SCENARIO SIMULATOR ---
function initScenarioSimulator() {
  const rangeTransport = document.getElementById('sim-transport');
  const rangeEnergy = document.getElementById('sim-energy');
  const rangeDiet = document.getElementById('sim-diet');

  if (!rangeTransport || !rangeEnergy || !rangeDiet) return;

  const inputs = [rangeTransport, rangeEnergy, rangeDiet];
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      const valSpan = document.getElementById(`${input.id}-val`);
      if (valSpan) valSpan.textContent = input.value;
      updateSimulation();
    });
  });
}

function updateSimulation() {
  const resultEl = document.getElementById('sim-footprint-result');
  if (!resultEl) return;

  if (!state.footprint || state.footprint.total === 0) {
    resultEl.textContent = "Calculator Pending";
    return;
  }

  const transportReductionPct = Number(document.getElementById('sim-transport').value) / 100;
  const energyReductionPct = Number(document.getElementById('sim-energy').value) / 100;
  const dietVegetarianDays = Number(document.getElementById('sim-diet').value);

  // Math simulation logic
  const simTransport = state.footprint.breakdown.transport * (1 - transportReductionPct);
  const simEnergy = state.footprint.breakdown.energy * (1 - energyReductionPct);
  
  const currentFoodVal = state.footprint.breakdown.food;
  const dietType = state.userInputs.dietType || 'averageMeat';
  
  let simFood = currentFoodVal;
  if (dietType !== 'vegan' && dietType !== 'vegetarian' && dietVegetarianDays > 0) {
    const savingsPerDay = Math.max(0, (currentFoodVal - 1.0) / 7);
    simFood = Math.max(1.0, currentFoodVal - (savingsPerDay * dietVegetarianDays));
  }

  const simConsumption = state.footprint.breakdown.consumption;
  const totalSimulated = simTransport + simEnergy + simFood + simConsumption;
  
  resultEl.textContent = `${totalSimulated.toFixed(1)} t`;
}

// --- PWA SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[EcoPulse PWA] ServiceWorker active:', reg.scope))
      .catch(err => console.error('[EcoPulse PWA] ServiceWorker registration failed:', err));
  });
}

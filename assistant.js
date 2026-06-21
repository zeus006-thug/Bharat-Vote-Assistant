/**
 * EcoPulse - Sustainability Coach Module ("Eco")
 * Performs local intelligence analysis and conversational matching.
 */

// Coach Knowledge Base (Sustainability Tips & FAQs)
const COACH_KNOWLEDGE = {
  general: [
    "To make a meaningful impact, target your biggest emissions category first. For most people, this is transport or home energy.",
    "The carbon target to combat global warming is under 2.0 tons per person per year. Achieving this requires lifestyle adjustments and clean grid transitions.",
    "Every small step adds up! Tracking your footprint monthly allows you to visualize reductions in real time."
  ],
  transport: [
    "🚗 **Transport Tip**: Shifting from a standard gasoline car to a hybrid or electric vehicle cuts transit emissions by 50% to 75%.",
    "🚲 **Active Commuting**: Commuting by bicycle or walking has a near-zero carbon footprint and improves cardiovascular health.",
    "✈️ **Aviation Impact**: A single long-haul flight can emit more CO2 than an entire year of daily driving. Consider direct flights, carbon offsets, or local staycations."
  ],
  energy: [
    "⚡ **Clean Grid**: If your utility provider allows it, switch to a 100% renewable electricity supply option. This is the single fastest way to shrink home energy footprint.",
    "💡 **LED Lighting**: Replacing standard incandescent bulbs with LEDs consumes up to 80% less electricity and lasts 25 times longer.",
    "🔌 **Phantom Load**: Electronics consume energy even when turned off. Use smart power strips to cut power completely when not in use."
  ],
  diet: [
    "🥗 **Plant-Based Benefits**: Shifting towards plant-based foods can decrease diet-related footprint by up to 60%. Beef has a carbon density 10 times higher than chicken and 30 times higher than beans.",
    "🍎 **Local & Seasonal**: Out-of-season produce imported via air-freight has a high footprint. Buy local and seasonal crops to reduce transit emissions.",
    "🗑️ **Zero Waste**: Roughly 30% of global food is wasted, decaying in landfills to produce methane. Plan meals, freeze extras, and compost food scraps."
  ],
  consumption: [
    "🛍️ **Circular Economy**: Buy high-quality goods built to last, choose second-hand clothing, and repair items instead of buying replacements.",
    "♻️ **Smart Recycling**: Ensure plastic, paper, glass, and metal are recycled correctly. Metal (especially aluminum) recycling saves up to 95% of the energy needed for virgin production.",
    "📦 **Minimal Packaging**: Buy items in bulk, carry reusable bags, and select products with biodegradable or minimal packaging."
  ]
};

// Conversational prompts based on category
const TOP_EMITTER_PROMPTS = {
  transport: "Eco-insights indicate that transportation is your highest carbon category. How would you describe your commuting habits, or are you interested in clean vehicle alternatives?",
  energy: "Your household energy represents your largest carbon contributor. Would you like suggestions on reducing electricity usage or exploring renewable options?",
  food: "Dietary emissions are currently your largest source of carbon. Let's discuss simple recipe shifts or ways to minimize home food waste.",
  consumption: "Shopping and consumption are driving your emissions higher. Would you like strategies on smart recycling or switching to circular product choices?",
  none: "Great job! Your emissions are low across all tracked categories. What area would you like to explore next?"
};

/**
 * Returns a response from the coach based on user prompt and footprint state.
 * @param {string} rawInput - Text submitted by the user
 * @param {Object} state - Current application state { footprint, commitments }
 * @returns {Object} Response text and list of recommended chips
 */
export function getCoachResponse(rawInput, state = {}) {
  const query = rawInput.toLowerCase().trim();
  const footprint = state.footprint || { total: 0, breakdown: { transport: 0, energy: 0, food: 0, consumption: 0 } };
  
  // Calculate primary emission sector
  let maxCat = 'none';
  let maxVal = 0;
  if (footprint.total > 0) {
    Object.keys(footprint.breakdown).forEach(key => {
      if (footprint.breakdown[key] > maxVal) {
        maxVal = footprint.breakdown[key];
        maxCat = key;
      }
    });
  }

  // Define response container
  let reply = "";
  let chips = ["Compare benchmarks", "My highest emitter", "Show eco-actions", "General tips"];

  // 1. MATCH SYSTEM TRIGGERS & CONTEXT QUESTIONS
  if (query.includes('hi') || query.includes('hello') || query.includes('hey') || query.includes('start')) {
    reply = `Hello! I'm Eco, your personalized carbon coaching assistant. ${footprint.total > 0 
      ? `I see your annual carbon footprint is estimated at **${footprint.total} tCO2e**. I can help you find high-impact changes to reduce this.` 
      : 'To start, please complete the Carbon Footprint Calculator tab, and I can analyze your lifestyle to give personalized reduction recommendations.'}`;
  } 
  
  else if (query.includes('highest') || query.includes('biggest') || query.includes('emitter') || query.includes('breakdown')) {
    if (footprint.total === 0) {
      reply = "You haven't calculated your footprint yet! Please fill out the Calculator tab first so I can identify your top carbon output areas.";
    } else {
      reply = `Your biggest carbon contributor is **${maxCat.toUpperCase()}** at **${maxVal.toFixed(1)} metric tons** annually (${Math.round((maxVal/footprint.total)*100)}% of your total). ${TOP_EMITTER_PROMPTS[maxCat]}`;
      chips = [`Reduce ${maxCat} emissions`, "How to recycle", "Calculate footprint", "Compare benchmarks"];
    }
  }

  else if (query.includes('benchmark') || query.includes('paris') || query.includes('average') || query.includes('target')) {
    if (footprint.total === 0) {
      reply = "Once calculated, your emissions are matched against global benchmarks: the Paris Climate Target is **2.0 tons**, the Global Average is **4.5 tons**, and the US Average is **16.0 tons** per person annually. What's your goal?";
    } else {
      const timesGlobal = (footprint.total / 4.5).toFixed(1);
      const isTargetMet = footprint.total <= 2.0;
      reply = `Your footprint is **${footprint.total} tCO2e/year**. That's **${timesGlobal}x** the sustainable global average. ${isTargetMet 
        ? "Excellent work! You are meeting the Paris Agreement target of 2.0 tons." 
        : "To reach the 2.0-ton Paris target, we should focus on reducing your largest consumption habits."}`;
    }
  }

  else if (query.includes('transport') || query.includes('car') || query.includes('flight') || query.includes('travel')) {
    const list = COACH_KNOWLEDGE.transport;
    reply = `Here are actions for transportation emissions:\n\n` + list.join('\n\n');
    chips = ["Reduce transport emissions", "My highest emitter", "Compare benchmarks"];
  }

  else if (query.includes('energy') || query.includes('electric') || query.includes('gas') || query.includes('heat')) {
    const list = COACH_KNOWLEDGE.energy;
    reply = `Here are ideas to curb home energy footprint:\n\n` + list.join('\n\n');
    chips = ["Reduce energy emissions", "Green energy tariff", "General tips"];
  }

  else if (query.includes('diet') || query.includes('food') || query.includes('meat') || query.includes('vegan') || query.includes('waste')) {
    const list = COACH_KNOWLEDGE.diet;
    reply = `Here is how to optimize food-related emissions:\n\n` + list.join('\n\n');
    chips = ["Meatless Mondays", "Reduce food waste", "My highest emitter"];
  }

  else if (query.includes('shop') || query.includes('consumption') || query.includes('buy') || query.includes('recycle') || query.includes('waste')) {
    const list = COACH_KNOWLEDGE.consumption;
    reply = `Here are consumption reduction strategies:\n\n` + list.join('\n\n');
    chips = ["How to recycle", "Minimalist shopping", "Go paperless"];
  }

  else if (query.includes('action') || query.includes('eco-action') || query.includes('reduce') || query.includes('help')) {
    reply = "To start reducing your footprint, visit the **Action Planner** tab. You can commit to direct tasks like: switching to LEDs, choosing hybrid commuting, or opting for meatless meals. What category are you hoping to work on first?";
    chips = ["Reduce transport emissions", "Reduce energy emissions", "Reduce diet emissions", "How to recycle"];
  }

  else {
    // Default reply using generic base tips
    const randTip = COACH_KNOWLEDGE.general[Math.floor(Math.random() * COACH_KNOWLEDGE.general.length)];
    reply = `I'm not sure I fully understood that request, but here is an eco-coaching tip: \n\n${randTip}\n\nTry asking me about your "highest emitter", "benchmarks", or specific areas like "energy", "diet", or "transport".`;
  }

  return { reply, chips };
}

/**
 * Returns dynamic insights based on footprint state.
 * Used for dashboard insight cards.
 * @param {Object} footprint - User footprint breakdown
 * @returns {Array} List of specific insight objects { title, text, type }
 */
export function getDashboardInsights(footprint) {
  if (!footprint || footprint.total === 0) {
    return [
      {
        title: "Calculations Incomplete",
        text: "Please complete the Carbon Footprint Calculator wizard to generate custom carbon reduction advice.",
        type: "info"
      }
    ];
  }

  const insights = [];
  const { transport, energy, food, consumption } = footprint.breakdown;

  // Transport insight
  if (transport > 4.0) {
    insights.push({
      title: "High Commuting Footprint",
      text: `Your transport emissions (${transport.toFixed(1)} t) exceed global targets. Swapping one drive weekly for a train, bus, or cycle reduces transit impact significantly.`,
      type: "critical"
    });
  } else if (transport > 0) {
    insights.push({
      title: "Efficient Transport Habits",
      text: `Good commute levels (${transport.toFixed(1)} t). Maintain low flight counts and fuel-efficient vehicles to keep transport impact low.`,
      type: "positive"
    });
  }

  // Energy insight
  if (energy > 3.0) {
    insights.push({
      title: "Energy Draw Detected",
      text: `Home energy is accounting for ${energy.toFixed(1)} t. Moving to a renewable power supplier grid will bring this category close to zero.`,
      type: "critical"
    });
  }

  // Food insight
  if (food > 2.0) {
    insights.push({
      title: "High Carbon Food Footprint",
      text: "Diet emissions are elevated. Reducing red meat intake or setting a plan for low-waste meal preps can save up to 1.0 tons annually.",
      type: "critical"
    });
  } else if (food > 0 && food <= 1.4) {
    insights.push({
      title: "Conscious Eating Habits",
      text: "Your dietary emissions represent an eco-friendly low-meat or plant-based consumption level. Outstanding job!",
      type: "positive"
    });
  }

  // General benchmark target
  if (footprint.total <= 2.0) {
    insights.push({
      title: "Paris Agreement Compliant!",
      text: `Outstanding! Your total carbon footprint (${footprint.total} t) meets the global goal. Keep up the green lifestyle.`,
      type: "positive"
    });
  } else {
    insights.push({
      title: "Track Reductions",
      text: "Aim to reduce your annual total by committing to 3 green actions in the Action Planner tab to decrease your carbon profile.",
      type: "info"
    });
  }

  return insights;
}

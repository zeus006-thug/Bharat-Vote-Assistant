# EcoPulse — Carbon Footprint Tracker & Assistant

EcoPulse is a state-of-the-art, high-security carbon footprint tracker and coaching system designed for urban professionals. Built for the Prompt Wars Challenge, it is a fully client-side Single Page Application (SPA) that operates with **Zero-Knowledge Privacy** — storing all data locally in the browser's sandbox (`localStorage`) and requiring zero network APIs, external libraries, or trackers.

## 🎯 Chosen Vertical & Persona
- **Chosen Vertical**: Personal Carbon Coaching & Lifestyle Optimization for Urban Professionals.
- **Target Persona**: The busy urban professional who wants to make a real, measurable contribution to climate action but has limited time. They need immediate, clear carbon calculations, structured daily targets, and gamified progress without compromising their personal data privacy.

---

## 🛠️ Approach and Logic

### 1. Calculation Engine (`calculator.js`)
EcoPulse uses carbon intensity parameters derived from **EPA (US Environmental Protection Agency)** and **IPCC** methodologies to convert activities into Metric Tons of CO2 equivalent ($tCO_2e$) per year:
- **Transportation**:
  - Cars: Gasoline (~0.404 kg/mi), Diesel (~0.420 kg/mi), Hybrid (~0.210 kg/mi), and Electric (~0.110 kg/mi, accounting for national grid mix).
  - Public Transit: Bus/Train average (~0.089 kg/mi per passenger).
  - Aviation: Evaluated by flights taken. Short-haul (~500 mi roundtrip at 0.225 kg/mi), Medium-haul (~2000 mi roundtrip at 0.150 kg/mi), and Long-haul (~6000 mi roundtrip at 0.130 kg/mi).
- **Home Energy**:
  - Electricity: Monthly bill converted to kWh using average rates ($0.16/kWh) and grid emissions factor (0.371 kg/kWh). Adjusts for renewable/solar share offsets.
  - Gas: Monthly bill converted to therms ($1.20/therm) and combustion emissions factor (5.306 kg/therm).
- **Diet & Food**:
  - Base footprint scale (Heavy Meat: 3.3t, Mixed Diet: 2.5t, Low Meat: 1.9t, Vegetarian: 1.4t, Vegan: 1.0t) adjusted dynamically by ±15% based on self-reported food waste behavior.
- **Consumption & Waste**:
  - Baseline buying habits (Minimalist: 0.6t, Moderate: 1.4t, Intensive: 2.8t) offset by active recycling habits (up to -0.21t deduction for recycling paper, plastics, glass, and metal).

### 2. Smart Sustainability Coach (`assistant.js`)
To align with high-security constraints and eliminate public API key exposure, the virtual assistant **"Eco"** runs a client-side rules engine. It parses the user's footprint outputs dynamically:
- Evaluates which category (Transport, Energy, Diet, Shopping) represents the user's highest emission source.
- Triggers context-aware suggestions (e.g., if Transport emissions exceed 4.0t, it prompts for specific active-commute shifts).
- Simulates natural chat flows (with typing indicators) and provides suggestion chips for rapid navigation.

### 3. Lightweight SVG Chart Library (`chart.js`)
Instead of importing large graphing frameworks, EcoPulse generates vector SVGs programmatically in JavaScript. This keeps the application size **under 100KB** (well below the 10MB challenge limit) and prevents external script injection vulnerabilities.

---

## 🔒 High-Security Implementation
Security and safety are core architectural constraints of EcoPulse:
1. **Zero Cloud Transmission**: 100% of user profile inputs and footprint data stay inside the client browser. No cloud backend, databases, or cookies are used.
2. **Content Security Policy (CSP)**: Strict headers restrict style/script execution to self-source and trusted Google Font assets.
3. **XSS Protection**: Complete avoidance of `innerHTML` or `eval()`. Chat input is strictly escaped, and text elements are generated using `textContent` and safe DOM node creation.

---

## ♿ Inclusive Accessibility (a11y)
- **Keyboard Friendly**: Custom inputs and navigation buttons use accessible focus rings. Skip-to-content anchors are provided for keyboard-only users.
- **Screen Reader Support**: Invisible ARIA tables are rendered alongside custom SVG charts, mapping data points into clear tabular format for screen readers via `aria-describedby` links.
- **Color Contrast**: Complies with WCAG AA requirements, using high-contrast forest greens, golds, and slates.

---

## 📋 Key Assumptions Made
- Average electricity cost is assumed to be **$0.16 per kWh** globally.
- Average natural gas cost is assumed to be **$1.20 per therm**.
- Flight segments are modeled on fixed averages: Short-haul (500 miles round trip), Medium-haul (2000 miles round trip), and Long-haul (6000 miles round trip).
- Reductions from committing to green actions are projected offset savings subtracted from the starting baseline calculated in the wizard.

---

## 🚀 How the Solution Works
1. **Complete the Profile**: Open the **Calculator** tab and fill out the transportation, energy, diet, and shopping sections.
2. **Review the Dashboard**: Check your net carbon total, benchmark comparison, and category distribution charts.
3. **Talk to Eco**: Open the **Smart Coach** chat. Ask questions or click suggestion chips to get immediate, context-based coaching tips.
4. **Commit & Complete**: Navigate to the **Action Planner**. Commit to green tasks. Once you complete an action, click check (✓) to log your XP points and unlock achievement Badges.

---

## 🧪 Validating Math and Logic
EcoPulse includes a pre-packaged unit test script `test.mjs` running in Node.js. It tests multiple carbon profiles and benchmark scores:
```bash
node test.mjs
```

## 📄 License
EcoPulse is open-source and licensed under the **MIT License**.

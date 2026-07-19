# ArenaPulse AI — FIFA World Cup 2026 Smart Stadium Platform

ArenaPulse AI is a high-security, GenAI-enabled Single Page Application (SPA) designed to enhance stadium operations and the overall tournament experience for fans, volunteer staff, and venue organizers during the **FIFA World Cup 2026**. 

Built for the Prompt Wars Challenge 4, the platform integrates **official Google developer tools** (such as the Google Gemini API Web SDK `@google/generative-ai` and Google Fonts) to provide real-time crowd management, intelligent navigation guidance, emergency protocols, and on-device secure ticket verification.

---

## 🎯 Chosen Vertical & Persona
Our solution addresses the **Stadium Operations & Fan Experience** vertical. Instead of restricting the platform to a single persona, ArenaPulse AI dynamically adapts to three roles via a premium role switcher:
1. **The Tournament Fan**: Needs seamless gate navigation, transit guides, accessibility assistance, multilingual translations, and cashless concession directories.
2. **The Volunteer Staff**: Needs actionable safety sweep checklists, lost-and-found child safety protocols, queue dispersion procedures, and an incident reporting interface.
3. **The Venue Organizer**: Needs global stadium capacity overviews, live gate congestion charts, volunteer allocations, and an active incident resolution command log.

---

## 🛠️ Approach and Logic

### 1. On-Device Cryptographic Ticket Verifier (`operations.js`)
To simulate high security and block counterfeit admissions at screening points:
* Standard tickets are parsed against format checks (matching the `WC2026-[A-Z0-9]{4}-[A-Z0-9]{5}` regex).
* Each valid ticket is validated by computing a simulated SHA/HMAC hash of its contents: `ticketId + matchNumber + holderName + sector + gate + seat` concatenated with a secure salt.
* The verifier checks this computed signature against the inputs on-device. When authenticated, it unlocks a customized seat direction card in the Fan Dashboard.

### 2. Smart Multilingual Assistant "Aegis" (`assistant.js`)
* **Live Google Gemini Mode**: If a user configures their Google Gemini API Key in the Settings Panel (⚙️), the app imports the official `@google/generative-ai` client-side Web SDK via an ESM loader. It runs queries against the `gemini-2.5-flash` model, using targeted system prompts injected with the active user role (`fan`, `staff`, or `organizer`).
* **Offline Fallback Simulator**: To ensure high availability and prevent failures when offline or without an API key, Aegis uses a regex keyword matcher mapping queries to MetLife Stadium's localized rules.

### 3. Programmatic SVG Analytics (`chart.js`)
To avoid large graphing packages and prevent security vulnerabilities (like external script injection vectors), the charts are rendered dynamically as scalable vector SVGs in pure JavaScript:
* **Gate Queue Wait Times (Bar Chart)**: Color-codes entry checkpoints (Green < 10 mins, Gold 10–25 mins, Red > 25 mins) based on people in queue.
* **Stand Occupancy (Donut Chart)**: Visualizes crowd density in North, East, South, and West stands with hover-interactive details.

---

## 🔒 High-Security & Verification Implementation
Security is a core design constraint of ArenaPulse AI:
1. **Zero Cloud Key Exposure**: The Google Gemini API key is stored strictly in browser `localStorage`. It is never transmitted to intermediate servers; requests go directly to Google's official API endpoint (`https://generativelanguage.googleapis.com`).
2. **Strict Content Security Policy (CSP)**: Headers restrict stylesheet/script execution. Connect rules are locked to self-source and official Google API domains, preventing XSS and injection attacks.
3. **Input Sanitization**: All chat prompts, ticket verifications, and incident report notes are strictly escaped (`/&/g`, `/</g`, `/>/g`) before rendering to the DOM.

---

## ♿ Inclusive Accessibility (a11y)
* **Screen Reader Support**: Hidden `aria-describedby` tables are updated dynamically alongside SVG charts, mapping data points into readable tabular descriptions.
* **Keyboard Friendly**: Navigations, dropdown menus, range sliders, and inputs are built using native HTML5 elements with focus indicator rings.
* **Color Contrast**: Follows WCAG AA standards using high-contrast neon highlights set against a deep indigo-violet dark theme.

---

## 📋 Key Assumptions Made
* **Stadium Context**: Real-time directions and transit guides are modeled on **MetLife Stadium (New York/New Jersey)** as a key FIFA World Cup 2026 venue.
* **Transit Math**: solo driving base speed is set to 30mph, rail transit speed is 25mph. Wait times are calculated at 0.12 mins per person in queue under moderate congestion.
* **PWA Offline caching**: Files list includes operations, charts, assistant modules, manifest, and logos for offline gate verification.

---

## 🚀 How the Solution Works
1. **Select a Role**: Toggle between **Fan**, **Staff**, or **Organizer** in the top navigation role dropdown.
2. **Verify a Ticket (Fan)**: Navigate to **Ticket Verifier**. Click "Generate Test Ticket" to see a mock ticket. Copy the cryptographic signature, enter details, and click verify to unlock customized seat navigation on your dashboard.
3. **Report Incidents (Staff)**: Switch to the Staff role, complete the safety checks, or log a spill/medical incident.
4. **Resolve Issues (Organizer)**: Switch to the Organizer role to review the live SVG dashboard charts and click "Resolve" to clear active volunteer-reported hazards.
5. **Chat with Aegis**: Enter your Google Gemini API Key in the Settings (⚙️) panel to chat with live GenAI, or query the offline simulated chatbot.

---

## 🧪 Validating Functionality
Run the built-in Node.js assertion test suite to verify ticket validation algorithms, transit maths, and alert calculations:
```bash
node test.mjs
```

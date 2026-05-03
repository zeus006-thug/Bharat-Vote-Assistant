# Prompt Wars: Bharat Vote Assistant

Welcome to the **Bharat Vote Assistant**, a modern, responsive, and highly secure web application designed for the **Google Prompt Wars** challenge. This project serves as a dynamic, interactive guide to help citizens seamlessly navigate the Indian Electoral System.

**Live Demo:** [https://bharat-vote-pw-2026.web.app](https://bharat-vote-pw-2026.web.app)

---

## 🎯 Specialization & Core Features

This project focuses on the **Educational / Civic Engagement** vertical, taking the persona of a secure, high-trust AI consultant specifically tuned to the Indian electoral process.

### 1. The 'Verified Mode' Authentication Logic
The assistant operates dynamically based on user trust:
- **General Mode:** Answers basic questions about voting rights.
- **Verified Mode:** Activated when the user inputs a 10-digit EPIC (Voter ID) or 12-digit Aadhaar. The assistant instantly shifts to providing personalized checklists and securely masks sensitive ID data (e.g., `ABCXXXX123`) to ensure absolute data privacy.

### 2. Form Navigator & BLO Localization
The assistant serves as an interactive navigator for the National Voter's Service Portal (NVSP):
- Accurately guides users to **Form 6** (New Voter), **Form 7** (Deletion), and **Form 8** (Correction).
- Emphasizes grassroots localization by educating users on finding their **Booth Level Officer (BLO)** and uses regional terms (e.g., *Vaku-Chavadi* for Polling Booths).

### 3. EVM & VVPAT Visualizer
To build trust in the voting mechanics, the application includes:
- A custom-built, responsive CSS illustration of an **Electronic Voting Machine (EVM)** and a **VVPAT machine**.
- The VVPAT window features a CSS animation demonstrating the 7-second paper slip verification process.
- Detailed step-by-step timeline of the election phases, culminating in the "Counting & Results" day.

### 4. Election Day Troubleshooting & KYC
The assistant is pre-trained with strict guardrails to handle real-world booth issues:
- Instructions for **Tendered Ballots** (if someone else voted in their name) and **Challenge Votes** (Section 49A).
- Educates voters on **Candidate KYC**, explaining how to access candidate affidavits regarding financial assets and criminal records, while remaining strictly non-partisan.

---

## 🛠 Approach and Technology Stack

- **Frontend:** React + Vite
- **Styling:** Premium Vanilla CSS (Zero Tailwind/Bootstrap to ensure custom, lightweight design). Features dark mode, glassmorphism, animated gradients, and custom scrollbars.
- **AI Integration:** Google Gemini API (`@google/genai`) configured with a highly specific system prompt and conversational memory.
- **Hosting:** Firebase Hosting, deployed directly from the `dist` build directory.
- **Size Optimization:** The entire built application is roughly ~300KB, well under the 10 MB limit.

---

## 🚀 How It Works

1. **Visual Guide:** Users are greeted with an interactive 5-step timeline of key election dates (Registration -> KYC -> Finding BLO -> Election Day -> Results).
2. **Quick Actions:** Responsive suggestion buttons ("Form 6 Registration", "Find my BLO", "Verify VVPAT") allow users to instantly query the assistant without typing.
3. **Gemini Integration:** The chat history and user context are sent to the Gemini model to provide accurate, conversational responses regarding the election, governed by strict neutrality rules.

### Assumptions Made
- Users have basic internet connectivity and use modern web browsers.
- A valid Gemini API key will be provided in the environment variables to fully enable the smart assistant feature.

---

## 💻 Getting Started (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- Google Gemini API Key

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment variables:
   Create a `.env` file in the root directory and add your Gemini API Key:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

---
*Built with ❤️ for Google Prompt Wars*

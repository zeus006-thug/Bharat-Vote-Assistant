# Prompt Wars: Election Assistant

This is a modern, responsive web application designed for the **Google Prompt Wars** challenge. It serves as an interactive Election Assistant to help users understand the election process, timelines, and steps in an easy-to-follow way.

## Overview

The Election Assistant provides citizens with a clear, visual timeline of the election process (from voter registration to election day). It features a sleek, dark-mode, glassmorphic UI built with **React** and **Vite**. 

A core feature is the **Smart Assistant Chatbot** powered by the **Google Gemini API**, which acts as a dynamic guide to answer context-specific questions about voting rules, deadlines, and procedures.

### Chosen Vertical
**Educational / Civic Engagement**: Guiding users through the complex electoral process via conversational AI and clear visual timelines.

### Approach and Logic
- **Modern UI/UX**: Implemented a responsive design using vanilla CSS with premium aesthetics (dark mode, glassmorphism, glowing gradients, micro-animations). This ensures a highly engaging user experience.
- **Dynamic Assistant**: Integrated `@google/genai` to handle user inquiries dynamically. The chatbot uses a system prompt to stay neutral, factual, and informative about civic duties.
- **Component-Driven**: Built using React for modularity and maintainability (e.g., `Timeline`, `SmartAssistant` components).

### How It Works
1. **Visual Guide**: Users are greeted with an interactive timeline of key election dates.
2. **Contextual Help**: Users can open the floating Assistant Widget at the bottom right to ask specific questions. 
3. **Gemini Integration**: The app sends the chat history to the Gemini model to provide accurate, conversational responses regarding the election.

### Assumptions Made
- Users have basic internet connectivity and use modern web browsers.
- The default timeline focuses on a generalized election process (which can be customized to a specific state or country).
- A valid Gemini API key will be provided in the environment variables to fully enable the smart assistant feature.

---

## Getting Started

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

4. Build for production:
   ```bash
   npm run build
   ```

## Requirements Checklist
- [x] Repository size < 10 MB (Currently ~300KB)
- [x] Modern, secure, fully device responsive website
- [x] Meaningful integration of Google Services (Gemini API)
- [x] Single branch repository (main)
- [x] Clean and maintainable code structure

---
*Built with ❤️ for Google Prompt Wars*

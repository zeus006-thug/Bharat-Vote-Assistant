import React from 'react';
import './App.css';
import Timeline from './components/Timeline';
import SmartAssistant from './components/SmartAssistant';

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h1>Bharat Vote Assistant</h1>
        <p>Your secure, high-trust digital guide to the Indian Electoral System. From NVSP registration to VVPAT verification, navigate your civic duty with confidence.</p>
      </header>

      <main>
        <Timeline />
      </main>

      <SmartAssistant />
    </div>
  );
}

export default App;

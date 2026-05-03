import React, { Suspense, lazy } from 'react';
import './App.css';

const Timeline = lazy(() => import('./components/Timeline'));
const SmartAssistant = lazy(() => import('./components/SmartAssistant'));

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h1>Bharat Vote Assistant</h1>
        <p>Your secure, high-trust digital guide to the Indian Electoral System. From NVSP registration to VVPAT verification, navigate your civic duty with confidence.</p>
      </header>

      <main>
        <Suspense fallback={<div style={{textAlign: 'center', padding: '2rem'}}>Loading timeline...</div>}>
          <Timeline />
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <SmartAssistant />
      </Suspense>
    </div>
  );
}

export default App;

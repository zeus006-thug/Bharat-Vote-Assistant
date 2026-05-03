import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { getAssistantResponse } from '../services/gemini';

export default function SmartAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Namaste! I am the Bharat Vote Digital Assistant. Please provide your 10-digit EPIC or 12-digit Aadhaar to enter Verified Mode, or ask any general questions about the election process.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e, quickText = null) => {
    e?.preventDefault();
    const textToSend = quickText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = { role: 'user', content: textToSend.trim() };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    if (!quickText) setInput('');
    setIsLoading(true);

    try {
      const responseText = await getAssistantResponse(newMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error communicating with the system.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="assistant-widget" aria-label="Smart Assistant Widget">
      {isOpen && (
        <section className="chat-window glass-panel" role="dialog" aria-labelledby="chat-title" aria-modal="true">
          <header className="chat-header">
            <MessageSquare size={20} color="var(--accent-primary)" aria-hidden="true" />
            <h3 id="chat-title">Bharat Vote Assistant</h3>
            <button 
              onClick={() => setIsOpen(false)}
              aria-label="Close chat assistant"
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: 'auto' }}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>
          
          <div className="chat-messages" aria-live="polite" role="log">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                {msg.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            ))}
            {isLoading && (
              <div className="message assistant" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 2s linear infinite' }} />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="quick-actions">
            <button className="quick-action-btn" onClick={(e) => handleSend(e, "How do I fill Form 6?")}>Form 6 Registration</button>
            <button className="quick-action-btn" onClick={(e) => handleSend(e, "How can I find my BLO?")}>Find my BLO</button>
            <button className="quick-action-btn" onClick={(e) => handleSend(e, "Explain VVPAT verification")}>Verify VVPAT</button>
          </div>

          <form className="chat-input-container" onSubmit={(e) => handleSend(e)} aria-label="Chat input form">
            <input
              type="text"
              className="chat-input"
              placeholder="Ask about voting..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              aria-label="Message input"
            />
            <button type="submit" className="send-btn" disabled={!input.trim() || isLoading} aria-label="Send message">
              <Send size={18} aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      {!isOpen && (
        <button className="chat-toggle-btn" onClick={() => setIsOpen(true)} aria-label="Open chat assistant" aria-expanded="false">
          <MessageSquare size={28} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import "../styles/ChatWidget.css";
import c3poIcon from "../assets/c3po_icon.jpg";

const N8N_CHAT_WEBHOOK_URL = import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL;

// Splits on **pairs** and bolds what's between them. Everything else stays as
// plain text nodes (not HTML), so this can't be used to inject markup.
function renderWithBold(text) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

const INITIAL_MESSAGE = {
  role: "bot",
  text: "Hello, Master Marcus! How may I assist you today? You can ask me about your spending, monthly totals, category breakdowns, trends, or any other questions about your financial history.",
};

export default function ChatWidget() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMessage = { role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch(N8N_CHAT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);

      const data = await res.json();
      const botText = data.reply ?? data.output ?? "Hmm, I didn't get a response back.";

      setMessages((prev) => [...prev, { role: "bot", text: botText }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Couldn't reach the statement bot just now. Check the n8n webhook and try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="chat-shell">
      <div className="chat-header">
        <div className="chat-avatar">
          <img src={c3poIcon} alt="Spending buddy avatar" className="chat-avatar-img" />
        </div>
        <div>
          <p className="chat-title">C-3PO the Credit Droid</p>
          <p className="chat-subtitle">Ask anything about your visa spending history</p>
        </div>
      </div>

      <div className="chat-scroll" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`bubble-row ${m.role}`}>
            <div className={`bubble ${m.role}`}>{renderWithBold(m.text)}</div>
          </div>
        ))}

        {isTyping && (
          <div className="bubble-row bot">
            <div className="bubble bot typing">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-row">
        <textarea
          className="chat-input"
          placeholder="Ask about your statements"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="send-button"
          onClick={sendMessage}
          disabled={!input.trim() || isTyping}
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2 15 22 11 13 2 9 22 2Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
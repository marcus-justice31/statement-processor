import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/processorchat.css";
import c3poIcon from "../assets/r2d2_icon.jpg";

const VISA_PROCESSOR_CHAT_WEBHOOK_URL = import.meta.env.VISA_PROCESSOR_CHAT_WEBHOOK_URL;

const INITIAL_MESSAGE = {
  role: "bot",
  type: "text",
  text: "Drop a visa statement PDF here, or use the + button, and I'll pull out the transactions for you to review before saving.",
};

function formatFileSize(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function ProcessorChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  function appendMessage(msg) {
    setMessages((prev) => [...prev, msg]);
  }

  function updateMessageAt(index, patch) {
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  // --- Staging a file (not sent yet) --------------------------------------

  function handleFilePicked(file) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      appendMessage({ role: "bot", type: "text", text: "That doesn't look like a PDF — only PDF statements are supported right now." });
      return;
    }
    setPendingFile(file);
  }

  function clearPendingFile() {
    setPendingFile(null);
  }

  // --- Sending (text, staged file, or both together) ----------------------

  async function handleSend() {
    if (isTyping) return;
    const trimmed = input.trim();
    if (!trimmed && !pendingFile) return;

    if (pendingFile) {
      const file = pendingFile;
      setPendingFile(null);
      await uploadFile(file);
    }
    if (trimmed) {
      setInput("");
      await sendText(trimmed);
    }
  }

  async function sendText(text) {
    appendMessage({ role: "user", type: "text", text });
    setIsTyping(true);
    try {
      const res = await fetch(VISA_PROCESSOR_CHAT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "message", message: text }),
      });
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
      const data = await res.json();
      appendMessage({ role: "bot", type: "text", text: data.output ?? data.reply ?? data.message ?? "Got it." });
    } catch {
      appendMessage({ role: "bot", type: "text", text: "Couldn't reach the workflow just now. Try again in a moment." });
    } finally {
      setIsTyping(false);
    }
  }

  async function uploadFile(file) {
    appendMessage({ role: "user", type: "file", fileName: file.name, fileSize: file.size });
    setIsTyping(true);

    try {
      const formData = new FormData();
      formData.append("type", "upload");
      formData.append("file", file);

      const res = await fetch(VISA_PROCESSOR_CHAT_WEBHOOK_URL, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);

      const data = await res.json();
      const transactions = Array.isArray(data.transactions) ? data.transactions : [];

      if (transactions.length === 0) {
        appendMessage({ role: "bot", type: "text", text: data.message ?? "I couldn't find any transactions in that PDF." });
      } else {
        appendMessage({
          role: "bot",
          type: "review",
          intro: data.message ?? `I found ${transactions.length} transaction${transactions.length === 1 ? "" : "s"}. Take a look and confirm when it's right:`,
          transactions,
          confirmed: false,
        });
      }
    } catch {
      appendMessage({ role: "bot", type: "text", text: "Couldn't process that file. Check the n8n webhook and try again." });
    } finally {
      setIsTyping(false);
    }
  }

  async function handleConfirm(messageIndex, editedTransactions) {
    updateMessageAt(messageIndex, { transactions: editedTransactions, confirming: true });
    setIsTyping(true);

    try {
      const res = await fetch(VISA_PROCESSOR_CHAT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "confirm", transactions: editedTransactions }),
      });
      if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
      const data = await res.json();

      updateMessageAt(messageIndex, { confirmed: true, confirming: false });
      appendMessage({ role: "bot", type: "text", text: data.message ?? data.output ?? "Saved — those transactions are in your records now." });
    } catch {
      updateMessageAt(messageIndex, { confirming: false });
      appendMessage({ role: "bot", type: "text", text: "Couldn't save that just now. Your edits are still here — try confirming again." });
    } finally {
      setIsTyping(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // --- Drag and drop --------------------------------------------------

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    handleFilePicked(dropped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page">
      <div className="chat-page-wrap">
        <button className="back-link" onClick={() => navigate('/v2')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M8.5 3L4 7l4.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>

        <div
          className="chat-shell"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="chat-header">
            <div className="chat-avatar">
              <img src={c3poIcon} alt="Statement intake bot avatar" className="chat-avatar-img" />
            </div>
            <div>
              <p className="chat-title">Statement Intake Bot</p>
              <p className="chat-subtitle">Upload &amp; review new statements</p>
            </div>
          </div>

          <div className="chat-scroll" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`bubble-row ${m.role}`}>
                {m.type === "text" && <div className={`bubble ${m.role}`}>{m.text}</div>}

                {m.type === "file" && (
                  <div className={`bubble ${m.role} file-bubble`}>
                    <FileIcon />
                    <div className="file-bubble-info">
                      <span className="file-bubble-name">{m.fileName}</span>
                      <span className="file-bubble-size">{formatFileSize(m.fileSize)}</span>
                    </div>
                  </div>
                )}

                {m.type === "review" && (
                  <ReviewCard
                    intro={m.intro}
                    transactions={m.transactions}
                    confirmed={m.confirmed}
                    confirming={m.confirming}
                    onConfirm={(edited) => handleConfirm(i, edited)}
                  />
                )}
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

          {isDragging && (
            <div className="drop-overlay">
              <div className="drop-overlay-inner">
                <UploadIcon />
                <p>Drop your PDF here</p>
              </div>
            </div>
          )}

          {pendingFile && (
            <div className="pending-file-row">
              <div className="pending-file-chip">
                <FileIcon />
                <div className="file-bubble-info">
                  <span className="file-bubble-name">{pendingFile.name}</span>
                  <span className="pending-file-size">{formatFileSize(pendingFile.size)}</span>
                </div>
                <button className="pending-file-remove" onClick={clearPendingFile} aria-label="Remove file" type="button">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="chat-input-row">
            <button
              className="plus-button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach a PDF statement"
              type="button"
            >
              <PlusIcon />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden-file-input"
              onChange={(e) => {
                handleFilePicked(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <textarea
              className="chat-input"
              placeholder={pendingFile ? "Add a note, or just hit send" : "Ask a question, or attach a PDF"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className="send-button"
              onClick={handleSend}
              disabled={(!input.trim() && !pendingFile) || isTyping}
              aria-label="Send message"
              type="button"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Review card: editable transaction table shown inside a bot bubble ---

function ReviewCard({ intro, transactions, confirmed, confirming, onConfirm }) {
  const [rows, setRows] = useState(transactions);

  function updateField(index, field, value) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function removeRow(index) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  const locked = confirmed || confirming;

  return (
    <div className="bubble bot review-bubble">
      <p className="review-intro">{intro}</p>

      <div className="review-table">
        <div className="review-row review-row-header">
          <span>Date</span>
          <span>Description</span>
          <span>Amount</span>
          <span>Category</span>
          <span aria-hidden="true"></span>
        </div>
        {rows.map((row, i) => (
          <div className="review-row" key={i}>
            <input
              value={row.date ?? ""}
              onChange={(e) => updateField(i, "date", e.target.value)}
              disabled={locked}
              placeholder="MM/DD"
            />
            <input
              value={row.description ?? ""}
              onChange={(e) => updateField(i, "description", e.target.value)}
              disabled={locked}
              placeholder="Description"
            />
            <input
              value={row.amount ?? ""}
              onChange={(e) => updateField(i, "amount", e.target.value)}
              disabled={locked}
              placeholder="0.00"
              inputMode="decimal"
            />
            <input
              value={row.category ?? ""}
              onChange={(e) => updateField(i, "category", e.target.value)}
              disabled={locked}
              placeholder="Category"
            />
            {!locked && (
              <button className="review-remove" onClick={() => removeRow(i)} aria-label="Remove row" type="button">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        className="review-confirm-btn"
        onClick={() => onConfirm(rows)}
        disabled={locked || rows.length === 0}
        type="button"
      >
        {confirmed ? "Saved ✓" : confirming ? "Saving…" : "Looks good, save it"}
      </button>
    </div>
  );
}

// --- Icons ---

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2 15 22 11 13 2 9 22 2Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2v13" strokeLinecap="round" />
      <path d="M7 8l5-6 5 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
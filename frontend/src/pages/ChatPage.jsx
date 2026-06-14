import { useState, useRef, useEffect } from "react";
import { Scale, Send } from "lucide-react";
import { callGemini, extractCitations, LEGAL_SYSTEM, QUICK_QS, DOMAINS } from "../utils";

function LoadingDots() {
  return (
    <span className="loading-dots">
      <span /><span /><span />
    </span>
  );
}

function CitationPill({ label, type }) {
  const icons = { constitution: "📜", judgment: "⚖️", statute: "📋" };
  return (
    <span className={`citation-pill ${type}`}>
      {icons[type] || "📌"} {label}
    </span>
  );
}

export default function ChatPage() {
  const [msgs, setMsgs] = useState([{
    role: "ai",
    text: "Namaskar. I am NyayaBot — your professional AI legal assistant for Indian law.\n\nI provide research assistance on Constitutional, Criminal, Civil, Family, Property, and Labour law with precise citations from the Constitution and Supreme Court and High Court judgments.\n\nPlease state your legal query below.",
    done: true
  }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [domain, setDomain] = useState("All");
  const bot = useRef(null);

  useEffect(() => {
    bot.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async (q) => {
    const txt = (q || input).trim();
    if (!txt || busy) return;
    setInput("");
    setMsgs(p => [...p, { role: "user", text: txt }, { role: "ai", text: "", done: false }]);
    setBusy(true);
    try {
      const ctx = domain !== "All" ? `\n[Domain: ${domain} law]` : "";
      await callGemini(LEGAL_SYSTEM, txt + ctx, s => {
        setMsgs(p => { const c = [...p]; c[c.length - 1] = { ...c[c.length - 1], text: s }; return c; });
      });
      setMsgs(p => { const c = [...p]; c[c.length - 1] = { ...c[c.length - 1], done: true }; return c; });
    } catch (e) {
      setMsgs(p => { const c = [...p]; c[c.length - 1] = { ...c[c.length - 1], text: "Error: " + e.message, done: true }; return c; });
    }
    setBusy(false);
  };

  return (
    <div className="chat-container">
      {/* Domain chips */}
      <div className="chat-domain-bar">
        {DOMAINS.map(d => (
          <button
            key={d}
            className={`chat-domain-chip ${domain === d ? "active" : ""}`}
            onClick={() => setDomain(d)}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {msgs.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role === "user" ? "user" : ""}`}>
            <div className={`chat-msg-avatar ${m.role === "ai" ? "bot" : "user-av"}`}>
              {m.role === "ai" ? <Scale size={16} /> : "A"}
            </div>
            <div style={{ maxWidth: "82%" }}>
              <div className="chat-bubble">
                {m.text || (m.role === "ai" && !m.done ? <LoadingDots /> : "")}
              </div>
              {m.role === "ai" && m.done && m.text && (
                <div className="chat-citations">
                  {extractCitations(m.text).map((t, j) => (
                    <CitationPill key={j} {...t} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bot} />
      </div>

      {/* Quick questions */}
      {msgs.length <= 1 && (
        <div style={{ padding: "0 18px 14px" }}>
          <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>Suggested queries</p>
          <div className="chat-quick-grid">
            {QUICK_QS.map((q, i) => (
              <button
                key={i}
                className="chat-quick-btn"
                onClick={() => { setDomain(q.domain.charAt(0).toUpperCase() + q.domain.slice(1)); send(q.q); }}
              >
                <span style={{ flexShrink: 0, fontSize: 14 }}>{q.icon}</span>
                <span>{q.q}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="chat-input-area">
        <div className="chat-input-row">
          <textarea
            className="chat-textarea"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="State your legal query… (Shift+Enter for new line)"
            rows={2}
            id="chat-input"
          />
          <button
            className={`chat-send-btn ${busy || !input.trim() ? "disabled" : "enabled"}`}
            onClick={() => send()}
            disabled={busy || !input.trim()}
            id="chat-send"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="chat-disclaimer">Informational purposes only — not a substitute for qualified legal advice</p>
      </div>
    </div>
  );
}

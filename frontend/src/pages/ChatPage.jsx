import { useState, useRef, useEffect } from "react";
import { Scale, Send, MessageSquarePlus, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
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

const defaultMsgs = [{
  role: "ai",
  text: "Namaskar. I am NyayaBot — your professional AI legal assistant for Indian law.\n\nI provide research assistance on Constitutional, Criminal, Civil, Family, Property, and Labour law with precise citations from the Constitution and Supreme Court and High Court judgments.\n\nPlease state your legal query below.",
  done: true
}];

export default function ChatPage() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [msgs, setMsgs] = useState(defaultMsgs);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [domain, setDomain] = useState("All");
  const bot = useRef(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("chat_sessions");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
          setMsgs(parsed[0].msgs || defaultMsgs);
        } else {
          startNewChat();
        }
      } catch (e) {
        startNewChat();
      }
    } else {
      startNewChat();
    }
  }, []);

  // Save active session whenever msgs change
  useEffect(() => {
    if (!activeSessionId || msgs === defaultMsgs && sessions.length === 0) return;
    setSessions(prev => {
      const updated = prev.map(s => s.id === activeSessionId ? { ...s, msgs } : s);
      localStorage.setItem("chat_sessions", JSON.stringify(updated));
      return updated;
    });
  }, [msgs, activeSessionId]);

  useEffect(() => {
    bot.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const startNewChat = () => {
    const newId = crypto.randomUUID();
    const initSession = { id: newId, title: "New Chat", msgs: defaultMsgs, timestamp: Date.now() };
    setSessions(prev => [initSession, ...prev]);
    setActiveSessionId(newId);
    setMsgs(defaultMsgs);
    setDomain("All");
  };

  const loadSession = (id) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setActiveSessionId(id);
      setMsgs(session.msgs || defaultMsgs);
      setDomain("All");
    }
  };

  const send = async (q) => {
    const txt = (q || input).trim();
    if (!txt || busy) return;
    setInput("");
    
    if (msgs.length <= 1) {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title: txt.slice(0, 30) + (txt.length > 30 ? "..." : "") } : s));
    }

    const history = msgs.slice(1).map(m => ({ role: m.role, text: m.text }));
    setMsgs(p => [...p, { role: "user", text: txt }, { role: "ai", text: "", done: false }]);
    setBusy(true);
    
    try {
      const ctx = domain !== "All" ? `\n[Domain: ${domain} law]` : "";
      await callGemini(LEGAL_SYSTEM, txt + ctx, s => {
        setMsgs(p => { const c = [...p]; c[c.length - 1] = { ...c[c.length - 1], text: s }; return c; });
      }, history);
      setMsgs(p => { const c = [...p]; c[c.length - 1] = { ...c[c.length - 1], done: true }; return c; });
    } catch (e) {
      setMsgs(p => { const c = [...p]; c[c.length - 1] = { ...c[c.length - 1], text: "Error: " + e.message, done: true }; return c; });
    }
    setBusy(false);
  };

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3 className="chat-sidebar-title">Chat History</h3>
          <button className="new-chat-btn" onClick={startNewChat} title="New Chat">
            <MessageSquarePlus size={18} />
          </button>
        </div>
        <div className="chat-sidebar-list">
          {sessions.map(s => (
            <div 
              key={s.id} 
              className={`chat-session-item ${s.id === activeSessionId ? "active" : ""}`}
              onClick={() => loadSession(s.id)}
            >
              <MessageSquare size={14} />
              {s.title}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-container">
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

        <div className="chat-messages">
          {msgs.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role === "user" ? "user" : ""}`}>
              <div className={`chat-msg-avatar ${m.role === "ai" ? "bot" : "user-av"}`}>
                {m.role === "ai" ? <Scale size={16} /> : "A"}
              </div>
              <div style={{ maxWidth: "82%" }}>
                <div className="chat-bubble">
                  {m.role === "ai" && !m.done && !m.text ? <LoadingDots /> : 
                   m.role === "user" ? m.text : 
                   <ReactMarkdown className="markdown-content chat-markdown">{m.text}</ReactMarkdown>
                  }
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
    </div>
  );
}

import { useState } from "react";
import { Search, AlertCircle, Scale, Lightbulb, X, Sparkles } from "lucide-react";
import { callGemini, extractJSON, CASE_PROMPT } from "../utils";
import ReactMarkdown from "react-markdown";

function LoadingDots() {
  return <span className="loading-dots"><span /><span /><span /></span>;
}

export default function CaseFinder() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Modal State for In-App Viewer
  const [activeCase, setActiveCase] = useState(null);

  const search = async () => {
    if (!q.trim() || busy) return;
    setBusy(true);
    setRes(null);
    setErr("");
    try {
      const raw = await callGemini(CASE_PROMPT, q);
      try {
        setRes(extractJSON(raw));
      } catch {
        setRes({
          legal_issues: ["Response received but could not parse JSON"],
          applicable_laws: [],
          cases: [],
          strategy_note: "Raw response: " + raw.slice(0, 500),
        });
      }
    } catch (e) {
      setErr("API Error: " + e.message);
    }
    setBusy(false);
  };



  return (
    <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Info Card */}
      <div className="card" style={{ padding: "16px 20px" }}>
        <p style={{ fontSize: 13.5, color: "#64748B", margin: 0, lineHeight: 1.6 }}>
          Describe your case facts in detail. JurisAI will identify applicable legal principles and retrieve relevant precedents from Indian courts.
        </p>
      </div>

      {/* Search Input */}
      <textarea
        className="form-textarea"
        value={q}
        onChange={e => setQ(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && e.metaKey) search(); }}
        placeholder="e.g. My client was arrested without a warrant and detained for 72 hours without being produced before a magistrate. What are the relevant cases on illegal detention and Article 22 violations?"
        rows={5}
        id="case-query"
      />

      <button
        className="btn-primary"
        onClick={search}
        disabled={!q.trim() || busy}
        style={{ width: "100%" }}
        id="case-search-btn"
      >
        <Search size={16} />
        {busy ? "Searching case law…" : "Find Relevant Precedents"}
      </button>

      {busy && (
        <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
          <LoadingDots />
        </div>
      )}

      {err && (
        <div className="card" style={{ padding: "14px 18px", borderColor: "rgba(239,68,68,0.3)" }}>
          <p style={{ fontSize: 13, color: "#EF4444", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={16} /> {err}
          </p>
        </div>
      )}

      {res && !res.error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Legal Issues */}
          {res.legal_issues?.length > 0 && (
            <div className="card" style={{ padding: "18px 22px", borderLeft: "3px solid #3B82F6" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
                Legal issues identified
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {res.legal_issues.map((issue, i) => (
                  <span key={i} style={{
                    background: "rgba(59,130,246,0.08)",
                    border: "1px solid rgba(59,130,246,0.2)",
                    borderRadius: 20,
                    padding: "5px 14px",
                    fontSize: 13,
                    color: "#3B82F6",
                    fontWeight: 600,
                  }}>
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Applicable Laws */}
          {res.applicable_laws?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {res.applicable_laws.map((l, i) => (
                <span key={i} className="citation-pill statute">
                  <Scale size={12} /> {l.slice(0, 46)}
                </span>
              ))}
            </div>
          )}

          {/* Cases */}
          {res.cases?.map((c, i) => (
            <div className="case-card" key={i}>
              <div className="case-header">
                <div>
                  <div className="case-name">{c.name}</div>
                  <div className="case-meta">{c.citation} · {c.court} · {c.year}</div>
                </div>
                <span className={`strength-badge ${c.strength || "analogous"}`}>
                  {c.strength?.replace(/_/g, " ") || "analogous"}
                </span>
              </div>

              <div className="case-section">
                <div className="case-section-label">Held</div>
                <div className="case-section-text">{c.held}</div>
              </div>

              <div className="case-relevance">
                <div className="case-section-label" style={{ color: "rgba(16,185,129,0.7)" }}>Relevance to your matter</div>
                <div className="case-section-text" style={{ color: "#065F46" }}>{c.relevance}</div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14, paddingTop: 14, borderTop: "1px solid #F1F5F9" }}>
                <button 
                  onClick={() => setActiveCase(c)}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: "center", fontSize: 13, padding: "8px 0", cursor: "pointer" }}
                >
                  <Scale size={14} color="#FFF" /> In-App Viewer (Kanoon)
                </button>
                <a 
                  href={`https://scholar.google.com/scholar?q=${encodeURIComponent(c.name)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-ghost"
                  style={{ flex: 1, justifyContent: "center", fontSize: 13, padding: "8px 0", textDecoration: "none" }}
                >
                  <Search size={14} /> Google Scholar
                </a>
              </div>
            </div>
          ))}

          {/* Strategy Note */}
          {res.strategy_note && (
            <div className="case-strategy">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Lightbulb size={16} color="#D97706" />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#D97706", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Counsel's note
                </span>
              </div>
              <p style={{ fontSize: 13.5, color: "#92400E", margin: 0, lineHeight: 1.65 }}>{res.strategy_note}</p>
            </div>
          )}
        </div>
      )}

      {/* Zero-Cost Iframe Modal */}
      {activeCase && (
        <div className="article-modal-overlay" onClick={() => setActiveCase(null)}>
          <div className="article-modal-content" style={{ maxWidth: 1000, height: '85vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <button className="article-modal-close" onClick={() => setActiveCase(null)}>
              <X size={20} />
            </button>
            <div className="article-modal-header" style={{ paddingBottom: 15 }}>
              <h2>{activeCase.name}</h2>
              <p className="article-modal-meta">
                <Scale size={14} /> {activeCase.citation || "Citation"}
                <span style={{ margin: "0 8px", color: "#CBD5E1" }}>|</span>
                Indian Kanoon Viewer (0 API Credits)
              </p>
            </div>
            
            <div className="article-modal-body" style={{ flex: 1, padding: 0, overflow: 'hidden', borderRadius: '0 0 14px 14px' }}>
              <iframe 
                src={`https://indiankanoon.org/search/?formInput=${encodeURIComponent(activeCase.name)}`} 
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Indian Kanoon Viewer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

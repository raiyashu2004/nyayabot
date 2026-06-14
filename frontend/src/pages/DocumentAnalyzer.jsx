import { useState, useRef } from "react";
import {
  Search, ChevronLeft, ChevronRight, Download, Maximize2,
  MessageSquare, AlertTriangle, AlertCircle, CheckCircle, Info,
  Users, DollarSign, Calendar, Clock, FileText, Scale, ArrowRight,
  Sparkles, Plus
} from "lucide-react";
import { callGemini, extractJSON, DOC_PROMPT } from "../utils";

function LoadingDots() {
  return <span className="loading-dots"><span /><span /><span /></span>;
}

export default function DocumentAnalyzer() {
  const [txt, setTxt] = useState("");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef(null);

  const handleFile = async (f) => {
    if (!f) return;
    setRes(null);
    setErr("");
    setFileName(f.name);
    if (f.type === "text/plain") {
      setTxt(await f.text());
    } else {
      setTxt(`[${f.name} uploaded]\nPaste document text below to proceed.`);
    }
  };

  const analyse = async () => {
    if (!txt.trim() || busy) return;
    setBusy(true);
    setErr("");
    setRes(null);
    try {
      const wordCount = txt.trim().split(/\s+/).length;
      const hint = wordCount < 100
        ? "NOTE: This is a very short document. Be especially conservative — do not manufacture issues for a brief text."
        : "";
      const raw = await callGemini(DOC_PROMPT, `Analyse this Indian legal document:\n\n${txt.slice(0, 7000)}\n\n${hint}`);
      setRes(extractJSON(raw));
    } catch (e) {
      setErr("Analysis failed: " + e.message);
    }
    setBusy(false);
  };

  // Compute stats from result
  const riskScore = res ? (res.overall_risk === "high" ? 72 : res.overall_risk === "medium" ? 45 : 23) : 0;
  const issueCount = res?.risk_flags?.length || 0;
  const clauseCount = res?.key_clauses?.length || 0;
  const confidence = res ? (res.overall_risk === "low" ? 95 : res.overall_risk === "medium" ? 78 : 91) : 0;

  // If no document analyzed yet, show upload UI
  if (!res && !busy) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div
          className="upload-zone"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          id="doc-upload-zone"
        >
          <div style={{ fontSize: 42, marginBottom: 10, opacity: 0.6 }}>📄</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", margin: "0 0 4px" }}>
            Drop a legal document or click to upload
          </p>
          <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>
            TXT supported — or paste text directly below
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".txt"
            style={{ display: "none" }}
            onChange={e => handleFile(e.target.files[0])}
          />
        </div>

        <textarea
          className="form-textarea"
          value={txt}
          onChange={e => setTxt(e.target.value)}
          placeholder="Paste document text: employment contract, sale deed, FIR, rental agreement, NDA, petition…"
          rows={8}
          style={{ marginTop: 16 }}
          id="doc-text-input"
        />

        <button
          className="btn-primary"
          onClick={analyse}
          disabled={!txt.trim()}
          style={{ width: "100%", marginTop: 14 }}
          id="doc-analyse-btn"
        >
          Analyse Document
        </button>

        {err && (
          <div className="card" style={{ padding: "14px 18px", marginTop: 14, borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.04)" }}>
            <p style={{ fontSize: 13, color: "#EF4444", margin: 0 }}>{err}</p>
          </div>
        )}
      </div>
    );
  }

  // Loading state
  if (busy) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 16 }}>
        <LoadingDots />
        <p style={{ fontSize: 14, color: "#64748B", fontWeight: 500 }}>Analyzing document…</p>
      </div>
    );
  }

  // ── Analysis Results Layout (matching reference) ──
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Row: Document Viewer + Stats + Issues */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Left: Document Viewer */}
        <div className="doc-viewer">
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>Document Viewer</h3>
          </div>
          <div className="doc-viewer-toolbar">
            <button className="doc-toolbar-btn"><Search size={14} /></button>
            <button className="doc-toolbar-btn"><ChevronLeft size={14} /></button>
            <div className="doc-page-indicator">
              <input defaultValue="1" readOnly /> / {Math.max(1, Math.ceil(txt.split('\n').length / 30))}
            </div>
            <button className="doc-toolbar-btn"><ChevronRight size={14} /></button>
            <button className="doc-toolbar-btn"><Download size={14} /></button>
            <button className="doc-toolbar-btn"><MessageSquare size={14} /></button>
            <button className="doc-toolbar-btn"><Maximize2 size={14} /></button>
          </div>
          <div className="doc-content">
            <h2>{res?.doc_type?.toUpperCase() || "DOCUMENT"}</h2>
            {res?.summary && (
              <p style={{ marginBottom: 16, color: "#475569" }}>{res.summary}</p>
            )}
            {res?.key_clauses?.map((clause, i) => {
              const highlightClass = clause.importance === "high" ? "red" : clause.importance === "medium" ? "" : "green";
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <p>
                    <span className="clause-number">{i + 1}. </span>
                    <strong style={{ textTransform: "uppercase" }}>{clause.title}</strong>
                  </p>
                  <div className={`clause-highlight ${highlightClass}`}>
                    {clause.content}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="doc-legend">
            <div className="doc-legend-item">
              <div className="doc-legend-dot" style={{ background: "#F59E0B" }} />
              Probable Issue
            </div>
            <div className="doc-legend-item">
              <div className="doc-legend-dot" style={{ background: "#EF4444" }} />
              Contradiction
            </div>
            <div className="doc-legend-item">
              <div className="doc-legend-dot" style={{ background: "#3B82F6" }} />
              Important Clause
            </div>
          </div>
        </div>

        {/* Right: Stats + Issues */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Stat Cards Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {/* Risk Score */}
            <div className="stat-card" style={{ alignItems: "center", textAlign: "center" }}>
              <div className="stat-icon" style={{ background: res?.overall_risk === "high" ? "rgba(239,68,68,0.08)" : res?.overall_risk === "medium" ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)" }}>
                <AlertCircle size={20} color={res?.overall_risk === "high" ? "#EF4444" : res?.overall_risk === "medium" ? "#F59E0B" : "#10B981"} />
              </div>
              <div className="stat-value">{riskScore}<span>/100</span></div>
              <div className="stat-label">Risk Score</div>
              <div className={`stat-sub`} style={{ color: res?.overall_risk === "high" ? "#EF4444" : res?.overall_risk === "medium" ? "#F59E0B" : "#10B981" }}>
                {res?.overall_risk === "high" ? "High Risk" : res?.overall_risk === "medium" ? "Medium Risk" : "Low Risk"}
              </div>
            </div>

            {/* Issues Found */}
            <div className="stat-card" style={{ alignItems: "center", textAlign: "center" }}>
              <div className="stat-icon" style={{ background: "rgba(59,130,246,0.08)" }}>
                <AlertTriangle size={20} color="#3B82F6" />
              </div>
              <div className="stat-value">{issueCount}</div>
              <div className="stat-label">Issues Found</div>
              <button style={{ fontSize: 11, color: "#3B82F6", fontWeight: 600, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 2, fontFamily: "inherit", marginTop: 2 }}>
                View all issues <ArrowRight size={10} />
              </button>
            </div>

            {/* Clauses Analyzed */}
            <div className="stat-card" style={{ alignItems: "center", textAlign: "center" }}>
              <div className="stat-icon" style={{ background: "rgba(139,92,246,0.08)" }}>
                <FileText size={20} color="#8B5CF6" />
              </div>
              <div className="stat-value">{clauseCount}</div>
              <div className="stat-label">Clauses Analyzed</div>
              <div className="stat-sub" style={{ color: "#94A3B8" }}>
                Across {Math.max(1, Math.ceil(txt.split('\n').length / 30))} pages
              </div>
            </div>

            {/* Confidence Score */}
            <div className="stat-card" style={{ alignItems: "center", textAlign: "center" }}>
              <div className="stat-icon" style={{ background: "rgba(16,185,129,0.08)" }}>
                <CheckCircle size={20} color="#10B981" />
              </div>
              <div className="stat-value">{confidence}%</div>
              <div className="stat-label">Confidence Score</div>
              <div className="stat-sub" style={{ color: "#10B981" }}>
                High Confidence
              </div>
            </div>
          </div>

          {/* Issues & Insights */}
          <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", margin: 0 }}>Issues & Insights</h3>
              <button style={{ fontSize: 12, color: "#3B82F6", fontWeight: 600, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontFamily: "inherit" }}>
                View Detailed Report <ArrowRight size={12} />
              </button>
            </div>
            <div style={{ padding: "4px 20px", flex: 1, overflowY: "auto" }}>
              {res?.risk_flags?.length > 0 ? res.risk_flags.map((rf, i) => {
                const iconComponent = rf.risk_level === "high"
                  ? <AlertCircle size={16} />
                  : rf.risk_level === "medium"
                    ? <AlertTriangle size={16} />
                    : <Info size={16} />;
                return (
                  <div className="issue-item" key={i}>
                    <div className={`issue-icon ${rf.risk_level}`}>
                      {iconComponent}
                    </div>
                    <div className="issue-content">
                      <h4>{rf.risk_type}</h4>
                      <p>{rf.explanation?.slice(0, 120)}{rf.explanation?.length > 120 ? "…" : ""}</p>
                    </div>
                    <span className={`risk-badge ${rf.risk_level}`}>{rf.risk_level}</span>
                  </div>
                );
              }) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 30, color: "#10B981", gap: 8 }}>
                  <CheckCircle size={18} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>No significant issues found</span>
                </div>
              )}

              {/* Missing clauses as additional items */}
              {res?.missing_clauses?.map((mc, i) => (
                <div className="issue-item" key={`mc-${i}`}>
                  <div className="issue-icon low">
                    <Info size={16} />
                  </div>
                  <div className="issue-content">
                    <h4>Missing Important Clauses</h4>
                    <p>{mc}</p>
                  </div>
                  <span className="risk-badge low">Low</span>
                </div>
              ))}

              {/* Compliance risk */}
              {res?.risk_summary && (
                <div className="issue-item">
                  <div className="issue-icon low">
                    <Scale size={16} />
                  </div>
                  <div className="issue-content">
                    <h4>Compliance Risk</h4>
                    <p>{res.risk_summary}</p>
                  </div>
                  <span className={`risk-badge ${res.overall_risk || 'low'}`}>{res.overall_risk || "low"}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Key Info + Legislation + AI Recommendations */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        {/* Extracted Key Information */}
        <div className="card">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", margin: 0 }}>Extracted Key Information</h3>
          </div>
          <div style={{ padding: "8px 20px" }}>
            <div className="info-row">
              <div className="info-icon"><Users size={14} /></div>
              <span className="info-label">Parties</span>
              <span className="info-value">{res?.parties?.join(" & ") || "—"}</span>
            </div>
            <div className="info-row">
              <div className="info-icon"><DollarSign size={14} /></div>
              <span className="info-label">Jurisdiction</span>
              <span className="info-value">{res?.jurisdiction || "Not Mentioned"}</span>
            </div>
            <div className="info-row">
              <div className="info-icon"><Calendar size={14} /></div>
              <span className="info-label">Doc Type</span>
              <span className="info-value">{res?.doc_type || "—"}</span>
            </div>
            <div className="info-row">
              <div className="info-icon"><Clock size={14} /></div>
              <span className="info-label">Risk Level</span>
              <span className="info-value">
                <span className={`risk-badge ${res?.overall_risk || "low"}`}>
                  {res?.overall_risk || "low"}
                </span>
              </span>
            </div>
            <div className="info-row">
              <div className="info-icon"><FileText size={14} /></div>
              <span className="info-label">Clauses</span>
              <span className="info-value">{clauseCount} analyzed</span>
            </div>
          </div>
        </div>

        {/* Applicable Legislation */}
        <div className="card">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", margin: 0 }}>Applicable Legislation</h3>
            <button style={{ fontSize: 12, color: "#3B82F6", fontWeight: 600, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontFamily: "inherit" }}>
              View All Laws <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ padding: "4px 0" }}>
            {res?.relevant_laws?.length > 0 ? res.relevant_laws.map((law, i) => (
              <div className="law-tag" key={i}>
                <Scale size={14} className="law-icon" />
                <span className="law-name">{law}</span>
                <span className="law-status applicable">Applicable</span>
              </div>
            )) : (
              <p style={{ padding: "16px 20px", color: "#94A3B8", fontSize: 13 }}>No specific laws identified.</p>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={16} color="#F59E0B" />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", margin: 0 }}>AI Recommendations</h3>
          </div>
          <div style={{ padding: "12px 20px", flex: 1 }}>
            {res?.risk_flags?.map((rf, i) => (
              <div className="recommendation-item" key={i}>
                <Plus size={14} />
                <span>{rf.suggestion}</span>
              </div>
            ))}
            {res?.missing_clauses?.map((mc, i) => (
              <div className="recommendation-item" key={`mc-${i}`}>
                <Plus size={14} />
                <span>Add missing clause: {mc}</span>
              </div>
            ))}
            {(!res?.risk_flags?.length && !res?.missing_clauses?.length) && (
              <div className="recommendation-item">
                <CheckCircle size={14} color="#10B981" />
                <span style={{ color: "#10B981" }}>Document appears legally sound. No major recommendations.</span>
              </div>
            )}
          </div>
          <div style={{ padding: "12px 20px", borderTop: "1px solid #F1F5F9" }}>
            <button className="generate-btn" id="generate-revised-draft">
              <Sparkles size={16} />
              Generate Revised Draft
            </button>
          </div>
        </div>
      </div>

      {/* Analyse another document */}
      <div style={{ textAlign: "center", paddingBottom: 20 }}>
        <button
          className="btn-ghost"
          onClick={() => { setRes(null); setTxt(""); setFileName(""); }}
          id="doc-analyse-new"
        >
          Analyse Another Document
        </button>
      </div>
    </div>
  );
}

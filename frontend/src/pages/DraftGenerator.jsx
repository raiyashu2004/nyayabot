import { useState } from "react";
import { PenTool, Copy, Check, AlertTriangle } from "lucide-react";
import { callGemini, DRAFT_PROMPT, DOC_TYPES_LIST } from "../utils";

function LoadingDots() {
  return <span className="loading-dots"><span /><span /><span /></span>;
}

export default function DraftGenerator() {
  const [form, setForm] = useState({
    docType: "bail_application",
    court: "The Hon'ble Sessions Court",
    facts: "",
    relief: "",
  });
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const gen = async () => {
    if (!form.facts.trim() || busy) return;
    setBusy(true);
    setDraft("");
    const label = DOC_TYPES_LIST.find(d => d.v === form.docType)?.l || form.docType;
    try {
      await callGemini(
        DRAFT_PROMPT,
        `Draft a ${label}\nCourt: ${form.court}\nFacts: ${form.facts}\nRelief: ${form.relief || "As may be just and appropriate in law"}`,
        s => setDraft(s)
      );
    } catch (e) {
      setDraft("Error: " + e.message);
    }
    setBusy(false);
  };

  const copy = () => {
    navigator.clipboard?.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Form */}
      <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="form-field">
          <label className="form-label">Document type</label>
          <select
            className="form-select"
            value={form.docType}
            onChange={e => setForm(p => ({ ...p, docType: e.target.value }))}
            id="draft-doc-type"
          >
            {DOC_TYPES_LIST.map(d => (
              <option key={d.v} value={d.v}>{d.l}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label">Court</label>
          <input
            className="form-input"
            value={form.court}
            onChange={e => setForm(p => ({ ...p, court: e.target.value }))}
            id="draft-court"
          />
        </div>

        <div className="form-field">
          <label className="form-label">Statement of facts</label>
          <textarea
            className="form-textarea"
            value={form.facts}
            onChange={e => setForm(p => ({ ...p, facts: e.target.value }))}
            placeholder="Names of parties, relevant dates, charges or nature of dispute, sequence of events…"
            rows={5}
            id="draft-facts"
          />
        </div>

        <div className="form-field">
          <label className="form-label">Relief sought (optional)</label>
          <textarea
            className="form-textarea"
            value={form.relief}
            onChange={e => setForm(p => ({ ...p, relief: e.target.value }))}
            placeholder="State the specific order or relief you seek from the court…"
            rows={2}
            id="draft-relief"
          />
        </div>

        <button
          className="btn-primary"
          onClick={gen}
          disabled={!form.facts.trim() || busy}
          style={{ width: "100%" }}
          id="draft-generate-btn"
        >
          <PenTool size={16} />
          {busy ? "Generating draft…" : "Generate Draft Document"}
        </button>
      </div>

      {busy && !draft && (
        <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
          <LoadingDots />
        </div>
      )}

      {draft && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1E293B", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>Generated Draft</h3>
            <button className="btn-ghost" onClick={copy} id="draft-copy-btn">
              {copied ? <><Check size={14} color="#10B981" /> Copied</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>

          <div className="draft-output">
            <pre>{draft}</pre>
          </div>

          <div className="draft-warning">
            <p style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: 0 }}>
              <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
              This is an AI-generated draft for research and reference purposes only. It must be reviewed, verified, and finalised by a qualified advocate before filing in any court or tribunal.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

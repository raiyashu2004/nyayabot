import { useState } from "react";
import { FileText, Copy, X, CheckCircle, Search } from "lucide-react";

const TEMPLATES = [
  { id: 1, title: "Non-Disclosure Agreement (NDA)", category: "Corporate", content: "THIS NON-DISCLOSURE AGREEMENT (the \"Agreement\") is entered into on [Date] by and between [Party A], having its principal place of business at [Address], and [Party B], having its principal place of business at [Address].\n\n1. Definition of Confidential Information\nFor purposes of this Agreement, \"Confidential Information\" shall include all information or material that has or could have commercial value or other utility in the business in which Disclosing Party is engaged.\n\n2. Obligations of Receiving Party\nReceiving Party shall hold and maintain the Confidential Information in strictest confidence for the sole and exclusive benefit of the Disclosing Party.\n\n3. Governing Law\nThis Agreement shall be governed by the laws of India and courts in [City] shall have exclusive jurisdiction." },
  { id: 2, title: "Commercial Lease Agreement", category: "Property", content: "THIS LEASE AGREEMENT is made on this [Date] day of [Month], [Year] between [Landlord Name] (hereinafter referred to as the \"Lessor\") and [Tenant Name] (hereinafter referred to as the \"Lessee\").\n\n1. The Lessor hereby leases to the Lessee the premises situated at [Full Address] for a period of [Duration] commencing from [Start Date].\n\n2. The Lessee agrees to pay a monthly rent of Rs. [Amount] on or before the [Day] of every month.\n\n3. The Lessee has paid a security deposit of Rs. [Amount], which shall be refundable at the time of vacating the premises, subject to deductions for damages.\n\n4. This Agreement is subject to the Transfer of Property Act, 1882." },
  { id: 3, title: "Employment Contract", category: "Labour", content: "EMPLOYMENT AGREEMENT\n\nThis Employment Agreement is executed on [Date] between [Company Name], a company incorporated under the Companies Act, 2013 and [Employee Name].\n\n1. POSITION: The Employee is hired for the position of [Job Title].\n\n2. COMPENSATION: The Company shall pay the Employee a basic salary of Rs. [Amount] per month.\n\n3. TERMINATION: Either party may terminate this agreement by providing [Notice Period] days' written notice.\n\n4. NON-COMPETE: The Employee agrees not to engage in any competing business during the term of employment and for [Months] months thereafter." },
  { id: 4, title: "Bail Application (Sec 439 BNSS)", category: "Criminal", content: "IN THE COURT OF THE SESSIONS JUDGE AT [DISTRICT]\nBail Application No. [Number] of [Year]\n\n[Applicant Name] ... Applicant\nVersus\nState of [State] ... Respondent\n\nAPPLICATION FOR GRANT OF REGULAR BAIL UNDER SECTION 439 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS)\n\nMost Respectfully Showeth:\n1. That the applicant has been falsely implicated in FIR No. [FIR Number] dated [Date] registered at PS [Police Station] under sections [Sections].\n2. That the applicant is innocent and has no criminal antecedents.\n3. That the investigation is complete and charge-sheet has been filed, hence no custodial interrogation is required.\n\nPRAYER\nIt is therefore prayed that the applicant may be released on bail in the interest of justice." },
  { id: 5, title: "Legal Notice for Recovery of Dues", category: "Civil", content: "LEGAL NOTICE\n\nDate: [Date]\n\nTo,\n[Defaulter Name/Company]\n[Address]\n\nUnder instructions from my client [Client Name], I hereby serve you with the following Legal Notice:\n\n1. That my client had supplied goods/services to you worth Rs. [Amount] vide Invoice No. [Invoice No.] dated [Date].\n2. That despite multiple reminders, you have failed to clear the outstanding dues.\n3. You are hereby called upon to pay the principal amount of Rs. [Amount] along with interest @ [Rate]% p.a. within 15 days of receipt of this notice.\n4. Failing this, my client will be constrained to initiate civil/criminal proceedings against you under the relevant laws of India." },
  { id: 6, title: "Mutual Consent Divorce Petition", category: "Family", content: "IN THE FAMILY COURT AT [CITY]\nHMA Petition No. [Number] of [Year]\n\n[Husband Name] ... Petitioner No. 1\nAND\n[Wife Name] ... Petitioner No. 2\n\nPETITION FOR DIVORCE BY MUTUAL CONSENT UNDER SECTION 13B OF THE HINDU MARRIAGE ACT, 1955\n\nMost Respectfully Showeth:\n1. That the marriage between the petitioners was solemnized on [Date] according to Hindu rites and ceremonies.\n2. That due to irreconcilable differences, the petitioners have been living separately since [Date].\n3. That the petitioners have mutually agreed to dissolve their marriage and all issues regarding alimony, maintenance, and child custody have been settled amicably.\n\nPRAYER\nIt is prayed that this Hon'ble Court may dissolve the marriage by a decree of divorce by mutual consent." }
];

export default function Templates() {
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [copied, setCopied] = useState(false);

  const filteredTemplates = TEMPLATES.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = () => {
    if (!selectedTemplate) return;
    navigator.clipboard.writeText(selectedTemplate.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container" style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", margin: "0 0 4px" }}>Legal Templates Library</h2>
        <p style={{ color: "#64748B", margin: 0 }}>Standard Indian legal boilerplate documents ready to use or customize.</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, background: "#FFFFFF", padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0" }}>
        <Search size={18} color="#94A3B8" />
        <input 
          type="text" 
          placeholder="Search templates (e.g. 'Bail', 'NDA', 'Corporate')..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ background: "transparent", border: "none", outline: "none", flex: 1, fontSize: 15 }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {filteredTemplates.map(template => (
          <div 
            key={template.id} 
            onClick={() => setSelectedTemplate(template)}
            className="card hover-card" 
            style={{ padding: 24, cursor: "pointer", transition: "all 0.2s", border: "1px solid #E2E8F0" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ padding: 10, background: "rgba(212,175,55,0.1)", color: "#D4AF37", borderRadius: 10 }}>
                <FileText size={20} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748B", background: "#F1F5F9", padding: "4px 8px", borderRadius: 20 }}>
                {template.category}
              </span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", margin: "0 0 8px", lineHeight: 1.4 }}>{template.title}</h3>
            <p style={{ fontSize: 13, color: "#64748B", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {template.content}
            </p>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>No templates found matching your search.</div>
      )}

      {/* Template View Modal */}
      {selectedTemplate && (
        <div className="article-modal-overlay" onClick={() => setSelectedTemplate(null)}>
          <div className="article-modal-content" onClick={e => e.stopPropagation()}>
            <button className="article-modal-close" onClick={() => setSelectedTemplate(null)}>
              <X size={20} />
            </button>
            <div className="article-modal-header">
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#64748B", marginBottom: 8, display: "block" }}>
                {selectedTemplate.category} Template
              </span>
              <h2 style={{ marginTop: 0 }}>{selectedTemplate.title}</h2>
            </div>
            <div className="article-modal-body" style={{ background: "#F8FAFC", borderTop: "1px solid #E8ECF1", borderBottom: "1px solid #E8ECF1" }}>
              <pre style={{ 
                fontFamily: "inherit", whiteSpace: "pre-wrap", margin: 0, 
                fontSize: 14, lineHeight: 1.8, color: "#334155" 
              }}>
                {selectedTemplate.content}
              </pre>
            </div>
            <div style={{ padding: "20px 40px", display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button onClick={() => setSelectedTemplate(null)} style={{ background: "transparent", border: "1px solid #CBD5E1", padding: "10px 20px", borderRadius: 8, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
                Close
              </button>
              <button onClick={handleCopy} style={{ display: "flex", alignItems: "center", gap: 8, background: copied ? "#10B981" : "#1A1A1A", color: "#FFF", border: "none", padding: "10px 20px", borderRadius: 8, fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}>
                {copied ? <><CheckCircle size={16} /> Copied!</> : <><Copy size={16} /> Copy Template</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

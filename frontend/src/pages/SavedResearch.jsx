import { useState, useEffect } from "react";
import { Bookmark, Scale, MessageSquare, PenTool, ExternalLink, Trash2 } from "lucide-react";

const INITIAL_SAVED = [
  { id: 1, title: "Kesavananda Bharati v. State of Kerala", type: "Case Law", date: "Oct 12, 2025", desc: "Landmark judgment on the basic structure doctrine of the Constitution.", domain: "Constitutional" },
  { id: 2, title: "Anticipatory Bail Requirements", type: "AI Chat", date: "Oct 11, 2025", desc: "Detailed breakdown of Section 438 CrPC and recent SC guidelines on bail.", domain: "Criminal" },
  { id: 3, title: "Draft Non-Compete Clause", type: "Draft", date: "Oct 08, 2025", desc: "Customized non-compete clause drafted for a software engineering contract.", domain: "Corporate" },
  { id: 4, title: "Vishaka v. State of Rajasthan", type: "Case Law", date: "Oct 01, 2025", desc: "Guidelines for preventing sexual harassment at the workplace.", domain: "Labour" }
];

export default function SavedResearch() {
  const [savedItems, setSavedItems] = useState([]);
  const [activeTab, setActiveTab] = useState("All"); // All | Case Law | AI Chat | Draft

  useEffect(() => {
    const saved = localStorage.getItem("nyayabot_saved");
    if (saved) {
      setSavedItems(JSON.parse(saved));
    } else {
      setSavedItems(INITIAL_SAVED);
      localStorage.setItem("nyayabot_saved", JSON.stringify(INITIAL_SAVED));
    }
  }, []);

  const handleDelete = (id) => {
    const updated = savedItems.filter(i => i.id !== id);
    setSavedItems(updated);
    localStorage.setItem("nyayabot_saved", JSON.stringify(updated));
  };

  const filteredItems = activeTab === "All" ? savedItems : savedItems.filter(i => i.type === activeTab);

  const getTypeIcon = (type) => {
    if (type === "Case Law") return <Scale size={18} />;
    if (type === "AI Chat") return <MessageSquare size={18} />;
    if (type === "Draft") return <PenTool size={18} />;
    return <Bookmark size={18} />;
  };

  const getTypeColor = (type) => {
    if (type === "Case Law") return { bg: "rgba(212,175,55,0.1)", color: "#D4AF37" };
    if (type === "AI Chat") return { bg: "rgba(59,130,246,0.1)", color: "#3B82F6" };
    if (type === "Draft") return { bg: "rgba(16,185,129,0.1)", color: "#10B981" };
    return { bg: "rgba(148,163,184,0.1)", color: "#64748B" };
  };

  return (
    <div className="page-container" style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", margin: "0 0 4px" }}>Saved Research</h2>
        <p style={{ color: "#64748B", margin: 0 }}>Access your bookmarked case laws, chat histories, and generated drafts.</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, borderBottom: "1px solid #E8ECF1", paddingBottom: 16 }}>
        {["All", "Case Law", "AI Chat", "Draft"].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 16px", borderRadius: 20, fontWeight: 600, fontSize: 14, cursor: "pointer", border: "none",
              background: activeTab === tab ? "#1A1A1A" : "transparent",
              color: activeTab === tab ? "#FFF" : "#64748B",
              transition: "all 0.2s"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748B" }}>
            <Bookmark size={48} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
            <p>No saved {activeTab !== "All" ? activeTab.toLowerCase() + "s" : "items"} found.</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const style = getTypeColor(item.type);
            return (
              <div key={item.id} className="card hover-card" style={{ padding: 24, display: "flex", gap: 20, alignItems: "flex-start", border: "1px solid #E2E8F0" }}>
                <div style={{ padding: 12, borderRadius: 12, background: style.bg, color: style.color }}>
                  {getTypeIcon(item.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "#1E293B" }}>{item.title}</h3>
                      <p style={{ margin: 0, fontSize: 14, color: "#475569", lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                    <button onClick={() => handleDelete(item.id)} style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: 4 }} className="icon-btn-hover" title="Remove bookmark">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16, fontSize: 13, fontWeight: 500 }}>
                    <span style={{ color: "#64748B" }}>Saved on {item.date}</span>
                    <span style={{ padding: "4px 10px", background: "#F1F5F9", borderRadius: 6, color: "#475569" }}>{item.domain}</span>
                    <span style={{ flex: 1 }}></span>
                    <button style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "#3B82F6", fontWeight: 600, cursor: "pointer", padding: 0 }}>
                      Open Item <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

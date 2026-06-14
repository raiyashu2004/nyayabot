import { useState } from "react";
import { User, Bell, Shield, CreditCard, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Simulated form states
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [barId, setBarId] = useState(user?.barCouncilId || "");
  const [specialization, setSpecialization] = useState(user?.specialization || "");
  
  // App preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [detailedAi, setDetailedAi] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    alert("Settings saved successfully! (Simulated for this prototype)");
  };

  return (
    <div className="page-container" style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A", margin: "0 0 4px" }}>Settings</h2>
        <p style={{ color: "#64748B", margin: 0 }}>Manage your account, billing, and application preferences.</p>
      </div>

      <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
        
        {/* Settings Sidebar */}
        <div style={{ width: 240, display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => setActiveTab("profile")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: activeTab === "profile" ? "#F1F5F9" : "transparent", color: activeTab === "profile" ? "#1E293B" : "#64748B", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
            <User size={18} /> Profile & Account
          </button>
          <button onClick={() => setActiveTab("preferences")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: activeTab === "preferences" ? "#F1F5F9" : "transparent", color: activeTab === "preferences" ? "#1E293B" : "#64748B", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
            <Bell size={18} /> App Preferences
          </button>
          <button onClick={() => setActiveTab("security")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: activeTab === "security" ? "#F1F5F9" : "transparent", color: activeTab === "security" ? "#1E293B" : "#64748B", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
            <Shield size={18} /> Security
          </button>
          <button onClick={() => setActiveTab("billing")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: activeTab === "billing" ? "#F1F5F9" : "transparent", color: activeTab === "billing" ? "#1E293B" : "#64748B", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
            <CreditCard size={18} /> Billing & Plan
          </button>
        </div>

        {/* Settings Content */}
        <div style={{ flex: 1, background: "#FFFFFF", borderRadius: 12, border: "1px solid #E2E8F0", padding: 32 }}>
          
          {activeTab === "profile" && (
            <form onSubmit={handleSave}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 24px" }}>Profile Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Email Address</label>
                  <input type="email" value={email} disabled style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14, background: "#F1F5F9", color: "#64748B" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Bar Council Registration</label>
                  <input type="text" value={barId} onChange={e => setBarId(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Specialization</label>
                  <input type="text" value={specialization} onChange={e => setSpecialization(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14 }} />
                </div>
              </div>
              <button type="submit" style={{ display: "flex", alignItems: "center", gap: 8, background: "#D4AF37", color: "#FFF", padding: "10px 24px", borderRadius: 8, fontWeight: 600, border: "none", cursor: "pointer" }}>
                <Save size={16} /> Save Changes
              </button>
            </form>
          )}

          {activeTab === "preferences" && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 24px" }}>Application Preferences</h3>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid #F1F5F9" }}>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: 15 }}>Email Notifications</h4>
                  <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>Receive updates on cases and generated drafts.</p>
                </div>
                <input type="checkbox" checked={emailNotifs} onChange={e => setEmailNotifs(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#D4AF37" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid #F1F5F9" }}>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: 15 }}>Detailed AI Analysis</h4>
                  <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>NyayaBot will generate longer, more comprehensive responses.</p>
                </div>
                <input type="checkbox" checked={detailedAi} onChange={e => setDetailedAi(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#D4AF37" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0" }}>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: 15 }}>Dark Mode</h4>
                  <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>Switch dashboard to a dark color scheme.</p>
                </div>
                <input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#D4AF37" }} />
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <form onSubmit={handleSave}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 24px" }}>Security & Password</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 400, marginBottom: 24 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Current Password</label>
                  <input type="password" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8 }}>New Password</label>
                  <input type="password" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 8 }}>Confirm New Password</label>
                  <input type="password" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 14 }} />
                </div>
              </div>
              <button type="submit" style={{ display: "flex", alignItems: "center", gap: 8, background: "#1A1A1A", color: "#FFF", padding: "10px 24px", borderRadius: 8, fontWeight: 600, border: "none", cursor: "pointer" }}>
                <Save size={16} /> Update Password
              </button>
            </form>
          )}

          {activeTab === "billing" && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 24px" }}>Billing & Plan</h3>
              <div style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 24, background: "#F8FAFC", marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <span style={{ background: "#1A1A1A", color: "#FFF", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Current Plan</span>
                    <h4 style={{ fontSize: 20, margin: "12px 0 4px" }}>NyayaBot Starter</h4>
                    <p style={{ margin: 0, fontSize: 14, color: "#64748B" }}>Basic AI functionality with limited query quota.</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <h3 style={{ fontSize: 32, margin: 0 }}>Free</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>Forever</p>
                  </div>
                </div>
                <div style={{ height: 6, background: "#E2E8F0", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ width: "75%", height: "100%", background: "#D4AF37" }}></div>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#64748B", textAlign: "right" }}>75 / 100 Monthly AI Queries Used</p>
              </div>

              <div style={{ border: "1px solid rgba(212,175,55,0.3)", borderRadius: 12, padding: 24, background: "rgba(212,175,55,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: "0 0 8px", fontSize: 16, color: "#AA8529" }}>NyayaBot Professional</h4>
                  <p style={{ margin: 0, fontSize: 14, color: "#64748B", maxWidth: 300 }}>Unlock unlimited AI queries, custom case drafting, and premium API access.</p>
                </div>
                <button style={{ background: "#D4AF37", color: "#FFF", border: "none", padding: "12px 24px", borderRadius: 8, fontWeight: 600, cursor: "not-allowed", opacity: 0.8 }}>
                  Upgrade (Coming Soon)
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

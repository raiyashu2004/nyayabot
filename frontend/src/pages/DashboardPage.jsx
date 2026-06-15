import { FileSearch, MessageSquare, Search, PenTool, Scale, BookOpen, FileText, Gavel } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const STATS = [
  { icon: Scale, label: "Constitution", value: "448 Articles", color: "#3B82F6", bg: "rgba(59,130,246,0.08)" },
  { icon: BookOpen, label: "SC Judgments", value: "50,000+", color: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
  { icon: FileText, label: "Central Acts", value: "200+", color: "#10B981", bg: "rgba(16,185,129,0.08)" },
  { icon: Gavel, label: "High Courts", value: "25 Covered", color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
];

const ACTIONS = [
  { id: "chat", icon: MessageSquare, label: "Chat with JurisAI", desc: "Ask questions about Indian law with cited answers from Constitution and case law.", color: "#3B82F6", bg: "rgba(59,130,246,0.08)" },
  { id: "doc", icon: FileSearch, label: "Document Analyzer", desc: "Upload contracts, FIRs, or agreements — get risk flags, clause analysis, and relevant laws.", color: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
  { id: "cases", icon: Search, label: "Case Finder", desc: "Find past Supreme Court and High Court judgments relevant to your legal matter.", color: "#10B981", bg: "rgba(16,185,129,0.08)" },
  { id: "draft", icon: PenTool, label: "Draft Generator", desc: "AI-assisted drafting of bail applications, writ petitions, legal notices, and more.", color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
];

export default function DashboardPage({ onNavigate }) {
  const { user } = useAuth();
  const displayName = user?.fullName || "User";

  return (
    <div>
      {/* Welcome Banner */}
      <div className="dashboard-welcome">
        <h1>Welcome back, {displayName} 👋</h1>
        <p>Your AI-powered legal research assistant for Indian law. What would you like to work on today?</p>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-grid">
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div className="stat-card" key={i}>
              <div className="stat-icon" style={{ background: stat.bg }}>
                <Icon size={20} color={stat.color} />
              </div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Action Cards */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", marginBottom: 14 }}>Quick Actions</h3>
      </div>
      <div className="dashboard-actions">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              className="action-card"
              onClick={() => onNavigate(action.id)}
              id={`action-${action.id}`}
            >
              <div className="action-card-icon" style={{ background: action.bg }}>
                <Icon size={24} color={action.color} />
              </div>
              <div>
                <h3>{action.label}</h3>
                <p>{action.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

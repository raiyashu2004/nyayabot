import {
  LayoutDashboard, MessageSquare, FileSearch, Scale, Search,
  PenTool, FolderOpen, FileText, Bookmark, Settings, Sparkles
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "chat", label: "Chat with JurisAI", icon: MessageSquare },
  { id: "doc", label: "Document Analyzer", icon: FileSearch },
  { id: "research", label: "Legal Research", icon: Scale },
  { id: "cases", label: "Case Finder", icon: Search },
  { id: "draft", label: "Draft Generator", icon: PenTool },
  { id: "documents", label: "My Documents", icon: FolderOpen },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "saved", label: "Saved Research", icon: Bookmark },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Scale size={20} color="#FFFFFF" />
        </div>
        <div className="sidebar-logo-text">
          <h2>JurisAI</h2>
          <p>AI Legal Assistant</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              className={`nav-item ${activePage === item.id ? "active" : ""}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>


      {/* Footer */}
      <div className="sidebar-footer">
        <p>© 2025 JurisAI</p>
        <p>All rights reserved.</p>
      </div>
    </aside>
  );
}

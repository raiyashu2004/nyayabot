import { useState } from "react";
import { ArrowLeft, Upload, Bell, Phone, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PAGE_TITLES = {
  dashboard: { title: "Dashboard", subtitle: null },
  chat: { title: "Chat with NyayaBot", subtitle: "AI Legal Research Assistant" },
  doc: { title: "Document Analysis", subtitle: null },
  research: { title: "Legal Research", subtitle: "Search Indian law databases" },
  cases: { title: "Case Finder", subtitle: "Find relevant precedents" },
  draft: { title: "Draft Generator", subtitle: "AI-assisted legal drafting" },
  documents: { title: "My Documents", subtitle: "Manage your uploaded files" },
  templates: { title: "Templates", subtitle: "Legal document templates" },
  saved: { title: "Saved Research", subtitle: "Your bookmarked research" },
  settings: { title: "Settings", subtitle: "Account & preferences" },
};

export default function Header({ activePage, onNavigate, docName }) {
  const { user, logout, getInitials } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const pageInfo = PAGE_TITLES[activePage] || PAGE_TITLES.dashboard;

  const displayName = user?.fullName || "User";
  const initials = getInitials();

  return (
    <header className="header-bar">
      <div className="header-left">
        {activePage !== "dashboard" && (
          <button
            className="header-back-btn"
            onClick={() => onNavigate("dashboard")}
            id="header-back"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <div className="header-title">
          <h1>{pageInfo.title}</h1>
          {(docName || pageInfo.subtitle) && (
            <p>{docName || pageInfo.subtitle}</p>
          )}
        </div>
      </div>

      <div className="header-right">
        {activePage === "doc" && (
          <button className="header-upload-btn" id="header-upload">
            <Upload size={15} />
            Upload New Document
          </button>
        )}

        <button className="header-icon-btn" id="header-phone">
          <Phone size={17} />
        </button>

        <button className="header-icon-btn" id="header-notifications">
          <Bell size={17} />
          <span className="notification-badge">2</span>
        </button>

        {/* User Avatar Dropdown */}
        <div className="header-avatar-wrapper">
          <button
            className="header-avatar"
            id="header-avatar"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="header-avatar-circle">{initials}</div>
            <span className="header-avatar-name">{displayName}</span>
            <ChevronDown size={14} color="#94A3B8" style={{ transition: "transform 0.2s", transform: showDropdown ? "rotate(180deg)" : "none" }} />
          </button>

          {showDropdown && (
            <>
              <div className="dropdown-overlay" onClick={() => setShowDropdown(false)} />
              <div className="header-dropdown">
                <div className="header-dropdown-header">
                  <div className="header-avatar-circle" style={{ width: 40, height: 40, fontSize: 15 }}>{initials}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{displayName}</div>
                    <div style={{ fontSize: 12, color: "#94A3B8" }}>{user?.email || ""}</div>
                  </div>
                </div>
                <div className="header-dropdown-divider" />
                <button className="header-dropdown-item" onClick={() => { setShowDropdown(false); onNavigate("settings"); }}>
                  <User size={16} />
                  My Profile
                </button>
                <button className="header-dropdown-item" onClick={() => { setShowDropdown(false); onNavigate("settings"); }}>
                  <Settings size={16} />
                  Settings
                </button>
                <div className="header-dropdown-divider" />
                <button className="header-dropdown-item logout" onClick={() => { setShowDropdown(false); logout(); }}>
                  <LogOut size={16} />
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

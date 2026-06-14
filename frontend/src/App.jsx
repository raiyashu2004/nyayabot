import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ChatPage from "./pages/ChatPage";
import DocumentAnalyzer from "./pages/DocumentAnalyzer";
import LegalResearch from "./pages/LegalResearch";
import CaseFinder from "./pages/CaseFinder";
import DraftGenerator from "./pages/DraftGenerator";
import MyDocuments from "./pages/MyDocuments";
import Templates from "./pages/Templates";
import SavedResearch from "./pages/SavedResearch";
import Settings from "./pages/Settings";

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [authView, setAuthView] = useState("landing"); // "landing" | "login" | "register"

  // Show loading spinner briefly on initial load
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F0F2F5" }}>
        <div className="loading-dots"><span /><span /><span /></div>
      </div>
    );
  }

  // Unauthenticated: show landing / login / register
  if (!isAuthenticated) {
    if (authView === "login") {
      return <LoginPage onNavigate={(v) => setAuthView(v)} />;
    }
    if (authView === "register") {
      return <RegisterPage onNavigate={(v) => setAuthView(v)} />;
    }
    return <LandingPage onNavigate={(v) => setAuthView(v)} />;
  }

  // Authenticated: show dashboard with sidebar
  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage onNavigate={setPage} />;
      case "chat": return <ChatPage />;
      case "doc": return <DocumentAnalyzer />;
      case "research": return <LegalResearch />;
      case "cases": return <CaseFinder />;
      case "draft": return <DraftGenerator />;
      case "documents": return <MyDocuments />;
      case "templates": return <Templates />;
      case "saved": return <SavedResearch />;
      case "settings": return <Settings />;
      default: return <DashboardPage onNavigate={setPage} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={page} onNavigate={setPage} />
      <div className="main-area">
        <Header activePage={page} onNavigate={setPage} />
        <main className="content-area">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

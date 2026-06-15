import { useState, useEffect } from "react";
import { RefreshCw, BookOpen, Scale, FileText, ExternalLink, Clock, Sparkles, AlertCircle, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { callGemini, extractJSON, RESEARCH_FEED_PROMPT, ARTICLE_GENERATOR_PROMPT } from "../utils";

const CACHE_KEY = "juris_research_feed";
const CACHE_TIME = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

function FeedSkeleton() {
  return (
    <div className="feed-skeleton">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="feed-card skeleton-card">
          <div className="skeleton-header">
            <div className="skeleton-badge"></div>
            <div className="skeleton-time"></div>
          </div>
          <div className="skeleton-title"></div>
          <div className="skeleton-title short"></div>
          <div className="skeleton-desc"></div>
          <div className="skeleton-desc"></div>
        </div>
      ))}
    </div>
  );
}

export default function LegalResearch() {
  const [activeTab, setActiveTab] = useState("research"); // research | case | regulation
  const [feedData, setFeedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");

  // Article Modal State
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleContent, setArticleContent] = useState("");
  const [articleLoading, setArticleLoading] = useState(false);

  const fetchFeed = async (force = false) => {
    setLoading(true);
    setError("");

    try {
      if (!force) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          // If less than 6 hours old, use cache
          if (Date.now() - parsed.timestamp < CACHE_TIME) {
            setFeedData(parsed.data);
            setLastUpdated(parsed.timestamp);
            setLoading(false);
            return;
          }
        }
      }

      // If no cache, expired, or forced -> call Gemini
      const raw = await callGemini(RESEARCH_FEED_PROMPT, "Generate the latest Indian legal updates for the last 6 hours.");
      const data = extractJSON(raw);
      
      const cacheObj = {
        timestamp: Date.now(),
        data: data
      };
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObj));
      setFeedData(data);
      setLastUpdated(cacheObj.timestamp);
    } catch (e) {
      setError("Failed to fetch latest legal updates. " + e.message);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const getSourceColor = (source) => {
    if (!source) return { bg: "rgba(148,163,184,0.1)", color: "#64748B" };
    const s = source.toLowerCase();
    if (s.includes("supreme court")) return { bg: "rgba(212,175,55,0.1)", color: "#D4AF37" }; // Gold
    if (s.includes("high court")) return { bg: "rgba(170,133,41,0.1)", color: "#AA8529" }; // Dark Gold
    if (s.includes("openalex") || s.includes("crossref")) return { bg: "rgba(59,130,246,0.1)", color: "#3B82F6" }; // Blue
    if (s.includes("ssrn")) return { bg: "rgba(139,92,246,0.1)", color: "#8B5CF6" }; // Purple
    if (s.includes("gazette")) return { bg: "rgba(16,185,129,0.1)", color: "#10B981" }; // Green
    if (s.includes("data.gov")) return { bg: "rgba(14,165,233,0.1)", color: "#0EA5E9" }; // Light Blue
    return { bg: "rgba(148,163,184,0.1)", color: "#64748B" }; // Slate
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Unknown";
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
  };

  const handleReadFull = async (item) => {
    setSelectedArticle(item);
    setArticleLoading(true);
    setArticleContent("");
    try {
      const userMsg = `Title: ${item.title}\nSource: ${item.source}\nSummary: ${item.summary}\n\nPlease generate the full article text.`;
      const fullText = await callGemini(ARTICLE_GENERATOR_PROMPT, userMsg);
      setArticleContent(fullText);
    } catch (e) {
      setArticleContent("Error generating article. Please try again.");
    }
    setArticleLoading(false);
  };

  const closeArticle = () => {
    setSelectedArticle(null);
    setArticleContent("");
  };

  const renderFeedItems = (items) => {
    if (!items || items.length === 0) return <p className="feed-empty">No updates available right now.</p>;
    
    return (
      <div className="feed-grid">
        {items.map((item, i) => {
          const style = getSourceColor(item.source);
          return (
            <div key={item.id || i} className="feed-card">
              <div className="feed-card-header">
                <div className="feed-source-badge" style={{ background: style.bg, color: style.color, border: `1px solid ${style.color}40` }}>
                  {item.source}
                </div>
                <div className="feed-time">
                  <Clock size={13} />
                  {item.time_ago}
                </div>
              </div>
              
              <h3 className="feed-card-title">{item.title}</h3>
              
              {/* Optional specific fields */}
              {item.court_name && <p className="feed-card-meta"><Scale size={13} /> {item.court_name}</p>}
              {item.ministry && <p className="feed-card-meta"><BookOpen size={13} /> {item.ministry}</p>}
              
              <p className="feed-card-summary">{item.summary}</p>
              
              <div className="feed-card-footer">
                <div className="feed-ai-badge">
                  <Sparkles size={12} color="#D4AF37" />
                  AI Summary
                </div>
                <button className="feed-read-more" onClick={() => handleReadFull(item)}>
                  Read Full <ExternalLink size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header & Controls */}
      <div className="feed-header-bar">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1A1A1A", margin: "0 0 4px" }}>Legal Research Feed</h2>
          <p style={{ fontSize: 14, color: "#64748B", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <span className="live-dot" /> Live aggregated updates from 7+ legal databases
          </p>
        </div>
        
        <div className="feed-controls">
          {lastUpdated && !loading && (
            <span className="feed-last-updated">
              Last synced: {formatTimeAgo(lastUpdated)}
            </span>
          )}
          <button 
            className="feed-refresh-btn" 
            onClick={() => fetchFeed(true)}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            {loading ? "Syncing..." : "Refresh Feed"}
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ padding: "14px 18px", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.04)" }}>
          <p style={{ fontSize: 14, color: "#EF4444", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={16} /> {error}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="feed-tabs">
        <button 
          className={`feed-tab ${activeTab === "research" ? "active" : ""}`}
          onClick={() => setActiveTab("research")}
        >
          <BookOpen size={16} />
          Research Papers
          <span className="feed-tab-count">OpenAlex • SSRN</span>
        </button>
        <button 
          className={`feed-tab ${activeTab === "case" ? "active" : ""}`}
          onClick={() => setActiveTab("case")}
        >
          <Scale size={16} />
          Case Judgments
          <span className="feed-tab-count">SC • High Courts</span>
        </button>
        <button 
          className={`feed-tab ${activeTab === "regulation" ? "active" : ""}`}
          onClick={() => setActiveTab("regulation")}
        >
          <FileText size={16} />
          Regulations & Gazette
          <span className="feed-tab-count">Gov.in • Gazette</span>
        </button>
      </div>

      {/* Content */}
      <div className="feed-content">
        {loading ? (
          <FeedSkeleton />
        ) : (
          <>
            {activeTab === "research" && renderFeedItems(feedData?.research_feed)}
            {activeTab === "case" && renderFeedItems(feedData?.case_feed)}
            {activeTab === "regulation" && renderFeedItems(feedData?.regulation_feed)}
          </>
        )}
      </div>

      {/* Article Modal */}
      {selectedArticle && (
        <div className="article-modal-overlay" onClick={closeArticle}>
          <div className="article-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="article-modal-close" onClick={closeArticle}>
              <X size={20} />
            </button>
            <div className="article-modal-header">
              <div className="feed-source-badge" style={{ 
                background: getSourceColor(selectedArticle.source).bg, 
                color: getSourceColor(selectedArticle.source).color 
              }}>
                {selectedArticle.source}
              </div>
              <h2>{selectedArticle.title}</h2>
              <p className="article-modal-meta">
                <Clock size={14} /> Published {selectedArticle.time_ago}
                <span style={{ margin: "0 8px", color: "#CBD5E1" }}>|</span>
                <Sparkles size={14} color="#D4AF37" /> AI Generated Summary
              </p>
            </div>
            
            <div className="article-modal-body">
              {articleLoading ? (
                <div className="article-loading">
                  <div className="spinner"></div>
                  <p>Generating full analysis...</p>
                </div>
              ) : (
                <ReactMarkdown className="markdown-content">
                  {articleContent}
                </ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

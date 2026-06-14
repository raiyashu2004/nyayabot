import { useState } from "react";
import {
  Scale, MessageSquare, FileSearch, Search, PenTool, Shield,
  ArrowRight, Star, CheckCircle, BookOpen, Sparkles, Users,
  ChevronRight, Gavel, Award, Globe
} from "lucide-react";

const FEATURES = [
  { icon: MessageSquare, title: "AI Legal Chat", desc: "Ask complex legal questions and get cited answers from Constitution, statutes, and Supreme Court judgments.", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  { icon: FileSearch, title: "Document Analyzer", desc: "Upload contracts, FIRs, or agreements — get instant risk flags, clause analysis, and applicable laws.", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  { icon: Search, title: "Case Finder", desc: "Find relevant Supreme Court and High Court precedents for your legal matter with AI-powered search.", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  { icon: PenTool, title: "Draft Generator", desc: "Generate bail applications, writ petitions, legal notices, and more with proper legal formatting.", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  { icon: Shield, title: "Anti-Hallucination", desc: "Every answer is backed by real citations. If we're unsure, we tell you — no fabricated case law.", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  { icon: BookOpen, title: "Comprehensive Database", desc: "448 Constitutional articles, 50,000+ SC judgments, 200+ central statutes, and 25 High Courts covered.", color: "#0EA5E9", bg: "rgba(14,165,233,0.1)" },
];

const STEPS = [
  { num: "01", title: "Upload or Ask", desc: "Upload a legal document for analysis or type your legal question in natural language." },
  { num: "02", title: "AI Analyzes", desc: "NyayaBot scans against Indian law databases, identifies issues, and finds relevant precedents." },
  { num: "03", title: "Get Insights", desc: "Receive cited answers, risk assessments, applicable laws, and actionable recommendations." },
];

const TESTIMONIALS = [
  { name: "Adv. Priya Sharma", role: "Senior Advocate, Delhi High Court", text: "NyayaBot has transformed how I prepare for cases. The document analyzer caught risk flags in a contract that I would have spent hours reviewing manually.", rating: 5 },
  { name: "Adv. Rajesh Iyer", role: "Corporate Lawyer, Mumbai", text: "The case finder is incredibly accurate. It found directly applicable SC judgments for my client's property dispute within seconds. An invaluable tool.", rating: 5 },
  { name: "Adv. Meera Patel", role: "Criminal Law Practitioner, Gujarat", text: "As a criminal lawyer, the draft generator saves me hours on bail applications. The legal formatting is precise and the citations are always verified.", rating: 5 },
];

const STATS = [
  { value: "5,000+", label: "Legal Professionals" },
  { value: "50,000+", label: "Cases Analyzed" },
  { value: "99.2%", label: "Citation Accuracy" },
  { value: "25", label: "High Courts Covered" },
];

export default function LandingPage({ onNavigate }) {
  return (
    <div className="landing-page">
      {/* ── Navbar ──────────────────────────────────── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-nav-brand">
            <div className="landing-nav-logo">
              <Scale size={20} color="#FFFFFF" />
            </div>
            <div>
              <span className="landing-nav-name">NyayaBot</span>
              <span className="landing-nav-tag">AI Legal Assistant</span>
            </div>
          </div>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#testimonials">Testimonials</a>
          </div>
          <div className="landing-nav-actions">
            <button className="landing-btn-ghost" onClick={() => onNavigate("login")}>
              Log In
            </button>
            <button className="landing-btn-primary" onClick={() => onNavigate("register")}>
              Get Started Free
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-bg">
          <div className="landing-hero-orb orb-1" />
          <div className="landing-hero-orb orb-2" />
          <div className="landing-hero-orb orb-3" />
        </div>
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <Sparkles size={14} />
            Powered by Advanced AI · Trusted by 5,000+ Advocates
          </div>
          <h1 className="landing-hero-title">
            India's Most Trusted
            <span className="landing-hero-gradient"> AI Legal Assistant</span>
          </h1>
          <p className="landing-hero-subtitle">
            Research Indian law, analyze legal documents, find case precedents, and draft petitions — all with verified citations from the Constitution, Supreme Court, and High Court judgments.
          </p>
          <div className="landing-hero-actions">
            <button className="landing-btn-primary large" onClick={() => onNavigate("register")}>
              Start Free Research
              <ArrowRight size={18} />
            </button>
            <button className="landing-btn-outline large" onClick={() => onNavigate("login")}>
              Log In to Dashboard
            </button>
          </div>
          <div className="landing-hero-trust">
            <div className="landing-hero-avatars">
              {["P", "R", "M", "A", "S"].map((l, i) => (
                <div key={i} className="landing-hero-avatar-dot" style={{ zIndex: 5 - i, marginLeft: i > 0 ? -8 : 0 }}>
                  {l}
                </div>
              ))}
            </div>
            <div>
              <div className="landing-hero-stars">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />)}
              </div>
              <p className="landing-hero-trust-text">Trusted by 5,000+ advocates across India</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────── */}
      <section className="landing-stats">
        <div className="landing-stats-inner">
          {STATS.map((s, i) => (
            <div key={i} className="landing-stat-item">
              <div className="landing-stat-value">{s.value}</div>
              <div className="landing-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────── */}
      <section className="landing-section" id="features">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-badge">Features</span>
            <h2 className="landing-section-title">Everything You Need for Legal Research</h2>
            <p className="landing-section-subtitle">Powerful AI tools designed specifically for Indian legal professionals</p>
          </div>
          <div className="landing-features-grid">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="landing-feature-card">
                  <div className="landing-feature-icon" style={{ background: f.bg }}>
                    <Icon size={24} color={f.color} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────── */}
      <section className="landing-section alt" id="how-it-works">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-badge">How It Works</span>
            <h2 className="landing-section-title">Get Legal Insights in 3 Simple Steps</h2>
          </div>
          <div className="landing-steps">
            {STEPS.map((s, i) => (
              <div key={i} className="landing-step-card">
                <div className="landing-step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="landing-step-arrow">
                    <ChevronRight size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────── */}
      <section className="landing-section" id="testimonials">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <span className="landing-section-badge">Testimonials</span>
            <h2 className="landing-section-title">Trusted by Legal Professionals</h2>
            <p className="landing-section-subtitle">See what advocates across India are saying about NyayaBot</p>
          </div>
          <div className="landing-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="landing-testimonial-card">
                <div className="landing-testimonial-stars">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} size={14} fill="#F59E0B" color="#F59E0B" />)}
                </div>
                <p className="landing-testimonial-text">"{t.text}"</p>
                <div className="landing-testimonial-author">
                  <div className="landing-testimonial-avatar">
                    {t.name.split(" ")[1]?.[0] || t.name[0]}
                  </div>
                  <div>
                    <div className="landing-testimonial-name">{t.name}</div>
                    <div className="landing-testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────── */}
      <section className="landing-cta">
        <div className="landing-cta-inner">
          <div className="landing-cta-bg">
            <div className="landing-hero-orb orb-1" />
            <div className="landing-hero-orb orb-2" />
          </div>
          <h2>Start Your Legal Research Today</h2>
          <p>Join 5,000+ legal professionals who trust NyayaBot for accurate, cited legal research.</p>
          <button className="landing-btn-primary large white" onClick={() => onNavigate("register")}>
            Create Free Account
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <div className="landing-nav-brand">
              <div className="landing-nav-logo">
                <Scale size={18} color="#FFFFFF" />
              </div>
              <span className="landing-nav-name">NyayaBot</span>
            </div>
            <p>AI-powered legal research assistant for Indian law. Providing verified, cited legal information to advocates, law students, and citizens.</p>
          </div>
          <div className="landing-footer-links">
            <div>
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#testimonials">Testimonials</a>
            </div>
            <div>
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Disclaimer</a>
            </div>
            <div>
              <h4>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">Contact Us</a>
              <a href="#">API Docs</a>
            </div>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <p>© 2025 NyayaBot. All rights reserved. Not a substitute for qualified legal advice.</p>
        </div>
      </footer>
    </div>
  );
}

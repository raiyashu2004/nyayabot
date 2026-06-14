import { useState } from "react";
import { Scale, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const BAR_COUNCILS = [
  "Bar Council of Delhi",
  "Bar Council of Maharashtra & Goa",
  "Bar Council of Tamil Nadu",
  "Bar Council of Karnataka",
  "Bar Council of Uttar Pradesh",
  "Bar Council of West Bengal",
  "Bar Council of Rajasthan",
  "Bar Council of Gujarat",
  "Bar Council of Kerala",
  "Bar Council of Madhya Pradesh",
  "Bar Council of Telangana",
  "Bar Council of Andhra Pradesh",
  "Bar Council of Punjab & Haryana",
  "Bar Council of Bihar",
  "Bar Council of Odisha",
  "Bar Council of Jharkhand",
  "Bar Council of Assam, Nagaland, Meghalaya, Manipur, Tripura, Mizoram & Arunachal Pradesh",
  "Bar Council of Chhattisgarh",
  "Bar Council of Himachal Pradesh",
  "Bar Council of Uttarakhand",
  "Bar Council of Jammu & Kashmir",
];

const SPECIALIZATIONS = [
  "Constitutional Law",
  "Criminal Law",
  "Civil Law",
  "Corporate Law",
  "Family Law",
  "Property Law",
  "Labour & Employment Law",
  "Tax Law",
  "Intellectual Property Law",
  "Banking & Finance Law",
  "Environmental Law",
  "Cyber Law",
  "Immigration Law",
  "International Law",
  "General Practice",
];

export default function RegisterPage({ onNavigate }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    barCouncilId: "",
    stateBarCouncil: "",
    specialization: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const validate = () => {
    if (!form.fullName.trim()) return "Please enter your full name.";
    if (!form.email.trim()) return "Please enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email address.";
    if (!form.password) return "Please create a password.";
    if (form.password.length < 6) return "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    if (!form.agreeTerms) return "Please agree to the Terms of Service.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    const result = await register(form);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    } else if (result.message) {
      // Email confirmation sent
      alert(result.message);
      setLoading(false);
      onNavigate("login");
    }
  };

  return (
    <div className="auth-page">
      {/* Left: Form */}
      <div className="auth-form-side">
        <div className="auth-form-container">
          {/* Logo */}
          <div className="auth-logo" onClick={() => onNavigate("landing")}>
            <div className="landing-nav-logo">
              <Scale size={20} color="#FFFFFF" />
            </div>
            <span className="auth-logo-text">NyayaBot</span>
          </div>

          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join thousands of legal professionals using NyayaBot</p>

          {error && (
            <div className="auth-error">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label>Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Adv. Aarav Sharma"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                id="register-name"
              />
            </div>

            <div className="auth-field">
              <label>Email Address *</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                id="register-email"
              />
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label>Bar Council Reg. No.</label>
                <input
                  type="text"
                  placeholder="e.g. D/1234/2020"
                  value={form.barCouncilId}
                  onChange={(e) => update("barCouncilId", e.target.value)}
                  id="register-barcouncil-id"
                />
              </div>
              <div className="auth-field">
                <label>State Bar Council</label>
                <select
                  value={form.stateBarCouncil}
                  onChange={(e) => update("stateBarCouncil", e.target.value)}
                  id="register-state-bar"
                >
                  <option value="">Select...</option>
                  {BAR_COUNCILS.map((bc) => (
                    <option key={bc} value={bc}>{bc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="auth-field">
              <label>Specialization</label>
              <select
                value={form.specialization}
                onChange={(e) => update("specialization", e.target.value)}
                id="register-specialization"
              >
                <option value="">Select your area of practice...</option>
                {SPECIALIZATIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label>Password *</label>
                <div className="auth-pw-wrapper">
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    id="register-password"
                  />
                  <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="auth-field">
                <label>Confirm Password *</label>
                <div className="auth-pw-wrapper">
                  <input
                    type={showCpw ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                    id="register-confirm-password"
                  />
                  <button type="button" className="auth-pw-toggle" onClick={() => setShowCpw(!showCpw)}>
                    {showCpw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={form.agreeTerms}
                onChange={(e) => update("agreeTerms", e.target.checked)}
                id="register-terms"
              />
              <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
            </label>

            <button type="submit" className="auth-submit-btn" disabled={loading} id="register-submit">
              {loading ? "Creating account…" : "Create Account"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <button onClick={() => onNavigate("login")}>Log in</button>
          </p>
        </div>
      </div>

      {/* Right: Branded Panel */}
      <div className="auth-brand-side">
        <div className="auth-brand-content">
          <div className="auth-brand-badge">
            <Scale size={32} color="#FFFFFF" />
          </div>
          <h2>Your AI Legal Research Partner</h2>
          <p>Access India's most comprehensive AI-powered legal research platform with verified citations.</p>
          <div className="auth-brand-features">
            <div className="auth-brand-feature">
              <CheckCircle size={18} color="#60A5FA" />
              <span>Constitution & 50,000+ SC judgments</span>
            </div>
            <div className="auth-brand-feature">
              <CheckCircle size={18} color="#60A5FA" />
              <span>Document risk analysis with AI</span>
            </div>
            <div className="auth-brand-feature">
              <CheckCircle size={18} color="#60A5FA" />
              <span>Anti-hallucination — no fabricated citations</span>
            </div>
            <div className="auth-brand-feature">
              <CheckCircle size={18} color="#60A5FA" />
              <span>Legal drafting with proper court format</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

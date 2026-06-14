import { useState } from "react";
import { Scale, Eye, EyeOff, ArrowRight, CheckCircle, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ onNavigate }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!password) { setError("Please enter your password."); return; }

    setLoading(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error);
      setLoading(false);
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

          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Log in to access your legal research dashboard</p>

          {error && (
            <div className="auth-error">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                id="login-email"
              />
            </div>

            <div className="auth-field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label>Password</label>
                <a href="#" className="auth-forgot">Forgot password?</a>
              </div>
              <div className="auth-pw-wrapper">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  id="login-password"
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                id="login-remember"
              />
              <span>Remember me for 30 days</span>
            </label>

            <button type="submit" className="auth-submit-btn" disabled={loading} id="login-submit">
              {loading ? "Logging in…" : "Log In"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account?{" "}
            <button onClick={() => onNavigate("register")}>Create one</button>
          </p>
        </div>
      </div>

      {/* Right: Branded Panel */}
      <div className="auth-brand-side">
        <div className="auth-brand-content">
          <div className="auth-brand-badge">
            <Shield size={32} color="#FFFFFF" />
          </div>
          <h2>Secure & Confidential</h2>
          <p>Your legal research and documents are protected with enterprise-grade security.</p>
          <div className="auth-brand-features">
            <div className="auth-brand-feature">
              <CheckCircle size={18} color="#60A5FA" />
              <span>End-to-end encrypted sessions</span>
            </div>
            <div className="auth-brand-feature">
              <CheckCircle size={18} color="#60A5FA" />
              <span>No document data stored permanently</span>
            </div>
            <div className="auth-brand-feature">
              <CheckCircle size={18} color="#60A5FA" />
              <span>Bar Council verified professionals</span>
            </div>
            <div className="auth-brand-feature">
              <CheckCircle size={18} color="#60A5FA" />
              <span>Compliant with Indian data privacy laws</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

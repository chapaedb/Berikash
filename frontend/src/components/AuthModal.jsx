import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { X, Lock, Mail, User, Store } from "lucide-react";

export default function AuthModal({ onClose, onSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [error, setError] = useState(null);

  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegister) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "420px", padding: "32px", background: "#121824", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", color: "var(--text-muted)" }}>
          <X size={20} />
        </button>

        <h2 style={{ fontSize: "1.6rem", textAlign: "center", marginBottom: "8px" }}>
          {isRegister ? "Create Account" : "Welcome Back"}
        </h2>
        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "24px" }}>
          {isRegister ? "Join Berikash to discover expiring supermarket deals" : "Sign in to save deals and manage your account"}
        </p>

        {error && (
          <div style={{ padding: "10px", background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#f87171", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {isRegister && (
            <div style={{ position: "relative" }}>
              <User size={16} color="#9ca3af" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                className="input-field"
                placeholder="Full Name"
                required
                style={{ paddingLeft: "40px" }}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div style={{ position: "relative" }}>
            <Mail size={16} color="#9ca3af" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="email"
              className="input-field"
              placeholder="Email Address"
              required
              style={{ paddingLeft: "40px" }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ position: "relative" }}>
            <Lock size={16} color="#9ca3af" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="password"
              className="input-field"
              placeholder="Password"
              required
              style={{ paddingLeft: "40px" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {isRegister && (
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                type="button"
                className={`btn-secondary ${role === "customer" ? "border-emerald-500 text-emerald-400" : ""}`}
                style={{ flex: 1, padding: "8px", fontSize: "0.85rem", justifyContent: "center" }}
                onClick={() => setRole("customer")}
              >
                <User size={14} /> Shopper
              </button>
              <button
                type="button"
                className={`btn-secondary ${role === "store_owner" ? "border-emerald-500 text-emerald-400" : ""}`}
                style={{ flex: 1, padding: "8px", fontSize: "0.85rem", justifyContent: "center" }}
                onClick={() => setRole("store_owner")}
              >
                <Store size={14} /> Supermarket Owner
              </button>
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "10px", height: "44px" }}>
            {isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <span
            style={{ color: "#10b981", fontWeight: "600", cursor: "pointer" }}
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? "Sign In" : "Register Now"}
          </span>
        </div>
      </div>
    </div>
  );
}

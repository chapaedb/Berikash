import React from "react";
import { useAuth } from "../context/AuthContext";
import { ShoppingBag, Search, User, LogOut, Store, Tag } from "lucide-react";

export default function Navbar({ activeTab, setActiveTab, searchQuery, setSearchQuery }) {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="container nav-container">
        {/* Brand Logo */}
        <div 
          className="logo" 
          style={{ cursor: "pointer" }}
          onClick={() => setActiveTab("home")}
        >
          <ShoppingBag className="text-emerald-400" size={28} color="#10b981" />
          <span>Beri<span className="logo-highlight">kash</span></span>
        </div>

        {/* Global Search Bar */}
        <div style={{ position: "relative", width: "100%", maxWidth: "420px" }}>
          <Search 
            size={18} 
            color="#9ca3af" 
            style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} 
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search discounted groceries, bakery, dairy..."
            style={{ paddingLeft: "42px", height: "42px" }}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeTab !== "deals") setActiveTab("deals");
            }}
          />
        </div>

        {/* Nav Links & User Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            className={`btn-secondary ${activeTab === "deals" ? "border-emerald-500" : ""}`}
            onClick={() => setActiveTab("deals")}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Tag size={16} /> Deals
          </button>

          <button 
            className={`btn-secondary ${activeTab === "stores" ? "border-emerald-500" : ""}`}
            onClick={() => setActiveTab("stores")}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Store size={16} /> Supermarkets
          </button>

          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {(user.role === "store_owner" || user.role === "admin") && (
                <button 
                  className="btn-primary"
                  onClick={() => setActiveTab("dashboard")}
                  style={{ fontSize: "0.85rem", padding: "8px 14px" }}
                >
                  Store Dashboard
                </button>
              )}
              {user.role === "admin" && (
                <button 
                  className="btn-primary"
                  onClick={() => setActiveTab("admin")}
                  style={{ fontSize: "0.85rem", padding: "8px 14px", background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
                >
                  🛡️ Admin Panel
                </button>
              )}
              <div 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  background: "var(--bg-input)", 
                  padding: "6px 12px", 
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-color)"
                }}
              >
                <User size={16} color="#10b981" />
                <span style={{ fontSize: "0.9rem", fontWeight: "600" }}>{user.name}</span>
                <button onClick={logout} title="Logout" style={{ marginLeft: "6px" }}>
                  <LogOut size={16} color="#ef4444" />
                </button>
              </div>
            </div>
          ) : (
            <button className="btn-primary" onClick={() => setActiveTab("login")}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

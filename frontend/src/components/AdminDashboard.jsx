import React, { useState, useEffect } from "react";
import api from "../services/api";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Users,
  Store,
  Tag,
  Clock,
  Search,
  Eye,
  FileText,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  UserX,
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingStores, setPendingStores] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAdminTab, setActiveAdminTab] = useState("applications"); // applications | stores | users

  // Modals
  const [inspectLicenseStore, setInspectLicenseStore] = useState(null);
  const [rejectingStore, setRejectingStore] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, pendingRes, storesRes, usersRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/stores/admin/pending"),
        api.get("/stores"),
        api.get("/admin/users"),
      ]);

      setStats(statsRes.data);
      setPendingStores(pendingRes.data || []);
      setAllStores(storesRes.data || []);
      setUsersList(usersRes.data || []);
    } catch (err) {
      console.error("Admin fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyStore = async (storeId, status, reason = "") => {
    try {
      setActionMessage(null);
      await api.put(`/stores/${storeId}/verify`, {
        status,
        rejectionReason: reason,
      });

      setActionMessage({
        type: "success",
        text: `Supermarket application ${status === "verified" ? "approved & verified" : "rejected"} successfully!`,
      });

      setRejectingStore(null);
      setRejectionReason("");
      fetchAdminData();
    } catch (err) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      setActionMessage(null);
      const res = await api.put(`/admin/users/${userId}/status`);
      setActionMessage({ type: "success", text: res.message });
      fetchAdminData();
    } catch (err) {
      setActionMessage({ type: "error", text: err.message });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)" }}>
        <RefreshCw size={32} className="animate-spin" style={{ margin: "0 auto 12px" }} />
        <p>Loading Admin Dashboard & Security Systems...</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: "60px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldAlert size={28} color="#6366f1" /> Admin Operations Panel
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Review supermarket applications, verify business licenses, and moderate platform users.
          </p>
        </div>

        <button className="btn-secondary" onClick={fetchAdminData} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <RefreshCw size={15} /> Refresh Data
        </button>
      </div>

      {/* Global Feedback Message */}
      {actionMessage && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-sm)",
            marginBottom: "20px",
            background: actionMessage.type === "success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
            border: `1px solid ${actionMessage.type === "success" ? "#10b981" : "#ef4444"}`,
            color: actionMessage.type === "success" ? "#34d399" : "#f87171",
            fontSize: "0.9rem",
          }}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <Users size={16} color="#6366f1" /> Registered Users
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", marginTop: "6px" }}>
            {stats?.users?.total || 0}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "20px", borderLeft: "4px solid #fbbf24" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock size={16} color="#fbbf24" /> Pending Applications
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", marginTop: "6px", color: "#fbbf24" }}>
            {stats?.stores?.pending || 0}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "20px", borderLeft: "4px solid #10b981" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <Store size={16} color="#10b981" /> Verified Partner Stores
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", marginTop: "6px", color: "#34d399" }}>
            {stats?.stores?.verified || 0}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <Tag size={16} color="#818cf8" /> Active Clearance Deals
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", marginTop: "6px" }}>
            {stats?.products?.active || 0}
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
        <button
          className={`btn-secondary ${activeAdminTab === "applications" ? "border-emerald-500" : ""}`}
          onClick={() => setActiveAdminTab("applications")}
          style={{ display: "flex", alignItems: "center", gap: "8px", position: "relative" }}
        >
          <Clock size={16} /> Pending Applications
          {pendingStores.length > 0 && (
            <span style={{ background: "#fbbf24", color: "#000", fontSize: "0.7rem", fontWeight: "700", padding: "2px 6px", borderRadius: "10px" }}>
              {pendingStores.length}
            </span>
          )}
        </button>

        <button
          className={`btn-secondary ${activeAdminTab === "stores" ? "border-emerald-500" : ""}`}
          onClick={() => setActiveAdminTab("stores")}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Store size={16} /> All Supermarkets ({allStores.length})
        </button>

        <button
          className={`btn-secondary ${activeAdminTab === "users" ? "border-emerald-500" : ""}`}
          onClick={() => setActiveAdminTab("users")}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Users size={16} /> User Moderation ({usersList.length})
        </button>
      </div>

      {/* TAB 1: PENDING APPLICATIONS QUEUE */}
      {activeAdminTab === "applications" && (
        <section>
          {pendingStores.length === 0 ? (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
              <CheckCircle2 size={48} color="#10b981" style={{ margin: "0 auto 12px" }} />
              <h3>All caught up!</h3>
              <p style={{ color: "var(--text-muted)", marginTop: "6px" }}>No supermarket registration applications currently pending verification.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {pendingStores.map((s) => (
                <div key={s._id} className="glass-card" style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <h3 style={{ fontSize: "1.2rem" }}>{s.name}</h3>
                      <span className="badge badge-discount" style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)" }}>
                        Pending Verification
                      </span>
                    </div>

                    <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "12px" }}>
                      {s.description || "Supermarket registration request."}
                    </p>

                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      <div>📍 Subcity: <strong style={{ color: "#fff" }}>{s.address?.subcity || "N/A"}</strong> (Woreda {s.address?.woreda || "N/A"})</div>
                      <div>👤 Applicant: <strong style={{ color: "#fff" }}>{s.owner?.name || "N/A"}</strong> ({s.owner?.email})</div>
                      <div>📞 Phone: <strong style={{ color: "#fff" }}>{s.contact?.phone || s.owner?.phone || "N/A"}</strong></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button
                      className="btn-secondary"
                      onClick={() => setInspectLicenseStore(s)}
                      style={{ fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <FileText size={14} /> License Document
                    </button>

                    <button
                      className="btn-secondary"
                      onClick={() => setRejectingStore(s)}
                      style={{ fontSize: "0.82rem", color: "#f87171", borderColor: "rgba(239,68,68,0.3)" }}
                    >
                      <XCircle size={14} /> Reject
                    </button>

                    <button
                      className="btn-primary"
                      onClick={() => handleVerifyStore(s._id, "verified")}
                      style={{ fontSize: "0.82rem", padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      <CheckCircle2 size={15} /> 1-Click Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: ALL SUPERMARKETS */}
      {activeAdminTab === "stores" && (
        <section>
          <div className="glass-card" style={{ padding: "20px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "12px" }}>Store Name</th>
                  <th style={{ padding: "12px" }}>Type</th>
                  <th style={{ padding: "12px" }}>Subcity</th>
                  <th style={{ padding: "12px" }}>Status</th>
                  <th style={{ padding: "12px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {allStores.map((s) => (
                  <tr key={s._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px", fontWeight: "600" }}>{s.name}</td>
                    <td style={{ padding: "12px", textTransform: "capitalize", color: "var(--text-muted)" }}>
                      {s.type?.replace(/_/g, " ")}
                    </td>
                    <td style={{ padding: "12px" }}>{s.address?.subcity || "Addis Ababa"}</td>
                    <td style={{ padding: "12px" }}>
                      <span
                        className="badge"
                        style={{
                          background: s.verification?.status === "verified" ? "rgba(16,185,129,0.15)" : s.verification?.status === "rejected" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                          color: s.verification?.status === "verified" ? "#34d399" : s.verification?.status === "rejected" ? "#f87171" : "#fbbf24",
                        }}
                      >
                        {s.verification?.status || "pending"}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      {s.verification?.status !== "verified" ? (
                        <button
                          className="btn-primary"
                          onClick={() => handleVerifyStore(s._id, "verified")}
                          style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                        >
                          Approve
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.78rem", color: "#34d399" }}>Verified Partner</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: USER MODERATION */}
      {activeAdminTab === "users" && (
        <section>
          <div className="glass-card" style={{ padding: "20px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "12px" }}>User Name</th>
                  <th style={{ padding: "12px" }}>Email</th>
                  <th style={{ padding: "12px" }}>Role</th>
                  <th style={{ padding: "12px" }}>Account Status</th>
                  <th style={{ padding: "12px" }}>Toggle Moderation</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px", fontWeight: "600" }}>{u.name}</td>
                    <td style={{ padding: "12px", color: "var(--text-muted)" }}>{u.email}</td>
                    <td style={{ padding: "12px" }}>
                      <span className="badge badge-fresh" style={{ fontSize: "0.7rem", textTransform: "uppercase" }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ color: u.isActive !== false ? "#34d399" : "#f87171", fontWeight: "600" }}>
                        {u.isActive !== false ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <button
                        className="btn-secondary"
                        onClick={() => handleToggleUserStatus(u._id)}
                        style={{ fontSize: "0.75rem", padding: "4px 10px", color: u.isActive !== false ? "#f87171" : "#34d399" }}
                      >
                        {u.isActive !== false ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* INSPECT BUSINESS LICENSE MODAL */}
      {inspectLicenseStore && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: "520px", padding: "28px", background: "#121824" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3>Business License Verification</h3>
              <button onClick={() => setInspectLicenseStore(null)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>

            <div style={{ padding: "16px", background: "var(--bg-input)", borderRadius: "var(--radius-sm)", marginBottom: "20px" }}>
              <div><strong>Store Name:</strong> {inspectLicenseStore.name}</div>
              <div><strong>Subcity:</strong> {inspectLicenseStore.address?.subcity}</div>
              <div><strong>License Status:</strong> {inspectLicenseStore.verification?.businessLicense ? "Document Uploaded" : "Verified by Admin Registration"}</div>
            </div>

            {inspectLicenseStore.verification?.businessLicense ? (
              <div style={{ marginBottom: "20px", textAlign: "center" }}>
                <a
                  href={`http://localhost:5000${inspectLicenseStore.verification.businessLicense}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Eye size={16} /> Open Business License Document
                </a>
              </div>
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", background: "rgba(255,255,255,0.03)", borderRadius: "8px", marginBottom: "20px" }}>
                <FileText size={40} opacity={0.3} style={{ margin: "0 auto 8px" }} />
                Standard retail registration without digital attachment. Verified via owner contact.
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setInspectLicenseStore(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT APPLICATION MODAL */}
      {rejectingStore && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: "480px", padding: "28px", background: "#121824" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ color: "#f87171" }}>Reject Application</h3>
              <button onClick={() => setRejectingStore(null)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>

            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "16px" }}>
              Please specify the rejection reason for <strong>{rejectingStore.name}</strong>:
            </p>

            <textarea
              className="input-field"
              rows={4}
              placeholder="e.g. Invalid business license or unverified trade registry number."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{ marginBottom: "20px", resize: "vertical" }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button className="btn-secondary" onClick={() => setRejectingStore(null)}>Cancel</button>
              <button
                className="btn-primary"
                style={{ background: "#ef4444" }}
                disabled={!rejectionReason.trim()}
                onClick={() => handleVerifyStore(rejectingStore._id, "rejected", rejectionReason)}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

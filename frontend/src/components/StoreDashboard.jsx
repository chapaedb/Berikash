import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Plus, Upload, CheckCircle, AlertTriangle, Package, MapPin, Phone, Clock, X, Store as StoreIcon } from "lucide-react";

export default function StoreDashboard() {
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [message, setMessage] = useState(null);

  // Form state for creating product
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    originalPrice: "",
    discountedPrice: "",
    quantity: "10",
    unit: "piece",
    expiryDate: "",
    description: "",
  });

  // Form state for registering store
  const [storeForm, setStoreForm] = useState({
    name: "",
    description: "",
    type: "small_supermarket",
    phone: "",
    email: "",
    subcity: "",
    woreda: "",
    lat: "9.0192",
    lng: "38.7525",
  });

  useEffect(() => {
    fetchStoreAndProducts();
  }, []);

  const fetchStoreAndProducts = async () => {
    try {
      setLoading(true);
      const storeRes = await api.get("/stores/me/store");
      setStore(storeRes.data);

      const catRes = await api.get("/categories");
      setCategories(catRes.data);

      if (storeRes.data?._id) {
        const prodRes = await api.get(`/stores/${storeRes.data._id}/products`);
        setProducts(prodRes.data || []);
      }
    } catch (err) {
      // If 404, user has no store — show register form
      if (err.message?.includes("don't have")) {
        // expected — no store yet
      } else {
        console.error("Dashboard fetch error:", err.message);
      }
      // Still load categories
      try {
        const catRes = await api.get("/categories");
        setCategories(catRes.data);
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStore = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const payload = {
        name: storeForm.name,
        description: storeForm.description,
        type: storeForm.type,
        lat: storeForm.lat,
        lng: storeForm.lng,
        contact: { phone: storeForm.phone, email: storeForm.email },
        address: { subcity: storeForm.subcity, woreda: storeForm.woreda },
      };
      const res = await api.post("/stores", payload);
      setStore(res.data);
      setShowRegisterForm(false);
      setMessage({ type: "success", text: "Store registered successfully! Awaiting admin verification." });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const [modalError, setModalError] = useState(null);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setMessage(null);
    setModalError(null);
    try {
      // Clean payload — convert numbers and remove empty optional fields
      const payload = {
        name: formData.name.trim(),
        originalPrice: parseFloat(formData.originalPrice),
        discountedPrice: parseFloat(formData.discountedPrice),
        quantity: parseInt(formData.quantity, 10),
        unit: formData.unit || "piece",
        expiryDate: new Date(formData.expiryDate).toISOString(),
      };

      if (formData.category) payload.category = formData.category;
      if (formData.description && formData.description.trim()) {
        payload.description = formData.description.trim();
      }

      await api.post("/products", payload);
      setMessage({ type: "success", text: "Product posted successfully!" });
      setShowAddModal(false);
      setFormData({
        name: "",
        category: "",
        originalPrice: "",
        discountedPrice: "",
        quantity: "10",
        unit: "piece",
        expiryDate: "",
        description: "",
      });
      fetchStoreAndProducts();
    } catch (err) {
      setModalError(err.message);
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return;

    const data = new FormData();
    data.append("file", csvFile);

    try {
      const res = await api.post("/products/bulk-upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage({ type: "success", text: res.message });
      setShowCsvModal(false);
      setCsvFile(null);
      fetchStoreAndProducts();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid var(--border-color)", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "var(--text-muted)" }}>Loading your dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ─── No Store Registered — Show Registration CTA or Form ─────────────────────
  if (!store) {
    return (
      <div style={{ padding: "30px 0", maxWidth: "650px", margin: "0 auto" }}>
        {/* Toast */}
        {message && (
          <div style={{ padding: "12px 20px", borderRadius: "var(--radius-sm)", marginBottom: "20px", background: message.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", border: `1px solid ${message.type === "success" ? "#10b981" : "#ef4444"}`, color: message.type === "success" ? "#34d399" : "#f87171" }}>
            {message.text}
          </div>
        )}

        {!showRegisterForm ? (
          // CTA Card
          <div className="glass-card" style={{ padding: "48px 36px", textAlign: "center" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <AlertTriangle size={36} color="#f59e0b" />
            </div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "10px" }}>No Store Registered Yet</h2>
            <p style={{ color: "var(--text-muted)", maxWidth: "420px", margin: "0 auto 28px", lineHeight: "1.6" }}>
              You need to register your supermarket or retail store before you can post discounted items for shoppers to find.
            </p>
            <button className="btn-primary" style={{ padding: "12px 28px", fontSize: "1rem" }} onClick={() => setShowRegisterForm(true)}>
              <StoreIcon size={18} /> Register Your Supermarket
            </button>
          </div>
        ) : (
          // Registration Form
          <div className="glass-card" style={{ padding: "32px", background: "#121824" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "1.4rem" }}>Register Your Supermarket</h2>
              <button onClick={() => setShowRegisterForm(false)} style={{ color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterStore} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Store Name */}
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>Store Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Shoa Supermarket"
                  required
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>Description</label>
                <textarea
                  className="input-field"
                  placeholder="Brief description of your store"
                  rows={3}
                  style={{ resize: "vertical" }}
                  value={storeForm.description}
                  onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                />
              </div>

              {/* Store Type */}
              <div>
                <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>Store Type</label>
                <select
                  className="input-field"
                  value={storeForm.type}
                  onChange={(e) => setStoreForm({ ...storeForm, type: e.target.value })}
                >
                  <option value="small_supermarket">Small Supermarket</option>
                  <option value="large_supermarket">Large Supermarket</option>
                  <option value="convenience_store">Convenience Store</option>
                  <option value="medium_chain">Medium Chain Supermarket</option>
                  <option value="large_retailer">Large Retailer</option>
                  <option value="grocery">Grocery Store</option>
                  <option value="bakery">Bakery</option>
                  <option value="butcher">Butcher Shop</option>
                  <option value="specialty">Specialty Food Store</option>
                  <option value="pharmacy">Pharmacy</option>
                </select>
              </div>

              {/* Contact Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>Phone</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="+251 9XX XXX XXXX"
                    value={storeForm.phone}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>Store Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="store@example.com"
                    value={storeForm.email}
                    onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Location Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>Subcity *</label>
                  <select
                    className="input-field"
                    required
                    value={storeForm.subcity}
                    onChange={(e) => setStoreForm({ ...storeForm, subcity: e.target.value })}
                  >
                    <option value="">Select Subcity</option>
                    <option value="Bole">Bole</option>
                    <option value="Kirkos">Kirkos</option>
                    <option value="Arada">Arada</option>
                    <option value="Yeka">Yeka</option>
                    <option value="Addis Ketema">Addis Ketema</option>
                    <option value="Lideta">Lideta</option>
                    <option value="Nifas Silk-Lafto">Nifas Silk-Lafto</option>
                    <option value="Kolfe Keranio">Kolfe Keranio</option>
                    <option value="Gulele">Gulele</option>
                    <option value="Akaky Kaliti">Akaky Kaliti</option>
                    <option value="Lemi Kura">Lemi Kura</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>Woreda</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., 03"
                    value={storeForm.woreda}
                    onChange={(e) => setStoreForm({ ...storeForm, woreda: e.target.value })}
                  />
                </div>
              </div>

              {/* Coordinates Note */}
              <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", padding: "10px 14px", background: "rgba(16,185,129,0.08)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <MapPin size={14} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
                Location coordinates default to central Addis Ababa (9.0192°N, 38.7525°E). Map-based pinning coming soon.
              </div>

              {/* Submit */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowRegisterForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }}>
                  <StoreIcon size={16} /> Register Supermarket
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // ─── Store Exists — Full Dashboard ───────────────────────────────────────────
  return (
    <div style={{ padding: "30px 0" }}>
      {/* Toast */}
      {message && (
        <div
          style={{
            padding: "12px 20px",
            borderRadius: "var(--radius-sm)",
            marginBottom: "20px",
            background: message.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${message.type === "success" ? "#10b981" : "#ef4444"}`,
            color: message.type === "success" ? "#34d399" : "#f87171",
          }}
        >
          {message.text}
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-card" style={{ padding: "24px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ fontSize: "1.8rem" }}>{store.name}</h1>
            <span className={`badge ${store.verification?.status === "verified" ? "badge-fresh" : store.verification?.status === "rejected" ? "badge-expiry" : "badge-discount"}`}>
              {store.verification?.status || "pending"}
            </span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            {store.address?.subcity ? `${store.address.subcity}, Addis Ababa` : "Addis Ababa"}
            {store.contact?.phone && ` • ${store.contact.phone}`}
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn-secondary" onClick={() => setShowCsvModal(true)}>
            <Upload size={16} /> Bulk CSV Import
          </button>
          {store.verification?.status === "verified" ? (
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Post Discount Item
            </button>
          ) : (
            <div style={{ fontSize: "0.85rem", color: "#fbbf24", padding: "8px 14px", background: "rgba(245,158,11,0.1)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={14} /> Awaiting admin verification to post deals
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <Package size={16} color="#10b981" /> Active Listings
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", marginTop: "8px" }}>{products.length}</div>
        </div>

        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <CheckCircle size={16} color="#f59e0b" /> Verification
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: "700", marginTop: "12px", textTransform: "capitalize", color: store.verification?.status === "verified" ? "#34d399" : store.verification?.status === "rejected" ? "#f87171" : "#fbbf24" }}>
            {store.verification?.status || "pending"}
          </div>
        </div>

        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <StoreIcon size={16} color="#818cf8" /> Store Type
          </div>
          <div style={{ fontSize: "1rem", fontWeight: "600", marginTop: "12px", textTransform: "capitalize" }}>
            {store.type?.replace(/_/g, " ")}
          </div>
        </div>
      </div>

      {/* Product Listings */}
      {products.length > 0 && (
        <section>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "16px" }}>Your Active Listings</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {products.map((p) => (
              <div key={p._id} className="glass-card" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ fontSize: "1rem", marginBottom: "4px" }}>{p.name}</h4>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    <span style={{ textDecoration: "line-through", marginRight: "8px" }}>{p.originalPrice} ETB</span>
                    <span style={{ color: "#10b981", fontWeight: "700" }}>{p.discountedPrice} ETB</span>
                  </div>
                </div>
                <span className="badge badge-discount">-{p.discountPercentage}%</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: "550px", padding: "28px", background: "#121824" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2>Post Discounted Item</h2>
              <button onClick={() => { setShowAddModal(false); setModalError(null); }} style={{ color: "var(--text-muted)" }}><X size={20} /></button>
            </div>

            {modalError && (
              <div style={{ padding: "10px 14px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#f87171", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px" }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <input type="text" className="input-field" placeholder="Product Name (e.g., Anchor Milk 1L)" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />

              <input type="text" className="input-field" placeholder="Description (optional)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <input type="number" step="0.01" className="input-field" placeholder="Original Price (ETB)" required value={formData.originalPrice} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} />
                <input type="number" step="0.01" className="input-field" placeholder="Discounted Price (ETB)" required value={formData.discountedPrice} onChange={(e) => setFormData({ ...formData, discountedPrice: e.target.value })} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <input type="number" className="input-field" placeholder="Quantity" required value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
                <input type="date" className="input-field" required value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
              </div>

              <select className="input-field" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                <option value="">Select Category (optional)</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>
                ))}
              </select>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Publish Deal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Modal */}
      {showCsvModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: "480px", padding: "28px", background: "#121824" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h2>Bulk Product CSV Import</h2>
              <button onClick={() => setShowCsvModal(false)} style={{ color: "var(--text-muted)" }}><X size={20} /></button>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
              Upload a CSV file with columns: <code style={{ color: "#10b981" }}>name, originalPrice, discountedPrice, quantity, expiryDate</code>
            </p>
            <form onSubmit={handleCsvUpload} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input type="file" accept=".csv" className="input-field" required onChange={(e) => setCsvFile(e.target.files[0])} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCsvModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Upload CSV</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

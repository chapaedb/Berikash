import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProductCard from "./components/ProductCard";
import StoreDashboard from "./components/StoreDashboard";
import AuthModal from "./components/AuthModal";
import api from "./services/api";
import { Sparkles, MapPin, Filter, ArrowRight, ShieldCheck, ShoppingBag, Store as StoreIcon } from "lucide-react";

function MainContent() {
  const [activeTab, setActiveTab] = useState("home"); // home | deals | stores | dashboard
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [products, setProducts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [stores, setStores] = useState([]);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [showNearby, setShowNearby] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery, activeTab]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [catRes, trendRes, storeRes] = await Promise.all([
        api.get("/categories"),
        api.get("/search/trending"),
        api.get("/stores"),
      ]);

      setCategories(catRes.data || []);
      setTrending(trendRes.data || []);
      setStores(storeRes.data || []);
    } catch (err) {
      console.error("Failed to load initial data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      let endpoint = "/search?";
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (selectedCategory) params.append("category", selectedCategory);

      const res = await api.get(`/search?${params.toString()}`);
      setProducts(res.data || []);
    } catch (err) {
      console.error("Fetch products error:", err.message);
    }
  };

  const findNearbyStores = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setNearbyLoading(true);
    setShowNearby(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await api.get(`/stores/nearby?lat=${latitude}&lng=${longitude}&maxDistance=10000`);
          setNearbyStores(res.data || []);
        } catch (err) {
          setLocationError("Could not find nearby stores. Please try again.");
        } finally {
          setNearbyLoading(false);
        }
      },
      () => {
        setLocationError("Location access denied. Please allow location in your browser.");
        setNearbyLoading(false);
        setShowNearby(false);
      }
    );
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === "login") {
            setShowAuthModal(true);
          } else {
            setActiveTab(tab);
          }
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Page Area */}
      <main className="container" style={{ flex: 1, paddingBottom: "60px" }}>
        {/* Category Pills Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            overflowX: "auto",
            padding: "16px 0",
            borderBottom: "1px solid var(--border-color)",
            marginBottom: "24px",
          }}
        >
          <button
            className={`btn-secondary ${selectedCategory === "" ? "border-emerald-500 text-emerald-400" : ""}`}
            style={{ borderRadius: "20px", padding: "6px 16px", fontSize: "0.85rem", whiteSpace: "nowrap" }}
            onClick={() => setSelectedCategory("")}
          >
            🔥 All Deals
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              className={`btn-secondary ${selectedCategory === cat._id ? "border-emerald-500 text-emerald-400" : ""}`}
              style={{ borderRadius: "20px", padding: "6px 16px", fontSize: "0.85rem", whiteSpace: "nowrap" }}
              onClick={() => {
                setSelectedCategory(cat._id);
                if (activeTab !== "deals") setActiveTab("deals");
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Tab 1: Home View */}
        {activeTab === "home" && (
          <>
            {/* Hero Section */}
            <div
              className="glass-card"
              style={{
                padding: "48px 36px",
                marginBottom: "40px",
                background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(18,24,36,0.85) 100%)",
                border: "1px solid rgba(16,185,129,0.3)",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                alignItems: "center",
                gap: "24px",
              }}
            >
              <div>
                <span className="badge badge-discount" style={{ marginBottom: "12px" }}>
                  <Sparkles size={14} /> Addis Ababa Clearance Marketplace
                </span>
                <h1 style={{ fontSize: "2.5rem", lineHeight: "1.2", marginBottom: "14px" }}>
                  Save Money. Save Food.<br />
                  <span style={{ color: "#10b981" }}>Up to 70% Off</span> Near Expiry Items.
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", maxWidth: "600px", marginBottom: "24px" }}>
                  Connecting Ethiopian supermarkets with local shoppers. Access exclusive daily discounts on fresh dairy, bakery, meat, and groceries near you.
                </p>
                <div style={{ display: "flex", gap: "14px" }}>
                  <button className="btn-primary" onClick={() => setActiveTab("deals")}>
                    Explore Deals Near Me <ArrowRight size={16} />
                  </button>
                  <button className="btn-secondary" onClick={() => setActiveTab("stores")}>
                    Browse Supermarkets
                  </button>
                </div>
              </div>
            </div>

            {/* Trending Deals Section */}
            <section style={{ marginBottom: "40px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "1.4rem" }}>🔥 Trending Top Discounts</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Highest discounts available in Addis Ababa stores today</p>
                </div>
                <button className="btn-secondary" onClick={() => setActiveTab("deals")} style={{ fontSize: "0.85rem" }}>
                  View All ({products.length})
                </button>
              </div>

              {trending.length > 0 ? (
                <div className="grid-products">
                  {trending.slice(0, 4).map((product) => (
                    <ProductCard key={product._id} product={product} onSelect={(p) => setSelectedProduct(p)} />
                  ))}
                </div>
              ) : (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                  No active trending deals right now. Check back soon!
                </div>
              )}
            </section>
          </>
        )}

        {/* Tab 2: Deals Browser */}
        {activeTab === "deals" && (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.4rem" }}>
                {selectedCategory ? "Filtered Deals" : "All Active Clearance Deals"}
              </h2>
              <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Showing {products.length} item(s)</span>
            </div>

            {products.length > 0 ? (
              <div className="grid-products">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} onSelect={(p) => setSelectedProduct(p)} />
                ))}
              </div>
            ) : (
              <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
                <ShoppingBag size={48} color="#6b7280" style={{ margin: "0 auto 12px" }} />
                <h3>No deals found</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "6px" }}>
                  Try resetting your category or search query.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Supermarket Directory */}
        {activeTab === "stores" && (
          <section>
            {/* Header + Nearby Button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2 style={{ fontSize: "1.4rem" }}>Partner Supermarkets</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Verified grocery retailers offering clearance deals in Addis Ababa</p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                {showNearby && (
                  <button className="btn-secondary" onClick={() => { setShowNearby(false); setNearbyStores([]); setLocationError(null); }}>
                    All Stores
                  </button>
                )}
                <button
                  className="btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.88rem" }}
                  onClick={findNearbyStores}
                  disabled={nearbyLoading}
                >
                  <MapPin size={15} />
                  {nearbyLoading ? "Locating..." : "Find Near Me"}
                </button>
              </div>
            </div>

            {/* Location Error */}
            {locationError && (
              <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", borderRadius: "8px", color: "#f87171", fontSize: "0.85rem", marginBottom: "16px" }}>
                {locationError}
              </div>
            )}

            {/* Nearby badge */}
            {showNearby && !nearbyLoading && (
              <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <MapPin size={16} color="#10b981" />
                <span style={{ color: "#10b981", fontWeight: "600", fontSize: "0.9rem" }}>
                  {nearbyStores.length} store{nearbyStores.length !== 1 ? "s" : ""} within 10km of your location
                </span>
              </div>
            )}

            {/* Store Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
              {(showNearby ? nearbyStores : stores).map((s) => (
                <div key={s._id} className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <StoreIcon size={24} color="#10b981" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "1.1rem" }}>{s.name}</h3>
                        <div style={{ display: "flex", gap: "6px", marginTop: "3px" }}>
                          <span className="badge badge-fresh" style={{ fontSize: "0.65rem" }}>Verified Partner</span>
                          {showNearby && <span className="badge badge-discount" style={{ fontSize: "0.65rem" }}>📍 Nearby</span>}
                        </div>
                      </div>
                    </div>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "12px" }}>
                      {s.description || "Fresh local groceries and daily discounts."}
                    </p>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={14} color="#10b981" /> {s.address?.subcity || "Addis Ababa"}
                    </span>
                    <span>{s.stats?.totalProducts || 0} active deals</span>
                  </div>
                </div>
              ))}

              {showNearby && !nearbyLoading && nearbyStores.length === 0 && (
                <div className="glass-card" style={{ padding: "40px", textAlign: "center", gridColumn: "1 / -1" }}>
                  <MapPin size={40} color="#6b7280" style={{ margin: "0 auto 12px" }} />
                  <h3>No stores within 10km</h3>
                  <p style={{ color: "var(--text-muted)", marginTop: "8px", fontSize: "0.9rem" }}>Try browsing all partner supermarkets instead.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tab 4: Store Dashboard */}
        {activeTab === "dashboard" && <StoreDashboard />}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: "520px", padding: "28px", background: "#121824" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span className="badge badge-discount">-{selectedProduct.discountPercentage}% OFF</span>
                <h2 style={{ fontSize: "1.5rem", marginTop: "8px" }}>{selectedProduct.name}</h2>
              </div>
              <button onClick={() => setSelectedProduct(null)} style={{ color: "var(--text-muted)" }}>✕</button>
            </div>

            <div style={{ margin: "16px 0", padding: "16px", background: "var(--bg-input)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "4px" }}>Available At:</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>{selectedProduct.store?.name || "Supermarket Branch"}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-dim)", marginTop: "2px" }}>
                📍 {selectedProduct.store?.address?.subcity || "Addis Ababa"}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0" }}>
              <div>
                <div style={{ textDecoration: "line-through", color: "var(--text-dim)", fontSize: "0.9rem" }}>
                  {selectedProduct.originalPrice} ETB
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#10b981" }}>
                  {selectedProduct.discountedPrice} ETB
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span className="badge badge-expiry">
                  ⏳ {selectedProduct.daysUntilExpiry} Days Until Expiry
                </span>
              </div>
            </div>

            <button className="btn-primary" style={{ width: "100%", justifyContent: "center", height: "46px" }} onClick={() => setSelectedProduct(null)}>
              Close & Visit Supermarket
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border-color)", padding: "24px 0", textAlign: "center", color: "var(--text-dim)", fontSize: "0.85rem" }}>
        <div className="container">
          Berikash © 2026 — Retail Technology & Food Waste Reduction in Addis Ababa, Ethiopia.
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

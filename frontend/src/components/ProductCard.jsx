import React, { useState } from "react";
import { Clock, Store, MapPin, Tag, Heart, ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductCard({ product, onSelect }) {
  const {
    name,
    originalPrice,
    discountedPrice,
    discountPercentage,
    daysUntilExpiry,
    expiryDate,
    store,
    images,
    unit,
    quantity,
  } = product;

  const [currentImg, setCurrentImg] = useState(0);

  const isUrgent = daysUntilExpiry <= 2;
  const hasMultipleImages = images && images.length > 1;

  const nextImg = (e) => {
    e.stopPropagation();
    setCurrentImg((prev) => (prev + 1) % images.length);
  };

  const prevImg = (e) => {
    e.stopPropagation();
    setCurrentImg((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="glass-card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Image & Discount Badge Overlay */}
      <div style={{ position: "relative", height: "180px", background: "var(--bg-surface)" }}>
        {images && images.length > 0 ? (
          <>
            <img
              src={`http://localhost:5000${images[currentImg]}`}
              alt={name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {/* Multi-Image Controls */}
            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={prevImg}
                  style={{
                    position: "absolute",
                    left: "6px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "26px",
                    height: "26px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 2,
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={nextImg}
                  style={{
                    position: "absolute",
                    right: "6px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "26px",
                    height: "26px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 2,
                  }}
                >
                  <ChevronRight size={16} />
                </button>

                {/* Dot Indicators */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "8px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: "4px",
                    zIndex: 2,
                  }}
                >
                  {images.map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: i === currentImg ? "12px" : "6px",
                        height: "6px",
                        borderRadius: "3px",
                        background: i === currentImg ? "#10b981" : "rgba(255,255,255,0.6)",
                        transition: "all 0.2s ease",
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #1e293b, #0f172a)",
              color: "#64748b",
            }}
          >
            <Tag size={48} opacity={0.3} />
          </div>
        )}

        {/* Discount Badge */}
        <div style={{ position: "absolute", top: "12px", left: "12px" }}>
          <span className="badge badge-discount">-{discountPercentage}% OFF</span>
        </div>

        {/* Expiry Badge */}
        <div style={{ position: "absolute", top: "12px", right: "12px" }}>
          <span className={`badge ${isUrgent ? "badge-expiry" : "badge-fresh"}`}>
            <Clock size={12} /> {daysUntilExpiry === 0 ? "Expires Today" : `${daysUntilExpiry} days left`}
          </span>
        </div>
      </div>

      {/* Product Details Body */}
      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          {/* Store Name & Distance */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px", flexWrap: "wrap" }}>
            <Store size={14} color="#10b981" />
            <span>{store?.name || "Partner Supermarket"}</span>
            {store?.address?.subcity && (
              <span style={{ display: "flex", alignItems: "center", gap: "2px", color: "var(--text-dim)" }}>
                • <MapPin size={12} /> {store.address.subcity}
              </span>
            )}
            {product.distanceKm !== undefined && product.distanceKm !== null && (
              <span className="badge badge-discount" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>
                📍 {product.distanceKm} km away
              </span>
            )}
          </div>

          {/* Product Name */}
          <h3 style={{ fontSize: "1.1rem", marginBottom: "8px", color: "#ffffff", lineHeight: "1.3" }}>
            {name}
          </h3>
        </div>

        {/* Pricing & CTA */}
        <div style={{ marginTop: "14px", pt: "12px", borderTop: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "0.8rem", textDecoration: "line-through", color: "var(--text-dim)" }}>
              {originalPrice} ETB
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "#10b981" }}>
              {discountedPrice} <span style={{ fontSize: "0.75rem", fontWeight: "400", color: "var(--text-muted)" }}>ETB / {unit}</span>
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ padding: "8px 14px", fontSize: "0.85rem" }}
            onClick={() => onSelect && onSelect(product)}
          >
            View Deal
          </button>
        </div>
      </div>
    </div>
  );
}

import type { VoiceLanguage } from "../services/voice"
import { t } from "../i18n/strings"

interface CropUploadCardProps {
  previewUrl: string | null
  onOpenCamera: () => void
  onOpenGallery: () => void
  onSendForAnalysis: () => void
  onRetake: () => void
  language: VoiceLanguage
  error?: string | null
  selectedCrop: string
  onCropChange: (crop: string) => void
  selectedDistrict: string
  onDistrictChange: (district: string) => void
}

const SUPPORTED_CROPS = [
  { id: "Tomato", labelEn: "Tomato (टोमॅटो / टमाटर)", icon: "🍅" },
  { id: "Cotton", labelEn: "Cotton (कापूस / कपास)", icon: "🌱" },
  { id: "Onion", labelEn: "Onion (कांदा / प्याज)", icon: "🧅" },
  { id: "Grapes", labelEn: "Grapes (द्राक्षे / अंगूर)", icon: "🍇" },
  { id: "Sugarcane", labelEn: "Sugarcane (ऊस / गन्ना)", icon: "🎋" },
  { id: "Potato", labelEn: "Potato (बटाटा / आलू)", icon: "🥔" },
  { id: "Soybean", labelEn: "Soybean (सोयाबीन)", icon: "🌿" },
  { id: "Rice", labelEn: "Rice (भात / धान)", icon: "🌾" },
  { id: "General", labelEn: "General / Other Plant", icon: "🍃" },
]

const MAHARASHTRA_DISTRICTS = [
  "Pune", "Nashik", "Aurangabad", "Nagpur", "Satara", "Kolhapur",
  "Solapur", "Ahmednagar", "Jalgaon", "Amravati", "Latur", "Buldhana",
  "Sangli", "Yavatmal", "Raigad", "Thane", "Akola", "Beed", "Chandrapur",
  "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalna", "Nanded", "Nandurbar",
  "Osmanabad", "Parbhani", "Ratnagiri", "Sindhudurg", "Wardha", "Washim",
]

export function CropUploadCard({
  previewUrl,
  onOpenCamera,
  onOpenGallery,
  onSendForAnalysis,
  onRetake,
  language,
  error,
  selectedCrop,
  onCropChange,
  selectedDistrict,
  onDistrictChange,
}: CropUploadCardProps) {
  return (
    <div className="card">
      <h2 className="card-title">🌱 {t("action_take_photo", language)}</h2>
      <p style={{ color: "var(--color-text-subtle)", fontSize: "0.9rem", marginBottom: 16 }}>
        {language === "hi-IN"
          ? "अपनी फसल और ज़िला चुनें, फिर प्रभावित पत्ते की साफ़ फोटो खींचकर विश्लेषण करें।"
          : language === "mr-IN"
          ? "तुमचे पीक आणि जिल्हा निवडा, नंतर बाधित पानाचा स्पष्ट फोटो काढून विश्लेषण करा."
          : "Select your target crop and district, then capture or upload a clear photo of the leaf."}
      </p>

      {/* Crop and District Selectors */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        marginBottom: 18,
        background: "var(--color-bg-app)",
        padding: 14,
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
      }}>
        <div>
          <label style={{ fontSize: "0.82rem", fontWeight: 700, display: "block", marginBottom: 6, color: "var(--color-forest)" }}>
            🌾 {language === "hi-IN" ? "फसल चुनें" : language === "mr-IN" ? "पीक निवडा" : "Target Crop"}:
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => onCropChange(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "var(--color-card-bg)",
              fontSize: "0.88rem",
              fontWeight: 600,
            }}
          >
            {SUPPORTED_CROPS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.labelEn}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: "0.82rem", fontWeight: 700, display: "block", marginBottom: 6, color: "var(--color-forest)" }}>
            📍 {language === "hi-IN" ? "ज़िला चुनें" : language === "mr-IN" ? "जिल्हा निवडा" : "District (Maharashtra)"}:
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => onDistrictChange(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "var(--color-card-bg)",
              fontSize: "0.88rem",
              fontWeight: 600,
            }}
          >
            {MAHARASHTRA_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {previewUrl ? (
        <div style={{ textAlign: "center" }}>
          <div className="preview-wrap">
            <img className="preview-img" src={previewUrl} alt="Captured crop preview" />
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
            <button
              className="small-btn primary"
              onClick={onSendForAnalysis}
              style={{ flex: 1, minWidth: 160, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              🔍 {t("action_send_for_analysis", language)} ({selectedCrop})
            </button>
            <button
              className="small-btn"
              onClick={onRetake}
              style={{ minWidth: 120, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              📷 {t("action_retake_photo", language)}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="camera-frame-container" style={{ marginBottom: 20 }}>
            <div className="camera-guide-overlay">
              <div className="guide-text">☀️ Ensure good daylight on the leaf</div>
              <div style={{ textAlign: "center", color: "#22C55E", fontSize: "2rem", fontWeight: 800 }}>
                [ Position Leaf Here ]
              </div>
              <div className="guide-text">📏 Keep 10–15 cm distance</div>
            </div>

            <div style={{ color: "#64748B", textAlign: "center" }}>
              <span style={{ fontSize: "3rem", display: "block" }}>🌿</span>
              <span style={{ fontSize: "0.9rem" }}>Ready to capture {selectedCrop} leaf</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button
              onClick={onOpenCamera}
              className="small-btn primary"
              style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
            >
              📸 {t("action_take_photo", language)}
            </button>

            <button
              onClick={onOpenGallery}
              className="small-btn"
              style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
            >
              🖼️ Upload Gallery
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

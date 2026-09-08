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
}

export function CropUploadCard({
  previewUrl,
  onOpenCamera,
  onOpenGallery,
  onSendForAnalysis,
  onRetake,
  language,
  error,
}: CropUploadCardProps) {
  return (
    <div className="card">
      <h2 className="card-title">🌱 {t("action_take_photo", language)}</h2>
      <p style={{ color: "var(--color-text-subtle)", fontSize: "0.9rem", marginBottom: 16 }}>
        {language === "hi-IN"
          ? "प्रभावित पत्ते की साफ़ फोटो खींचें। सूरज पौधे के सामने हो, पीछे नहीं।"
          : language === "mr-IN"
          ? "बाधित पानाचा स्पष्ट फोटो घ्या. प्रकाश पानावर असावा."
          : "Take a clear photo of the affected leaf or plant. Ensure good lighting and hold steady."}
      </p>

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
              🔍 {t("action_send_for_analysis", language)}
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
              <div className="guide-text">☀️ Ensure daylight on the leaf</div>
              <div style={{ textAlign: "center", color: "#22C55E", fontSize: "2rem", fontWeight: 800 }}>
                [ Position Leaf Here ]
              </div>
              <div className="guide-text">📏 Keep 10–15 cm distance</div>
            </div>

            <div style={{ color: "#64748B", textAlign: "center" }}>
              <span style={{ fontSize: "3rem", display: "block" }}>🌿</span>
              <span style={{ fontSize: "0.9rem" }}>No photo selected yet</span>
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

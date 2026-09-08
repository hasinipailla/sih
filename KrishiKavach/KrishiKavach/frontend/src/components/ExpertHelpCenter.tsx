import type { VoiceLanguage } from "../services/voice"
import { t } from "../i18n/strings"

interface ExpertHelpCenterProps {
  language: VoiceLanguage
  onSpeakInfo?: () => void
  uncertainCaseId?: string | null
}

const EXPERTS_LIST = [
  {
    name: "Dr. Prakash Ghadge",
    specialty: "Tomato & Vegetable Crops",
    email: "prakash.ghadge@agri.mah.nic.in",
    phone: "1800-103-AGRI",
    location: "Pune KVK",
  },
  {
    name: "Dr. Sunanda Pawar",
    specialty: "Cotton & Pulses",
    email: "sunanda.pawar@agri.mah.nic.in",
    phone: "1800-103-AGRI",
    location: "Aurangabad KVK",
  },
  {
    name: "Dr. Ramesh Kulkarni",
    specialty: "Grape & Orchard Crops",
    email: "ramesh.kulkarni@agri.mah.nic.in",
    phone: "1800-103-AGRI",
    location: "Nashik KVK",
  },
]

export function ExpertHelpCenter({ language, onSpeakInfo, uncertainCaseId }: ExpertHelpCenterProps) {
  return (
    <div>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <h2 className="card-title" style={{ margin: 0 }}>
              👨🌾 {t("action_expert_help", language)}
            </h2>
            <p style={{ color: "var(--color-text-subtle)", fontSize: "0.85rem", margin: 0 }}>
              Direct escalation to Agronomists and Krishi Vigyan Kendra Officers
            </p>
          </div>

          {onSpeakInfo && (
            <button className="small-btn primary" onClick={onSpeakInfo} style={{ minHeight: 40, padding: "8px 14px", fontSize: "0.85rem" }}>
              🔊 {t("action_listen_again", language)}
            </button>
          )}
        </div>

        {uncertainCaseId && (
          <div className="warning-box" style={{ background: "#FEF2F2", borderColor: "#FCA5A5", color: "#991B1B", marginBottom: 20 }}>
            <strong>⚠️ Low Confidence Case Escalation:</strong> Case #{uncertainCaseId.slice(0, 8)} has been flagged for expert verification. An officer will review the leaf photo.
          </div>
        )}

        {/* KVK Helpline Highlight Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #14532D 0%, #16A34A 100%)",
            color: "#FFFFFF",
            borderRadius: "var(--radius-md)",
            padding: 20,
            marginBottom: 24,
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 6 }}>
            {t("krishi_vigyan_kendra", language)}
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: 1, margin: "6px 0", color: "#FEF08A" }}>
            📞 1800-103-AGRI
          </div>
          <div style={{ fontSize: "0.88rem", opacity: 0.9 }}>
            {t("helpline_hours", language)}
          </div>
          <p style={{ fontSize: "0.85rem", margin: "10px 0 0", background: "rgba(255,255,255,0.15)", padding: 10, borderRadius: 8 }}>
            💡 {t("expert_photo_explainer", language)}
          </p>
        </div>

        {/* Agronomist Roster */}
        <h3 style={{ color: "var(--color-forest)", fontSize: "1.1rem", marginBottom: 14 }}>
          🏛️ Assigned Agronomists & Officers (Maharashtra)
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {EXPERTS_LIST.map((exp, idx) => (
            <div
              key={idx}
              style={{
                background: "var(--color-bg-app)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: 16,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--color-text-main)" }}>
                {exp.name}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--color-leaf)", fontWeight: 600, marginTop: 2 }}>
                🌱 Specialty: {exp.specialty}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-subtle)", marginTop: 4 }}>
                📍 {exp.location}
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <a
                  href={`tel:${exp.phone}`}
                  className="small-btn primary"
                  style={{ textDecoration: "none", flex: 1, textAlign: "center", fontSize: "0.8rem", padding: "8px" }}
                >
                  📞 Call KVK
                </a>
                <a
                  href={`mailto:${exp.email}`}
                  className="small-btn"
                  style={{ textDecoration: "none", textAlign: "center", fontSize: "0.8rem", padding: "8px 12px" }}
                >
                  ✉️ Email
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

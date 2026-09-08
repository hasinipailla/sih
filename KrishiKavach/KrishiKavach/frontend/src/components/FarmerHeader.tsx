import type { VoiceLanguage } from "../services/voice"
import { t } from "../i18n/strings"

interface FarmerHeaderProps {
  language: VoiceLanguage
  activeCasesCount?: number
  dueFollowUpsCount?: number
  farmerName?: string
  district?: string
  primaryCrop?: string
}

export function FarmerHeader({
  language,
  activeCasesCount = 0,
  dueFollowUpsCount = 0,
  farmerName = "Demo Farmer (Ramesh Patil)",
  district = "Pune",
  primaryCrop = "Tomato",
}: FarmerHeaderProps) {
  // Calculate farm health score: 100 - (activeCases * 10)
  const healthScore = Math.max(60, 100 - activeCasesCount * 10)

  return (
    <div className="hero-card">
      <div className="hero-greeting">{t("dashboard_greeting", language)}</div>
      <div className="hero-subtitle">
        👨🌾 {farmerName} • 📍 {district}, Maharashtra
      </div>

      <div className="hero-badges">
        <span className="hero-chip">🌱 Crop: {primaryCrop}</span>
        <span className="hero-chip">📏 Area: 1.5 Ha</span>
        <span className="hero-chip">📋 Active Cases: {activeCasesCount}</span>
        {dueFollowUpsCount > 0 && (
          <span className="hero-chip" style={{ background: "rgba(239, 68, 68, 0.3)", borderColor: "#EF4444" }}>
            ⏰ Follow-ups Due: {dueFollowUpsCount}
          </span>
        )}
      </div>

      <div className="health-score-widget">
        <div className="health-score-circle">{healthScore}%</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>
            {t("dashboard_farm_health", language)}
          </div>
          <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>
            {activeCasesCount === 0
              ? t("dashboard_health_status", language)
              : `${activeCasesCount} case(s) currently being monitored`}
          </div>
        </div>
      </div>
    </div>
  )
}

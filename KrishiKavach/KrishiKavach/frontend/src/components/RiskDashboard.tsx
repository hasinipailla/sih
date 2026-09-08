import { useEffect, useState } from "react"
import type { DiseaseReport } from "../types"
import type { VoiceLanguage } from "../services/voice"
import { listOutbreaks } from "../services/api"
import { t } from "../i18n/strings"

interface RiskDashboardProps {
  language: VoiceLanguage
  onSpeakSummary?: () => void
}

const RISK_BADGES: Record<string, string> = {
  low: "badge-low",
  medium: "badge-medium",
  high: "badge-high",
  critical: "badge-critical",
}

export function RiskDashboard({ language, onSpeakSummary }: RiskDashboardProps) {
  const [reports, setReports] = useState<DiseaseReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [districtFilter, setDistrictFilter] = useState<string>("all")
  const [riskFilter, setRiskFilter] = useState<string>("all")

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const filterDist = districtFilter === "all" ? undefined : districtFilter
        const data = await listOutbreaks(filterDist)
        setReports(data)
        setError(null)
      } catch (err: any) {
        setError(err.message || "Failed to load outbreak risk data")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [districtFilter])

  const filteredReports = reports.filter((r) => {
    if (riskFilter !== "all" && (r.risk_level || "").toLowerCase() !== riskFilter) {
      return false
    }
    return true
  })

  // Get unique districts for dropdown filter
  const uniqueDistricts = Array.from(
    new Set(reports.map((r) => r.district).filter(Boolean))
  ) as string[]

  return (
    <div>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <h2 className="card-title" style={{ margin: 0 }}>
              ⚠️ {t("action_nearby_risk", language)} ({filteredReports.length})
            </h2>
            <p style={{ color: "var(--color-text-subtle)", fontSize: "0.85rem", margin: 0 }}>
              Geospatial outbreak forecasting & district disease alerts (SIH 2026 Outbreak Intelligence)
            </p>
          </div>

          {onSpeakSummary && (
            <button className="small-btn primary" onClick={onSpeakSummary} style={{ minHeight: 40, padding: "8px 14px", fontSize: "0.85rem" }}>
              🔊 {t("action_listen_again", language)}
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20, background: "var(--color-bg-app)", padding: 12, borderRadius: "var(--radius-md)" }}>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, display: "block", marginBottom: 4 }}>
              District Filter:
            </label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: "0.85rem" }}
            >
              <option value="all">All Districts ({reports.length})</option>
              {uniqueDistricts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, display: "block", marginBottom: 4 }}>
              Risk Severity:
            </label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: "0.85rem" }}
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <div>{t("loading_outbreaks", language)}</div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <span style={{ fontSize: "3rem", display: "block" }}>🛡️</span>
            <h3 style={{ color: "var(--color-forest)", margin: "8px 0" }}>{t("no_outbreaks", language)}</h3>
            <p style={{ color: "var(--color-text-subtle)", fontSize: "0.88rem", margin: 0 }}>
              {t("no_outbreaks_explainer", language)}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filteredReports.map((r) => {
              const riskKey = (r.risk_level || "medium").toLowerCase()
              const badgeClass = RISK_BADGES[riskKey] || "badge-medium"

              return (
                <div
                  key={r.id}
                  style={{
                    background: "var(--color-card-bg)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: 16,
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span className={`badge ${badgeClass}`}>{riskKey} Risk</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-subtle)", fontWeight: 600 }}>
                      📍 {r.district || "Maharashtra"}
                    </span>
                  </div>

                  <h3 style={{ margin: "10px 0 4px", fontSize: "1.15rem", color: "var(--color-forest)" }}>
                    {r.disease_type || "Crop Disease"}
                  </h3>
                  <div style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", marginBottom: 12 }}>
                    🌾 Target Crop: <strong>{r.crop_type || "General"}</strong>
                  </div>

                  <div style={{ background: "var(--color-bg-app)", padding: 10, borderRadius: 8, fontSize: "0.82rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <span style={{ color: "var(--color-text-subtle)" }}>Affected Farms:</span>
                      <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--color-text-main)" }}>
                        {r.affected_farms}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: "var(--color-text-subtle)" }}>Total Cases:</span>
                      <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--color-text-main)" }}>
                        {r.total_cases_reported}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-subtle)", marginTop: 10, textAlign: "right" }}>
                    Valid: {r.valid_from} to {r.valid_to}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

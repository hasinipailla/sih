import { useEffect, useState } from "react"
import type { CaseResponse } from "../types"
import type { VoiceLanguage } from "../services/voice"
import { listCases } from "../services/api"
import { t } from "../i18n/strings"

interface CaseHistoryProps {
  language: VoiceLanguage
  onSelectCase?: (caseId: string) => void
}

const STATUS_BADGES: Record<string, string> = {
  active: "badge-active",
  resolved: "badge-resolved",
  escalated: "badge-escalated",
  closed: "badge-closed",
}

export function CaseHistory({ language, onSelectCase }: CaseHistoryProps) {
  const [cases, setCases] = useState<CaseResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedCase, setSelectedCase] = useState<CaseResponse | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const filter = statusFilter === "all" ? undefined : statusFilter
        const data = await listCases(undefined, filter)
        setCases(data)
        setError(null)
      } catch (err: any) {
        setError(err.message || "Failed to load cases")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [statusFilter])

  return (
    <div>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <h2 className="card-title" style={{ margin: 0 }}>
              📋 {t("nav_cases", language)} ({cases.length})
            </h2>
            <p style={{ color: "var(--color-text-subtle)", fontSize: "0.85rem", margin: 0 }}>
              Historical crop disease diagnoses and intervention logs
            </p>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["all", "active", "resolved", "escalated", "closed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`badge ${statusFilter === st ? "badge-active" : "badge-closed"}`}
                style={{ cursor: "pointer", border: "none", textTransform: "capitalize", padding: "6px 12px" }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <div>Loading cases...</div>
          </div>
        ) : cases.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--color-text-subtle)" }}>
            <span style={{ fontSize: "3rem", display: "block" }}>🌱</span>
            <p style={{ fontWeight: 600, margin: "8px 0" }}>No crop health cases found</p>
            <p style={{ fontSize: "0.85rem", margin: 0 }}>Take a photo of a sick leaf to record your first case.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cases.map((c) => {
              const statusClass = STATUS_BADGES[c.case_status] || "badge-closed"
              const confidencePct = c.confidence ? Math.round(c.confidence * 100) : 0

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCase(c)
                    if (onSelectCase) onSelectCase(c.id)
                  }}
                  style={{
                    background: "var(--color-bg-app)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: 16,
                    cursor: "pointer",
                    transition: "transform 150ms ease, box-shadow 150ms ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--color-forest)" }}>
                        {c.predicted_disease || "Unspecified Disease"}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--color-text-subtle)", marginTop: 2 }}>
                        🌾 Crop: {c.predicted_crop || "Tomato"} • 📅 {new Date(c.detected_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span className={`badge ${statusClass}`} style={{ textTransform: "uppercase" }}>
                        {c.case_status}
                      </span>
                      {c.confidence && (
                        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-leaf)", marginTop: 4 }}>
                          {confidencePct}% Confidence
                        </div>
                      )}
                    </div>
                  </div>

                  {c.notes && (
                    <p style={{ fontSize: "0.85rem", color: "var(--color-text-main)", margin: "10px 0 0", WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      💡 {c.notes}
                    </p>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, fontSize: "0.78rem", color: "var(--color-text-subtle)" }}>
                    <span>Follow-up: {c.next_follow_up_at}</span>
                    <span style={{ color: "var(--color-sky)", fontWeight: 600 }}>View Details →</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Case Details Modal */}
      {selectedCase && (
        <div className="modal-overlay" onClick={() => setSelectedCase(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "var(--color-forest)" }}>Case Record Details</h3>
              <button onClick={() => setSelectedCase(null)} style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <span className={`badge ${STATUS_BADGES[selectedCase.case_status] || "badge-closed"}`}>
                Status: {selectedCase.case_status}
              </span>
            </div>

            <p><strong>Predicted Disease:</strong> {selectedCase.predicted_disease}</p>
            <p><strong>Crop Type:</strong> {selectedCase.predicted_crop}</p>
            <p><strong>Confidence Score:</strong> {selectedCase.confidence ? Math.round(selectedCase.confidence * 100) : 0}%</p>
            <p><strong>Severity:</strong> {selectedCase.severity}</p>
            <p><strong>Detected At:</strong> {new Date(selectedCase.detected_at).toLocaleString()}</p>
            <p><strong>Next Follow-up Due:</strong> {selectedCase.next_follow_up_at}</p>
            {selectedCase.notes && <p><strong>Recommendation Notes:</strong> {selectedCase.notes}</p>}

            <button
              className="small-btn primary"
              onClick={() => setSelectedCase(null)}
              style={{ width: "100%", marginTop: 16 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

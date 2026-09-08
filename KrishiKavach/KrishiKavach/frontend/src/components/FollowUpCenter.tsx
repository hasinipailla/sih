import { useEffect, useState } from "react"
import type { CaseResponse } from "../types"
import type { VoiceLanguage } from "../services/voice"
import { advanceDemoTime, listDueFollowUps, resetDemoTime, submitFeedback } from "../services/api"
import { t } from "../i18n/strings"

interface FollowUpCenterProps {
  language: VoiceLanguage
  onRefreshCases?: () => void
}

export function FollowUpCenter({ language, onRefreshCases }: FollowUpCenterProps) {
  const [cases, setCases] = useState<CaseResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCase, setSelectedCase] = useState<CaseResponse | null>(null)

  // Feedback form state
  const [attempted, setAttempted] = useState(true)
  const [cropImproved, setCropImproved] = useState<boolean | null>(true)
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null)
  const [demoMessage, setDemoMessage] = useState<string | null>(null)

  async function loadDueCases() {
    setLoading(true)
    try {
      const data = await listDueFollowUps()
      setCases(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to load due follow-ups")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDueCases()
  }, [])

  async function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCase) return
    setSubmitting(true)
    try {
      await submitFeedback(selectedCase.id, {
        attempted_intervention: attempted,
        crop_improved: cropImproved,
        farmer_notes: notes,
      })
      setFeedbackSuccess("Feedback recorded successfully! Case status updated.")
      setSelectedCase(null)
      setNotes("")
      await loadDueCases()
      if (onRefreshCases) onRefreshCases()
    } catch (err: any) {
      setError(err.message || "Failed to submit feedback")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAdvanceTime() {
    try {
      const res = await advanceDemoTime(1)
      setDemoMessage(res.message)
      await loadDueCases()
      if (onRefreshCases) onRefreshCases()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleResetTime() {
    try {
      const res = await resetDemoTime()
      setDemoMessage(res.message)
      await loadDueCases()
      if (onRefreshCases) onRefreshCases()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div>
      {/* Demo Time Control Bar */}
      <div className="demo-time-bar">
        <div>
          <strong>📅 {t("demo_time_title", language)}:</strong> Simulate passage of days to test follow-up dates
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleAdvanceTime}
            className="small-btn primary"
            style={{ minHeight: 36, padding: "6px 12px", fontSize: "0.8rem" }}
          >
            ⏩ {t("demo_time_advance_1d", language)}
          </button>
          <button
            onClick={handleResetTime}
            className="small-btn"
            style={{ minHeight: 36, padding: "6px 12px", fontSize: "0.8rem" }}
          >
            🔄 {t("demo_time_reset", language)}
          </button>
        </div>
      </div>

      {demoMessage && (
        <div style={{ background: "#DCFCE7", color: "#166534", padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: "0.88rem" }}>
          ℹ️ {demoMessage}
        </div>
      )}

      {feedbackSuccess && (
        <div style={{ background: "#DCFCE7", color: "#166534", padding: "12px 14px", borderRadius: 10, marginBottom: 16, fontSize: "0.9rem", fontWeight: 600 }}>
          ✓ {feedbackSuccess}
        </div>
      )}

      <div className="card">
        <h2 className="card-title">📅 {t("followup_title", language)}</h2>
        <p style={{ color: "var(--color-text-subtle)", fontSize: "0.9rem", marginBottom: 16 }}>
          Cases requiring attention and status updates based on real treatment timestamps
        </p>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <div>Checking due follow-ups...</div>
          </div>
        ) : cases.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <span style={{ fontSize: "3rem", display: "block" }}>🎉</span>
            <h3 style={{ color: "var(--color-forest)", margin: "8px 0" }}>All crops are up to date!</h3>
            <p style={{ color: "var(--color-text-subtle)", fontSize: "0.88rem", margin: 0 }}>
              No follow-ups due today. You can click <strong>"+1 Day Advance"</strong> above to simulate tomorrow's checkups.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ color: "var(--color-warning)", fontSize: "1.05rem", margin: 0 }}>
              🔴 {t("followup_due_today", language)} ({cases.length})
            </h3>

            {cases.map((c) => (
              <div
                key={c.id}
                style={{
                  background: "#FFF7ED",
                  border: "1px solid #FDBA74",
                  borderRadius: "var(--radius-md)",
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <span className="badge badge-high">Follow-up Due</span>
                    <h4 style={{ margin: "6px 0 2px", fontSize: "1.1rem", color: "#9A3412" }}>
                      {c.predicted_disease || "Crop Disease Case"}
                    </h4>
                    <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                      🌾 Crop: {c.predicted_crop || "Tomato"} • Due: {c.next_follow_up_at}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCase(c)
                      setFeedbackSuccess(null)
                    }}
                    className="small-btn primary"
                    style={{ minHeight: 40, padding: "8px 14px", fontSize: "0.85rem" }}
                  >
                    ✏️ Provide Feedback
                  </button>
                </div>

                {c.notes && (
                  <div style={{ marginTop: 10, fontSize: "0.85rem", background: "#FFFFFF", padding: 10, borderRadius: 8 }}>
                    <strong>Treatment Given:</strong> {c.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Form Modal */}
      {selectedCase && (
        <div className="modal-overlay" onClick={() => setSelectedCase(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "var(--color-forest)" }}>Field Outcome Feedback</h3>
              <button onClick={() => setSelectedCase(null)} style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer" }}>✕</button>
            </div>

            <p style={{ fontSize: "0.9rem", color: "var(--color-text-subtle)", margin: "0 0 16px" }}>
              Case: <strong>{selectedCase.predicted_disease}</strong> ({selectedCase.predicted_crop})
            </p>

            <form onSubmit={handleSubmitFeedback}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontWeight: 700, marginBottom: 8, fontSize: "0.95rem" }}>
                  Did you attempt the recommended treatment?
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="button"
                    className={`small-btn ${attempted ? "primary" : ""}`}
                    onClick={() => setAttempted(true)}
                    style={{ flex: 1 }}
                  >
                    Yes, attempted
                  </button>
                  <button
                    type="button"
                    className={`small-btn ${!attempted ? "primary" : ""}`}
                    onClick={() => setAttempted(false)}
                    style={{ flex: 1 }}
                  >
                    No
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontWeight: 700, marginBottom: 8, fontSize: "0.95rem" }}>
                  {t("feedback_question", language)}
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button
                    type="button"
                    className={`small-btn ${cropImproved === true ? "primary" : ""}`}
                    onClick={() => setCropImproved(true)}
                    style={{ textAlign: "left" }}
                  >
                    👍 {t("feedback_yes", language)} (Mark Resolved)
                  </button>
                  <button
                    type="button"
                    className={`small-btn ${cropImproved === false ? "primary" : ""}`}
                    onClick={() => setCropImproved(false)}
                    style={{ textAlign: "left" }}
                  >
                    👎 {t("feedback_no", language)} (Schedule Follow-up in 7 days)
                  </button>
                  <button
                    type="button"
                    className={`small-btn ${cropImproved === null ? "primary" : ""}`}
                    onClick={() => setCropImproved(null)}
                    style={{ textAlign: "left" }}
                  >
                    🤔 {t("feedback_not_sure", language)}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 700, marginBottom: 6, fontSize: "0.9rem" }}>
                  Farmer / Extension Worker Notes (Optional):
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("feedback_notes_placeholder", language)}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontFamily: "inherit",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="small-btn primary"
                style={{ width: "100%", padding: 14, fontSize: "1rem" }}
              >
                {submitting ? "Saving feedback..." : t("feedback_submit", language)}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

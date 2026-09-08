import { useState } from "react"
import type { PredictionResult } from "../types"
import type { VoiceLanguage } from "../services/voice"
import { t } from "../i18n/strings"

interface DiagnosisCardProps {
  prediction: PredictionResult
  language: VoiceLanguage
  onSpeakAgain: () => void
  onDone: () => void
  onAskExpert?: () => void
  previewUrl?: string | null
}

const SEVERITY_CLASS: Record<string, string> = {
  low: "badge-low",
  medium: "badge-medium",
  high: "badge-high",
}

const SEVERITY_TEXT: Record<VoiceLanguage, Record<string, string>> = {
  "hi-IN": { low: "हल्का (Mild)", medium: "मध्यम (Moderate)", high: "गंभीर (Severe)" },
  "mr-IN": { low: "हलका (Mild)", medium: "मध्यम (Moderate)", high: "गंभीर (Severe)" },
  "en-IN": { low: "Mild Severity", medium: "Moderate Severity", high: "High Severity" },
}

export function DiagnosisCard({
  prediction,
  language,
  onSpeakAgain,
  onDone,
  onAskExpert,
  previewUrl,
}: DiagnosisCardProps) {
  const [showAlternatives, setShowAlternatives] = useState(false)
  const confidencePct = Math.round(prediction.confidence * 100)
  const severityClass = SEVERITY_CLASS[prediction.severity] || "badge-medium"
  const severityLabel = SEVERITY_TEXT[language]?.[prediction.severity] || prediction.severity

  return (
    <div className="card" role="region" aria-label="Diagnosis Result">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <span className="badge badge-active" style={{ marginBottom: 6 }}>
            {prediction.crop && prediction.crop !== "Unknown" ? `🌾 Crop: ${prediction.crop}` : "🌱 Crop Disease"}
          </span>
          <h2 style={{ fontSize: "1.6rem", color: "var(--color-forest)", margin: "4px 0" }}>
            {prediction.disease}
          </h2>
        </div>

        <div style={{ textAlign: "right" }}>
          <span className={`badge ${severityClass}`}>{severityLabel}</span>
          {prediction.is_demo && (
            <div style={{ fontSize: "0.72rem", color: "var(--color-warning)", fontWeight: 700, marginTop: 4 }}>
              SIH Demo Model
            </div>
          )}
        </div>
      </div>

      {previewUrl && (
        <div className="preview-wrap" style={{ margin: "16px 0" }}>
          <img className="preview-img" src={previewUrl} alt="Analyzed crop leaf" style={{ maxHeight: 220, width: "100%", objectFit: "cover" }} />
        </div>
      )}

      {/* Confidence Meter Bar */}
      <div style={{ margin: "16px 0", background: "var(--color-bg-app)", padding: 14, borderRadius: "var(--radius-md)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", fontWeight: 700, marginBottom: 6 }}>
          <span>{t("confidence_label", language)}</span>
          <span style={{ color: confidencePct > 75 ? "var(--color-leaf)" : "var(--color-warning)" }}>
            {confidencePct}%
          </span>
        </div>
        <div style={{ height: 10, width: "100%", background: "#E2E8F0", borderRadius: 999, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${confidencePct}%`,
              background: confidencePct > 75 ? "var(--color-leaf)" : "var(--color-sun)",
              borderRadius: 999,
              transition: "width 600ms ease",
            }}
          />
        </div>
      </div>

      {/* Uncertainty Warning Banner */}
      {prediction.uncertainty_flag && (
        <div className="warning-box" style={{ background: "#FEF2F2", borderColor: "#FCA5A5", color: "#991B1B" }}>
          <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>
            ⚠️ {t("not_fully_sure", language)}
          </div>
          <div>{t("result_uncertain_warning", language)}</div>
          {onAskExpert && (
            <button
              onClick={onAskExpert}
              className="small-btn"
              style={{ marginTop: 10, background: "#DC2626", color: "#FFFFFF", border: "none" }}
            >
              👨🌾 {t("action_expert_help", language)}
            </button>
          )}
        </div>
      )}

      {/* Description */}
      <div style={{ margin: "16px 0" }}>
        <h4 style={{ color: "var(--color-forest)", margin: "0 0 6px", fontSize: "1.05rem" }}>
          🔬 {language === "hi-IN" ? "जाँच रिपोर्ट" : language === "mr-IN" ? "तपासणी अहवाल" : "What we found"}
        </h4>
        <p style={{ margin: 0, color: "var(--color-text-main)", fontSize: "0.95rem" }}>
          {prediction.description}
        </p>
      </div>

      {/* Treatment Steps */}
      <div style={{ margin: "16px 0", background: "var(--color-mint)", padding: 16, borderRadius: "var(--radius-md)", border: "1px solid var(--color-leaf)" }}>
        <h4 style={{ color: "var(--color-forest)", margin: "0 0 8px", fontSize: "1.05rem" }}>
          🌱 {language === "hi-IN" ? "उपचार कदम" : language === "mr-IN" ? "उपचार पायऱ्या" : "What you should do"}
        </h4>
        <p style={{ margin: "0 0 10px", fontWeight: 600, fontSize: "0.95rem" }}>
          {prediction.recommendation_text}
        </p>
        {prediction.steps && prediction.steps.length > 0 && (
          <ol className="steps" style={{ margin: 0, paddingLeft: 20 }}>
            {prediction.steps.map((step, idx) => (
              <li key={idx} style={{ marginBottom: 6, fontSize: "0.9rem" }}>{step}</li>
            ))}
          </ol>
        )}
      </div>

      {/* Important Warning */}
      {prediction.warning && (
        <div className="warning-box">
          <strong>⚠️ {language === "hi-IN" ? "सावधानी" : "Caution"}:</strong> {prediction.warning}
        </div>
      )}

      {/* Next Follow-up interval */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", color: "var(--color-text-subtle)", margin: "12px 0" }}>
        <span>📅</span>
        <span>
          {language === "hi-IN"
            ? `अगली जाँच: ${prediction.follow_up_days} दिनों में`
            : `Next follow-up recommended in ${prediction.follow_up_days} days`}
        </span>
      </div>

      {/* Alternative Predictions Collapsible */}
      {prediction.alternatives && prediction.alternatives.length > 0 && (
        <div style={{ marginTop: 16, borderTop: "1px solid var(--color-border)", paddingTop: 12 }}>
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-sky)",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {showAlternatives ? "▲ Hide other possible matches" : "▼ Show other possible matches"}
          </button>

          {showAlternatives && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {prediction.alternatives.map((alt, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "var(--color-bg-app)",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.85rem",
                  }}
                >
                  <span>{alt.disease} ({alt.crop})</span>
                  <span style={{ fontWeight: 600 }}>{Math.round(alt.confidence * 100)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="inline-actions" style={{ marginTop: 20 }}>
        <button className="small-btn primary" onClick={onSpeakAgain} type="button" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          🔊 {language === "hi-IN" ? "फिर से सुनें" : language === "mr-IN" ? "पुन्हा ऐका" : "Listen again"}
        </button>
        <button className="small-btn" onClick={onDone} type="button" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          ✓ {t("ready", language)} / Done
        </button>
      </div>

      <div style={{ marginTop: 16, fontSize: "0.75rem", color: "var(--color-text-subtle)", textAlign: "center" }}>
        Model Source: {prediction.model_source}
      </div>
    </div>
  )
}

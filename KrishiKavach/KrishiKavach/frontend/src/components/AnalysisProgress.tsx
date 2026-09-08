import { useEffect, useState } from "react"
import type { VoiceLanguage } from "../services/voice"
import { t } from "../i18n/strings"

interface AnalysisProgressProps {
  language: VoiceLanguage
}

interface Step {
  id: string
  labelEn: string
  labelHi: string
  labelMr: string
  icon: string
}

const AGENT_STEPS: Step[] = [
  {
    id: "vision",
    labelEn: "Vision Agent: Inspecting leaf symptoms & affected area",
    labelHi: "विजन एजेंट: पत्ते के लक्षणों और प्रभावित क्षेत्र की जाँच",
    labelMr: "व्हिजन एजंट: पानावरील लक्षणे व बाधित भाग तपासत आहे",
    icon: "🌿",
  },
  {
    id: "risk",
    labelEn: "Risk Forecast Agent: Checking weather & leaf wetness data",
    labelHi: "जोखिम एजेंट: मौसम और नमी डेटा का विश्लेषण",
    labelMr: "जोखीम अंदाज एजंट: हवामान व ओलावा डेटा विश्लेषित करत आहे",
    icon: "🔬",
  },
  {
    id: "geospatial",
    labelEn: "Geospatial Agent: Querying district disease outbreak cluster",
    labelHi: "जियोस्पेशियल एजेंट: जिला रोग क्लस्टर की जाँच",
    labelMr: "जिओस्पेशिअल एजंट: जिल्ह्यातील रोग क्लस्टर तपासत आहे",
    icon: "📍",
  },
  {
    id: "recommendation",
    labelEn: "Recommendation Agent: Generating confidence-ranked IPM advisory",
    labelHi: "सिफारिश एजेंट: IPM उपचार सलाह तैयार कर रहा है",
    labelMr: "सल्ला एजंट: आयपीएम उपचार सल्ला तयार करत आहे",
    icon: "📊",
  },
]

export function AnalysisProgress({ language }: AnalysisProgressProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStepIndex((prev) => (prev < AGENT_STEPS.length - 1 ? prev + 1 : prev))
    }, 600)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="agent-pipeline-container">
      <div className="spinner" />
      <h3 style={{ color: "var(--color-forest)", margin: "0 0 8px", fontSize: "1.2rem" }}>
        {t("thinking_about_photo", language)}
      </h3>
      <p style={{ color: "var(--color-text-subtle)", fontSize: "0.85rem", margin: 0 }}>
        SIH 2026 Multi-Agent Core (LangGraph Pipeline)
      </p>

      <div className="agent-steps">
        {AGENT_STEPS.map((step, idx) => {
          const isActive = idx === activeStepIndex
          const isDone = idx < activeStepIndex
          const label =
            language === "hi-IN" ? step.labelHi : language === "mr-IN" ? step.labelMr : step.labelEn

          return (
            <div
              key={step.id}
              className={`agent-step-item ${isActive ? "active" : ""} ${isDone ? "completed" : ""}`}
            >
              <span style={{ fontSize: "1.4rem" }}>{step.icon}</span>
              <span style={{ flex: 1, textAlign: "left", fontSize: "0.9rem", fontWeight: isActive ? 700 : 500 }}>
                {label}
              </span>
              {isDone && <span style={{ color: "var(--color-leaf)", fontWeight: 800 }}>✓</span>}
              {isActive && <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, margin: 0 }} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

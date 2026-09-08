// RiskCard — wrapper for RiskDashboard.
import { RiskDashboard } from "./RiskDashboard"
import type { DiseaseReport } from "../types"
import type { VoiceLanguage } from "../services/voice"

interface Props {
  reports: DiseaseReport[]
  loading: boolean
  error: string | null
  language: VoiceLanguage
  onDone: () => void
  onSpeak: () => void
}

export function RiskCard({ language, onSpeak }: Props) {
  return <RiskDashboard language={language} onSpeakSummary={onSpeak} />
}


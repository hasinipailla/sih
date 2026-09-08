// ResultCard — wrappers DiagnosisCard for backward compatibility.
import { DiagnosisCard } from "./DiagnosisCard"
import type { PredictionResult } from "../types"
import type { VoiceLanguage } from "../services/voice"

interface Props {
  prediction: PredictionResult
  language: VoiceLanguage
  onSpeakAgain: () => void
  onDone: () => void
  onAskExpert?: () => void
  previewUrl?: string | null
}

export function ResultCard({
  prediction,
  language,
  onSpeakAgain,
  onDone,
  onAskExpert,
  previewUrl,
}: Props) {
  return (
    <DiagnosisCard
      prediction={prediction}
      language={language}
      onSpeakAgain={onSpeakAgain}
      onDone={onDone}
      onAskExpert={onAskExpert}
      previewUrl={previewUrl}
    />
  )
}


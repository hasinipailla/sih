// ExpertCard — wrapper for ExpertHelpCenter.
import { ExpertHelpCenter } from "./ExpertHelpCenter"
import type { VoiceLanguage } from "../services/voice"

interface Props {
  language: VoiceLanguage
  onDone: () => void
  onSpeak: () => void
}

export function ExpertCard({ language, onSpeak }: Props) {
  return <ExpertHelpCenter language={language} onSpeakInfo={onSpeak} />
}


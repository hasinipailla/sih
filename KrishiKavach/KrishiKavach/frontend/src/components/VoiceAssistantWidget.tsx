import type { VoiceLanguage } from "../services/voice"
import type { VoiceStatus } from "../services/voiceController"

interface VoiceAssistantWidgetProps {
  status: VoiceStatus
  interim: string
  message: string
  language: VoiceLanguage
  onToggleListen?: () => void
  onSpeakMessageAgain?: () => void
}

export function VoiceAssistantWidget({
  status,
  interim,
  message,
  language,
  onToggleListen,
  onSpeakMessageAgain,
}: VoiceAssistantWidgetProps) {
  const isListening = status === "listening"
  const isSpeaking = status === "speaking"

  return (
    <div className={`voice-banner ${isListening ? "is-listening" : ""} ${isSpeaking ? "is-speaking" : ""}`}>
      <div className="indicator" />

      <div className="text">
        <div>{message || "Tap microphone or ask using your voice"}</div>
        {interim && <span className="heard">Listening: "{interim}"</span>}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {onSpeakMessageAgain && message && !isSpeaking && (
          <button
            onClick={onSpeakMessageAgain}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#FFFFFF",
              borderRadius: "50%",
              width: 38,
              height: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            title="Listen again"
          >
            🔊
          </button>
        )}

        {onToggleListen && (
          <button
            onClick={onToggleListen}
            style={{
              background: isListening ? "#EF4444" : "var(--color-leaf)",
              border: "none",
              color: "#FFFFFF",
              borderRadius: "50%",
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: isListening ? "0 0 0 4px rgba(239,68,68,0.3)" : "none",
              transition: "transform 150ms ease",
            }}
            title={isListening ? "Listening..." : "Tap to speak"}
          >
            🎙️
          </button>
        )}
      </div>
    </div>
  )
}

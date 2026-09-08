import type { VoiceLanguage } from "../services/voice"
import { LanguagePicker } from "./LanguagePicker"
import { t } from "../i18n/strings"

interface TopBarProps {
  language: VoiceLanguage
  onLanguageChange: (lang: VoiceLanguage) => void
  currentDemoDate?: string | null
  onToggleDemoTimeBar?: () => void
}

export function TopBar({
  language,
  onLanguageChange,
  currentDemoDate,
  onToggleDemoTimeBar,
}: TopBarProps) {
  return (
    <header className="top-header">
      <div className="top-header-inner">
        <div className="brand-logo">
          <span className="leaf-icon">🌿</span>
          <span>{t("app_title", language)}</span>
        </div>

        <div className="header-actions">
          {currentDemoDate && (
            <button
              onClick={onToggleDemoTimeBar}
              className="demo-badge"
              style={{ cursor: "pointer", border: "1px solid #fdba74" }}
              title="Click to adjust demo clock timeline"
            >
              📅 {currentDemoDate}
            </button>
          )}

          <LanguagePicker current={language} onChange={onLanguageChange} />
        </div>
      </div>
    </header>
  )
}

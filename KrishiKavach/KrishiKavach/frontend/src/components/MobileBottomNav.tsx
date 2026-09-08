import type { VoiceLanguage } from "../services/voice"
import { t, type StringKey } from "../i18n/strings"
import type { TabName } from "./Sidebar"

interface MobileBottomNavProps {
  activeTab: TabName
  onSelectTab: (tab: TabName) => void
  language: VoiceLanguage
  dueFollowUpsCount?: number
}

interface NavItemDef {
  tab: TabName
  icon: string
  labelKey: StringKey
}

const MOBILE_ITEMS: NavItemDef[] = [
  { tab: "home", icon: "🌱", labelKey: "nav_home" },
  { tab: "crop-health", icon: "📸", labelKey: "nav_crop_health" },
  { tab: "cases", icon: "📋", labelKey: "nav_cases" },
  { tab: "follow-ups", icon: "📅", labelKey: "nav_follow_ups" },
  { tab: "risk", icon: "⚠️", labelKey: "nav_risk_alerts" },
  { tab: "expert", icon: "👨‍🌾", labelKey: "nav_expert_help" },
  { tab: "voice", icon: "🎙️", labelKey: "nav_voice" },
]

export function MobileBottomNav({
  activeTab,
  onSelectTab,
  language,
  dueFollowUpsCount = 0,
}: MobileBottomNavProps) {
  return (
    <nav className="mobile-nav" aria-label="Mobile Navigation">
      {MOBILE_ITEMS.map((item) => {
        const isActive = activeTab === item.tab
        const showBadge = item.tab === "follow-ups" && dueFollowUpsCount > 0
        return (
          <button
            key={item.tab}
            className={`mobile-nav-item ${isActive ? "active" : ""}`}
            onClick={() => onSelectTab(item.tab)}
          >
            <span className="mobile-icon" style={{ position: "relative" }}>
              {item.icon}
              {showBadge && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -6,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-warning)",
                  }}
                />
              )}
            </span>
            <span>{t(item.labelKey, language)}</span>
          </button>
        )
      })}
    </nav>
  )
}

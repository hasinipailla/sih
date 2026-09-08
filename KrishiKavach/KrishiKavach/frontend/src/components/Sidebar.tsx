import type { VoiceLanguage } from "../services/voice"
import { t, type StringKey } from "../i18n/strings"

export type TabName =
  | "home"
  | "my-farm"
  | "crop-health"
  | "cases"
  | "follow-ups"
  | "risk"
  | "expert"
  | "voice"

interface SidebarProps {
  activeTab: TabName
  onSelectTab: (tab: TabName) => void
  language: VoiceLanguage
  dueFollowUpsCount?: number
}

interface NavItemDef {
  tab: TabName
  icon: string
  labelKey: StringKey
  badge?: number
}

const NAV_ITEMS: NavItemDef[] = [
  { tab: "home", icon: "🌱", labelKey: "nav_home" },
  { tab: "crop-health", icon: "📸", labelKey: "nav_crop_health" },
  { tab: "cases", icon: "📋", labelKey: "nav_cases" },
  { tab: "follow-ups", icon: "📅", labelKey: "nav_follow_ups" },
  { tab: "risk", icon: "⚠️", labelKey: "nav_risk_alerts" },
  { tab: "expert", icon: "👨🌾", labelKey: "nav_expert_help" },
  { tab: "voice", icon: "🎙️", labelKey: "nav_voice" },
]

export function Sidebar({ activeTab, onSelectTab, language, dueFollowUpsCount = 0 }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Main Navigation">
      <div className="sidebar-header">
        <span className="leaf-icon" style={{ fontSize: "2rem" }}>🌿</span>
        <div>
          <div className="sidebar-title">KrishiKavach</div>
          <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>SIH26131 • 6Fingers</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.tab
          const badgeValue = item.tab === "follow-ups" ? dueFollowUpsCount : 0
          return (
            <button
              key={item.tab}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => onSelectTab(item.tab)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span style={{ flex: 1 }}>{t(item.labelKey, language)}</span>
              {badgeValue > 0 && (
                <span className="badge badge-high" style={{ padding: "2px 8px", borderRadius: "999px" }}>
                  {badgeValue}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "0.8rem", opacity: 0.7 }}>
        🌾 Agricultural AI Platform
      </div>
    </aside>
  )
}

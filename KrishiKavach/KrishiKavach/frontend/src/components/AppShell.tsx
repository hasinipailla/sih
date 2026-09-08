import type { ReactNode } from "react"
import type { VoiceLanguage } from "../services/voice"
import { Sidebar, type TabName } from "./Sidebar"
import { MobileBottomNav } from "./MobileBottomNav"
import { TopBar } from "./TopBar"
import { t } from "../i18n/strings"

interface AppShellProps {
  children: ReactNode
  activeTab: TabName
  onSelectTab: (tab: TabName) => void
  language: VoiceLanguage
  onLanguageChange: (lang: VoiceLanguage) => void
  currentDemoDate?: string | null
  onToggleDemoTimeBar?: () => void
  dueFollowUpsCount?: number
}

export function AppShell({
  children,
  activeTab,
  onSelectTab,
  language,
  onLanguageChange,
  currentDemoDate,
  onToggleDemoTimeBar,
  dueFollowUpsCount = 0,
}: AppShellProps) {
  return (
    <div className="app-layout">
      {/* Sidebar for Desktop (visible on desktop screen size) */}
      <div className="desktop-sidebar-wrap" style={{ display: "none" }}>
        <Sidebar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          language={language}
          dueFollowUpsCount={dueFollowUpsCount}
        />
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .desktop-sidebar-wrap {
            display: flex !important;
          }
          .mobile-nav-wrap {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <TopBar
          language={language}
          onLanguageChange={onLanguageChange}
          currentDemoDate={currentDemoDate}
          onToggleDemoTimeBar={onToggleDemoTimeBar}
        />

        <main className="content-container">{children}</main>

        <footer className="app-footer" style={{ padding: "20px 16px 30px" }}>
          <div>{t("footer_brand", language)}</div>
          <div>{t("footer_tagline", language)}</div>
          <div style={{ marginTop: 6, fontSize: "0.75rem", opacity: 0.8 }}>
            {t("footer_demo", language)}
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation (visible on mobile/tablet screen sizes) */}
      <div className="mobile-nav-wrap">
        <MobileBottomNav
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          language={language}
          dueFollowUpsCount={dueFollowUpsCount}
        />
      </div>
    </div>
  )
}

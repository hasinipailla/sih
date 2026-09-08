interface QuickActionCardProps {
  color: "green" | "blue" | "orange" | "red" | "purple"
  icon: string
  title: string
  subtitle: string
  onClick: () => void
  disabled?: boolean
  badgeCount?: number
}

export function QuickActionCard({
  color,
  icon,
  title,
  subtitle,
  onClick,
  disabled = false,
  badgeCount,
}: QuickActionCardProps) {
  return (
    <button
      className={`quick-action-card ${color}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      <div className="quick-action-icon" style={{ position: "relative" }}>
        {icon}
        {badgeCount !== undefined && badgeCount > 0 && (
          <span
            className="badge badge-high"
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              fontSize: "0.7rem",
              padding: "2px 6px",
            }}
          >
            {badgeCount}
          </span>
        )}
      </div>

      <div>
        <h3 className="quick-action-title">{title}</h3>
        <p className="quick-action-sub">{subtitle}</p>
      </div>
    </button>
  )
}

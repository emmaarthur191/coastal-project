// --- UNIFIED UI THEME CONSTANTS (MATCHING OPS DASHBOARD) ---
export const THEME = {
  colors: {
    bg: '#F8FAFC', // Slate 50
    primary: '#0066CC', // Brand Blue
    success: '#10b981', // Emerald 500
    danger: '#ef4444', // Red 500
    warning: '#f59e0b', // Amber 500
    info: '#3b82f6', // Blue 500
    white: '#FFFFFF',
    text: '#0f172a', // Slate 900
    muted: '#94a3b8', // Slate 400
    border: '#e2e8f0', // Slate 200
  },
  shadows: {
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    button: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    buttonActive: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },
  radius: {
    small: '0.375rem',
    medium: '0.75rem',
    large: '1rem',
    round: '9999px'
  }
};

// --- STYLED COMPONENTS (ADAPTED) ---
export const PlayfulCard = ({ children, color = THEME.colors.white, style, className }: {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}) => (
  // We largely ignore the 'color' prop for background if it's the "playful" one, to ensure consistency
  // However, for mobile toolkit buttons they might rely on color. 'FieldToolbox' uses it.
  // We'll trust the caller unless it's the specific "Playful" colors, but let's just apply the card style
  // and maybe keep the background if it's explicitly passed, but add transparency?
  // Actually, 'FieldToolbox' passes explicit colors like 'colors.success', which we updated.
  // So we can respect the color prop.
  <div className={className} style={{
    background: color === THEME.colors.white ? 'rgba(255, 255, 255, 0.9)' : color,
    borderRadius: THEME.radius.medium,
    boxShadow: THEME.shadows.card,
    padding: '20px',
    border: `1px solid ${THEME.colors.border}`,
    backdropFilter: 'blur(8px)',
    transition: 'transform 0.2s',
    ...style
  }}>
    {children}
  </div>
);

export const PlayfulButton = ({
  children,
  onClick,
  color = THEME.colors.primary,
  style
}: {
  children: React.ReactNode;
  onClick: () => void;
  color?: string;
  style?: React.CSSProperties;
}) => (
  <button
    onClick={onClick}
    style={{
      background: color,
      color: 'white',
      border: 'none',
      borderRadius: THEME.radius.medium, // More consistent radius
      padding: '12px 20px',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      boxShadow: THEME.shadows.button,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'transform 0.1s, box-shadow 0.1s',
      ...style
    }}
    onMouseDown={e => {
      e.currentTarget.style.transform = 'translateY(1px)';
      e.currentTarget.style.boxShadow = THEME.shadows.buttonActive;
    }}
    onMouseUp={e => {
      e.currentTarget.style.transform = 'translateY(0px)';
      e.currentTarget.style.boxShadow = THEME.shadows.button;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0px)';
      e.currentTarget.style.boxShadow = THEME.shadows.button;
    }}
  >
    {children}
  </button>
);
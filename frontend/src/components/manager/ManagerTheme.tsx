// --- UNIFIED UI THEME CONSTANTS (MATCHING OPS DASHBOARD) ---
export const THEME = {
  colors: {
    bg: '#F8FAFC', // Slate 50
    primary: '#0066CC', // Brand Blue
    secondary: '#64748b', // Slate 500
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
    round: '9999px',
    card: '1rem'
  }
};

// --- STYLED WRAPPERS (ADAPTED TO MATCH NEW DESIGN) ---
// We keep the names PlayfulCard/Button to avoid breaking imports, but style them like the Glass/Clean UI
export const PlayfulCard = ({ children, color = '#FFFFFF', style }: {
  children: React.ReactNode;
  color?: string; // We might ignore custom colors or map them to unified ones if they are too "playful"
  style?: React.CSSProperties;
}) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.9)', // Glass-like opacity
    backdropFilter: 'blur(8px)',
    borderRadius: THEME.radius.card,
    boxShadow: THEME.shadows.card,
    padding: '24px',
    border: `1px solid ${THEME.colors.border}`,
    ...style
  }}>
    {children}
  </div>
);

export const PlayfulButton = ({
  children,
  onClick,
  variant = 'primary',
  style
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'danger';
  style?: React.CSSProperties;
}) => (
  <button
    onClick={onClick}
    style={{
      background: variant === 'danger' ? THEME.colors.danger : THEME.colors.primary,
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: THEME.radius.medium, // More standard radius
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      boxShadow: THEME.shadows.button,
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
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
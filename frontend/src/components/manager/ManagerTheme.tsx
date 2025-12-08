// --- PLAYFUL UI THEME CONSTANTS ---
export const THEME = {
  colors: {
    bg: '#F0F4F8',
    primary: '#6C5CE7', // Purple
    secondary: '#A29BFE', // Light Purple
    success: '#00B894', // Green
    danger: '#FF7675', // Salmon Red
    warning: '#FDCB6E', // Mustard
    info: '#74B9FF', // Sky Blue
    white: '#FFFFFF',
    text: '#2D3436',
    muted: '#636E72',
    border: '#DFE6E9',
  },
  shadows: {
    card: '0 10px 20px rgba(0,0,0,0.08), 0 6px 6px rgba(0,0,0,0.1)',
    button: '0 4px 0px rgba(0,0,0,0.15)', // "Pressed" 3D effect
    buttonActive: '0 2px 0px rgba(0,0,0,0.15)',
  },
  radius: {
    small: '12px',
    medium: '20px',
    large: '35px',
    round: '50px',
    card: '20px'
  }
};

// --- STYLED WRAPPERS ---
export const PlayfulCard = ({ children, color = '#FFFFFF', style }: {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}) => (
  <div style={{
    background: color,
    borderRadius: THEME.radius.medium,
    boxShadow: THEME.shadows.card,
    padding: '24px',
    border: '3px solid white',
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
      padding: '12px 24px',
      borderRadius: THEME.radius.round,
      fontWeight: 'bold',
      fontSize: '16px',
      cursor: 'pointer',
      boxShadow: THEME.shadows.button,
      transition: 'transform 0.1s, box-shadow 0.1s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      ...style
    }}
    onMouseDown={e => {
      e.currentTarget.style.transform = 'translateY(4px)';
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
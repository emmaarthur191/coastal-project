// --- PLAYFUL UI THEME CONSTANTS ---
import React from 'react';
export const THEME = {
  colors: {
    bg: '#F0F4F8',
    primary: '#6C5CE7', // Purple
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
    round: '50px'
  }
};

// --- STYLED SUB-COMPONENTS ---

export const PlayfulCard = ({ children, color = THEME.colors.white, style, className }: {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}) => (
  <div className={className} style={{
    background: color,
    borderRadius: THEME.radius.medium,
    boxShadow: THEME.shadows.card,
    padding: '24px',
    border: `3px solid ${THEME.colors.white}`,
    ...style
  }}>
    {children}
  </div>
);

export const PlayfulButton = ({
  children,
  onClick,
  variant = 'primary',
  style,
  disabled = false,
  type
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'success' | 'danger';
  style?: React.CSSProperties;
  disabled?: boolean;
  type?: "button" | "reset" | "submit";
}) => {
  const bg = variant === 'danger' ? THEME.colors.danger :
             variant === 'success' ? THEME.colors.success :
             THEME.colors.primary;
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#B2BEC3' : bg,
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: THEME.radius.round,
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : THEME.shadows.button,
        transition: 'transform 0.1s, box-shadow 0.1s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...style
      }}
      onMouseDown={disabled ? undefined : (e) => {
        e.currentTarget.style.transform = 'translateY(4px)';
        e.currentTarget.style.boxShadow = THEME.shadows.buttonActive;
      }}
      onMouseUp={disabled ? undefined : (e) => {
        e.currentTarget.style.transform = 'translateY(0px)';
        e.currentTarget.style.boxShadow = THEME.shadows.button;
      }}
      onMouseLeave={disabled ? undefined : (e) => {
        e.currentTarget.style.transform = 'translateY(0px)';
        e.currentTarget.style.boxShadow = THEME.shadows.button;
      }}
    >
      {children}
    </button>
  );
};

export const PlayfulInput = ({
  label,
  ...props
}: {
  label?: string;
  [key: string]: any;
}) => (
  <div style={{ marginBottom: '16px' }}>
    {label && <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: THEME.colors.muted, marginLeft: '4px' }}>{label}</label>}
    <input
      style={{
        width: '100%',
        padding: '16px',
        borderRadius: THEME.radius.small,
        border: `3px solid ${THEME.colors.border}`,
        fontSize: '16px',
        outline: 'none',
        background: '#F9F9F9',
        transition: 'border-color 0.2s'
      }}
      onFocus={(e) => e.target.style.borderColor = THEME.colors.primary}
      onBlur={(e) => e.target.style.borderColor = THEME.colors.border}
      {...props}
    />
  </div>
);

// Skeleton Loading Component (Restyled)
export const SkeletonLoader = React.memo(({
  width = '100%',
  height = '20px',
  style = {}
}: {
  width?: string;
  height?: string;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      width,
      height,
      background: 'linear-gradient(90deg, #dfe6e9 25%, #f1f2f6 50%, #dfe6e9 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: THEME.radius.small,
      ...style
    }}
  />
));

// Error Boundary Component (Restyled)
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <PlayfulCard color="#FFEAA7" style={{ border: `3px solid ${THEME.colors.warning}` }}>
          <h3 style={{ fontSize: '24px', color: '#D35400' }}>⚠️ Oopsie!</h3>
          <p style={{ fontSize: '18px', color: '#D35400' }}>Something broke. Let's try that again.</p>
          <PlayfulButton onClick={() => this.setState({ hasError: false, error: null })} variant="danger">
            Try Again ↻
          </PlayfulButton>
        </PlayfulCard>
      );
    }
    return this.props.children;
  }
}
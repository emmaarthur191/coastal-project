import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  minHeight?: number | string;
  hoverEffect?: boolean;
  onClick?: () => void;
  /** Optional entrance animation delay */
  delay?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  style,
  minHeight,
  hoverEffect = false,
  onClick,
  delay = 0
}) => {
  const combinedStyle: React.CSSProperties = {
    ...style,
    minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight || 'auto',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.2, 0, 0, 1] }}
      whileHover={hoverEffect ? { 
        y: -4, 
        scale: 1.01,
        transition: { duration: 0.5, ease: [0.2, 0, 0, 1] }
      } : undefined}
      onClick={onClick}
      style={combinedStyle}
      className={`
        glass-card-global rounded-2xl
        ${hoverEffect ? 'cursor-pointer hover:shadow-2xl hover:border-white/20' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;

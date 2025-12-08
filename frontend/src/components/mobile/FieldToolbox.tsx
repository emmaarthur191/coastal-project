import React from 'react';
import { PlayfulCard, PlayfulButton, THEME } from './MobileTheme';

interface QuickActionButton {
  action: string;
  label: string;
  icon: string;
  color: string;
}

interface FieldToolboxProps {
  quickActionButtons: QuickActionButton[];
  onQuickAction: (action: string) => void;
}

const FieldToolbox: React.FC<FieldToolboxProps> = ({ quickActionButtons, onQuickAction }) => {
  return (
    <PlayfulCard color="#FFF3E0">
      <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: '900' }}>🧰 Field Toolbox</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {quickActionButtons.map((btn, i) => (
          <PlayfulButton
            key={i}
            color={btn.color}
            onClick={() => onQuickAction(btn.action)}
            style={{ justifyContent: 'flex-start' }}
          >
            <span style={{ fontSize: '18px' }}>{btn.icon}</span> {btn.label}
          </PlayfulButton>
        ))}
      </div>
    </PlayfulCard>
  );
};

export default FieldToolbox;
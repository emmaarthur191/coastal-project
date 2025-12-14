import React from 'react';
import { Button } from '../ui/Button';
import GlassCard from '../ui/modern/GlassCard';

interface QuickActionButton {
  action: string;
  label: string;
  icon: string;
  variant: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost';
}

interface FieldToolboxProps {
  quickActionButtons: QuickActionButton[];
  onQuickAction: (action: string) => void;
}

const FieldToolbox: React.FC<FieldToolboxProps> = ({ quickActionButtons, onQuickAction }) => {
  return (
    <GlassCard className="p-6 bg-amber-50/50 border-amber-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        🧰 Field Toolbox
      </h3>
      <div className="flex flex-col gap-3">
        {quickActionButtons.map((btn, i) => (
          <Button
            key={i}
            variant={btn.variant}
            onClick={() => onQuickAction(btn.action)}
            className="w-full justify-start text-lg h-12"
          >
            <span className="mr-3 text-xl leading-none">{btn.icon}</span>
            {btn.label}
          </Button>
        ))}
      </div>
    </GlassCard>
  );
};

export default FieldToolbox;
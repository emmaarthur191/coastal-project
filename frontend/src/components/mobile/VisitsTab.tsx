import React from 'react';
import { PlayfulCard, PlayfulButton, THEME } from './MobileTheme';

interface Visit {
  id: number;
  client_name: string;
  scheduled_time: string;
  purpose: string;
  status: string;
}

interface VisitsTabProps {
  scheduledVisits: Visit[];
  onAddStop: () => void;
}

const VisitsTab: React.FC<VisitsTabProps> = ({ scheduledVisits, onAddStop }) => {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>🗓️ Today's Route</h2>
        <PlayfulButton onClick={onAddStop} color={THEME.colors.success}>+ Add Stop</PlayfulButton>
      </div>
      {scheduledVisits.length > 0 ? scheduledVisits.map(visit => (
        <PlayfulCard key={visit.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <strong>{visit.client_name}</strong>
            <div style={{ fontSize: '12px' }}>{visit.scheduled_time} • {visit.purpose}</div>
          </div>
          <div>{visit.status === 'completed' ? '✅' : '⏳'}</div>
        </PlayfulCard>
      )) : (
        <PlayfulCard style={{ textAlign: 'center', color: '#aaa' }}>No stops planned yet! Go exploring! 🗺️</PlayfulCard>
      )}
    </>
  );
};

export default VisitsTab;
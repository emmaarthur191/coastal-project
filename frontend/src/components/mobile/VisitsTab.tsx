import React from 'react';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';

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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-black text-gray-800">🗓️ Today's Route</h2>
        <Button onClick={onAddStop} size="sm" variant="success">
          + Add Stop
        </Button>
      </div>
      <div className="space-y-4">
        {scheduledVisits.length > 0 ? scheduledVisits.map(visit => (
          <GlassCard key={visit.id} className="flex justify-between items-center p-4">
            <div>
              <strong className="block text-gray-800 text-lg">{visit.client_name}</strong>
              <div className="text-xs text-gray-500 font-medium">
                {visit.scheduled_time} • {visit.purpose}
              </div>
            </div>
            <div className="text-2xl" title={visit.status === 'completed' ? 'Completed' : 'Pending'}>
              {visit.status === 'completed' ? '✅' : '⏳'}
            </div>
          </GlassCard>
        )) : (
          <GlassCard className="text-center py-12 text-gray-400">
            <p>No stops planned yet! Go exploring! 🗺️</p>
          </GlassCard>
        )}
      </div>
    </>
  );
};

export default VisitsTab;

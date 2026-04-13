import React from 'react';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';
import { Calendar, Clock, CheckCircle2, Map, Plus } from 'lucide-react';

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
  onComplete?: (id: number) => void;
}

const VisitsTab: React.FC<VisitsTabProps> = ({ scheduledVisits, onAddStop, onComplete }) => {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-coastal-primary" /> Today's Route
        </h2>
        <Button onClick={onAddStop} size="sm" variant="success" className="flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add Stop
        </Button>
      </div>
      <div className="space-y-4">
        {scheduledVisits.length > 0 ? scheduledVisits.map((visit, index) => (
          <GlassCard key={visit.id || `visit-${index}`} className="flex justify-between items-center p-4">
            <div>
              <strong className="block text-gray-800 text-lg">{visit.client_name}</strong>
              <div className="text-xs text-gray-500 font-medium">
                {visit.scheduled_time} • {visit.purpose}
              </div>
            </div>
            <div
              className={`cursor-pointer hover:scale-110 transition-transform ${visit.status === 'completed' ? 'pointer-events-none opacity-100' : 'opacity-70 hover:opacity-100'}`}
              title={visit.status === 'completed' ? 'Completed' : 'Click to complete'}
              onClick={() => visit.status !== 'completed' && onComplete?.(visit.id)}
            >
              {visit.status === 'completed' ? 
                <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : 
                <Clock className="w-6 h-6 text-slate-400" />
              }
            </div>
          </GlassCard>
        )) : (
          <GlassCard className="text-center py-12 text-gray-400">
            <div className="flex justify-center mb-4">
              <Map className="w-12 h-12 text-slate-200" />
            </div>
            <p className="font-medium">No stops planned yet!</p>
          </GlassCard>
        )}
      </div>
    </>
  );
};

export default VisitsTab;

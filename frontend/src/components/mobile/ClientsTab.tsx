import React from 'react';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';

interface Client {
  id: number;
  client_id?: string | number;
  name: string;
  location?: string;
  status?: string;
  amountDue?: string | number | null;
  nextVisit?: string;
  priority?: string;
}


interface ClientsTabProps {
  assignedClients: Client[];
  onVisit?: (client: Client) => void;
  onComplete?: (id: number) => void;
}

const ClientsTab: React.FC<ClientsTabProps> = ({ assignedClients, onVisit, onComplete }) => {
  return (
    <>
      <h2 className="text-xl font-black text-gray-800 mb-4">📋 My Clients</h2>
      <div className="flex flex-col gap-4">
        {assignedClients.map((client) => (
          <GlassCard
            key={client.id}
            className={`flex items-center gap-4 p-4 !border-l-4 ${client.priority === 'high' ? '!border-l-red-500' : '!border-l-black'} ${client.status === 'completed' ? 'opacity-60' : 'opacity-100'}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 ${client.status === 'completed' ? 'bg-success-100 border-success-500 text-success-700' : 'bg-gray-100 border-black text-gray-700'}`}>
              {client.status === 'completed' ? '✅' : client.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg text-gray-800">{client.name}</div>
              <div className="text-sm text-gray-500">📍 {client.location || 'N/A'}</div>
              <div className="flex gap-2 items-center mt-1">
                {client.priority === 'high' && (
                  <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold inline-block">
                    URGENT
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${client.status === 'completed' ? 'bg-success-100 text-success-700' : 'bg-secondary-100 text-secondary-700'}`}>
                  {client.status || 'Active'}
                </span>
              </div>
            </div>
            <div className="text-right flex flex-col gap-2">
              {client.amountDue && (
                <div className="text-red-500 font-black text-sm">{client.amountDue}</div>
              )}
              {client.status !== 'completed' ? (
                <div className="flex gap-1">
                  <Button
                    onClick={() => onVisit?.(client)}
                    size="sm"
                    className="text-[10px] px-2 py-1"
                    variant="primary"
                  >
                    Action
                  </Button>
                  <Button
                    onClick={() => onComplete?.(client.id)}
                    size="sm"
                    className="text-[10px] px-2 py-1"
                    variant="success"
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <span className="text-xs font-bold text-success-600 italic">Visited</span>
              )}
            </div>
          </GlassCard>
        ))}
        {assignedClients.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p>No clients assigned yet.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ClientsTab;

import React from 'react';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';

interface Client {
  id: number;
  name: string;
  location: string;
  status: string;
  amountDue: string | null;
  nextVisit: string;
  priority: string;
}

interface ClientsTabProps {
  assignedClients: Client[];
}

const ClientsTab: React.FC<ClientsTabProps> = ({ assignedClients }) => {
  return (
    <>
      <h2 className="text-xl font-black text-gray-800 mb-4">📋 My Clients</h2>
      <div className="flex flex-col gap-4">
        {assignedClients.map((client) => (
          <GlassCard
            key={client.id}
            className={`flex items-center gap-4 p-4 !border-l-4 ${client.priority === 'high' ? '!border-l-red-500' : '!border-l-black'}`}
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-bold text-lg border-2 border-black text-gray-700">
              {client.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg text-gray-800">{client.name}</div>
              <div className="text-sm text-gray-500">📍 {client.location}</div>
              {client.priority === 'high' && (
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 inline-block">
                  URGENT
                </span>
              )}
            </div>
            <div className="text-right">
              {client.amountDue && (
                <div className="text-red-500 font-black mb-1">{client.amountDue}</div>
              )}
              <Button
                onClick={() => { }}
                size="sm"
                className="text-xs px-3 py-1"
                variant="primary"
              >
                Visit
              </Button>
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

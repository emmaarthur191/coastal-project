import React from 'react';
import { PlayfulCard, PlayfulButton, THEME } from './MobileTheme';
import { formatCurrencyGHS } from '../../utils/formatters';

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
      <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '15px' }}>📋 My Clients</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {assignedClients.map((client) => (
          <PlayfulCard key={client.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: client.priority === 'high' ? `8px solid ${THEME.colors.danger}` : `3px solid black` }}>
            <div style={{ width: '50px', height: '50px', background: '#dfe6e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', border: '2px solid black' }}>
              {client.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{client.name}</div>
              <div style={{ fontSize: '14px', color: '#636e72' }}>📍 {client.location}</div>
              {client.priority === 'high' && <span style={{ background: THEME.colors.danger, color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>URGENT</span>}
            </div>
            <div style={{ textAlign: 'right' }}>
              {client.amountDue && <div style={{ color: THEME.colors.danger, fontWeight: '900' }}>{client.amountDue}</div>}
              <PlayfulButton onClick={() => {}} style={{ padding: '5px 10px', fontSize: '12px', marginTop: '5px' }}>Visit</PlayfulButton>
            </div>
          </PlayfulCard>
        ))}
      </div>
    </>
  );
};

export default ClientsTab;
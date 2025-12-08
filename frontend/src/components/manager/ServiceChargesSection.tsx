import React from 'react';

interface ServiceChargesSectionProps {
  newCharge: any;
  setNewCharge: React.Dispatch<React.SetStateAction<any>>;
  serviceChargeCalculation: any;
  setServiceChargeCalculation: React.Dispatch<React.SetStateAction<any>>;
  serviceCharges: any[];
  fetchServiceCharges: () => void;
}

const ServiceChargesSection: React.FC<ServiceChargesSectionProps> = ({
  newCharge,
  setNewCharge,
  serviceChargeCalculation,
  setServiceChargeCalculation,
  serviceCharges,
  fetchServiceCharges
}) => {
  return (
    <div>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '900' }}>🏷️ Service Charges</h3>
      <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>💰</div>
        <h4>Service Charge Management</h4>
        <p>Configure and manage service charges for banking operations.</p>
        <p style={{ fontSize: '14px', marginTop: '16px' }}>Feature coming soon! 🚧</p>
      </div>
    </div>
  );
};

export default ServiceChargesSection;
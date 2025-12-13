
import React from 'react';
import { THEME, PlayfulButton } from './MobileTheme';

// --- GENERIC MOBILE MODAL ---
interface MobileModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

const MobileModal: React.FC<MobileModalProps> = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: THEME.radius.medium,
                width: '100%', maxWidth: '400px',
                boxShadow: THEME.shadows.card,
                overflow: 'hidden',
                border: '3px solid black'
            }}>
                {/* Header */}
                <div style={{
                    padding: '15px 20px',
                    background: THEME.colors.bg,
                    borderBottom: '2px solid #eee',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: THEME.colors.text }}>{title}</h3>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: THEME.colors.muted
                    }}>×</button>
                </div>

                {/* Body */}
                <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div style={{
                        padding: '15px 20px',
                        borderTop: '2px solid #eee',
                        display: 'flex', justifyContent: 'flex-end', gap: '10px'
                    }}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- STYLED INPUTS ---
const InputGroup = ({ label, type = 'text', value, onChange, placeholder, options }: any) => (
    <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: THEME.colors.muted, marginBottom: '5px' }}>{label}</label>
        {options ? (
            <select
                value={value}
                onChange={onChange}
                style={{
                    width: '100%', padding: '10px', borderRadius: '8px', border: `2px solid ${THEME.colors.border}`,
                    fontWeight: 'bold', fontSize: '14px', outline: 'none'
                }}
            >
                {options.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        ) : (
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                style={{
                    width: '100%', padding: '10px', borderRadius: '8px', border: `2px solid ${THEME.colors.border}`,
                    fontWeight: 'bold', fontSize: '14px', outline: 'none'
                }}
            />
        )}
    </div>
);

// --- SPECIFIC MODALS ---

export const DepositModal = ({ isOpen, onClose, formData, setFormData, onSubmit }: any) => (
    <MobileModal
        isOpen={isOpen}
        onClose={onClose}
        title="📥 New Deposit"
        footer={
            <>
                <PlayfulButton onClick={onClose} color="#ccc" style={{ color: '#333' }}>Cancel</PlayfulButton>
                <PlayfulButton onClick={onSubmit} color={THEME.colors.success}>Process Deposit</PlayfulButton>
            </>
        }
    >
        <InputGroup
            label="Member ID / Account Number"
            value={formData.account_number || formData.member_id}
            onChange={(e: any) => setFormData({ ...formData, account_number: e.target.value })}
            placeholder="Enter account number..."
        />
        <InputGroup
            label="Account Type"
            value={formData.account_type || 'daily_susu'}
            options={[
                { value: 'daily_susu', label: 'Daily Susu' },
                { value: 'savings', label: 'Savings' },
                { value: 'checking', label: 'Checking' }
            ]}
            onChange={(e: any) => setFormData({ ...formData, account_type: e.target.value })}
        />
        <InputGroup
            label="Amount (GHS)"
            type="number"
            value={formData.amount}
            onChange={(e: any) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
        />
    </MobileModal>
);

export const WithdrawalModal = ({ isOpen, onClose, formData, setFormData, onSubmit }: any) => (
    <MobileModal
        isOpen={isOpen}
        onClose={onClose}
        title="📤 New Withdrawal"
        footer={
            <>
                <PlayfulButton onClick={onClose} color="#ccc" style={{ color: '#333' }}>Cancel</PlayfulButton>
                <PlayfulButton onClick={onSubmit} color={THEME.colors.danger}>Process Withdrawal</PlayfulButton>
            </>
        }
    >
        <InputGroup
            label="Member ID / Account Number"
            value={formData.account_number || formData.member_id}
            onChange={(e: any) => setFormData({ ...formData, account_number: e.target.value })}
            placeholder="Enter account number..."
        />
        <InputGroup
            label="Amount (GHS)"
            type="number"
            value={formData.amount}
            onChange={(e: any) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
        />
    </MobileModal>
);

export const PaymentModal = ({ isOpen, onClose, formData, setFormData, onSubmit }: any) => (
    <MobileModal
        isOpen={isOpen}
        onClose={onClose}
        title="💵 Collect Payment"
        footer={
            <>
                <PlayfulButton onClick={onClose} color="#ccc" style={{ color: '#333' }}>Cancel</PlayfulButton>
                <PlayfulButton onClick={onSubmit} color={THEME.colors.primary}>Collect</PlayfulButton>
            </>
        }
    >
        <InputGroup
            label="Client Name / ID"
            value={formData.member_id}
            onChange={(e: any) => setFormData({ ...formData, member_id: e.target.value })}
            placeholder="Client..."
        />
        <InputGroup
            label="Amount (GHS)"
            type="number"
            value={formData.amount}
            onChange={(e: any) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
        />
        <p style={{ fontSize: '12px', color: '#666' }}>Use this for loan repayments or generic collections.</p>
    </MobileModal>
);

export const LoanModal = ({ isOpen, onClose, formData, setFormData, onSubmit }: any) => (
    <MobileModal
        isOpen={isOpen}
        onClose={onClose}
        title="🤝 Loan Application"
        footer={
            <>
                <PlayfulButton onClick={onClose} color="#ccc" style={{ color: '#333' }}>Cancel</PlayfulButton>
                <PlayfulButton onClick={onSubmit} color={THEME.colors.info}>Submit Application</PlayfulButton>
            </>
        }
    >
        <InputGroup
            label="Applicant Name"
            value={formData.applicant_name}
            onChange={(e: any) => setFormData({ ...formData, applicant_name: e.target.value })}
            placeholder="Full Name"
        />
        <InputGroup
            label="Loan Amount Requested"
            type="number"
            value={formData.loan_amount}
            onChange={(e: any) => setFormData({ ...formData, loan_amount: e.target.value })}
            placeholder="0.00"
        />
        <InputGroup
            label="Purpose"
            value={formData.loan_purpose}
            onChange={(e: any) => setFormData({ ...formData, loan_purpose: e.target.value })}
            placeholder="Reason for loan..."
        />
        <InputGroup
            label="Monthly Income"
            type="number"
            value={formData.monthly_income}
            onChange={(e: any) => setFormData({ ...formData, monthly_income: e.target.value })}
            placeholder="0.00"
        />
    </MobileModal>
);

export const VisitModal = ({ isOpen, onClose, formData, setFormData, onSubmit }: any) => (
    <MobileModal
        isOpen={isOpen}
        onClose={onClose}
        title="🛵 Schedule Visit"
        footer={
            <>
                <PlayfulButton onClick={onClose} color="#ccc" style={{ color: '#333' }}>Cancel</PlayfulButton>
                <PlayfulButton onClick={onSubmit} color={THEME.colors.warning}>Schedule</PlayfulButton>
            </>
        }
    >
        <InputGroup
            label="Client Name"
            value={formData.client_name}
            onChange={(e: any) => setFormData({ ...formData, client_name: e.target.value })}
            placeholder="Name..."
        />
        <InputGroup
            label="Location"
            value={formData.location}
            onChange={(e: any) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Area/Town"
        />
        <InputGroup
            label="Date & Time"
            type="datetime-local"
            value={formData.scheduled_time}
            onChange={(e: any) => setFormData({ ...formData, scheduled_time: e.target.value })}
        />
        <InputGroup
            label="Purpose"
            value={formData.purpose}
            onChange={(e: any) => setFormData({ ...formData, purpose: e.target.value })}
            placeholder="Collection, Sales, etc."
        />
    </MobileModal>
);

export const MessageModal = ({ isOpen, onClose, formData, setFormData, onSubmit }: any) => (
    <MobileModal
        isOpen={isOpen}
        onClose={onClose}
        title="💬 New Message"
        footer={
            <>
                <PlayfulButton onClick={onClose} color="#ccc" style={{ color: '#333' }}>Cancel</PlayfulButton>
                <PlayfulButton onClick={onSubmit} color={THEME.colors.primary}>Send</PlayfulButton>
            </>
        }
    >
        <InputGroup
            label="Subject"
            value={formData.subject}
            onChange={(e: any) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Message Subject..."
        />
        <InputGroup
            label="Priority"
            value={formData.priority}
            options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' }
            ]}
            onChange={(e: any) => setFormData({ ...formData, priority: e.target.value })}
        />
        <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: THEME.colors.muted, marginBottom: '5px' }}>Message</label>
            <textarea
                value={formData.content || formData.message}
                onChange={(e: any) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Type your message..."
                rows={4}
                style={{
                    width: '100%', padding: '10px', borderRadius: '8px', border: `2px solid ${THEME.colors.border}`,
                    fontWeight: 'bold', fontSize: '14px', outline: 'none', resize: 'vertical'
                }}
            />
        </div>
    </MobileModal>
);

export const KycModal = ({ isOpen, onClose }: any) => (
    <MobileModal
        isOpen={isOpen}
        onClose={onClose}
        title="📸 KYC Document"
        footer={
            <PlayfulButton onClick={onClose} color="#ccc" style={{ color: '#333' }}>Close</PlayfulButton>
        }
    >
        <p style={{ textAlign: 'center', color: '#666' }}>KYC Upload feature coming soon!</p>
    </MobileModal>
);

import React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-100 animate-scale-in">
                {/* Header */}
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="m-0 text-lg font-black text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="bg-transparent border-none text-2xl cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- STYLED INPUTS ---
const InputGroup = ({ label, type = 'text', value, onChange, placeholder, options }: any) => (
    <div className="mb-4">
        {options ? (
            <div className="relative">
                <Input
                    label={label}
                    as="select"
                    value={value}
                    onChange={onChange}
                    className="w-full font-bold"
                >
                    {options.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </Input>
            </div>
        ) : (
            <Input
                label={label}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full font-bold"
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
                <Button onClick={onClose} variant="ghost" className="text-gray-600">Cancel</Button>
                <Button onClick={onSubmit} variant="success">Process Deposit 💰</Button>
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
                <Button onClick={onClose} variant="ghost" className="text-gray-600">Cancel</Button>
                <Button onClick={onSubmit} variant="danger">Process Withdrawal 💸</Button>
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
                <Button onClick={onClose} variant="ghost" className="text-gray-600">Cancel</Button>
                <Button onClick={onSubmit} variant="primary">Collect Payment 💳</Button>
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
        <p className="text-xs text-gray-500 mt-2 italic">Use this for loan repayments or generic collections.</p>
    </MobileModal>
);

export const LoanModal = ({ isOpen, onClose, formData, setFormData, onSubmit }: any) => (
    <MobileModal
        isOpen={isOpen}
        onClose={onClose}
        title="🤝 Loan Application"
        footer={
            <>
                <Button onClick={onClose} variant="ghost" className="text-gray-600">Cancel</Button>
                <Button onClick={onSubmit} variant="secondary">Submit Application 📝</Button>
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
                <Button onClick={onClose} variant="ghost" className="text-gray-600">Cancel</Button>
                <Button onClick={onSubmit} variant="warning" className="text-white">Schedule 📅</Button>
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
                <Button onClick={onClose} variant="ghost" className="text-gray-600">Cancel</Button>
                <Button onClick={onSubmit} variant="primary">Send Message 📨</Button>
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
        <div className="mb-4">
            <label className="block text-sm font-bold text-gray-500 mb-1">Message</label>
            <textarea
                value={formData.content || formData.message}
                onChange={(e: any) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Type your message..."
                rows={4}
                className="w-full p-3 rounded-lg border-2 border-gray-200 outline-none focus:border-blue-400 font-medium text-gray-700 resize-y"
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
            <Button onClick={onClose} variant="ghost" className="text-gray-600">Close</Button>
        }
    >
        <p className="text-center text-gray-500 py-8 italic">KYC Upload feature coming soon! 🚧</p>
    </MobileModal>
);

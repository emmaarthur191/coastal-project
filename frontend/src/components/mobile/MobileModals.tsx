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
interface InputGroupProps {
    label: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    placeholder?: string;
    options?: { value: string; label: string }[];
}

const InputGroup: React.FC<InputGroupProps> = ({ label, type = 'text', value, onChange, placeholder, options }) => (
    <div className="mb-4">
        <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
        {options ? (
            <select
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-100 outline-none focus:border-black transition-all bg-gray-50 text-gray-800"
                value={value}
                onChange={onChange}
                title={label}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        ) : (
            <Input
                type={type}
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-100 outline-none focus:border-black transition-all bg-gray-50 text-gray-800"
                placeholder={placeholder || label}
                value={value}
                onChange={onChange}
                title={label}
            />
        )}
    </div>
);

// --- SPECIFIC MODALS ---
interface BaseFormModalProps<T> {
    isOpen: boolean;
    onClose: () => void;
    formData: T;
    setFormData: (data: T) => void;
    onSubmit: (e: React.FormEvent) => void;
    loading?: boolean;
}

export const DepositModal: React.FC<BaseFormModalProps<any>> = ({ isOpen, onClose, formData, setFormData, onSubmit, loading }) => (
    <MobileModal
        isOpen={isOpen}
        onClose={onClose}
        title="📥 New Deposit"
        footer={
            <>
                <Button onClick={onClose} variant="ghost" className="text-gray-600" disabled={loading}>Cancel</Button>
                <Button onClick={onSubmit} variant="success" disabled={loading}>
                    {loading ? 'Processing...' : 'Process Deposit 💰'}
                </Button>
            </>
        }
    >
        <InputGroup
            label="Member ID"
            value={formData.member_id}
            onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
        />
        <InputGroup
            label="Amount (GHS)"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        />
        <InputGroup
            label="Deposit Type"
            value={formData.deposit_type}
            onChange={(e) => setFormData({ ...formData, deposit_type: e.target.value })}
            options={[
                { value: 'daily_susu', label: 'Daily Susu' },
                { value: 'savings', label: 'Regular Savings' },
                { value: 'shares', label: 'Shares' },
            ]}
        />
    </MobileModal>
);

export const WithdrawalModal: React.FC<BaseFormModalProps<any>> = ({ isOpen, onClose, formData, setFormData, onSubmit, loading }) => (
    <MobileModal
        isOpen={isOpen}
        onClose={onClose}
        title="📤 New Withdrawal"
        footer={
            <>
                <Button onClick={onClose} variant="ghost" className="text-gray-600" disabled={loading}>Cancel</Button>
                <Button onClick={onSubmit} variant="danger" disabled={loading}>
                    {loading ? 'Processing...' : 'Process Withdrawal 💸'}
                </Button>
            </>
        }
    >
        <InputGroup
            label="Member ID"
            value={formData.member_id}
            onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
        />
        <InputGroup
            label="Amount (GHS)"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        />
    </MobileModal>
);

export const PaymentModal: React.FC<BaseFormModalProps<any>> = ({ isOpen, onClose, formData, setFormData, onSubmit, loading }) => (
    <MobileModal
        isOpen={isOpen}
        onClose={onClose}
        title="💸 Loan Payment"
        footer={
            <>
                <Button onClick={onClose} variant="ghost" disabled={loading}>Cancel</Button>
                <Button onClick={onSubmit} variant="primary" disabled={loading}>
                    {loading ? 'Processing...' : 'Make Payment ✅'}
                </Button>
            </>
        }
    >
        <InputGroup
            label="Member ID"
            value={formData.member_id}
            onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
        />
        <InputGroup
            label="Amount (GHS)"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        />
    </MobileModal>
);

export const LoanModal: React.FC<BaseFormModalProps<any>> = ({ isOpen, onClose, formData, setFormData, onSubmit, loading }) => (
    <MobileModal
        isOpen={isOpen}
        onClose={onClose}
        title="🏦 Loan Application"
        footer={
            <>
                <Button onClick={onClose} variant="ghost" disabled={loading}>Cancel</Button>
                <Button onClick={onSubmit} variant="primary" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Application 📄'}
                </Button>
            </>
        }
    >
        {/* PERSONAL INFO */}
        <div className="mb-6">
            <p className="text-secondary-600 font-bold mb-2 border-b border-secondary-100 pb-1">👤 Personal Information</p>
            <InputGroup
                label="Member ID"
                value={formData.member_id}
                onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
            />
            <InputGroup
                label="Date of Birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
                <InputGroup
                    label="ID Type"
                    value={formData.id_type}
                    onChange={(e) => setFormData({ ...formData, id_type: e.target.value })}
                    options={[
                        { value: 'ghana_card', label: 'Ghana Card' },
                        { value: 'voter_id', label: 'Voter ID' },
                        { value: 'passport', label: 'Passport' },
                    ]}
                />
                <InputGroup
                    label="ID Number"
                    value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                />
            </div>
            <InputGroup
                label="Digital Address"
                value={formData.digital_address}
                onChange={(e) => setFormData({ ...formData, digital_address: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
                <InputGroup
                    label="Town"
                    value={formData.town}
                    onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                />
                <InputGroup
                    label="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
            </div>
        </div>

        {/* NEXT OF KIN 1 */}
        <div className="mb-6">
            <p className="text-secondary-600 font-bold mb-2 border-b border-secondary-100 pb-1">👪 Next of Kin (1)</p>
            <InputGroup
                label="Full Name"
                value={formData.next_of_kin_1_name}
                onChange={(e) => setFormData({ ...formData, next_of_kin_1_name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
                <InputGroup
                    label="Relationship"
                    value={formData.next_of_kin_1_relationship}
                    onChange={(e) => setFormData({ ...formData, next_of_kin_1_relationship: e.target.value })}
                />
                <InputGroup
                    label="Phone"
                    value={formData.next_of_kin_1_phone}
                    onChange={(e) => setFormData({ ...formData, next_of_kin_1_phone: e.target.value })}
                />
            </div>
            <InputGroup
                label="Address"
                value={formData.next_of_kin_1_address}
                onChange={(e) => setFormData({ ...formData, next_of_kin_1_address: e.target.value })}
            />
        </div>

        {/* NEXT OF KIN 2 */}
        <div className="mb-6">
            <p className="text-secondary-600 font-bold mb-2 border-b border-secondary-100 pb-1">👪 Next of Kin (2)</p>
            <InputGroup
                label="Full Name"
                value={formData.next_of_kin_2_name}
                onChange={(e) => setFormData({ ...formData, next_of_kin_2_name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
                <InputGroup
                    label="Relationship"
                    value={formData.next_of_kin_2_relationship}
                    onChange={(e) => setFormData({ ...formData, next_of_kin_2_relationship: e.target.value })}
                />
                <InputGroup
                    label="Phone"
                    value={formData.next_of_kin_2_phone}
                    onChange={(e) => setFormData({ ...formData, next_of_kin_2_phone: e.target.value })}
                />
            </div>
            <InputGroup
                label="Address"
                value={formData.next_of_kin_2_address}
                onChange={(e) => setFormData({ ...formData, next_of_kin_2_address: e.target.value })}
            />
        </div>

        {/* GUARANTOR 1 */}
        <div className="mb-6">
            <p className="text-secondary-600 font-bold mb-2 border-b border-secondary-100 pb-1">🛡️ Guarantor (1)</p>
            <InputGroup
                label="Full Name"
                value={formData.guarantor_1_name}
                onChange={(e) => setFormData({ ...formData, guarantor_1_name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
                <InputGroup
                    label="ID Type"
                    value={formData.guarantor_1_id_type}
                    onChange={(e) => setFormData({ ...formData, guarantor_1_id_type: e.target.value })}
                    options={[
                        { value: 'ghana_card', label: 'Ghana Card' },
                        { value: 'voter_id', label: 'Voter ID' },
                        { value: 'passport', label: 'Passport' },
                    ]}
                />
                <InputGroup
                    label="ID Number"
                    value={formData.guarantor_1_id_number}
                    onChange={(e) => setFormData({ ...formData, guarantor_1_id_number: e.target.value })}
                />
            </div>
            <InputGroup
                label="Phone"
                value={formData.guarantor_1_phone}
                onChange={(e) => setFormData({ ...formData, guarantor_1_phone: e.target.value })}
            />
            <InputGroup
                label="Address"
                value={formData.guarantor_1_address}
                onChange={(e) => setFormData({ ...formData, guarantor_1_address: e.target.value })}
            />
        </div>

        {/* GUARANTOR 2 */}
        <div className="mb-6">
            <p className="text-secondary-600 font-bold mb-2 border-b border-secondary-100 pb-1">🛡️ Guarantor (2)</p>
            <InputGroup
                label="Full Name"
                value={formData.guarantor_2_name}
                onChange={(e) => setFormData({ ...formData, guarantor_2_name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
                <InputGroup
                    label="ID Type"
                    value={formData.guarantor_2_id_type}
                    onChange={(e) => setFormData({ ...formData, guarantor_2_id_type: e.target.value })}
                    options={[
                        { value: 'ghana_card', label: 'Ghana Card' },
                        { value: 'voter_id', label: 'Voter ID' },
                        { value: 'passport', label: 'Passport' },
                    ]}
                />
                <InputGroup
                    label="ID Number"
                    value={formData.guarantor_2_id_number}
                    onChange={(e) => setFormData({ ...formData, guarantor_2_id_number: e.target.value })}
                />
            </div>
            <InputGroup
                label="Phone"
                value={formData.guarantor_2_phone}
                onChange={(e) => setFormData({ ...formData, guarantor_2_phone: e.target.value })}
            />
            <InputGroup
                label="Address"
                value={formData.guarantor_2_address}
                onChange={(e) => setFormData({ ...formData, guarantor_2_address: e.target.value })}
            />
        </div>

        {/* LOAN DETAILS */}
        <div className="mb-2">
            <p className="text-secondary-600 font-bold mb-2 border-b border-secondary-100 pb-1">💰 Loan & Financial Details</p>
            <InputGroup
                label="Loan Amount (GHS)"
                type="number"
                value={formData.loan_amount}
                onChange={(e) => setFormData({ ...formData, loan_amount: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
                <InputGroup
                    label="Term (Months)"
                    type="number"
                    value={formData.term_months}
                    onChange={(e) => setFormData({ ...formData, term_months: e.target.value })}
                />
                <InputGroup
                    label="Interest Rate (%)"
                    type="number"
                    value={formData.interest_rate}
                    onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                />
            </div>
            <InputGroup
                label="Monthly Income (GHS)"
                type="number"
                value={formData.monthly_income}
                onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
            />
            <InputGroup
                label="Purpose"
                value={formData.loan_purpose}
                onChange={(e) => setFormData({ ...formData, loan_purpose: e.target.value })}
            />
        </div>
    </MobileModal>
);

export const ScheduleModal: React.FC<BaseFormModalProps<any>> = ({ isOpen, onClose, formData, setFormData, onSubmit, loading }) => (
    <MobileModal
        isOpen={isOpen}
        onClose={onClose}
        title="📅 Schedule Visit"
        footer={
            <>
                <Button onClick={onClose} variant="ghost" disabled={loading}>Cancel</Button>
                <Button onClick={onSubmit} variant="success" disabled={loading}>
                    {loading ? 'Scheduling...' : 'Schedule Stop 📍'}
                </Button>
            </>
        }
    >
        <InputGroup
            label="Client Name"
            value={formData.client_name}
            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            placeholder="Search or enter client name"
        />
        <InputGroup
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Client shop, office, etc."
        />
        <InputGroup
            label="Date & Time"
            type="datetime-local"
            value={formData.scheduled_time}
            onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
        />
        <InputGroup
            label="Purpose"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: (e.target as HTMLInputElement).value })}
            placeholder="Collection, Sales, etc."
        />
    </MobileModal>
);

export const MessageModal: React.FC<BaseFormModalProps<any>> = ({ isOpen, onClose, formData, setFormData, onSubmit, loading }) => (
    <MobileModal
        isOpen={isOpen}
        onClose={onClose}
        title="💬 New Message"
        footer={
            <>
                <Button onClick={onClose} variant="ghost" className="text-gray-600" disabled={loading}>Cancel</Button>
                <Button onClick={onSubmit} variant="primary" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Message 📨'}
                </Button>
            </>
        }
    >
        <InputGroup
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
        />
        <div className="mb-4">
            <label className="block text-sm font-bold text-gray-500 mb-1">Message</label>
            <textarea
                value={formData.content || formData.message || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Type your message..."
                rows={4}
                className="w-full p-3 rounded-lg border-2 border-gray-200 outline-none focus:border-blue-400 font-medium text-gray-700 resize-y"
            />
        </div>
    </MobileModal>
);

export const KycModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
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

import React, { useState, useCallback, useId } from 'react';
import { api, apiService } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import GlassCard from '../ui/modern/GlassCard';
import CameraCapture from '../shared/CameraCapture';
import { 
  Printer, 
  RefreshCw, 
  UserPlus, 
  Search, 
  User, 
  CreditCard, 
  Briefcase, 
  Users, 
  Plus, 
  Building2, 
  Send,
  CheckCircle2,
  X,
  ShieldAlert
} from 'lucide-react';

/**
 * Account Opening Tab Component for Cashier Dashboard
 * Unified form matching Mobile Banker's ClientRegistrationTab with camera capture
 */
const AccountOpeningTab: React.FC = () => {
  interface SubmitResponse {
    success: boolean;
    account_id?: string;
    error?: string;
  }

  // Form data state - matching ClientRegistrationTab structure
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phoneNumber: '',
    email: '',
    digitalAddress: '',

    // Identification
    idType: 'ghana_card',
    idNumber: '',

    // Employment Information
    occupation: '',
    workAddress: '',
    position: '',

    // Next of Kin (up to 4)
    nextOfKin: [
      { name: '', relationship: '', address: '', stakePercentage: '' }
    ],

    // Account Type
    accountType: 'daily_susu',
    cardType: 'standard',

    // Photo
    photo: null as string | null
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [_newAccountId, _setNewAccountId] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Form, 2: Success

  const [lookupNumber, setLookupNumber] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  const idTypeSelectId = useId();
  const accountTypeSelectId = useId();
  const cardTypeSelectId = useId();

  // === CAMERA FUNCTIONS ===
  const handlePhotoCapture = useCallback((photo: string | null) => {
    setFormData(prev => ({ ...prev, photo }));
  }, []);

  // === FORM HANDLERS ===
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNextOfKinChange = useCallback((index: number, field: string, value: string) => {
    setFormData(prev => {
      const newNextOfKin = [...prev.nextOfKin];
      newNextOfKin[index] = { ...newNextOfKin[index], [field]: value };
      return { ...prev, nextOfKin: newNextOfKin };
    });
  }, []);

  const addNextOfKin = useCallback(() => {
    if (formData.nextOfKin.length < 4) {
      setFormData(prev => ({
        ...prev,
        nextOfKin: [...prev.nextOfKin, { name: '', relationship: '', address: '', stakePercentage: '' }]
      }));
    }
  }, [formData.nextOfKin.length]);

  const removeNextOfKin = useCallback((index: number) => {
    if (formData.nextOfKin.length > 1) {
      setFormData(prev => ({
        ...prev,
        nextOfKin: prev.nextOfKin.filter((_, i) => i !== index)
      }));
    }
  }, [formData.nextOfKin.length]);

  // === VALIDATION ===
  const validateForm = useCallback(() => {
    if (!formData.firstName.trim()) {
      setMessage({ type: 'error', text: 'First name is required' });
      return false;
    }
    if (!formData.lastName.trim()) {
      setMessage({ type: 'error', text: 'Last name is required' });
      return false;
    }
    if (!formData.dateOfBirth) {
      setMessage({ type: 'error', text: 'Date of birth is required' });
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      setMessage({ type: 'error', text: 'Phone number is required' });
      return false;
    }
    if (!formData.idNumber.trim()) {
      setMessage({ type: 'error', text: 'ID number is required' });
      return false;
    }
    if (!formData.digitalAddress.trim()) {
      setMessage({ type: 'error', text: 'Digital address is required' });
      return false;
    }
    // Age validation
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18 && formData.accountType !== 'youth_savings') {
      setMessage({ type: 'error', text: 'Customer must be at least 18 years old' });
      return false;
    }
    return true;
  }, [formData]);

  // === FORM SUBMISSION ===
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const submitData = {
        account_type: formData.accountType,
        card_type: formData.cardType,
        id_type: formData.idType,
        id_number: formData.idNumber,
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        phone_number: formData.phoneNumber,
        email: formData.email,
        occupation: formData.occupation,
        work_address: formData.workAddress,
        digital_address: formData.digitalAddress,
        position: formData.position,
        next_of_kin: formData.nextOfKin,
        photo: formData.photo
      };

      const response = await api.post<SubmitResponse>('banking/account-openings/submit-request/', {
        account_data: submitData
      });

      setCurrentStep(2);
      _setNewAccountId(response.data?.account_id || 'Pending Request');
      resetForm();
    } catch (error) {
      console.error('Error submitting request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit request.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleLookupMember = async () => {
    if (!lookupNumber.trim()) return;
    setLookupLoading(true);
    setMessage({ type: '', text: '' });
    try {
        const res = await apiService.lookupMember(lookupNumber);
        
        if (res.success && res.data) {
            const d = res.data;
            setFormData(prev => ({
                ...prev,
                firstName: d.first_name || prev.firstName,
                lastName: d.last_name || prev.lastName,
                dateOfBirth: d.date_of_birth || prev.dateOfBirth,
                phoneNumber: d.phone_number || prev.phoneNumber,
                email: d.email || prev.email,
                digitalAddress: d.digital_address || prev.digitalAddress,
                idType: d.id_type || prev.idType,
                idNumber: d.id_number || prev.idNumber,
                occupation: d.occupation || prev.occupation,
                workAddress: d.work_address || prev.workAddress,
                position: d.position || prev.position,
            }));
            setMessage({ type: 'success', text: `Existing record found for Member #${lookupNumber}. Details pre-filled.` });
        } else {
            setMessage({ type: 'error', text: res.error || `Member #${lookupNumber} not found.` });
        }
    } catch (error: unknown) {
        console.error('Lookup error:', error);
        setMessage({ type: 'error', text: 'Error connecting to lookup service.' });
    } finally {
        setLookupLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '', lastName: '', dateOfBirth: '', phoneNumber: '', email: '', digitalAddress: '',
      idType: 'ghana_card', idNumber: '',
      occupation: '', workAddress: '', position: '',
      nextOfKin: [{ name: '', relationship: '', address: '', stakePercentage: '' }],
      accountType: 'daily_susu', cardType: 'standard', photo: null
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // === RENDER ===
  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Action Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tighter italic">Registration Desk</h2>
          <p className="text-xs text-slate-500 font-medium">Capture details and generate physical forms</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="ghost" className="border-slate-200 flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print Blank Form
          </Button>
          <Button onClick={resetForm} variant="ghost" className="text-rose-500 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Reset
          </Button>
        </div>
      </div>

      <GlassCard className="p-8 print:shadow-none print:border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-coastal-primary" /> Account Opening
          </h2>
          <div className="flex items-center gap-2 bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-100 shadow-sm animate-pulse-subtle">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span className="text-[10px] text-rose-900 font-black uppercase tracking-widest">
              Verify Member Identity before onboarding!
            </span>
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-6 print:hidden">
          {[1, 2].map(step => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${currentStep >= step ? 'bg-coastal-primary text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                {step}
              </div>
              {step < 2 && <div className={`w-10 h-1 mx-2 ${currentStep > step ? 'bg-coastal-primary' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-10 text-sm text-gray-500 print:hidden">
          <span className={currentStep === 1 ? 'font-bold text-coastal-primary' : ''}>Opening Form</span>
          <span className={currentStep === 2 ? 'font-bold text-coastal-primary' : ''}>Submission Complete</span>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`p-4 rounded-xl border mb-6 ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
            {message.text}
          </div>
        )}

        {/* Step 1: Opening Form */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Lookup Section */}
            <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-200/20 mb-4 print:hidden">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-500" /> Existing Member Lookup
                </h3>
                <div className="flex gap-2">
                    <Input 
                        placeholder="CB-XXXXXX..." 
                        value={lookupNumber}
                        onChange={(e) => setLookupNumber(e.target.value)}
                        className="flex-1"
                        title="Enter Member ID to pre-fill form"
                    />
                    <Button 
                        onClick={handleLookupMember} 
                        disabled={lookupLoading || !lookupNumber}
                        className="font-black px-6"
                    >
                        {lookupLoading ? '...' : 'LOOKUP'}
                    </Button>
                </div>
                <p className="text-[10px] text-slate-500 font-bold mt-2 italic">
                    Use this to pre-fill PII data for existing customers adding new accounts.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <CameraCapture
                label="Customer Photo"
                description="Capture or upload a passport-style photo for identification. This is required for account security."
                photo={formData.photo}
                onPhotoCapture={handlePhotoCapture}
                previewWidth={160}
                previewHeight={192}
              />

              {/* Personal Information */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-coastal-primary" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Input label="First Name *" value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} placeholder="Enter first name" required />
                  <Input label="Last Name *" value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} placeholder="Enter last name" required />
                  <Input label="Date of Birth *" type="date" value={formData.dateOfBirth} onChange={(e) => handleInputChange('dateOfBirth', e.target.value)} required />
                  <Input label="Phone Number *" type="tel" value={formData.phoneNumber} onChange={(e) => handleInputChange('phoneNumber', e.target.value)} placeholder="+233 XX XXX XXXX" required />
                  <Input label="Email Address" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="customer@example.com" />
                  <Input label="Digital Address (GPS) *" value={formData.digitalAddress} onChange={(e) => handleInputChange('digitalAddress', e.target.value)} placeholder="e.g., GA-123-4567" required />
                </div>
              </div>

              {/* Identification */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-coastal-primary" /> Identification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    as="select"
                    label="ID Type *"
                    id={idTypeSelectId}
                    title="Select the type of ID provided by the customer"
                    value={formData.idType}
                    onChange={(e) => handleInputChange('idType', e.target.value)}
                  >
                    <option value="ghana_card">Ghana Card</option>
                    <option value="voter_id">Voter ID</option>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="nhis_card">NHIS Card</option>
                  </Input>
                  <Input label="ID Number *" value={formData.idNumber} onChange={(e) => handleInputChange('idNumber', e.target.value)} placeholder="Enter ID number" required />
                </div>
              </div>

              {/* Employment Information */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-coastal-primary" /> Employment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Occupation" value={formData.occupation} onChange={(e) => handleInputChange('occupation', e.target.value)} placeholder="e.g., Teacher, Trader" />
                  <Input label="Position/Title" value={formData.position} onChange={(e) => handleInputChange('position', e.target.value)} placeholder="e.g., Senior Staff" />
                  <div className="md:col-span-2">
                    <Input label="Work Address" value={formData.workAddress} onChange={(e) => handleInputChange('workAddress', e.target.value)} placeholder="Enter work address" />
                  </div>
                </div>
              </div>

              {/* Next of Kin */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-coastal-primary" /> Next of Kin (Beneficiaries)
                </h3>
                <div className="space-y-4">
                  {formData.nextOfKin.map((kin, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-gray-600">Beneficiary {index + 1}</span>
                        {formData.nextOfKin.length > 1 && (
                          <button type="button" onClick={() => removeNextOfKin(index)} className="text-red-500 hover:text-red-700 text-sm font-semibold transition-colors print:hidden flex items-center gap-1">
                            <X className="w-4 h-4" /> Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Input label="Full Name" value={kin.name} onChange={(e) => handleNextOfKinChange(index, 'name', e.target.value)} placeholder="Beneficiary name" />
                        <Input label="Relationship" value={kin.relationship} onChange={(e) => handleNextOfKinChange(index, 'relationship', e.target.value)} placeholder="e.g., Spouse" />
                        <Input label="Address" value={kin.address} onChange={(e) => handleNextOfKinChange(index, 'address', e.target.value)} placeholder="Beneficiary address" />
                        <Input label="Stake %" type="number" value={kin.stakePercentage} onChange={(e) => handleNextOfKinChange(index, 'stakePercentage', e.target.value)} placeholder="e.g., 50" />
                      </div>
                    </div>
                  ))}
                </div>
                {formData.nextOfKin.length < 4 && (
                  <div className="mt-4 print:hidden">
                    <Button type="button" onClick={addNextOfKin} variant="secondary" size="sm" className="flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Add Another Beneficiary
                    </Button>
                  </div>
                )}
              </div>

              {/* Account Type */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-coastal-primary" /> Account Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    as="select"
                    label="Account Type *"
                    id={accountTypeSelectId}
                    title="Select the type of account to open"
                    value={formData.accountType}
                    onChange={(e) => handleInputChange('accountType', e.target.value)}
                  >
                    <option value="daily_susu">Daily Susu Account</option>
                    <option value="shares">Shares Account</option>
                    <option value="youth_savings">Youth Savings Account</option>
                    <option value="monthly_contribution">Monthly Contribution</option>
                  </Input>
                  <Input
                    as="select"
                    label="Card Type"
                    id={cardTypeSelectId}
                    title="Select the type of ATM card requested, if any"
                    value={formData.cardType}
                    onChange={(e) => handleInputChange('cardType', e.target.value)}
                  >
                    <option value="standard">Standard Card</option>
                    <option value="gold">Gold Card</option>
                    <option value="platinum">Platinum Card</option>
                    <option value="none">No Card Required</option>
                  </Input>
                </div>
              </div>

              {/* Submit Button */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
                <div className="flex flex-col md:flex-row justify-center gap-4">
                  <Button
                    onClick={handleSubmit}
                    variant="primary"
                    size="lg"
                    disabled={loading}
                    className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 print:hidden flex items-center justify-center gap-3"
                  >
                    {loading ? 'Processing...' : (
                      <>
                        Complete Digital Registration
                        <Send className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handlePrint}
                    variant="ghost"
                    className="w-full mt-4 border-2 border-slate-200 font-bold uppercase print:hidden flex items-center justify-center gap-2"
                  >
                    <Printer className="w-5 h-5" /> Print Filled Form for Signature
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Success */}
        {currentStep === 2 && (
          <div className="text-center py-12">
            <div className="flex justify-center mb-6">
              <CheckCircle2 className="w-20 h-20 text-emerald-500 animate-bounce" />
            </div>
            <h2 className="text-3xl font-bold text-emerald-600 mb-2">Request Submitted Successfully!</h2>
            <div className="max-w-md mx-auto bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm mb-8">
              <p className="text-gray-600 mb-4">
                The account opening request for <span className="font-bold text-gray-800">{formData.firstName} {formData.lastName}</span> has been saved in a <b>Pending</b> state.
              </p>
              <div className="bg-emerald-50 p-4 rounded-xl text-emerald-800 text-sm border border-emerald-200">
                <p className="font-bold mb-2">Next Steps for Customer:</p>
                <ol className="text-left list-decimal ml-5 space-y-1">
                  <li>Proceed to the <b>Manager's Office</b></li>
                  <li>Present physical ID for verification</li>
                  <li>Collect your printed <b>Account Opening Letter</b></li>
                  <li>Use credentials in the letter to log in</li>
                </ol>
              </div>
            </div>
            <Button onClick={() => { setCurrentStep(1); resetForm(); }} variant="primary" size="lg">
              Register Another Customer
            </Button>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default AccountOpeningTab;

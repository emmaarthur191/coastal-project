import React, { useRef } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import GlassCard from '../ui/modern/GlassCard';

interface Member {
  id: string;
  name: string;
  email: string;
}

interface CheckDepositTabProps {
  checkDepositAmount: string;
  setCheckDepositAmount: React.Dispatch<React.SetStateAction<string>>;
  checkDepositMemberId: string;
  setCheckDepositMemberId: React.Dispatch<React.SetStateAction<string>>;
  checkDepositAccountType: string;
  setCheckDepositAccountType: React.Dispatch<React.SetStateAction<string>>;
  frontImage: File | null;
  setFrontImage: React.Dispatch<React.SetStateAction<File | null>>;
  backImage: File | null;
  setBackImage: React.Dispatch<React.SetStateAction<File | null>>;
  members: Member[];
  loading: boolean;
  handleCheckDepositSubmit: (e: React.FormEvent) => void;
}

const CheckDepositTab: React.FC<CheckDepositTabProps> = ({
  checkDepositAmount,
  setCheckDepositAmount,
  checkDepositMemberId,
  setCheckDepositMemberId,
  checkDepositAccountType,
  setCheckDepositAccountType,
  frontImage,
  setFrontImage,
  backImage,
  setBackImage,
  members,
  loading,
  handleCheckDepositSubmit
}) => {
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDropFront = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFrontImage(e.dataTransfer.files[0]);
    }
  };

  const handleDropBack = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setBackImage(e.dataTransfer.files[0]);
    }
  };

  return (
    <GlassCard className="max-w-3xl mx-auto p-8 border-t-[6px] border-t-amber-500">
      <div className="mb-8 text-center">
        <div className="inline-block p-4 rounded-full bg-amber-50 mb-4">
          <span className="text-4xl">📄</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Check Deposit</h2>
        <p className="text-gray-500 mt-2">Process secure check deposits for members</p>
      </div>

      <form onSubmit={handleCheckDepositSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Member ID / Search"
            value={checkDepositMemberId}
            onChange={e => setCheckDepositMemberId(e.target.value)}
            list="member-list"
            placeholder="Search member..."
            required
          />
          <Input
            label="Check Amount (GHS)"
            type="number"
            value={checkDepositAmount}
            onChange={e => setCheckDepositAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Front Image Upload */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${frontImage ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50'}`}
            onClick={() => frontInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDropFront}
          >
            <input
              type="file"
              ref={frontInputRef}
              onChange={e => setFrontImage(e.target.files?.[0] || null)}
              className="hidden"
              accept="image/*"
            />
            <div className="text-4xl mb-3">{frontImage ? '✅' : '📷'}</div>
            <div className="font-bold text-gray-700">{frontImage ? 'Front Image Selected' : 'Upload Front of Check'}</div>
            <div className="text-xs text-gray-400 mt-1">{frontImage ? frontImage.name : 'Click or drag image here'}</div>
          </div>

          {/* Back Image Upload */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${backImage ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50'}`}
            onClick={() => backInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDropBack}
          >
            <input
              type="file"
              ref={backInputRef}
              onChange={e => setBackImage(e.target.files?.[0] || null)}
              className="hidden"
              accept="image/*"
            />
            <div className="text-4xl mb-3">{backImage ? '✅' : '🔄'}</div>
            <div className="font-bold text-gray-700">{backImage ? 'Back Image Selected' : 'Upload Back of Check'}</div>
            <div className="text-xs text-gray-400 mt-1">{backImage ? backImage.name : 'Click or drag image here'}</div>
          </div>
        </div>

        <Button
          type="submit"
          variant="warning"
          className="w-full py-4 text-lg font-bold shadow-lg shadow-amber-100/50"
          disabled={loading || !checkDepositMemberId || !checkDepositAmount || !frontImage}
        >
          {loading ? 'Processing Check...' : 'Process Deposit 📥'}
        </Button>
      </form>
    </GlassCard>
  );
};

export default CheckDepositTab;

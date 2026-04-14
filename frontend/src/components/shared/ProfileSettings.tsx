import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { 
  Lock, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Camera, 
  ShieldCheck,
  X,
  BadgeCheck,
  Building,
  Mail,
  Phone
} from 'lucide-react';
import { Button } from '../ui/Button';
import GlassCard from '../ui/modern/GlassCard';
import { logger } from '../../utils/logger';
import { UserExtended } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface ProfileSettingsProps {
  user: UserExtended;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user }) => {
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Password state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Profile data state
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',
    profile_photo: user?.profile_photo || '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ text: 'File too large (Max 2MB)', type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm({ ...profileForm, profile_photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ text: 'New passwords do not match', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.changePassword({
        old_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password
      });

      if (res.success) {
        setMessage({ text: 'Password updated successfully!', type: 'success' });
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        setMessage({ text: res.error || 'Failed to update password', type: 'error' });
      }
    } catch (err) {
      logger.error('Password change error', err);
      setMessage({ text: 'An unexpected error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiService.updateProfile(profileForm);
      if (res.success) {
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        if (res.data) {
          updateUser(res.data);
        }
      } else {
        setMessage({ text: res.error || 'Failed to update profile', type: 'error' });
      }
    } catch (_err) {
      setMessage({ text: 'An unexpected error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Executive Identity Header */}
      <GlassCard className="p-6 border-l-8 border-l-coastal-primary shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-coastal-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {/* Avatar Section */}
          <div className="relative group">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden bg-slate-50 transition-transform duration-300 group-hover:scale-[1.02]">
              {profileForm.profile_photo ? (
                <img src={profileForm.profile_photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 text-5xl font-black">
                  {(profileForm.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                </div>
              )}
            </div>
            <label className="absolute -bottom-3 -right-3 p-3 bg-coastal-primary text-white rounded-xl shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-all z-20 border-2 border-white">
              <Camera className="w-5 h-5" />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
                aria-label="Upload profile photo"
                title="Upload profile photo"
              />
            </label>
          </div>

          <div className="flex-1 text-center md:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
              <span className="px-2.5 py-1 bg-coastal-primary/10 text-coastal-primary rounded-lg text-xs font-black uppercase tracking-widest border border-coastal-primary/20 flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5" /> Verified Staff
              </span>
              <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" /> {user?.department || 'Operations'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
              {profileForm.first_name} {profileForm.last_name}
            </h1>
            <p className="text-base text-slate-600 font-medium">{user?.username || 'user'} • Professional Profile</p>
          </div>

          <div className="hidden lg:block border-l border-slate-200 pl-6 space-y-3">
             <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                  <p className="text-xs font-bold text-slate-900">{user?.email}</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <Phone className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone Contact</p>
                  <p className="text-xs font-bold text-slate-900">{profileForm.phone_number || 'Not provided'}</p>
                </div>
             </div>
          </div>
        </div>
      </GlassCard>

      {/* Status Notifications */}
      {message.text && (
        <div className={`p-4 rounded-2xl font-bold flex items-center justify-between animate-in zoom-in-95 duration-300 ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
          <button 
            onClick={() => setMessage({ text: '', type: '' })} 
            className="hover:opacity-70 transition-opacity"
            aria-label="Close notification"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings Form */}
        <div className="lg:col-span-1">
          <GlassCard className="p-6 shadow-xl h-full flex flex-col">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 tracking-tight">
              <span className="w-9 h-9 rounded-xl bg-coastal-primary flex items-center justify-center text-white shadow-lg">
                <User className="w-4.5 h-4.5" />
              </span>
              Personal Details
            </h3>
            
            <form onSubmit={handleProfileUpdate} className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="first_name" className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">First Name</label>
                  <input
                    id="first_name"
                    type="text"
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold focus:ring-4 focus:ring-coastal-primary/10 focus:border-coastal-primary outline-none transition-all placeholder:text-slate-300 shadow-sm text-sm"
                    placeholder="First Name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="last_name" className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Last Name</label>
                  <input
                    id="last_name"
                    type="text"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold focus:ring-4 focus:ring-coastal-primary/10 focus:border-coastal-primary outline-none transition-all placeholder:text-slate-300 shadow-sm text-sm"
                    placeholder="Last Name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Official Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 font-bold cursor-not-allowed opacity-80 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone_number" className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Primary Contact Number</label>
                  <input
                    id="phone_number"
                    type="tel"
                    value={profileForm.phone_number}
                    onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold focus:ring-4 focus:ring-coastal-primary/10 focus:border-coastal-primary outline-none transition-all placeholder:text-slate-300 shadow-sm text-sm"
                    placeholder="+233 XX XXX XXXX"
                  />
                </div>
              </div>

              <div className="pt-3">
                <Button type="submit" variant="primary" className="w-full py-4 rounded-2xl text-base font-black shadow-2xl shadow-coastal-primary/20 flex items-center justify-center gap-2 transform active:scale-95 transition-transform" disabled={loading}>
                  {loading ? 'Processing...' : (
                    <>
                      Apply Updates
                      <Sparkles className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>

        {/* Security Section */}
        <div className="lg:col-span-1">
          <GlassCard className="p-6 shadow-xl border-t-8 border-t-amber-500">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 tracking-tight">
              <span className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg">
                <Lock className="w-4.5 h-4.5" />
              </span>
              Security
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="current_password" className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Current Password</label>
                  <input
                    id="current_password"
                    type="password"
                    required
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all placeholder:text-slate-300 text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="new_password" className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">New Password</label>
                  <input
                    id="new_password"
                    type="password"
                    required
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all placeholder:text-slate-300 text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm_password" className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Confirm Security Key</label>
                  <input
                    id="confirm_password"
                    type="password"
                    required
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all placeholder:text-slate-300 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-3">
                <Button type="submit" variant="warning" className="w-full py-4 rounded-2xl text-base font-black shadow-2xl shadow-amber-500/20 flex items-center justify-center gap-2 transform active:scale-95 transition-transform" disabled={loading}>
                  {loading ? 'Securing...' : (
                    <>
                      Update Credentials
                      <ShieldCheck className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>

        {/* Operational Badge Column */}
        <div className="lg:col-span-1">
          <GlassCard className="p-6 bg-slate-900 border-none text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute -right-12 -top-12 w-64 h-64 bg-coastal-primary/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
             
             <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <ShieldCheck className="w-6 h-6 text-coastal-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
                    <span className="text-xs font-black tracking-widest uppercase text-emerald-400">System Active</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Official Designation</h4>
                  <p className="text-xl font-black text-white capitalize leading-tight">
                    {user?.role?.replace('_', ' ') || 'Strategic Staff'}
                  </p>
                </div>

                <div className="flex justify-between items-end border-t border-white/10 pt-3 mt-3">
                  <div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Staff ID</h4>
                    <p className="text-lg font-mono font-bold text-coastal-primary">{user?.staff_id || 'PRO-9921'}</p>
                  </div>
                  <div className="text-right">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Authorization</h4>
                    <p className="text-[10px] font-bold text-white uppercase bg-white/10 px-2 py-1 rounded">Level 4</p>
                  </div>
                </div>
             </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;

import React, { useState, useEffect } from 'react';
import { api, apiService, ServiceRequestExtended } from '../services/api';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Award,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import GlassCard from '../components/ui/modern/GlassCard';

interface ServiceStats {
  total_requests?: number;
  pending_requests?: number;
  fulfilled_requests?: number;
  rejected_requests?: number;
  [key: string]: unknown;
}

function Services() {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestExtended[]>([]);
  const [stats, setStats] = useState<ServiceStats>({});
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    loadServiceRequests();
    loadStats();
  }, []);

  const loadServiceRequests = async () => {
    try {
      setLoading(true);
      const result = await apiService.getServiceRequests();
      if (result.success && result.data) {
        setServiceRequests(result.data || []);
      }
    } catch (error) {
      console.error('Error loading service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get<ServiceStats>('services/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading service stats:', error);
    }
  };

  const filteredRequests = selectedStatus
    ? serviceRequests.filter((request) => request.status === selectedStatus)
    : serviceRequests;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 border border-yellow-250/20';
      case 'approved':
        return 'bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 border border-blue-250/20';
      case 'in_progress':
        return 'bg-purple-100 dark:bg-purple-950/20 text-purple-800 dark:text-purple-400 border border-purple-250/20';
      case 'fulfilled':
        return 'bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-400 border border-green-250/20';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-400 border border-red-250/20';
      case 'cancelled':
        return 'bg-gray-100 dark:bg-gray-800/20 text-gray-850 dark:text-gray-400 border border-gray-700/20';
      default:
        return 'bg-gray-100 dark:bg-gray-800/20 text-gray-850 dark:text-gray-400 border border-gray-700/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center transition-colors duration-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-amber-500 mx-auto"></div>
          <p className="mt-4 text-slate-900 dark:text-slate-300 font-black uppercase tracking-[0.2em] text-xs">
            Synchronizing Service Matrix...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 transition-colors duration-500">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Block */}
        <div className="bg-white/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 shadow-lg p-6 backdrop-blur-md relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 dark:bg-amber-500/5 rounded-full blur-2xl" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <FileSpreadsheet className="w-7 h-7 text-blue-600 dark:text-amber-500" />
            Service Request Hub
          </h1>
          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mt-1">
            Institutional workflow monitoring and service audit trails
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <GlassCard className="p-5 border-slate-200/50 dark:border-slate-800/60">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/10 dark:bg-blue-500/5 rounded-xl">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Capture Volume
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  {stats.total_requests || 0}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5 border-slate-200/50 dark:border-slate-800/60">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500/10 dark:bg-yellow-500/5 rounded-xl animate-pulse">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">
                  Pending
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  {stats.pending_requests || 0}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5 border-slate-200/50 dark:border-slate-800/60">
            <div className="flex items-center">
              <div className="p-2 bg-green-500/10 dark:bg-green-500/5 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">
                  Fulfilled
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  {stats.fulfilled_requests || 0}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5 border-slate-200/50 dark:border-slate-800/60 border-2 dark:border-slate-700/60">
            <div className="flex items-center">
              <div className="p-2 bg-rose-500/10 dark:bg-rose-500/5 rounded-xl">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="ml-4">
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">
                  Rejected
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  {stats.rejected_requests || 0}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Status Filter */}
        <div className="bg-white/80 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 shadow-lg p-6 backdrop-blur-md">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedStatus('')}
              className={`px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all duration-300 ${
                selectedStatus === ''
                  ? 'bg-blue-600 text-white dark:bg-amber-500 dark:text-slate-950 shadow-md shadow-blue-500/10 dark:shadow-amber-500/10'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-350 dark:hover:bg-slate-700/80'
              }`}
            >
              All Statuses
            </button>
            {['pending', 'approved', 'in_progress', 'fulfilled', 'rejected', 'cancelled'].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all duration-300 capitalize ${
                    selectedStatus === status
                      ? 'bg-blue-600 text-white dark:bg-amber-500 dark:text-slate-950 shadow-md shadow-blue-500/10 dark:shadow-amber-500/10'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-350 dark:hover:bg-slate-700/80'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              )
            )}
          </div>
        </div>

        {/* Service Requests Table */}
        <GlassCard className="p-0 overflow-hidden border-slate-200/50 dark:border-slate-800/40">
          <div className="px-6 py-5 border-b border-slate-200/50 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-500 dark:text-amber-500" />
              Service Requests
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/50 dark:divide-slate-800/40">
              <thead className="bg-slate-50/50 dark:bg-slate-900/20 text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[9px] font-black border-b border-slate-200/50 dark:border-slate-800/60">
                <tr>
                  <th className="px-6 py-4 text-left">Operational Type</th>
                  <th className="px-6 py-4 text-left">Member Identity</th>
                  <th className="px-6 py-4 text-left">Audit Status</th>
                  <th className="px-6 py-4 text-left">Priority</th>
                  <th className="px-6 py-4 text-left">Timestamp</th>
                  <th className="px-6 py-4 text-right">Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
                {filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-black text-slate-900 dark:text-white capitalize">
                        {request.request_type.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-455 font-mono">
                        {request.member?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${getStatusColor(request.status)}`}
                      >
                        {request.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 text-[9px] font-black uppercase rounded-full border ${
                          request.priority === 'urgent'
                            ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200/30'
                            : request.priority === 'high'
                              ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-200/30'
                              : request.priority === 'normal'
                                ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200/30'
                                : 'bg-gray-50 dark:bg-gray-800/20 text-gray-700 dark:text-gray-400 border-gray-200/30'
                        }`}
                      >
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500 dark:text-slate-455 font-mono">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-black">
                      <button className="text-blue-600 dark:text-amber-500 hover:text-blue-800 dark:hover:text-amber-400 transition-colors uppercase tracking-widest text-[9px]">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="px-6 py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800/60 rounded-b-xl backdrop-blur-md">
              <div className="text-slate-300 dark:text-slate-600 mb-6 opacity-40 flex justify-center">
                <ShieldAlert className="w-16 h-16" />
              </div>
              <h3 className="text-md font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">
                No active service logs detected
              </h3>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest opacity-60">
                The vault is currently synchronized with all member requests
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

export default Services;

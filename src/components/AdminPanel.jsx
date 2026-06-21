import React, { useEffect, useState } from 'react';
import { useRoleRequests } from '../hooks/useRoleRequests';
import { Check, X, Shield, Calendar, User, FileText, Loader2, ArrowLeft } from 'lucide-react';

export default function AdminPanel({ setView }) {
  const { requests, loading, fetchAllRequests, reviewRoleRequest } = useRoleRequests();
  const [filter, setFilter] = useState('pending'); // 'pending', 'resolved'

  useEffect(() => {
    fetchAllRequests();
  }, [fetchAllRequests]);

  const handleReview = async (id, approved) => {
    try {
      await reviewRoleRequest(id, approved);
    } catch (err) {
      alert('Error updating request: ' + err.message);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'pending') return req.status === 'pending';
    return req.status === 'approved' || req.status === 'denied';
  });

  return (
    <div className="bg-transparent w-full min-h-screen px-[5%] py-12 text-ivory relative z-10">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setView('home')} 
            className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.05] transition-all"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-sans font-extrabold text-2xl tracking-tight text-white leading-none">
              Super Admin Console
            </h1>
            <p className="font-mono text-[9px] uppercase tracking-wider text-champagne/80 mt-2">
              Review Credentials & Role Elevations
            </p>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex space-x-2 bg-white/[0.02] border border-white/5 p-1 rounded-xl">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              filter === 'pending'
                ? 'bg-champagne text-obsidian shadow-lg'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            PENDING
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              filter === 'resolved'
                ? 'bg-champagne text-obsidian shadow-lg'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            RESOLVED
          </button>
        </div>
      </div>

      {/* Requests Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={32} className="text-champagne animate-spin mb-4" />
          <p className="font-mono text-xs text-white/40">FETCHING INCOMING TRANSMISSIONS...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-[2rem] p-12 text-center bg-white/[0.01]">
          <Shield className="mx-auto text-white/20 mb-4" size={40} />
          <p className="font-sans font-bold text-base text-white/80">No role requests found</p>
          <p className="font-mono text-[10px] text-white/40 mt-1 uppercase">
            Database queue is clean. Ready for new inputs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRequests.map((req) => (
            <div 
              key={req.id} 
              className="bg-slate-dark/40 border border-white/5 p-6 rounded-[2rem] backdrop-blur-xl flex flex-col justify-between"
            >
              <div>
                {/* User Info Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-champagne">
                      <User size={18} />
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-sm text-white">{req.profiles?.full_name || 'Anonymous Student'}</h4>
                      <p className="font-mono text-[9px] text-white/40">ID / ROLL: {req.profiles?.student_id || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <span className={`px-2 py-1 rounded font-mono text-[8px] font-bold uppercase tracking-wider ${
                    req.status === 'pending'
                      ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50'
                      : req.status === 'approved'
                      ? 'bg-green-950/40 text-green-400 border border-green-900/50'
                      : 'bg-red-950/40 text-red-400 border border-red-900/50'
                  }`}>
                    {req.status}
                  </span>
                </div>

                {/* Elevation Details */}
                <div className="my-6 p-4 rounded-xl bg-white/[0.02] border border-white/5 font-sans space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40">Requested Role:</span>
                    <span className="font-bold text-white uppercase">{req.requested_role}</span>
                  </div>
                  {req.requested_section && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/40">Target Section:</span>
                      <span className="font-mono font-bold text-champagne">{req.requested_section}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[10px] text-white/30 font-mono">
                    <span>Submitted:</span>
                    <span>{new Date(req.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {req.status === 'pending' && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <button
                    onClick={() => handleReview(req.id, false)}
                    className="w-full py-2 bg-red-950/20 hover:bg-red-900/40 border border-red-900/50 hover:border-red-500/50 text-red-400 font-mono text-[10px] font-bold tracking-wider rounded-xl transition-all flex items-center justify-center space-x-1.5"
                  >
                    <X size={12} />
                    <span>DENY</span>
                  </button>
                  <button
                    onClick={() => handleReview(req.id, true)}
                    className="w-full py-2 bg-green-950/20 hover:bg-green-900/40 border border-green-900/50 hover:border-green-500/50 text-green-400 font-mono text-[10px] font-bold tracking-wider rounded-xl transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Check size={12} />
                    <span>APPROVE</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

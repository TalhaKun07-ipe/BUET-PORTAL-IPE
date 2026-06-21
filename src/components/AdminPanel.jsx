import React, { useEffect, useState } from 'react';
import { useRoleRequests } from '../hooks/useRoleRequests';
import { 
  Check, 
  X, 
  Shield, 
  Calendar, 
  User, 
  FileText, 
  Loader2, 
  ArrowLeft, 
  Trash2, 
  Search, 
  UserPlus, 
  UserCheck 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminPanel({ setView }) {
  const { requests, loading, fetchAllRequests, reviewRoleRequest } = useRoleRequests();
  const [filter, setFilter] = useState('pending'); // 'pending', 'resolved', 'crs'

  // CR management states
  const [crs, setCrs] = useState([]);
  const [crLoading, setCrLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [targetSection, setTargetSection] = useState('A1');

  const fetchCRs = async () => {
    setCrLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'cr')
        .order('section', { ascending: true })
        .order('student_id', { ascending: true });
      if (error) throw error;
      setCrs(data || []);
    } catch (err) {
      console.error('Error fetching CRs:', err.message);
    } finally {
      setCrLoading(false);
    }
  };

  useEffect(() => {
    if (filter === 'crs') {
      fetchCRs();
    } else {
      fetchAllRequests();
    }
  }, [filter, fetchAllRequests]);

  // Debounced search for student profiles to promote
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const searchStudents = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('role', 'admin') // admin cannot be CR
          .neq('role', 'cr')    // only search standard students
          .or(`full_name.ilike.%${searchQuery}%,student_id.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
          .limit(5);
        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        console.error('Error searching students:', err.message);
      }
    };
    const timer = setTimeout(searchStudents, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleReview = async (id, approved) => {
    try {
      await reviewRoleRequest(id, approved);
    } catch (err) {
      alert('Error updating request: ' + err.message);
    }
  };

  const handlePromote = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'cr',
          section: targetSection
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      alert(`Successfully promoted ${selectedUser.full_name} to CR of Section ${targetSection}!`);
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
      fetchCRs();
    } catch (err) {
      alert('Error promoting student: ' + err.message);
    }
  };

  const handleDemote = async (profile) => {
    if (!confirm(`Are you sure you want to remove CR role from ${profile.full_name}? This will reset their role to student.`)) return;
    try {
      // Resolve expected default student section based on student ID / roll number
      let resolvedSection = null;
      if (profile.student_id) {
        const rollMatch = profile.student_id.match(/202508(\d{3})/);
        if (rollMatch) {
          const rollNum = parseInt(rollMatch[1], 10);
          if (rollNum >= 1 && rollNum <= 30) resolvedSection = 'A1';
          else if (rollNum >= 31 && rollNum <= 60) resolvedSection = 'A2';
          else if (rollNum >= 61 && rollNum <= 90) resolvedSection = 'B1';
          else if (rollNum >= 91 && rollNum <= 120) resolvedSection = 'B2';
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'student',
          section: resolvedSection
        })
        .eq('id', profile.id);

      if (error) throw error;

      alert(`Successfully removed CR role from ${profile.full_name}. Reassigned to Section ${resolvedSection || 'N/A'}.`);
      fetchCRs();
    } catch (err) {
      alert('Error demoting CR: ' + err.message);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'pending') return req.status === 'pending';
    return req.status === 'approved' || req.status === 'denied';
  });

  return (
    <div className="bg-transparent w-full min-h-screen px-[5%] py-12 text-ivory relative z-10">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setView('home')} 
            className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.05] transition-all shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-sans font-extrabold text-2xl tracking-tight text-white leading-none">
              Super Admin Console
            </h1>
            <p className="font-mono text-[9px] uppercase tracking-wider text-champagne/80 mt-2">
              Review Credentials & CR Assignments
            </p>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex bg-white/[0.02] border border-white/5 p-1 rounded-xl w-fit self-start lg:self-center">
          {['pending', 'resolved', 'crs'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all uppercase ${
                filter === tab
                  ? 'bg-champagne text-obsidian shadow-lg'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              {tab === 'crs' ? 'Manage CRs' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Content / CR management tab */}
      {filter === 'crs' ? (
        <CRManagerView 
          crs={crs}
          crLoading={crLoading}
          handleDemote={handleDemote}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          targetSection={targetSection}
          setTargetSection={setTargetSection}
          handlePromote={handlePromote}
        />
      ) : loading ? (
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

function CRManagerView({
  crs,
  crLoading,
  handleDemote,
  searchQuery,
  setSearchQuery,
  searchResults,
  selectedUser,
  setSelectedUser,
  targetSection,
  setTargetSection,
  handlePromote
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Left Column: Promote Form (5 cols) */}
      <div className="lg:col-span-5 bg-slate-dark/30 border border-white/5 p-6 rounded-[2rem] backdrop-blur-xl h-fit">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-champagne/10 flex items-center justify-center text-champagne shrink-0">
            <UserPlus size={16} />
          </div>
          <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">Promote Student to CR</h3>
        </div>

        <form onSubmit={handlePromote} className="space-y-6">
          {/* Student Search */}
          <div className="relative">
            <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">
              Search Student (Name, Email, or Roll)
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedUser) setSelectedUser(null);
                }}
                placeholder="e.g. Student 013 or 202508..."
                className="w-full bg-white/[0.02] border border-white/10 focus:border-champagne/50 rounded-xl pl-10 pr-4 py-2.5 text-xs font-sans text-white outline-none"
              />
              <Search size={14} className="absolute left-3.5 top-3.5 text-white/30" />
            </div>

            {/* Floating Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-[#0D0D12] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5 max-h-48 overflow-y-auto">
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user);
                      setSearchQuery(user.full_name);
                      setSearchResults([]);
                    }}
                    className="p-3 hover:bg-white/[0.03] cursor-pointer transition-colors text-left"
                  >
                    <p className="font-sans text-xs text-white font-bold">{user.full_name}</p>
                    <p className="font-mono text-[9px] text-white/40">Roll: {user.student_id} | {user.email}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected User Display Card */}
          {selectedUser && (
            <div className="p-4 rounded-xl bg-champagne/5 border border-champagne/20 flex items-center justify-between">
              <div>
                <p className="font-sans text-xs text-champagne font-bold">{selectedUser.full_name}</p>
                <p className="font-mono text-[9px] text-white/50">Roll: {selectedUser.student_id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg hover:bg-white/5 text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Section Selection */}
          <div>
            <label className="block font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1.5">
              Assign to Section
            </label>
            <select
              value={targetSection}
              onChange={(e) => setTargetSection(e.target.value)}
              className="w-full bg-[#121217] border border-white/10 focus:border-champagne/50 rounded-xl px-4 py-2.5 text-xs font-sans text-white outline-none"
            >
              <option value="A1">Section A1</option>
              <option value="A2">Section A2</option>
              <option value="B1">Section B1</option>
              <option value="B2">Section B2</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedUser}
            className="w-full py-2.5 bg-champagne text-obsidian font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center space-x-1.5"
          >
            <UserCheck size={14} />
            <span>Promote to CR</span>
          </button>
        </form>
      </div>

      {/* Right Column: Active CRs (7 cols) */}
      <div className="lg:col-span-7 bg-slate-dark/30 border border-white/5 p-6 rounded-[2rem] backdrop-blur-xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-champagne/10 flex items-center justify-center text-champagne shrink-0">
            <Shield size={16} />
          </div>
          <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">Active Class Representatives</h3>
        </div>

        {crLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={24} className="text-champagne animate-spin mb-3" />
            <p className="font-mono text-[10px] text-white/40">RETRIEVING CR RECORDS...</p>
          </div>
        ) : crs.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center bg-white/[0.01]">
            <p className="font-sans text-xs text-white/50 font-bold">No active Class Representatives found</p>
            <p className="font-mono text-[9px] text-white/30 mt-1 uppercase">Use the form to promote a student.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {crs.map(cr => (
              <div
                key={cr.id}
                className="bg-white/[0.01] border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-white/10 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-champagne/10 border border-champagne/20 flex items-center justify-center text-champagne shrink-0 mt-0.5">
                    <span className="font-mono text-xs font-bold">{cr.section}</span>
                  </div>
                  <div className="truncate">
                    <h4 className="font-sans font-bold text-xs text-white truncate">{cr.full_name}</h4>
                    <p className="font-mono text-[9px] text-white/40">Roll: {cr.student_id} | {cr.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDemote(cr)}
                  className="px-3 py-1.5 border border-red-500/20 hover:border-red-500 bg-red-950/10 hover:bg-red-950/30 text-red-400 font-mono text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all shrink-0 flex items-center justify-center space-x-1"
                >
                  <Trash2 size={10} />
                  <span>Remove CR</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

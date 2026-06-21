import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useRoleRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMyRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('role_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data);
    } catch (err) {
      console.error('Error fetching role requests:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const submitRoleRequest = async (requestedRole, requestedSection = null) => {
    if (!user) throw new Error('Not authenticated');
    
    // Check if there is already a pending request for the same role/section
    const { data: existing, error: checkError } = await supabase
      .from('role_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .eq('requested_role', requestedRole);

    if (checkError) throw checkError;
    if (existing && existing.length > 0) {
      throw new Error(`You already have a pending request for the ${requestedRole} role.`);
    }

    const { data, error } = await supabase
      .from('role_requests')
      .insert({
        user_id: user.id,
        requested_role: requestedRole,
        requested_section: requestedSection,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  // Admin: Fetch all pending role requests
  const fetchAllRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('role_requests')
        .select(`
          *,
          profiles:user_id (
            full_name,
            student_id,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data);
    } catch (err) {
      console.error('Error fetching all requests:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Admin: Approve or Deny request
  const reviewRoleRequest = async (requestId, approved) => {
    if (!user) throw new Error('Not authenticated');

    const status = approved ? 'approved' : 'denied';
    const { data, error } = await supabase
      .from('role_requests')
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    
    // Re-fetch all requests to update UI
    await fetchAllRequests();
    return data;
  };

  return {
    requests,
    loading,
    submitRoleRequest,
    fetchMyRequests,
    fetchAllRequests,
    reviewRoleRequest
  };
}

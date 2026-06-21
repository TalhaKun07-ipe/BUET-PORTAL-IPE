import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useNotices() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notices')
        .select(`
          *,
          author:profiles(full_name, role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter notices: showcase for maximum 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const activeNotices = data.filter(n => {
        const createdDate = new Date(n.created_at);
        return createdDate >= sevenDaysAgo;
      });

      // Transform data for UI: format date beautifully
      const formatted = activeNotices.map(n => ({
        id: n.id,
        title: n.title,
        tag: n.tag,
        details: n.details,
        author_id: n.author_id,
        author_name: n.author?.full_name || 'Anonymous',
        author_role: n.author?.role || 'student',
        date: new Date(n.created_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      }));

      setNotices(formatted);
    } catch (err) {
      console.error('Error fetching notices:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addNotice = async (title, tag, details) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notices')
      .insert({
        title,
        tag,
        details,
        author_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Refresh notices list
    await fetchNotices();
    return data;
  };

  const deleteNotice = async (id) => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("You do not have permission to delete this notice (only the author or an admin can delete it).");
      }

      // Refresh notices list
      await fetchNotices();
    } catch (err) {
      console.error('Error deleting notice:', err.message);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotices();
    }
  }, [user, fetchNotices]);

  return {
    notices,
    loading,
    fetchNotices,
    addNotice,
    deleteNotice
  };
}

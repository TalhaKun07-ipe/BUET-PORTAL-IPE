import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const INITIAL_SCHEDULE = {
  A1: { S: [], M: [], T: [], W: [], T_thu: [], F: [], S_sat: [] },
  A2: { S: [], M: [], T: [], W: [], T_thu: [], F: [], S_sat: [] },
  B1: { S: [], M: [], T: [], W: [], T_thu: [], F: [], S_sat: [] },
  B2: { S: [], M: [], T: [], W: [], T_thu: [], F: [], S_sat: [] }
};

export function useRoutines() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);
  const [loading, setLoading] = useState(false);

  const fetchRoutines = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .order('time_slot', { ascending: true });

      if (error) throw error;

      // Group and transform database rows to nested calendar structures
      const transformed = JSON.parse(JSON.stringify(INITIAL_SCHEDULE));
      
      data.forEach(row => {
        if (transformed[row.section] && transformed[row.section][row.day]) {
          transformed[row.section][row.day].push({
            id: row.id,
            time: row.time_slot,
            subject: row.subject,
            created_by: row.created_by
          });
        }
      });

      setSchedule(transformed);
    } catch (err) {
      console.error('Error fetching routines:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addRoutine = async (section, day, timeSlot, subject) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('routines')
      .insert({
        section,
        day,
        time_slot: timeSlot,
        subject,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    await fetchRoutines();
    return data;
  };

  const deleteRoutine = async (id) => {
    try {
      const { data, error } = await supabase
        .from('routines')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("You do not have permission to delete this routine entry (only the creator or an admin can delete it).");
      }

      await fetchRoutines();
    } catch (err) {
      console.error('Error deleting routine:', err.message);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchRoutines();
    }
  }, [user, fetchRoutines]);

  return {
    schedule,
    loading,
    fetchRoutines,
    addRoutine,
    deleteRoutine
  };
}

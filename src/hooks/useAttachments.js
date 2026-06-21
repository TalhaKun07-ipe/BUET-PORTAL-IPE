import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useAttachments() {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAttachments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map DB columns to UI state names
      const mapped = data.map(item => ({
        id: item.id,
        term: item.term,
        subject: item.subject,
        title: item.title,
        type: item.file_type,
        size: item.file_size,
        drive_url: item.drive_url,
        uploaded_by: item.uploaded_by
      }));

      setAttachments(mapped);
    } catch (err) {
      console.error('Error fetching attachments:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAttachment = async (title, subject, term, fileType, fileSize, driveUrl) => {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('attachments')
      .insert({
        title,
        subject,
        term,
        file_type: fileType,
        file_size: fileSize,
        drive_url: driveUrl,
        uploaded_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    await fetchAttachments();
    return data;
  };

  const deleteAttachment = async (id) => {
    try {
      const { data, error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("You do not have permission to delete this sessional resource (only the uploader or an admin can delete it).");
      }

      await fetchAttachments();
    } catch (err) {
      console.error('Error deleting attachment:', err.message);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchAttachments();
    }
  }, [user, fetchAttachments]);

  return {
    attachments,
    loading,
    fetchAttachments,
    addAttachment,
    deleteAttachment
  };
}

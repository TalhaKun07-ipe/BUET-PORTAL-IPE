import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useGallery() {
  const { user } = useAuth();
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchGallery = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map DB columns to UI state names (image_path -> img)
      const mapped = data.map(item => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        img: item.image_path,
        uploaded_by: item.uploaded_by
      }));

      setGallery(mapped);
    } catch (err) {
      console.error('Error fetching gallery:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addPhoto = async (title, subtitle, imageFileOrUrl) => {
    if (!user) throw new Error('Not authenticated');
    
    let imageUrl = '';

    if (imageFileOrUrl instanceof File) {
      // Validate file type
      if (!imageFileOrUrl.type.startsWith('image/')) {
        throw new Error('Invalid file type. Only images are allowed.');
      }
      // Validate file size (max 5MB)
      if (imageFileOrUrl.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be under 5MB.');
      }

      // 1. Upload to Supabase Storage 'gallery' bucket
      const fileExt = imageFileOrUrl.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `moments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, imageFileOrUrl);

      if (uploadError) {
        throw new Error(`Failed to upload file to storage: ${uploadError.message}. Make sure the 'gallery' bucket is created and public in Supabase.`);
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      imageUrl = publicUrl;
    } else {
      // If a URL was typed in directly
      imageUrl = imageFileOrUrl;
    }

    // 3. Save to database gallery table
    const { data, error } = await supabase
      .from('gallery')
      .insert({
        title,
        subtitle,
        image_path: imageUrl,
        uploaded_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    await fetchGallery();
    return data;
  };

  const deletePhoto = async (id, imagePath) => {
    try {
      // Delete database row
      const { data, error: dbError } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id)
        .select();

      if (dbError) throw dbError;

      if (!data || data.length === 0) {
        throw new Error("You do not have permission to delete this moment (only the uploader or an admin can delete it).");
      }

      // Proactively try to delete the file from Supabase storage if it was uploaded there
      if (imagePath && imagePath.includes('/storage/v1/object/public/gallery/')) {
        try {
          const relativePath = imagePath.split('/storage/v1/object/public/gallery/')[1];
          if (relativePath) {
            await supabase.storage.from('gallery').remove([relativePath]);
          }
        } catch (err) {
          console.warn('Could not delete file from Supabase storage:', err);
        }
      }

      await fetchGallery();
    } catch (err) {
      console.error('Error deleting photo:', err.message);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchGallery();
    }
  }, [user, fetchGallery]);

  return {
    gallery,
    loading,
    fetchGallery,
    addPhoto,
    deletePhoto
  };
}

import { supabase } from './supabase';
import { compressImage } from './imageCompressor';

/**
 * Robust image upload helper that tries uploading to Supabase Storage,
 * and falls back seamlessly to compressed base64 if Supabase Storage
 * bucket lacks permission/is not created.
 */
export async function uploadImageToStorage(
  dataUrl: string, 
  bucketName: string, 
  fileName: string
): Promise<string> {
  try {
    if (!dataUrl) return '';
    // If it's already an external HTTP URL or not base64, return it as-is
    if (!dataUrl.startsWith('data:')) {
      return dataUrl;
    }

    // 1. Compress image optimized for mobile devices
    const compressedDataUrl = await compressImage(dataUrl, 800, 800, 0.75);

    // If supabase URL or key are placeholders, don't even try and return base64
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder.supabase.co')) {
      return compressedDataUrl;
    }

    // 2. Convert base64 to binary ArrayBuffer or Blob
    const parts = compressedDataUrl.split(';base64,');
    if (parts.length < 2) return compressedDataUrl;
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    const blob = new Blob([uInt8Array], { type: contentType });

    // 3. Upload to Supabase Storage
    // We sanitize the bucket name and fileName to ensure clean pathways
    const sanitizedFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    
    // Attempt to upload
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(sanitizedFileName, blob, {
        upsert: true,
        cacheControl: '3600',
        contentType: contentType
      });

    if (error) {
      console.warn(`Supabase Storage Upload failed, falling back to base64:`, error.message);
      return compressedDataUrl;
    }

    // 4. Get the public asset URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(sanitizedFileName);

    return publicUrl || compressedDataUrl;
  } catch (err) {
    console.warn("Storage upload wrapper encountered an error, using base64 fallback:", err);
    // Bulletproof fallback to compressed image
    try {
      return await compressImage(dataUrl, 800, 800, 0.75);
    } catch {
      return dataUrl;
    }
  }
}

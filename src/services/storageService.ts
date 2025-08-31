import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export class StorageService {
  async requestPermissions() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      
      return {
        mediaLibrary: status === 'granted',
        camera: cameraStatus.status === 'granted',
      };
    } catch (error) {
      return { mediaLibrary: false, camera: false, error };
    }
  }

  async pickImage(options?: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }) {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options?.allowsEditing ?? true,
        aspect: options?.aspect ?? [4, 3],
        quality: options?.quality ?? 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return { data: result.assets[0], error: null };
      }

      return { data: null, error: 'Image selection cancelled' };
    } catch (error) {
      return { data: null, error };
    }
  }

  async takePhoto(options?: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }) {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options?.allowsEditing ?? true,
        aspect: options?.aspect ?? [4, 3],
        quality: options?.quality ?? 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return { data: result.assets[0], error: null };
      }

      return { data: null, error: 'Photo capture cancelled' };
    } catch (error) {
      return { data: null, error };
    }
  }

  async uploadImage(uri: string, bucket: string = 'request-photos', fileName?: string): Promise<{ data: string | null; error: any }> {
    try {
      console.log('Starting image upload:', { uri, bucket, fileName });

      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Authentication error:', authError);
        return { data: null, error: 'User not authenticated' };
      }
      console.log('User authenticated:', user.id);

      // Get file extension from URI
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const finalFileName = fileName || `request_${user.id}_${Date.now()}.${fileExt}`;
      
      console.log('Preparing upload:', { bucket, finalFileName, uri });

      // For React Native/Expo, we need to read the file as ArrayBuffer
      let uploadData: ArrayBuffer;
      
      try {
        console.log('Fetching image data...');
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        
        uploadData = await response.arrayBuffer();
        console.log('Image data loaded:', { size: uploadData.byteLength });
        
        if (uploadData.byteLength === 0) {
          throw new Error('Image file is empty');
        }
      } catch (fetchError) {
        console.error('Error reading image file:', fetchError);
        return { data: null, error: `Failed to read image file: ${fetchError}` };
      }

      console.log('Uploading to Supabase storage...');
      
      // Upload to Supabase storage using ArrayBuffer
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(finalFileName, uploadData, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (error) {
        console.error('Upload error details:', {
          message: error.message,
          error: error,
          bucket: bucket,
          fileName: finalFileName
        });
        
        // Provide more specific error messages
        if (error.message?.includes('row-level security')) {
          return { data: null, error: 'Storage permissions error. Please check database configuration.' };
        }
        if (error.message?.includes('bucket')) {
          return { data: null, error: 'Storage bucket not found. Please check configuration.' };
        }
        
        return { data: null, error: `Upload failed: ${error.message}` };
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      console.log('Public URL generated:', publicUrl);
      return { data: publicUrl, error: null };
    } catch (error) {
      console.error('Image upload failed:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  async deleteImage(bucket: string, fileName: string) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  getPublicUrl(bucket: string, fileName: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  }
}

export const storageService = new StorageService();

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

  async uploadImage(uri: string, bucket: string, fileName?: string): Promise<{ data: string | null; error: any }> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExt = uri.split('.').pop();
      const finalFileName = fileName || `${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(finalFileName, blob, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return { data: publicUrl, error: null };
    } catch (error) {
      return { data: null, error };
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

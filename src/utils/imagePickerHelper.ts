import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface PickedImageResult {
  uri: string;
  base64: string;
  mimeType: string;
  width?: number;
  height?: number;
}

/**
 * Resolves appropriate MIME type from type string, file name, or URI.
 */
function resolveMimeType(
  rawMimeType?: string | null,
  uri?: string,
  fileName?: string
): string {
  if (rawMimeType && rawMimeType.includes('/') && rawMimeType !== 'image/*') {
    return rawMimeType;
  }
  const checkStr = (fileName || uri || '').toLowerCase();
  if (checkStr.endsWith('.png')) return 'image/png';
  if (checkStr.endsWith('.webp')) return 'image/webp';
  if (checkStr.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

/**
 * Reads a Web File or Blob as a base64 string and mimeType.
 */
function readFileAsBase64(
  file: File | Blob
): Promise<{ base64: string; mimeType: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        resolve({
          mimeType: match[1],
          base64: match[2],
          dataUrl,
        });
      } else {
        const parts = dataUrl.split(',');
        resolve({
          mimeType: file.type || 'image/jpeg',
          base64: parts[1] || '',
          dataUrl,
        });
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Web file picker for images.
 */
export function pickImageFromBrowser(
  capture?: 'environment' | 'user'
): Promise<PickedImageResult | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/jpg,image/webp,image/*';
    if (capture) {
      input.capture = capture;
    }

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      // Check supported mime types
      const validPrefixes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      const fileType = (file.type || '').toLowerCase();
      const isAcceptable =
        !fileType ||
        validPrefixes.some((p) => fileType.startsWith(p)) ||
        fileType.startsWith('image/');

      if (!isAcceptable) {
        Alert.alert(
          'Unsupported File Type',
          'Please select a PNG, JPG, or WEBP image file.'
        );
        resolve(null);
        return;
      }

      try {
        const { base64, mimeType, dataUrl } = await readFileAsBase64(file);
        const resolved = resolveMimeType(mimeType || file.type, file.name, file.name);
        resolve({
          uri: dataUrl,
          base64,
          mimeType: resolved,
        });
      } catch (err) {
        console.error('Error reading browser file:', err);
        Alert.alert('Error', 'Failed to read the selected image.');
        resolve(null);
      }
    };

    input.oncancel = () => {
      resolve(null);
    };

    // Trigger file chooser
    input.click();
  });
}

/**
 * Cross-platform Gallery picker.
 */
export async function pickImageFromGallery(): Promise<PickedImageResult | null> {
  if (Platform.OS === 'web') {
    return pickImageFromBrowser();
  }

  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photo Library Permission Required',
        'Please grant access to your photo library to select images for AI analysis.',
        [{ text: 'OK' }]
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const mimeType = resolveMimeType(asset.mimeType, asset.uri, asset.fileName ?? undefined);

    // If base64 is already provided by Expo
    if (asset.base64 && asset.uri) {
      return {
        uri: asset.uri,
        base64: asset.base64,
        mimeType,
        width: asset.width,
        height: asset.height,
      };
    }

    // Fallback: fetch blob and read as base64
    if (asset.uri) {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const { base64 } = await readFileAsBase64(blob);
      return {
        uri: asset.uri,
        base64,
        mimeType,
        width: asset.width,
        height: asset.height,
      };
    }

    return null;
  } catch (error) {
    console.error('Error selecting image from gallery:', error);
    Alert.alert('Gallery Error', 'Could not select photo. Please try again.');
    return null;
  }
}

/**
 * Cross-platform Camera picker.
 */
export async function pickImageFromCamera(): Promise<PickedImageResult | null> {
  if (Platform.OS === 'web') {
    // On web, trigger browser camera capture
    return pickImageFromBrowser('environment');
  }

  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in your device settings to take photos for AI analysis.',
        [{ text: 'OK' }]
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const mimeType = resolveMimeType(asset.mimeType, asset.uri, asset.fileName ?? undefined);

    if (asset.base64 && asset.uri) {
      return {
        uri: asset.uri,
        base64: asset.base64,
        mimeType,
        width: asset.width,
        height: asset.height,
      };
    }

    if (asset.uri) {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const { base64 } = await readFileAsBase64(blob);
      return {
        uri: asset.uri,
        base64,
        mimeType,
        width: asset.width,
        height: asset.height,
      };
    }

    return null;
  } catch (error) {
    console.error('Error launching camera:', error);
    Alert.alert('Camera Error', 'Could not open camera. Please try again.');
    return null;
  }
}


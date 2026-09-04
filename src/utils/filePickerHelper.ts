import { Platform, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import {
  pickImageFromCamera,
  pickImageFromGallery,
  pickImageFromBrowser,
  PickedImageResult,
} from './imagePickerHelper';

export interface PickedFileResult {
  uri: string;
  name: string;
  base64: string;
  mimeType: string;
  sizeBytes?: number;
  isImage?: boolean;
  extractedText?: string;
}

/**
 * Resolves appropriate MIME type from file extension or provided mimeType.
 */
export function resolveFileMimeType(name?: string, uri?: string, rawMime?: string): string {
  if (rawMime && rawMime.includes('/') && rawMime !== 'application/octet-stream' && rawMime !== '*/*') {
    return rawMime;
  }

  const check = (name || uri || '').toLowerCase();
  if (check.endsWith('.pdf')) return 'application/pdf';
  if (check.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (check.endsWith('.doc')) return 'application/msword';
  if (check.endsWith('.txt')) return 'text/plain';
  if (check.endsWith('.csv')) return 'text/csv';
  if (check.endsWith('.json')) return 'application/json';
  if (check.endsWith('.png')) return 'image/png';
  if (check.endsWith('.jpg') || check.endsWith('.jpeg')) return 'image/jpeg';
  if (check.endsWith('.webp')) return 'image/webp';
  if (check.endsWith('.gif')) return 'image/gif';

  return rawMime || 'application/octet-stream';
}

/**
 * Reads browser file as base64 and data URL.
 */
function readWebFile(file: File): Promise<{ base64: string; dataUrl: string; text?: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      const base64 = match ? match[2] : (dataUrl.split(',')[1] || '');

      // If text file, also read text
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json') || file.name.endsWith('.md')) {
        const textReader = new FileReader();
        textReader.onload = () => {
          resolve({ base64, dataUrl, text: textReader.result as string });
        };
        textReader.onerror = () => resolve({ base64, dataUrl });
        textReader.readAsText(file);
      } else {
        resolve({ base64, dataUrl });
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Universal document picker supporting PDF, Word, TXT, CSV, Code, Images, etc.
 */
export async function pickAnyFile(): Promise<PickedFileResult | null> {
  try {
    if (Platform.OS === 'web') {
      return new Promise((resolve) => {
        if (typeof document === 'undefined') {
          resolve(null);
          return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.txt,.csv,.json,.md,.png,.jpg,.jpeg,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/*';

        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }

          try {
            const { base64, dataUrl, text } = await readWebFile(file);
            const mimeType = resolveFileMimeType(file.name, undefined, file.type);
            const isImage = mimeType.startsWith('image/');

            resolve({
              uri: dataUrl,
              name: file.name,
              base64,
              mimeType,
              sizeBytes: file.size,
              isImage,
              extractedText: text,
            });
          } catch (err) {
            console.error('Error reading web document:', err);
            Alert.alert('File Error', 'Could not read selected document.');
            resolve(null);
          }
        };

        input.oncancel = () => resolve(null);
        input.click();
      });
    }

    // Native Mobile (Android / iOS)
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/csv',
        'application/json',
        'image/*',
        '*/*',
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const file = result.assets[0];
    const mimeType = resolveFileMimeType(file.name, file.uri, file.mimeType ?? undefined);
    const isImage = mimeType.startsWith('image/');

    let base64 = '';
    let extractedText: string | undefined = undefined;

    if (file.uri) {
      try {
        base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });

        if (mimeType.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
          extractedText = await FileSystem.readAsStringAsync(file.uri, { encoding: 'utf8' });
        }
      } catch (e) {
        console.warn('Could not read string from uri:', e);
      }
    }

    return {
      uri: file.uri,
      name: file.name,
      base64,
      mimeType,
      sizeBytes: file.size,
      isImage,
      extractedText,
    };
  } catch (error) {
    console.error('Error picking document:', error);
    Alert.alert('File Picker Error', 'Could not pick file. Please try again.');
    return null;
  }
}

/**
 * Pick image from gallery and return as PickedFileResult
 */
export async function pickImageAsFile(): Promise<PickedFileResult | null> {
  const res: PickedImageResult | null = await pickImageFromGallery();
  if (!res) return null;

  return {
    uri: res.uri,
    name: 'Photo_' + Date.now() + '.jpg',
    base64: res.base64,
    mimeType: res.mimeType,
    isImage: true,
  };
}

/**
 * Take photo with camera and return as PickedFileResult
 */
export async function takePhotoAsFile(): Promise<PickedFileResult | null> {
  const res: PickedImageResult | null = await pickImageFromCamera();
  if (!res) return null;

  return {
    uri: res.uri,
    name: 'Camera_' + Date.now() + '.jpg',
    base64: res.base64,
    mimeType: res.mimeType,
    isImage: true,
  };
}

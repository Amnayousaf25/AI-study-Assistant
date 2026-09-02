import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

let recordingInstance: Audio.Recording | null = null;

export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.warn('Microphone permission check error:', err);
    return false;
  }
}

export async function startAudioRecording(): Promise<boolean> {
  try {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return false;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    if (recordingInstance) {
      try {
        await recordingInstance.stopAndUnloadAsync();
      } catch {}
      recordingInstance = null;
    }

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    recordingInstance = recording;
    return true;
  } catch (err) {
    console.error('Failed to start audio recording:', err);
    return false;
  }
}

export async function stopAudioRecording(): Promise<{ uri: string | null; base64Data?: string }> {
  try {
    if (!recordingInstance) return { uri: null };

    await recordingInstance.stopAndUnloadAsync();
    const uri = recordingInstance.getURI();
    recordingInstance = null;

    if (!uri) return { uri: null };

    let base64Data: string | undefined;
    try {
      base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
    } catch (readErr) {
      console.warn('Could not read voice audio base64:', readErr);
    }

    return { uri, base64Data };
  } catch (err) {
    console.error('Failed to stop audio recording:', err);
    recordingInstance = null;
    return { uri: null };
  }
}

export async function cancelAudioRecording(): Promise<void> {
  try {
    if (recordingInstance) {
      await recordingInstance.stopAndUnloadAsync();
      recordingInstance = null;
    }
  } catch {
    recordingInstance = null;
  }
}

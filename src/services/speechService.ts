import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

let currentSpeakingId: string | null = null;
let onDoneCallback: (() => void) | null = null;

function cleanMarkdownForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, ' Code snippet omitted for audio playback. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')
    .replace(/^\s*[-+*]\s+/gm, ' ')
    .replace(/^\s*\d+\.\s+/gm, ' ')
    .replace(/\|.*?\|/g, '')
    .replace(/\n+/g, '. ')
    .trim();
}

export async function speakText(
  id: string,
  text: string,
  onStart?: () => void,
  onDone?: () => void,
  onError?: (err: unknown) => void
): Promise<void> {
  try {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking && currentSpeakingId === id) {
      await stopSpeaking();
      return;
    }

    await stopSpeaking();

    currentSpeakingId = id;
    onDoneCallback = onDone || null;

    const cleaned = cleanMarkdownForSpeech(text);
    if (!cleaned) {
      if (onDone) onDone();
      return;
    }

    if (onStart) onStart();

    Speech.speak(cleaned, {
      language: 'en-US',
      pitch: 1.0,
      rate: Platform.OS === 'ios' ? 0.52 : 0.95,
      onStart: () => {
        if (onStart) onStart();
      },
      onDone: () => {
        currentSpeakingId = null;
        if (onDoneCallback) {
          onDoneCallback();
          onDoneCallback = null;
        }
      },
      onStopped: () => {
        currentSpeakingId = null;
        if (onDoneCallback) {
          onDoneCallback();
          onDoneCallback = null;
        }
      },
      onError: (err) => {
        currentSpeakingId = null;
        if (onError) onError(err);
        if (onDoneCallback) {
          onDoneCallback();
          onDoneCallback = null;
        }
      },
    });
  } catch (error) {
    console.error('Speech error:', error);
    currentSpeakingId = null;
    if (onError) onError(error);
    if (onDone) onDone();
  }
}

export async function stopSpeaking(): Promise<void> {
  try {
    currentSpeakingId = null;
    if (onDoneCallback) {
      onDoneCallback();
      onDoneCallback = null;
    }
    await Speech.stop();
  } catch (err) {
    console.error('Error stopping speech:', err);
  }
}

export function isCurrentlySpeaking(id: string): boolean {
  return currentSpeakingId === id;
}

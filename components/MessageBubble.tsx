import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useResponsive } from '../src/hooks/useResponsive';
import { speakText, stopSpeaking } from '../src/services/speechService';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'gemini';
  imageUri?: string;
  imageBase64?: string;
  mimeType?: string;
  imageWidth?: number;
  imageHeight?: number;
  isError?: boolean;
  timestamp?: number;
}

interface MessageBubbleProps {
  message: Message;
  isLatestGemini?: boolean;
  isLoading?: boolean;
  isFavorited?: boolean;
  onRegenerate?: () => void;
  onToggleFavorite?: () => void;
  onOpenImage?: (uri: string) => void;
}

function formatTime(timestamp?: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const MessageBubbleComponent: React.FC<MessageBubbleProps> = ({
  message,
  isLatestGemini = false,
  isLoading = false,
  isFavorited = false,
  onRegenerate,
  onToggleFavorite,
  onOpenImage,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { isWideScreen, isSmallMobile } = useResponsive();

  const isUser = message.sender === 'user';
  const isError = message.isError || message.id.includes('error');
  const formattedTime = formatTime(message.timestamp);

  const [aspectRatio, setAspectRatio] = useState<number | null>(() => {
    if (message.imageWidth && message.imageHeight && message.imageHeight > 0) {
      return message.imageWidth / message.imageHeight;
    }
    return null;
  });

  useEffect(() => {
    if (!aspectRatio && message.imageUri) {
      Image.getSize(
        message.imageUri,
        (w, h) => {
          if (w > 0 && h > 0) setAspectRatio(w / h);
        },
        () => setAspectRatio(4 / 3)
      );
    }
  }, [message.imageUri, aspectRatio]);

  const maxThumbWidth = isWideScreen ? 280 : isSmallMobile ? 220 : 250;
  const maxThumbHeight = isWideScreen ? 340 : isSmallMobile ? 260 : 300;
  const minThumbWidth = 160;

  const { displayWidth, displayHeight } = useMemo(() => {
    const ratio = aspectRatio || (4 / 3);
    let w = maxThumbWidth;
    let h = w / ratio;

    if (h > maxThumbHeight) {
      h = maxThumbHeight;
      w = h * ratio;
    }

    if (w < minThumbWidth && ratio >= 0.5) {
      w = minThumbWidth;
      h = w / ratio;
      if (h > maxThumbHeight) h = maxThumbHeight;
    }

    return {
      displayWidth: Math.round(w),
      displayHeight: Math.round(h),
    };
  }, [aspectRatio, maxThumbWidth, maxThumbHeight, minThumbWidth]);

  const handleCopy = useCallback(async () => {
    try {
      if (Clipboard && Clipboard.setStringAsync) {
        await Clipboard.setStringAsync(message.text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [message.text]);

  const handleSpeak = useCallback(async () => {
    if (isSpeaking) {
      await stopSpeaking();
      setIsSpeaking(false);
    } else {
      await speakText(
        message.id,
        message.text,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false),
        () => setIsSpeaking(false)
      );
    }
  }, [isSpeaking, message.id, message.text]);

  const hasImage = Boolean(message.imageUri);
  const hasText = Boolean(message.text && message.text.trim());

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowGemini]}>
      {/* AI Avatar */}
      {!isUser && (
        <View style={styles.avatarWrap}>
          <View style={styles.aiAvatar}>
            <Ionicons name="hardware-chip-outline" size={16} color="#6366f1" />
          </View>
        </View>
      )}

      {/* Bubble Container */}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : isError ? styles.bubbleError : styles.bubbleGemini,
          { maxWidth: isWideScreen ? '75%' : isSmallMobile ? '90%' : '85%' },
        ]}
      >
        {/* Error Header */}
        {isError && (
          <View style={styles.errorHeader}>
            <Text style={styles.errorText}>⚠️ Request Error</Text>
            {onRegenerate && (
              <Pressable
                onPress={onRegenerate}
                disabled={isLoading}
                style={styles.errorRetryBtn}
                hitSlop={6}
              >
                <Ionicons name="refresh" size={12} color="#ffffff" />
                <Text style={styles.errorRetryBtnText}>Retry Answer</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Image Attachment Preview */}
        {hasImage && message.imageUri && (
          <Pressable
            onPress={() => onOpenImage && onOpenImage(message.imageUri!)}
            style={[styles.imageFrame, { width: displayWidth, height: displayHeight }]}
          >
            <Image source={{ uri: message.imageUri }} style={{ width: displayWidth, height: displayHeight, borderRadius: 14 }} resizeMode="cover" />
            <View style={styles.viewBadge}>
              <Ionicons name="expand-outline" size={10} color="#ffffff" />
              <Text style={styles.viewBadgeText}>View</Text>
            </View>
          </Pressable>
        )}

        {/* Markdown & Text Content */}
        {hasText && (
          <MarkdownRenderer content={message.text} isUser={isUser} isError={isError} />
        )}

        {/* Metadata & Action Bar */}
        <View style={[styles.metaRow, isUser ? styles.metaRowUser : styles.metaRowGemini]}>
          {!isUser && (
            <View style={styles.senderTagRow}>
              <Text style={styles.senderTagText}>Gemini</Text>
              {formattedTime ? <Text style={styles.senderTagText}> • {formattedTime}</Text> : null}
            </View>
          )}

          {isUser && formattedTime ? (
            <Text style={styles.userTimeText}>{formattedTime}</Text>
          ) : null}

          {/* AI Actions */}
          {!isUser && (
            <View style={styles.actionsGroup}>
              {/* TTS Listen Button */}
              {hasText && (
                <Pressable
                  onPress={handleSpeak}
                  style={[
                    styles.actionPill,
                    {
                      backgroundColor: isSpeaking ? '#fee2e2' : '#eef2ff',
                      borderColor: isSpeaking ? '#fca5a5' : '#c7d2fe',
                    },
                  ]}
                  hitSlop={6}
                >
                  <Ionicons name={isSpeaking ? 'volume-mute-outline' : 'volume-high-outline'} size={12} color={isSpeaking ? '#ef4444' : '#4f46e5'} />
                  <Text style={[styles.actionPillText, { color: isSpeaking ? '#ef4444' : '#4f46e5' }]}>
                    {isSpeaking ? 'Stop' : 'Listen'}
                  </Text>
                </Pressable>
              )}

              {/* Save / Favorite Button */}
              {onToggleFavorite && (
                <Pressable
                  onPress={onToggleFavorite}
                  style={[
                    styles.actionPill,
                    {
                      backgroundColor: isFavorited ? '#fef3c7' : '#f8fafc',
                      borderColor: isFavorited ? '#fde68a' : '#e2e8f0',
                    },
                  ]}
                  hitSlop={6}
                >
                  <Ionicons name={isFavorited ? 'star' : 'star-outline'} size={12} color={isFavorited ? '#d97706' : '#64748b'} />
                  <Text style={[styles.actionPillText, { color: isFavorited ? '#d97706' : '#64748b' }]}>
                    {isFavorited ? 'Saved' : 'Save'}
                  </Text>
                </Pressable>
              )}

              {/* Copy Button */}
              <Pressable
                onPress={handleCopy}
                style={[
                  styles.actionPill,
                  {
                    backgroundColor: copied ? '#dcfce7' : '#f8fafc',
                    borderColor: copied ? '#86efac' : '#e2e8f0',
                  },
                ]}
                hitSlop={6}
              >
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={12} color={copied ? '#16a34a' : '#64748b'} />
                <Text style={[styles.actionPillText, { color: copied ? '#16a34a' : '#64748b' }]}>
                  {copied ? 'Copied' : 'Copy'}
                </Text>
              </Pressable>

              {/* Retry / Regenerate Button */}
              {isLatestGemini && onRegenerate && (
                <Pressable
                  onPress={onRegenerate}
                  disabled={isLoading}
                  style={[styles.actionPill, { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }]}
                  hitSlop={6}
                >
                  <Ionicons name="refresh-outline" size={12} color="#475569" />
                  <Text style={[styles.actionPillText, { color: '#475569' }]}>Retry</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>

      {/* User Avatar */}
      {isUser && (
        <View style={styles.avatarWrapRight}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={14} color="#ffffff" />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    width: '100%',
    marginVertical: 6,
    flexDirection: 'row',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowGemini: {
    justifyContent: 'flex-start',
  },
  avatarWrap: {
    marginRight: 8,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  avatarWrapRight: {
    marginLeft: 8,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    borderRadius: 20,
    padding: 14,
  },
  bubbleUser: {
    backgroundColor: '#6366f1',
    borderTopRightRadius: 4,
  },
  bubbleGemini: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopLeftRadius: 4,
  },
  bubbleError: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderTopLeftRadius: 4,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#fecdd3',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e11d48',
  },
  errorRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e11d48',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  errorRetryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 4,
  },
  imageFrame: {
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  viewBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  metaRowUser: {
    borderTopColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'flex-end',
  },
  metaRowGemini: {
    borderTopColor: '#f1f5f9',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  senderTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderTagText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  userTimeText: {
    fontSize: 10,
    color: '#e0e7ff',
    fontWeight: '500',
  },
  actionsGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
    flex: 1,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export const MessageBubble = React.memo(MessageBubbleComponent);

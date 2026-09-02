import React, { useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Image,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ImageAttachment {
  uri: string;
  base64: string;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface ChatInputProps {
  input: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  isDark?: boolean;
  attachedImage?: ImageAttachment | null;
  onAttachPress?: () => void;
  onRemoveAttachment?: () => void;
  onStop?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  onChangeText,
  onSend,
  isLoading = false,
  isDark = false,
  attachedImage = null,
  onAttachPress,
  onRemoveAttachment,
  onStop,
}) => {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (attachedImage) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [attachedImage]);

  const canSend = (input.trim().length > 0 || !!attachedImage) && !isLoading;

  const colors = {
    bg: isDark ? '#0f172a' : '#ffffff',
    border: isDark ? '#1e293b' : '#e2e8f0',
    inputBg: isDark ? '#1e293b' : '#f1f5f9',
    text: isDark ? '#f8fafc' : '#0f172a',
    placeholder: isDark ? '#64748b' : '#94a3b8',
    primary: '#6366f1',
    primaryDisabled: isDark ? '#312e81' : '#c7d2fe',
    iconColor: isDark ? '#94a3b8' : '#64748b',
    removeBtnBg: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(0, 0, 0, 0.6)',
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
      {/* 1. Attached Image Thumbnail Preview */}
      {attachedImage && (
        <View style={styles.previewContainer}>
          <View style={[styles.previewFrame, { borderColor: colors.border }]}>
            <Image source={{ uri: attachedImage.uri }} style={styles.previewImage} />
            <Pressable
              onPress={onRemoveAttachment}
              style={[styles.removeButton, { backgroundColor: colors.removeBtnBg }]}
              hitSlop={8}
            >
              <Ionicons name="close" size={14} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      )}

      {/* 2. Composer Row */}
      <View style={styles.inputRow}>
        {/* Attachment Clip Button */}
        {onAttachPress && (
          <Pressable
            onPress={onAttachPress}
            disabled={isLoading}
            style={[styles.attachButton, { backgroundColor: colors.inputBg }]}
            hitSlop={6}
          >
            <Ionicons name="attach" size={20} color={colors.iconColor} />
          </Pressable>
        )}

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          value={input}
          onChangeText={onChangeText}
          placeholder={attachedImage ? 'Ask about this image...' : 'Ask AI anything about your studies...'}
          placeholderTextColor={colors.placeholder}
          multiline
          maxLength={4000}
          editable={!isLoading}
          style={[
            styles.textInput,
            {
              backgroundColor: colors.inputBg,
              color: colors.text,
            },
          ]}
        />

        {/* Send or Stop Button */}
        {isLoading ? (
          <Pressable
            onPress={onStop}
            style={[styles.sendButton, { backgroundColor: '#ef4444' }]}
            hitSlop={6}
          >
            <Ionicons name="stop" size={16} color="#ffffff" />
          </Pressable>
        ) : (
          <Pressable
            onPress={onSend}
            disabled={!canSend}
            style={[
              styles.sendButton,
              { backgroundColor: canSend ? colors.primary : colors.primaryDisabled },
            ]}
            hitSlop={6}
          >
            <Ionicons name="arrow-up" size={18} color="#ffffff" />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
  },
  previewContainer: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  previewFrame: {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 120,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

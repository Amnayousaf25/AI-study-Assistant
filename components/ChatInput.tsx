import React, { useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Image,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ImageAttachment {
  uri: string;
  base64: string;
  mimeType: string;
  name?: string;
  width?: number;
  height?: number;
  extractedText?: string;
  isImage?: boolean;
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
  const isImage = attachedImage?.mimeType?.startsWith('image/') || attachedImage?.isImage;

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
    docCardBg: isDark ? '#1e293b' : '#f1f5f9',
    docBorder: isDark ? '#334155' : '#cbd5e1',
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
      {/* 1. Attachment Preview (Image Thumbnail or Document Pill) */}
      {attachedImage && (
        <View style={styles.previewContainer}>
          {isImage ? (
            /* Image Preview */
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
          ) : (
            /* Document File Pill Preview */
            <View style={[styles.docPreviewPill, { backgroundColor: colors.docCardBg, borderColor: colors.docBorder }]}>
              <View style={styles.docIconBadge}>
                <Ionicons
                  name={attachedImage.mimeType?.includes('pdf') ? 'document-text' : 'document'}
                  size={16}
                  color="#ffffff"
                />
              </View>
              <View style={styles.docTextCol}>
                <Text numberOfLines={1} style={[styles.docName, { color: colors.text }]}>
                  {attachedImage.name || 'Attached Document'}
                </Text>
                <Text style={[styles.docMime, { color: colors.iconColor }]}>
                  {attachedImage.mimeType?.includes('pdf')
                    ? 'PDF Document'
                    : attachedImage.mimeType?.includes('word') || attachedImage.name?.endsWith('.docx') || attachedImage.name?.endsWith('.doc')
                    ? 'Word Document'
                    : 'Text File'}
                </Text>
              </View>
              <Pressable
                onPress={onRemoveAttachment}
                style={styles.docRemoveBtn}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={20} color={colors.iconColor} />
              </Pressable>
            </View>
          )}
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
            <Ionicons name="attach" size={22} color={colors.iconColor} />
          </Pressable>
        )}

        {/* Text Input */}
        <TextInput
          ref={inputRef}
          value={input}
          onChangeText={onChangeText}
          placeholder={
            attachedImage
              ? isImage
                ? 'Ask about this image...'
                : `Ask AI about "${attachedImage.name || 'this document'}"...`
              : 'Ask AI anything about your studies or upload files...'
          }
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
  docPreviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: 280,
    gap: 8,
  },
  docIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTextCol: {
    flex: 1,
  },
  docName: {
    fontSize: 12,
    fontWeight: '700',
  },
  docMime: {
    fontSize: 10,
    marginTop: 1,
  },
  docRemoveBtn: {
    padding: 2,
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

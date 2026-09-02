import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

interface MarkdownRendererProps {
  content: string;
  isUser: boolean;
  isError?: boolean;
}

interface Block {
  type: 'code' | 'text';
  language?: string;
  content: string;
}

function parseBlocks(rawText: string): Block[] {
  const blocks: Block[] = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = rawText.substring(lastIndex, match.index);
      if (textChunk.trim()) {
        blocks.push({ type: 'text', content: textChunk });
      }
    }
    blocks.push({
      type: 'code',
      language: match[1] || 'code',
      content: match[2].trim(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < rawText.length) {
    const remaining = rawText.substring(lastIndex);
    if (remaining.trim()) {
      blocks.push({ type: 'text', content: remaining });
    }
  }

  return blocks.length > 0 ? blocks : [{ type: 'text', content: rawText }];
}

interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = useCallback(async () => {
    try {
      if (Clipboard && Clipboard.setStringAsync) {
        await Clipboard.setStringAsync(code);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  return (
    <View style={styles.codeContainer}>
      {/* Code Header Bar */}
      <View style={styles.codeHeader}>
        <Text style={styles.codeLang}>{language}</Text>
        <Pressable onPress={handleCopyCode} style={styles.copyBtn} hitSlop={6}>
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={12} color={copied ? '#10b981' : '#cbd5e1'} />
          <Text style={[styles.copyBtnText, { color: copied ? '#10b981' : '#cbd5e1' }]}>
            {copied ? 'Copied' : 'Copy'}
          </Text>
        </Pressable>
      </View>

      {/* Code Body */}
      <View style={styles.codeBody}>
        <Text
          selectable={true}
          style={[
            styles.codeText,
            { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
          ]}
        >
          {code}
        </Text>
      </View>
    </View>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isUser,
  isError = false,
}) => {
  const blocks = parseBlocks(content);

  const renderInlineFormattedText = (text: string) => {
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => {
      const isHeader = line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ');
      const cleanLine = isHeader ? line.replace(/^#{1,3}\s+/, '') : line;
      const isBullet = /^\s*[-*•]\s+/.test(line);
      const bulletContent = isBullet ? line.replace(/^\s*[-*•]\s+/, '') : cleanLine;

      const parts = bulletContent.split(/(\*\*.*?\*\*)/g);

      return (
        <View
          key={lineIndex}
          style={[
            styles.lineRow,
            isHeader ? styles.headerRow : isBullet ? styles.bulletRow : styles.normalRow,
          ]}
        >
          {isBullet && (
            <Text style={[styles.bulletPoint, { color: isUser ? '#ffffff' : '#6366f1' }]}>
              •
            </Text>
          )}
          <Text
            selectable={true}
            style={[
              styles.textBase,
              isHeader
                ? [styles.headerText, { color: isUser ? '#ffffff' : '#0f172a' }]
                : isUser
                ? { color: '#ffffff' }
                : isError
                ? { color: '#9f1239' }
                : { color: '#1e293b' },
            ]}
          >
            {parts.map((part, partIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <Text key={partIndex} style={styles.boldText}>
                    {part.slice(2, -2)}
                  </Text>
                );
              }
              return <Text key={partIndex}>{part}</Text>;
            })}
          </Text>
        </View>
      );
    });
  };

  return (
    <View style={styles.fullWidth}>
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          return (
            <CodeBlock
              key={index}
              code={block.content}
              language={block.language || 'code'}
            />
          );
        }
        return <View key={index}>{renderInlineFormattedText(block.content)}</View>;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  codeContainer: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  codeLang: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: '#cbd5e1',
    textTransform: 'uppercase',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  copyBtnText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  codeBody: {
    padding: 12,
  },
  codeText: {
    fontSize: 12,
    color: '#e0e7ff',
    lineHeight: 18,
  },
  lineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  headerRow: {
    marginTop: 8,
    marginBottom: 4,
  },
  bulletRow: {
    marginVertical: 2,
    paddingLeft: 8,
  },
  normalRow: {
    marginVertical: 2,
  },
  bulletPoint: {
    marginRight: 6,
    fontWeight: '700',
    fontSize: 14,
  },
  textBase: {
    fontSize: 14,
    lineHeight: 22,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '800',
  },
  boldText: {
    fontWeight: '700',
  },
});

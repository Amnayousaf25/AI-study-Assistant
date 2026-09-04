import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useStudy } from '../src/context/StudyContext';
import { useChat } from '../src/context/ChatContext';
import { getFriendlyErrorMessage } from '../src/services/aiService';
import { SummaryLength, SummaryResult, StudyDocument } from '../src/types/study';

interface SummarizerModalProps {
  visible: boolean;
  onClose: () => void;
  initialText?: string;
  initialSubject?: string;
  initialTopic?: string;
  document?: StudyDocument;
  onTakeQuizOnTopic?: (subject: string, topic: string) => void;
}

const LENGTHS: Array<{ label: string; value: SummaryLength; desc: string }> = [
  { label: 'Short', value: 'short', desc: 'Bullet points & quick facts' },
  { label: 'Medium', value: 'medium', desc: 'Core concepts & definitions' },
  { label: 'Detailed', value: 'detailed', desc: 'Comprehensive study guide' },
];

export const SummarizerModal: React.FC<SummarizerModalProps> = ({
  visible,
  onClose,
  initialText = '',
  initialSubject,
  initialTopic = '',
  document,
  onTakeQuizOnTopic,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useChat();
  const { subjects, createSummary, saveSummaryAsDocument } = useStudy();

  const [selectedSubject, setSelectedSubject] = useState<string>(
    initialSubject || subjects[0]?.name || 'Physics'
  );
  const [topic, setTopic] = useState<string>(initialTopic);
  const [customText, setCustomText] = useState<string>(initialText);
  const [length, setLength] = useState<SummaryLength>('medium');
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (initialSubject) setSelectedSubject(initialSubject);
    if (initialTopic) setTopic(initialTopic);
    if (initialText) setCustomText(initialText);
  }, [initialSubject, initialTopic, initialText, visible]);

  const handleGenerateSummary = async () => {
    const textToSummarize =
      customText.trim() ||
      topic.trim() ||
      `Comprehensive revision of core principles, formulas, and key concepts in ${selectedSubject}: ${topic}`;

    if (!textToSummarize && !document?.base64Data) {
      setErrorMsg('Please enter notes, a topic, or select a document to summarize.');
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);

    // Timeout guard (25 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('TIMEOUT'));
      }, 25000);
    });

    try {
      const summary = (await Promise.race([
        createSummary(
          textToSummarize,
          length,
          selectedSubject,
          document?.base64Data,
          document?.mimeType,
          document?.name || (topic ? `${selectedSubject} - ${topic}` : selectedSubject)
        ),
        timeoutPromise,
      ])) as SummaryResult;

      setResult(summary);
    } catch (err: any) {
      console.error('Summary generation error:', err);
      if (err?.message === 'TIMEOUT') {
        setErrorMsg('The AI request took too long (timed out after 25s). Please try again.');
      } else {
        setErrorMsg(getFriendlyErrorMessage(err));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const content = `# ${result.title}

## Main Concept
${result.mainConcept}

## Key Takeaways
${result.keyPoints.map((p) => `- ${p}`).join('\n')}

## Important Terms & Definitions
${result.importantTerms.map((t) => `- **${t.term}**: ${t.definition}`).join('\n')}

## Quick Revision
${result.quickRevision}`;

    await Clipboard.setStringAsync(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToNotes = async () => {
    if (!result || saved) return;
    await saveSummaryAsDocument(result);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClose = () => {
    setResult(null);
    setErrorMsg(null);
    setIsGenerating(false);
    onClose();
  };

  const colors = {
    bg: isDark ? '#020617' : '#f8fafc',
    headerBg: isDark ? '#0f172a' : '#ffffff',
    card: isDark ? '#0f172a' : '#ffffff',
    border: isDark ? '#1e293b' : '#e2e8f0',
    textPrimary: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    primary: '#6366f1',
    primaryBg: isDark ? '#1e1b4b' : '#eef2ff',
    success: '#10b981',
    successBg: isDark ? '#064e3b' : '#ecfdf5',
    error: '#f43f5e',
    errorBg: isDark ? '#881337' : '#fff1f2',
    inputBg: isDark ? '#1e293b' : '#ffffff',
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* Full-Screen Top Navigation Header */}
        <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.iconBadge, { backgroundColor: colors.primaryBg }]}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
            </View>
            <View style={styles.headerTextCol}>
              <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>
                {result ? result.title : 'AI Study Summarizer'}
              </Text>
              <Text numberOfLines={1} style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {result ? `${result.subject || selectedSubject} • Key Concept Summary` : 'Summarize your study material'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleClose}
            style={[styles.closeButton, { backgroundColor: colors.border }]}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Scrollable Body */}
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.innerWrapper}>
            {result ? (
              /* RESULT VIEW */
              <View style={styles.resultContainer}>
                {/* Result Card: Core Concept */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHeaderRow}>
                    <Ionicons name="bulb-outline" size={18} color={colors.primary} />
                    <Text style={[styles.cardHeaderTitle, { color: colors.primary }]}>Core Concept</Text>
                  </View>
                  <Text style={[styles.cardBodyText, { color: colors.textPrimary }]}>
                    {result.mainConcept}
                  </Text>
                </View>

                {/* Key Takeaways List */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHeaderRow}>
                    <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
                    <Text style={[styles.cardHeaderTitle, { color: colors.success }]}>Key Takeaways</Text>
                  </View>
                  <View style={styles.listGap}>
                    {result.keyPoints.map((point, idx) => (
                      <View key={idx} style={styles.bulletRow}>
                        <Text style={[styles.bulletDot, { color: colors.success }]}>•</Text>
                        <Text style={[styles.bulletText, { color: colors.textPrimary }]}>{point}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Important Terms & Definitions */}
                {result.importantTerms && result.importantTerms.length > 0 && (
                  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.cardHeaderRow}>
                      <Ionicons name="book-outline" size={18} color="#f59e0b" />
                      <Text style={[styles.cardHeaderTitle, { color: '#f59e0b' }]}>Important Terms</Text>
                    </View>
                    <View style={styles.listGap}>
                      {result.importantTerms.map((termItem, idx) => (
                        <View key={idx} style={styles.termBox}>
                          <Text style={[styles.termTitle, { color: colors.textPrimary }]}>
                            • {termItem.term}
                          </Text>
                          <Text style={[styles.termDef, { color: colors.textMuted }]}>
                            {termItem.definition}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Quick Revision Summary */}
                {result.quickRevision ? (
                  <View style={[styles.card, { backgroundColor: colors.primaryBg, borderColor: colors.primary }]}>
                    <View style={styles.cardHeaderRow}>
                      <Ionicons name="flash-outline" size={18} color={colors.primary} />
                      <Text style={[styles.cardHeaderTitle, { color: colors.primary }]}>Quick Revision</Text>
                    </View>
                    <Text style={[styles.cardBodyText, { color: colors.textPrimary }]}>
                      {result.quickRevision}
                    </Text>
                  </View>
                ) : null}

                {/* Action Buttons: Copy, Save Notes, New Summary */}
                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={handleCopy}
                    style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={copied ? colors.success : colors.textPrimary} />
                    <Text style={[styles.actionBtnText, { color: copied ? colors.success : colors.textPrimary }]}>
                      {copied ? 'Copied' : 'Copy'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleSaveToNotes}
                    style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={16} color={saved ? colors.success : colors.textPrimary} />
                    <Text style={[styles.actionBtnText, { color: saved ? colors.success : colors.textPrimary }]}>
                      {saved ? 'Saved' : 'Save Notes'}
                    </Text>
                  </Pressable>
                </View>

                {/* New Summary CTA */}
                <Pressable
                  onPress={() => setResult(null)}
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.primaryButtonText}>✨ New Summary</Text>
                </Pressable>
              </View>
            ) : (
              /* INPUT FORM VIEW */
              <View style={styles.formContainer}>
                {/* Notes Input Area */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                    Paste your study notes or concept details
                  </Text>
                  <TextInput
                    value={customText}
                    onChangeText={setCustomText}
                    placeholder="Type or paste textbook notes, lecture points, or questions here..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={6}
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>

                {/* Optional Topic Field */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                    Topic Title (Optional)
                  </Text>
                  <TextInput
                    value={topic}
                    onChangeText={setTopic}
                    placeholder="e.g. Cellular Respiration, Newton's 2nd Law..."
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>

                {/* Summary Length Selector */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                    Summary Length
                  </Text>
                  <View style={styles.lengthRow}>
                    {LENGTHS.map((item) => {
                      const isSelected = length === item.value;
                      return (
                        <Pressable
                          key={item.value}
                          onPress={() => setLength(item.value)}
                          style={[
                            styles.lengthChip,
                            {
                              backgroundColor: isSelected ? colors.primaryBg : colors.card,
                              borderColor: isSelected ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.lengthChipText,
                              {
                                color: isSelected ? colors.primary : colors.textPrimary,
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}
                          >
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Error Banner if any */}
                {errorMsg && (
                  <View style={[styles.errorBanner, { backgroundColor: colors.errorBg, borderColor: colors.error }]}>
                    <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
                    <Text style={[styles.errorBannerText, { color: colors.error }]}>
                      {errorMsg}
                    </Text>
                  </View>
                )}

                {/* Generate Summary CTA Button */}
                <Pressable
                  onPress={handleGenerateSummary}
                  disabled={isGenerating}
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: isGenerating ? colors.border : colors.primary,
                      opacity: isGenerating ? 0.7 : 1,
                    },
                  ]}
                >
                  {isGenerating ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>
                        ✨ Creating your summary...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.primaryButtonText}>✨ Generate Summary</Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  innerWrapper: {
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  formContainer: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  lengthRow: {
    flexDirection: 'row',
    gap: 8,
  },
  lengthChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lengthChipText: {
    fontSize: 13,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultContainer: {
    gap: 14,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardBodyText: {
    fontSize: 13,
    lineHeight: 20,
  },
  listGap: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletDot: {
    fontSize: 16,
    marginRight: 8,
    lineHeight: 20,
  },
  bulletText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  termBox: {
    gap: 2,
  },
  termTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  termDef: {
    fontSize: 12,
    paddingLeft: 12,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
});

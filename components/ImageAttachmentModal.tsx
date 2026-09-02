import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  Platform,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../src/hooks/useResponsive';
import {
  pickImageFromCamera,
  pickImageFromGallery,
  pickImageFromBrowser,
  PickedImageResult,
} from '../src/utils/imagePickerHelper';

interface ImageAttachmentModalProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (image: PickedImageResult) => void;
  isDark?: boolean;
}

export const ImageAttachmentModal: React.FC<ImageAttachmentModalProps> = ({
  visible,
  onClose,
  onImageSelected,
  isDark = false,
}) => {
  const insets = useSafeAreaInsets();
  const { isWideScreen } = useResponsive();
  const isWeb = Platform.OS === 'web';

  const handleCameraPress = async () => {
    onClose();
    if (isWeb) {
      const result = await pickImageFromBrowser('environment');
      if (result) onImageSelected(result);
    } else {
      setTimeout(async () => {
        const result = await pickImageFromCamera();
        if (result) onImageSelected(result);
      }, 150);
    }
  };

  const handleGalleryOrUploadPress = async () => {
    onClose();
    if (isWeb) {
      const result = await pickImageFromBrowser();
      if (result) onImageSelected(result);
    } else {
      setTimeout(async () => {
        const result = await pickImageFromGallery();
        if (result) onImageSelected(result);
      }, 150);
    }
  };

  const colors = {
    modalBg: isDark ? '#0f172a' : '#ffffff',
    border: isDark ? '#1e293b' : '#e2e8f0',
    titleText: isDark ? '#f8fafc' : '#0f172a',
    subText: isDark ? '#94a3b8' : '#64748b',
    cardBg1: isDark ? '#1e1b4b' : '#eef2ff',
    cardBorder1: isDark ? '#312e81' : '#c7d2fe',
    cardBg2: isDark ? '#1e293b' : '#f8fafc',
    cardBorder2: isDark ? '#334155' : '#e2e8f0',
    btnBg: isDark ? '#1e293b' : '#f1f5f9',
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={[
            styles.backdrop,
            isWideScreen ? styles.centerBackdrop : styles.bottomBackdrop,
          ]}
        >
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.modalBg,
                  borderColor: colors.border,
                  paddingBottom: isWideScreen ? 20 : Math.max(insets.bottom, 20),
                },
                isWideScreen ? styles.wideCard : styles.mobileCard,
              ]}
            >
              {/* Modal Header */}
              <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
                <View style={styles.headerTextCol}>
                  <Text style={[styles.title, { color: colors.titleText }]}>
                    {isWeb ? 'Attach Image / Photo' : 'Attach Image for AI Analysis'}
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.subText }]}>
                    Ask questions, solve problems, or inspect diagrams
                  </Text>
                </View>

                <Pressable
                  onPress={onClose}
                  style={[styles.closeBtn, { backgroundColor: colors.btnBg }]}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={16} color={colors.subText} />
                </Pressable>
              </View>

              {/* Action Options */}
              <View style={styles.optionsList}>
                {/* Option 1: Gallery */}
                <Pressable
                  onPress={handleGalleryOrUploadPress}
                  style={[
                    styles.optionItem,
                    { backgroundColor: colors.cardBg1, borderColor: colors.cardBorder1 },
                  ]}
                >
                  <View style={styles.optionIconBadge}>
                    <Ionicons name="images" size={20} color="#ffffff" />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={[styles.optionTitle, { color: colors.titleText }]}>
                      {isWeb ? 'Upload Image File' : 'Choose from Library'}
                    </Text>
                    <Text style={[styles.optionDesc, { color: colors.subText }]}>
                      {isWeb
                        ? 'Select PNG, JPG, or WEBP from your device'
                        : 'Select an existing photo, chart, or screenshot'}
                    </Text>
                  </View>
                </Pressable>

                {/* Option 2: Camera */}
                <Pressable
                  onPress={handleCameraPress}
                  style={[
                    styles.optionItem,
                    { backgroundColor: colors.cardBg2, borderColor: colors.cardBorder2 },
                  ]}
                >
                  <View style={[styles.optionIconBadge, { backgroundColor: '#475569' }]}>
                    <Ionicons name="camera" size={20} color="#ffffff" />
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={[styles.optionTitle, { color: colors.titleText }]}>
                      Take Photo
                    </Text>
                    <Text style={[styles.optionDesc, { color: colors.subText }]}>
                      {isWeb
                        ? 'Capture photo with device camera'
                        : 'Capture a document, diagram, or textbook page'}
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* Cancel Button */}
              <Pressable
                onPress={onClose}
                style={[styles.cancelBtn, { backgroundColor: colors.btnBg }]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.titleText }]}>Cancel</Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  centerBackdrop: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  bottomBackdrop: {
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderWidth: 1,
    padding: 20,
  },
  wideCard: {
    borderRadius: 24,
    width: '100%',
    maxWidth: 440,
  },
  mobileCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  headerTextCol: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    gap: 12,
    marginVertical: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  optionIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionTextCol: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

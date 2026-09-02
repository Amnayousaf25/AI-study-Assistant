import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ScrollToBottomButtonProps {
  onPress: () => void;
  visible: boolean;
}

export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
  onPress,
  visible,
}) => {
  if (!visible) return null;

  return (
    <Pressable
      onPress={onPress}
      style={styles.button}
      accessibilityLabel="Scroll to latest message"
    >
      <Ionicons name="chevron-down" size={18} color="#ffffff" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#818cf8',
  },
});

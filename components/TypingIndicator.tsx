import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

function AnimatedDot({ delay }: { delay: number }) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 350 }),
          withTiming(0.4, { duration: 350 })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 350 }),
          withTiming(0.4, { duration: 350 })
        ),
        -1,
        false
      )
    );
  }, [delay, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        animatedStyle,
      ]}
    />
  );
}

export const TypingIndicator: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Bot Avatar */}
      <View style={styles.avatarWrap}>
        <View style={styles.aiAvatar}>
          <Ionicons name="hardware-chip-outline" size={16} color="#6366f1" />
        </View>
      </View>

      {/* Bubble */}
      <View style={styles.bubble}>
        <View style={styles.dotsRow}>
          <AnimatedDot delay={0} />
          <AnimatedDot delay={180} />
          <AnimatedDot delay={360} />
        </View>
        <Text style={styles.thinkingText}>Thinking...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    marginRight: 8,
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
  bubble: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#6366f1',
  },
  thinkingText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
});

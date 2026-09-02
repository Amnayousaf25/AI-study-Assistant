import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
  FontAwesome5,
} from '@expo/vector-icons';

interface IconProps {
  size?: number;
  color?: string;
}

// Navigation & Core
export const SparklesIcon = ({ size = 20, color = '#6366f1' }: IconProps) => (
  <Ionicons name="sparkles" size={size} color={color} />
);

export const HomeIcon = ({ size = 20, color = '#6366f1' }: IconProps) => (
  <Ionicons name="home" size={size} color={color} />
);

export const ChatIcon = ({ size = 20, color = '#6366f1' }: IconProps) => (
  <Ionicons name="chatbubble-ellipses" size={size} color={color} />
);

export const BookOpenIcon = ({ size = 20, color = '#6366f1' }: IconProps) => (
  <Ionicons name="book" size={size} color={color} />
);

export const ChartBarIcon = ({ size = 20, color = '#6366f1' }: IconProps) => (
  <Ionicons name="bar-chart" size={size} color={color} />
);

export const UserCircleIcon = ({ size = 20, color = '#6366f1' }: IconProps) => (
  <Ionicons name="person-circle" size={size} color={color} />
);

export const GraduationCapIcon = ({ size = 20, color = '#6366f1' }: IconProps) => (
  <FontAwesome5 name="graduation-cap" size={size * 0.9} color={color} />
);

// Study Tools
export const CameraIcon = ({ size = 20, color = '#6366f1' }: IconProps) => (
  <Ionicons name="camera" size={size} color={color} />
);

export const PhotoIcon = ({ size = 20, color = '#6366f1' }: IconProps) => (
  <Ionicons name="images" size={size} color={color} />
);

export const DocumentIcon = ({ size = 20, color = '#6366f1' }: IconProps) => (
  <Ionicons name="document-text" size={size} color={color} />
);

export const PdfIcon = ({ size = 20, color = '#ef4444' }: IconProps) => (
  <MaterialCommunityIcons name="file-pdf-box" size={size * 1.15} color={color} />
);

export const QuizIcon = ({ size = 20, color = '#6366f1' }: IconProps) => (
  <MaterialCommunityIcons name="clipboard-check-outline" size={size} color={color} />
);

export const BrainIcon = ({ size = 20, color = '#6366f1' }: IconProps) => (
  <MaterialCommunityIcons name="brain" size={size} color={color} />
);

export const TrophyIcon = ({ size = 20, color = '#eab308' }: IconProps) => (
  <Ionicons name="trophy" size={size} color={color} />
);

export const FireIcon = ({ size = 20, color = '#f97316' }: IconProps) => (
  <Ionicons name="flame" size={size} color={color} />
);

export const TargetIcon = ({ size = 20, color = '#10b981' }: IconProps) => (
  <MaterialCommunityIcons name="target" size={size} color={color} />
);

export const LightbulbIcon = ({ size = 20, color = '#f59e0b' }: IconProps) => (
  <Ionicons name="bulb" size={size} color={color} />
);

export const ClockIcon = ({ size = 18, color = '#6366f1' }: IconProps) => (
  <Ionicons name="time-outline" size={size} color={color} />
);

// Actions & Audio
export const SendIcon = ({ size = 18, color = '#ffffff' }: IconProps) => (
  <Ionicons name="arrow-up" size={size} color={color} />
);

export const AttachmentIcon = ({ size = 18, color = '#64748b' }: IconProps) => (
  <Ionicons name="attach" size={size} color={color} />
);

export const PlusIcon = ({ size = 18, color = '#6366f1' }: IconProps) => (
  <Ionicons name="add" size={size} color={color} />
);

export const CloseIcon = ({ size = 16, color = '#64748b' }: IconProps) => (
  <Ionicons name="close" size={size} color={color} />
);

export const CopyIcon = ({ size = 16, color = '#64748b' }: IconProps) => (
  <Ionicons name="copy-outline" size={size} color={color} />
);

export const CheckIcon = ({ size = 16, color = '#10b981' }: IconProps) => (
  <Ionicons name="checkmark" size={size} color={color} />
);

export const RefreshIcon = ({ size = 16, color = '#64748b' }: IconProps) => (
  <Ionicons name="refresh" size={size} color={color} />
);

export const SpeakerIcon = ({ size = 16, color = '#6366f1' }: IconProps) => (
  <Ionicons name="volume-high" size={size} color={color} />
);

export const SpeakerMuteIcon = ({ size = 16, color = '#94a3b8' }: IconProps) => (
  <Ionicons name="volume-mute" size={size} color={color} />
);

export const StarIcon = ({ size = 16, color = '#64748b' }: IconProps) => (
  <Ionicons name="star-outline" size={size} color={color} />
);

export const StarFilledIcon = ({ size = 16, color = '#eab308' }: IconProps) => (
  <Ionicons name="star" size={size} color={color} />
);

export const TrashIcon = ({ size = 16, color = '#f43f5e' }: IconProps) => (
  <Ionicons name="trash-outline" size={size} color={color} />
);

export const ArrowLeftIcon = ({ size = 20, color = '#64748b' }: IconProps) => (
  <Ionicons name="arrow-back" size={size} color={color} />
);

export const ChevronRightIcon = ({ size = 18, color = '#94a3b8' }: IconProps) => (
  <Ionicons name="chevron-forward" size={size} color={color} />
);

export const ChevronDownIcon = ({ size = 18, color = '#64748b' }: IconProps) => (
  <Ionicons name="chevron-down" size={size} color={color} />
);

export const InfoIcon = ({ size = 18, color = '#6366f1' }: IconProps) => (
  <Ionicons name="information-circle-outline" size={size} color={color} />
);

export const HelpIcon = ({ size = 18, color = '#6366f1' }: IconProps) => (
  <Ionicons name="help-circle-outline" size={size} color={color} />
);

export const MenuIcon = ({ size = 20, color = '#64748b' }: IconProps) => (
  <Ionicons name="menu" size={size} color={color} />
);

export const ExpandIcon = ({ size = 14, color = '#ffffff' }: IconProps) => (
  <Ionicons name="expand-outline" size={size} color={color} />
);

export const StopIcon = ({ size = 14, color = '#ffffff' }: IconProps) => (
  <Ionicons name="stop" size={size} color={color} />
);

export const SearchIcon = ({ size = 18, color = '#94a3b8' }: IconProps) => (
  <Ionicons name="search" size={size} color={color} />
);

export const SettingsIcon = ({ size = 18, color = '#64748b' }: IconProps) => (
  <Ionicons name="settings-outline" size={size} color={color} />
);

export const SunIcon = ({ size = 16, color = '#f59e0b' }: IconProps) => (
  <Ionicons name="sunny" size={size} color={color} />
);

export const MoonIcon = ({ size = 16, color = '#6366f1' }: IconProps) => (
  <Ionicons name="moon" size={size} color={color} />
);

export const BotIcon = ({ size = 20, color = '#6366f1' }: IconProps) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: '#eef2ff',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Ionicons name="hardware-chip-outline" size={size * 0.65} color={color} />
  </View>
);

export const UserIcon = ({ size = 20, color = '#ffffff' }: IconProps) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: '#6366f1',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Ionicons name="person" size={size * 0.6} color={color} />
  </View>
);

export const LayersIcon = ({ size = 18, color = '#6366f1' }: IconProps) => (
  <Ionicons name="layers-outline" size={size} color={color} />
);

export const CodeIcon = ({ size = 18, color = '#6366f1' }: IconProps) => (
  <Ionicons name="code-slash" size={size} color={color} />
);

export const MicrophoneIcon = ({ size = 18, color = '#6366f1' }: IconProps) => (
  <Ionicons name="mic" size={size} color={color} />
);

export const MicrophoneOffIcon = ({ size = 18, color = '#f43f5e' }: IconProps) => (
  <Ionicons name="mic-off" size={size} color={color} />
);

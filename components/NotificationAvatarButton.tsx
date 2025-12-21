import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import type { NotificationAvatarButtonProps } from '../interfaces/components.types';

export default function NotificationAvatarButton({
  onPress,
  size = 32,
  showBadge = true,
}: NotificationAvatarButtonProps) {
  const diameter = size;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ paddingHorizontal: 4 }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <View
        style={[
          styles.fallback,
          { width: diameter, height: diameter, borderRadius: diameter / 2 },
        ]}
      >
        <Bell size={Math.max(14, Math.floor(diameter * 0.55))} color="#FFFFFF" />
        {showBadge && (
          <View
            style={[
              styles.badge,
              {
                width: Math.max(6, Math.floor(diameter * 0.25)),
                height: Math.max(6, Math.floor(diameter * 0.25)),
                borderRadius: Math.max(3, Math.floor(diameter * 0.125)),
              },
            ]}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -0.5,
    left: 0,
    backgroundColor: '#22C55E',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
});



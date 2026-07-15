import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';

interface StatCardProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  accent?: boolean;
  /** Splash color used for the icon badge when not the primary accent card. */
  tint?: string;
}

export function StatCard({ icon, label, value, accent, tint }: StatCardProps) {
  const colors = useColors();
  const badgeColor = accent ? colors.primaryForeground : (tint ?? colors.primary);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: accent ? colors.primary : colors.card,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View
        style={[
          styles.iconBadge,
          {
            backgroundColor: accent
              ? 'rgba(0,0,0,0.14)'
              : `${badgeColor}22`,
          },
        ]}
      >
        <Feather
          name={icon}
          size={16}
          color={accent ? colors.primaryForeground : badgeColor}
        />
      </View>
      <Text
        style={[
          styles.value,
          { color: accent ? colors.primaryForeground : colors.foreground },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.label,
          {
            color: accent
              ? colors.primaryForeground
              : colors.mutedForeground,
            opacity: accent ? 0.85 : 1,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 14,
    gap: 8,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});

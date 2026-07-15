import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';

interface StatCardProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  accent?: boolean;
}

export function StatCard({ icon, label, value, accent }: StatCardProps) {
  const colors = useColors();

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
      <Feather
        name={icon}
        size={18}
        color={accent ? colors.primaryForeground : colors.mutedForeground}
      />
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
  value: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});

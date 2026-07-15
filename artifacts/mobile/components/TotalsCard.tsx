import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';

interface TotalsCardProps {
  volume: number;
  distance: number;
  onPress: () => void;
}

export function TotalsCard({ volume, distance, onPress }: TotalsCardProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      testID="lifetime-totals-card"
    >
      <View style={styles.left}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Lifetime Totals
        </Text>
        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Feather name="trending-up" size={13} color={colors.primary} />
            <Text style={[styles.metricText, { color: colors.mutedForeground }]}>
              {Math.round(volume).toLocaleString()} lb lifted
            </Text>
          </View>
          <View style={styles.metric}>
            <Feather name="wind" size={13} color={colors.primary} />
            <Text style={[styles.metricText, { color: colors.mutedForeground }]}>
              {distance.toFixed(1)} mi run
            </Text>
          </View>
        </View>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  left: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  metrics: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});

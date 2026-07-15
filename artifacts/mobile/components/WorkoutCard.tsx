import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import type { Workout } from '@/context/WorkoutContext';
import { totalSets, totalVolume } from '@/context/WorkoutContext';
import { formatDayLabel, formatDuration } from '@/lib/dateUtils';

interface WorkoutCardProps {
  workout: Workout;
  onPress: () => void;
}

export function WorkoutCard({ workout, onPress }: WorkoutCardProps) {
  const colors = useColors();
  const exerciseNames = workout.exercises.map((e) => e.name).join(' · ');
  const volume = totalVolume(workout);

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
      testID={`workout-card-${workout.id}`}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {workout.name}
          </Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {formatDayLabel(workout.date)}
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </View>

      {exerciseNames ? (
        <Text
          numberOfLines={1}
          style={[styles.exercises, { color: colors.mutedForeground }]}
        >
          {exerciseNames}
        </Text>
      ) : null}

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.footerItem}>
          <Feather name="layers" size={13} color={colors.mutedForeground} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            {totalSets(workout)} sets
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Feather name="trending-up" size={13} color={colors.mutedForeground} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            {Math.round(volume).toLocaleString()} lb
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Feather name="clock" size={13} color={colors.mutedForeground} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            {formatDuration(workout.durationSeconds)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  date: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  exercises: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});

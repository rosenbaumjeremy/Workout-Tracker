import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import {
  totalDistance,
  totalSets,
  totalVolume,
  useWorkouts,
} from '@/context/WorkoutContext';
import { Feather } from '@expo/vector-icons';
import {
  formatClock,
  formatDuration,
  formatFullDate,
} from '@/lib/dateUtils';

export default function WorkoutDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getWorkoutById, deleteWorkout } = useWorkouts();
  const workout = getWorkoutById(id);

  if (!workout) {
    return (
      <View
        style={[
          styles.notFound,
          { backgroundColor: colors.background, paddingTop: insets.top + 40 },
        ]}
      >
        <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>
          Workout not found.
        </Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete workout?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteWorkout(workout.id);
            router.back();
          },
        },
      ],
    );
  };

  const volume = totalVolume(workout);
  const distance = totalDistance(workout);
  const sets = totalSets(workout);

  const statsList: { key: string; value: string; label: string }[] = [
    { key: 'duration', value: formatDuration(workout.durationSeconds), label: 'Duration' },
    { key: 'sets', value: String(sets), label: 'Sets' },
  ];
  if (volume > 0) {
    statsList.push({
      key: 'volume',
      value: Math.round(volume).toLocaleString(),
      label: 'Volume (lb)',
    });
  }
  if (distance > 0) {
    statsList.push({
      key: 'distance',
      value: distance.toFixed(2),
      label: 'Distance (mi)',
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === 'web' ? 24 : insets.top + 8,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} testID="back-button">
          <Feather name="chevron-left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Workout
        </Text>
        <Pressable onPress={handleDelete} hitSlop={10} testID="delete-workout">
          <Feather name="trash-2" size={20} color={colors.destructive} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.name, { color: colors.foreground }]}>
          {workout.name}
        </Text>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {formatFullDate(workout.date)} · {formatClock(workout.date)}
        </Text>

        <View style={styles.statsRow}>
          {statsList.map((stat) => (
            <View
              key={stat.key}
              style={[styles.stat, { backgroundColor: colors.card, borderRadius: colors.radius }]}
            >
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.exerciseList}>
          {workout.exercises.map((exercise) => (
            <View
              key={exercise.id}
              style={[
                styles.exerciseCard,
                { backgroundColor: colors.card, borderRadius: colors.radius },
              ]}
            >
              <View style={styles.exerciseTitleRow}>
                <Text style={[styles.exerciseName, { color: colors.foreground }]}>
                  {exercise.name}
                </Text>
                {exercise.runType && (
                  <View style={[styles.runBadge, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.runBadgeText, { color: colors.accentForeground }]}>
                      {exercise.runType === 'Interval' ? 'Intervals' : `${exercise.runType} Run`}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.setTable}>
                {exercise.sets.map((set, index) => (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={[styles.setIndex, { color: colors.mutedForeground }]}>
                      {exercise.isCardio ? `Run ${index + 1}` : `Set ${index + 1}`}
                    </Text>
                    <Text style={[styles.setValue, { color: colors.foreground }]}>
                      {exercise.isCardio
                        ? `${(set.distance ?? 0).toFixed(2)} mi`
                        : `${set.reps} reps × ${set.weight} lb`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  name: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
  },
  date: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: -12,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stat: {
    flexGrow: 1,
    flexBasis: '30%',
    padding: 14,
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  exerciseList: {
    gap: 12,
  },
  exerciseCard: {
    padding: 16,
    gap: 10,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  runBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  runBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  setTable: {
    gap: 8,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  setIndex: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  setValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
  },
});

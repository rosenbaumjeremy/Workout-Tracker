import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useWorkouts } from '@/context/WorkoutContext';
import { StatCard } from '@/components/StatCard';
import { WorkoutCard } from '@/components/WorkoutCard';
import { EmptyState } from '@/components/EmptyState';
import { Feather } from '@expo/vector-icons';
import { greetingForNow } from '@/lib/dateUtils';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { workouts, stats, isLoaded } = useWorkouts();
  const recent = workouts.slice(0, 3);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? 67 + 16 : insets.top + 16,
            paddingBottom: Platform.OS === 'web' ? 84 + 24 : 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {greetingForNow()}
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Volt Log
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon="zap"
            label="Day Streak"
            value={String(stats.currentStreakDays)}
            accent
          />
          <StatCard
            icon="calendar"
            label="This Week"
            value={String(stats.thisWeekWorkouts)}
          />
          <StatCard
            icon="award"
            label="Total"
            value={String(stats.totalWorkouts)}
          />
        </View>

        <Pressable
          onPress={() => router.push('/workout/new')}
          style={({ pressed }) => [
            styles.startButton,
            {
              backgroundColor: colors.primary,
              borderRadius: colors.radius,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          testID="start-workout-button"
        >
          <Feather name="play" size={18} color={colors.primaryForeground} />
          <Text
            style={[styles.startButtonText, { color: colors.primaryForeground }]}
          >
            Start Workout
          </Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recent Workouts
          </Text>
          {workouts.length > 0 && (
            <Pressable
              onPress={() => router.push('/(tabs)/history')}
              hitSlop={8}
            >
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                See All
              </Text>
            </Pressable>
          )}
        </View>

        {!isLoaded ? null : recent.length === 0 ? (
          <EmptyState
            icon="activity"
            title="No workouts yet"
            subtitle="Start your first session and it will show up here."
          />
        ) : (
          <View style={styles.list}>
            {recent.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onPress={() => router.push(`/workout/${workout.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  title: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
  },
  startButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  seeAll: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  list: {
    gap: 12,
  },
});

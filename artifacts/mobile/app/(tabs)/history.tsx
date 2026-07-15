import React from 'react';
import { FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useWorkouts } from '@/context/WorkoutContext';
import { WorkoutCard } from '@/components/WorkoutCard';
import { EmptyState } from '@/components/EmptyState';
import type { Workout } from '@/context/WorkoutContext';

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { workouts, isLoaded } = useWorkouts();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList<Workout>
        data={workouts}
        keyExtractor={(item) => item.id}
        scrollEnabled={workouts.length > 0}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? 67 + 16 : insets.top + 16,
            paddingBottom: Platform.OS === 'web' ? 84 + 24 : 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <Text style={[styles.title, { color: colors.foreground }]}>
            History
          </Text>
        }
        ListEmptyComponent={
          isLoaded ? (
            <EmptyState
              icon="calendar"
              title="No workouts logged"
              subtitle="Every workout you finish will be saved here."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <WorkoutCard
            workout={item}
            onPress={() => router.push(`/workout/${item.id}`)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    marginBottom: 20,
  },
});

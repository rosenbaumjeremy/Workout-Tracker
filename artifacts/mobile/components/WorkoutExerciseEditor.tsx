import React from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { WorkoutSet } from '@/context/WorkoutContext';

export interface ExerciseDraft {
  id: string;
  name: string;
  sets: WorkoutSet[];
}

interface WorkoutExerciseEditorProps {
  exercise: ExerciseDraft;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onUpdateSet: (setId: string, field: 'reps' | 'weight', value: string) => void;
  onRemoveExercise: () => void;
}

export function WorkoutExerciseEditor({
  exercise,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  onRemoveExercise,
}: WorkoutExerciseEditorProps) {
  const colors = useColors();

  const handleAddSet = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAddSet();
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderRadius: colors.radius },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.name, { color: colors.foreground }]}>
          {exercise.name}
        </Text>
        <Pressable onPress={onRemoveExercise} hitSlop={10} testID={`remove-exercise-${exercise.id}`}>
          <Feather name="trash-2" size={17} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {exercise.sets.length > 0 && (
        <View style={styles.columnHeader}>
          <Text style={[styles.columnLabel, { color: colors.mutedForeground, width: 34 }]}>
            SET
          </Text>
          <Text style={[styles.columnLabel, { color: colors.mutedForeground, flex: 1 }]}>
            REPS
          </Text>
          <Text style={[styles.columnLabel, { color: colors.mutedForeground, flex: 1 }]}>
            WEIGHT (LB)
          </Text>
          <View style={{ width: 28 }} />
        </View>
      )}

      {exercise.sets.map((set, index) => (
        <View key={set.id} style={styles.setRow}>
          <Text style={[styles.setIndex, { color: colors.mutedForeground }]}>
            {index + 1}
          </Text>
          <TextInput
            value={set.reps > 0 ? String(set.reps) : ''}
            onChangeText={(value) => onUpdateSet(set.id, 'reps', value)}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.secondary,
                borderRadius: colors.radius / 2,
              },
            ]}
            testID={`reps-input-${set.id}`}
          />
          <TextInput
            value={set.weight > 0 ? String(set.weight) : ''}
            onChangeText={(value) => onUpdateSet(set.id, 'weight', value)}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.secondary,
                borderRadius: colors.radius / 2,
              },
            ]}
            testID={`weight-input-${set.id}`}
          />
          <Pressable
            onPress={() => onRemoveSet(set.id)}
            hitSlop={10}
            style={styles.setRemove}
            testID={`remove-set-${set.id}`}
          >
            <Feather name="minus-circle" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
      ))}

      <Pressable
        onPress={handleAddSet}
        style={({ pressed }) => [
          styles.addSetButton,
          {
            backgroundColor: colors.secondary,
            borderRadius: colors.radius / 1.4,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        testID={`add-set-${exercise.id}`}
      >
        <Feather name="plus" size={16} color={colors.foreground} />
        <Text style={[styles.addSetText, { color: colors.foreground }]}>
          Add Set
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  columnLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setIndex: {
    width: 34,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  setRemove: {
    width: 28,
    alignItems: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    marginTop: 2,
  },
  addSetText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});

import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { looksLikeCardio, searchExercises } from '@/constants/exercises';
import * as Haptics from 'expo-haptics';

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (name: string, isCardio: boolean) => void;
}

export function ExercisePickerModal({
  visible,
  onClose,
  onSelect,
}: ExercisePickerModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const groups = searchExercises(query);

  const handleSelect = (name: string, isCardio: boolean) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    onSelect(name, isCardio);
    setQuery('');
  };

  const handleAddCustom = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    handleSelect(trimmed, looksLikeCardio(trimmed));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: Platform.OS === 'web' ? 24 : insets.top + 8,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>
            Add Exercise
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={[styles.closeButton, { backgroundColor: colors.secondary }]}
            testID="exercise-picker-close"
          >
            <Feather name="x" size={18} color={colors.foreground} />
          </Pressable>
        </View>

        <View
          style={[
            styles.searchRow,
            { backgroundColor: colors.secondary, borderRadius: colors.radius },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search or add custom exercise"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleAddCustom}
            testID="exercise-search-input"
          />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 24 },
          ]}
        >
          {groups.length === 0 ? (
            <Pressable
              onPress={handleAddCustom}
              style={[
                styles.customRow,
                { backgroundColor: colors.card, borderRadius: colors.radius },
              ]}
            >
              <Feather name="plus-circle" size={18} color={colors.primary} />
              <Text style={[styles.customText, { color: colors.foreground }]}>
                Add &ldquo;{query.trim()}&rdquo; as custom exercise
              </Text>
            </Pressable>
          ) : (
            groups.map((group) => (
              <View key={group.category} style={styles.group}>
                <Text
                  style={[styles.groupTitle, { color: colors.mutedForeground }]}
                >
                  {group.category.toUpperCase()}
                </Text>
                <View
                  style={[
                    styles.groupCard,
                    { backgroundColor: colors.card, borderRadius: colors.radius },
                  ]}
                >
                  {group.exercises.map((name, index) => (
                    <Pressable
                      key={name}
                      onPress={() =>
                        handleSelect(name, group.category === 'Cardio')
                      }
                      style={({ pressed }) => [
                        styles.exerciseRow,
                        index < group.exercises.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: colors.border,
                        },
                        pressed && { opacity: 0.6 },
                      ]}
                      testID={`exercise-option-${name}`}
                    >
                      <Text
                        style={[styles.exerciseName, { color: colors.foreground }]}
                      >
                        {name}
                      </Text>
                      <Feather name="plus" size={16} color={colors.primary} />
                    </Pressable>
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    height: '100%',
  },
  list: {
    padding: 20,
    gap: 20,
  },
  group: {
    gap: 8,
  },
  groupTitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.6,
    marginLeft: 4,
  },
  groupCard: {
    overflow: 'hidden',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  exerciseName: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
  },
  customText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
});

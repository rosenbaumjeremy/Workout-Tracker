import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';

type Mode = 'timer' | 'stopwatch';

const PRESETS_SECONDS = [30, 60, 90, 180];

function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function TimerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('timer');

  // Timer (countdown)
  const [presetSeconds, setPresetSeconds] = useState(60);
  const [customInput, setCustomInput] = useState('');
  const [remainingMs, setRemainingMs] = useState(60 * 1000);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerEndRef = useRef<number | null>(null);

  // Stopwatch (count up)
  const [stopwatchMs, setStopwatchMs] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const stopwatchStartRef = useRef<number | null>(null);
  const stopwatchBaseRef = useRef(0);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      if (timerEndRef.current == null) return;
      const msLeft = timerEndRef.current - Date.now();
      if (msLeft <= 0) {
        setRemainingMs(0);
        setTimerRunning(false);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return;
      }
      setRemainingMs(msLeft);
    }, 200);
    return () => clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    if (!stopwatchRunning) return;
    const interval = setInterval(() => {
      if (stopwatchStartRef.current == null) return;
      setStopwatchMs(
        stopwatchBaseRef.current + (Date.now() - stopwatchStartRef.current),
      );
    }, 100);
    return () => clearInterval(interval);
  }, [stopwatchRunning]);

  const selectPreset = (seconds: number) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setPresetSeconds(seconds);
    setCustomInput('');
    setRemainingMs(seconds * 1000);
    setTimerRunning(false);
    timerEndRef.current = null;
  };

  const applyCustom = () => {
    const minutes = Number(customInput.replace(/[^0-9.]/g, ''));
    if (!minutes || Number.isNaN(minutes)) return;
    const seconds = Math.round(minutes * 60);
    setPresetSeconds(seconds);
    setRemainingMs(seconds * 1000);
    setTimerRunning(false);
    timerEndRef.current = null;
  };

  const toggleTimer = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    if (timerRunning) {
      setTimerRunning(false);
      timerEndRef.current = null;
      return;
    }
    if (remainingMs <= 0) return;
    timerEndRef.current = Date.now() + remainingMs;
    setTimerRunning(true);
  };

  const resetTimer = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setTimerRunning(false);
    timerEndRef.current = null;
    setRemainingMs(presetSeconds * 1000);
  };

  const toggleStopwatch = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    if (stopwatchRunning) {
      stopwatchBaseRef.current = stopwatchMs;
      stopwatchStartRef.current = null;
      setStopwatchRunning(false);
      return;
    }
    stopwatchStartRef.current = Date.now();
    setStopwatchRunning(true);
  };

  const resetStopwatch = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setStopwatchRunning(false);
    stopwatchStartRef.current = null;
    stopwatchBaseRef.current = 0;
    setStopwatchMs(0);
  };

  const timerProgress =
    presetSeconds > 0 ? 1 - remainingMs / (presetSeconds * 1000) : 0;

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Timer
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12} testID="timer-close">
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={[styles.segmented, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
          <Pressable
            onPress={() => setMode('timer')}
            style={[
              styles.segment,
              mode === 'timer' && { backgroundColor: colors.card },
            ]}
            testID="mode-timer"
          >
            <Text
              style={[
                styles.segmentText,
                { color: mode === 'timer' ? colors.foreground : colors.mutedForeground },
              ]}
            >
              Timer
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('stopwatch')}
            style={[
              styles.segment,
              mode === 'stopwatch' && { backgroundColor: colors.card },
            ]}
            testID="mode-stopwatch"
          >
            <Text
              style={[
                styles.segmentText,
                { color: mode === 'stopwatch' ? colors.foreground : colors.mutedForeground },
              ]}
            >
              Stopwatch
            </Text>
          </Pressable>
        </View>

        {mode === 'timer' ? (
          <>
            <View style={styles.dialWrap}>
              <View
                style={[
                  styles.dial,
                  {
                    borderColor: colors.secondary,
                  },
                ]}
              >
                <View
                  style={[
                    styles.dialProgress,
                    {
                      borderColor: colors.primary,
                      opacity: timerProgress > 0 ? 1 : 0,
                    },
                  ]}
                />
                <Text style={[styles.dialText, { color: colors.foreground }]}>
                  {formatClock(remainingMs / 1000)}
                </Text>
              </View>
            </View>

            <View style={styles.presetRow}>
              {PRESETS_SECONDS.map((seconds) => (
                <Pressable
                  key={seconds}
                  onPress={() => selectPreset(seconds)}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor:
                        presetSeconds === seconds && !customInput
                          ? colors.primary
                          : colors.card,
                      borderRadius: colors.radius,
                    },
                  ]}
                  testID={`preset-${seconds}`}
                >
                  <Text
                    style={[
                      styles.presetText,
                      {
                        color:
                          presetSeconds === seconds && !customInput
                            ? colors.primaryForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={[styles.customRow, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
              <TextInput
                value={customInput}
                onChangeText={setCustomInput}
                placeholder="Custom minutes"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
                style={[styles.customInput, { color: colors.foreground }]}
                onSubmitEditing={applyCustom}
                testID="custom-timer-input"
              />
              <Pressable onPress={applyCustom} hitSlop={10}>
                <Feather name="arrow-right-circle" size={22} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.controlsRow}>
              <Pressable
                onPress={resetTimer}
                style={[styles.secondaryButton, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}
                testID="timer-reset"
              >
                <Feather name="rotate-ccw" size={20} color={colors.foreground} />
              </Pressable>
              <Pressable
                onPress={toggleTimer}
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary, borderRadius: colors.radius },
                ]}
                testID="timer-toggle"
              >
                <Feather
                  name={timerRunning ? 'pause' : 'play'}
                  size={24}
                  color={colors.primaryForeground}
                />
              </Pressable>
              <View style={styles.secondaryButton} />
            </View>
          </>
        ) : (
          <>
            <View style={styles.dialWrap}>
              <View style={[styles.dial, { borderColor: colors.secondary }]}>
                <View
                  style={[
                    styles.dialProgress,
                    { borderColor: colors.primary, opacity: stopwatchRunning ? 1 : 0 },
                  ]}
                />
                <Text style={[styles.dialText, { color: colors.foreground }]}>
                  {formatClock(stopwatchMs / 1000)}
                </Text>
              </View>
            </View>

            <View style={styles.controlsRow}>
              <Pressable
                onPress={resetStopwatch}
                style={[styles.secondaryButton, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}
                testID="stopwatch-reset"
              >
                <Feather name="rotate-ccw" size={20} color={colors.foreground} />
              </Pressable>
              <Pressable
                onPress={toggleStopwatch}
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary, borderRadius: colors.radius },
                ]}
                testID="stopwatch-toggle"
              >
                <Feather
                  name={stopwatchRunning ? 'pause' : 'play'}
                  size={24}
                  color={colors.primaryForeground}
                />
              </Pressable>
              <View style={styles.secondaryButton} />
            </View>
          </>
        )}
      </View>
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
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 24,
  },
  segmented: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 14,
  },
  segmentText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  dialWrap: {
    alignItems: 'center',
    marginTop: 12,
  },
  dial: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialProgress: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 10,
  },
  dialText: {
    fontSize: 44,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  presetText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    height: 50,
  },
  customInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    height: '100%',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 'auto',
    marginBottom: 12,
  },
  secondaryButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

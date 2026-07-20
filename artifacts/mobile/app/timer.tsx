import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useAudioPlayer } from 'expo-audio';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';

type Mode = 'timer' | 'stopwatch';

const PRESETS_SECONDS = [30, 60, 90, 120, 180, 300];

/**
 * Both clocks are driven off absolute timestamps and re-read on every tick,
 * so the display stays correct even when JS timers are throttled (background,
 * low-power mode). The tick only controls how smoothly the ring and the
 * hundredths digits move — never the elapsed time itself.
 */
const TICK_MS = 50;

const KEEP_AWAKE_TAG = 'workout-timer';

const RING_SIZE = 220;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** `m:ss`, or `h:mm:ss` once the duration reaches an hour. */
function formatClock(totalMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(totalMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Same as `formatClock` but with hundredths, for stopwatch readouts. */
function formatClockPrecise(totalMs: number): string {
  const clamped = Math.max(0, totalMs);
  const hundredths = Math.floor((clamped % 1000) / 10);
  return `${formatClock(Math.floor(clamped / 1000) * 1000)}.${String(
    hundredths,
  ).padStart(2, '0')}`;
}

function formatPreset(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = seconds / 60;
  return Number.isInteger(minutes) ? `${minutes}m` : `${minutes.toFixed(1)}m`;
}

/**
 * Accepts either plain minutes ("2", "1.5") or a clock-style duration
 * ("2:30", "1:05:00"). Returns null when the input isn't a usable duration.
 */
function parseDurationInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    if (parts.length > 3) return null;
    const numbers = parts.map((part) => Number(part.replace(/[^0-9]/g, '')));
    if (numbers.some((n) => Number.isNaN(n))) return null;
    const seconds = numbers.reduce((total, n) => total * 60 + n, 0);
    return seconds > 0 ? seconds : null;
  }

  const minutes = Number(trimmed.replace(/[^0-9.]/g, ''));
  if (!minutes || Number.isNaN(minutes)) return null;
  return Math.round(minutes * 60);
}

function ProgressRing({
  progress,
  color,
  trackColor,
  children,
}: {
  progress: number;
  color: string;
  trackColor: string;
  children: React.ReactNode;
}) {
  const clamped = Math.min(1, Math.max(0, progress));
  const center = RING_SIZE / 2;
  return (
    <View style={styles.dial}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
        <Circle
          cx={center}
          cy={center}
          r={RING_RADIUS}
          stroke={trackColor}
          strokeWidth={RING_STROKE}
          fill="none"
        />
        {clamped > 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={RING_RADIUS}
            stroke={color}
            strokeWidth={RING_STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - clamped)}
            // Start the sweep at 12 o'clock rather than 3 o'clock.
            transform={`rotate(-90 ${center} ${center})`}
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}

export default function TimerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('timer');

  const alarm = useAudioPlayer(require('../assets/sounds/alarm.wav'));

  // Timer (countdown)
  const [presetSeconds, setPresetSeconds] = useState(60);
  const [customInput, setCustomInput] = useState('');
  const [remainingMs, setRemainingMs] = useState(60 * 1000);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerEndRef = useRef<number | null>(null);

  // Stopwatch (count up)
  const [stopwatchMs, setStopwatchMs] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const stopwatchStartRef = useRef<number | null>(null);
  const stopwatchBaseRef = useRef(0);

  const completeTimer = useCallback(() => {
    setRemainingMs(0);
    setTimerRunning(false);
    timerEndRef.current = null;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    alarm.seekTo(0);
    alarm.play();
  }, [alarm]);

  const syncTimer = useCallback(() => {
    if (timerEndRef.current == null) return;
    const msLeft = timerEndRef.current - Date.now();
    if (msLeft <= 0) {
      completeTimer();
      return;
    }
    setRemainingMs(msLeft);
  }, [completeTimer]);

  const syncStopwatch = useCallback(() => {
    if (stopwatchStartRef.current == null) return;
    setStopwatchMs(
      stopwatchBaseRef.current + (Date.now() - stopwatchStartRef.current),
    );
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(syncTimer, TICK_MS);
    return () => clearInterval(interval);
  }, [timerRunning, syncTimer]);

  useEffect(() => {
    if (!stopwatchRunning) return;
    const interval = setInterval(syncStopwatch, TICK_MS);
    return () => clearInterval(interval);
  }, [stopwatchRunning, syncStopwatch]);

  // Intervals are throttled or suspended while the app is backgrounded, so
  // recompute from the stored timestamps the moment we come back.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      syncTimer();
      syncStopwatch();
    });
    return () => subscription.remove();
  }, [syncTimer, syncStopwatch]);

  const isRunning = timerRunning || stopwatchRunning;
  useEffect(() => {
    if (!isRunning) return;
    // Both reject rather than throw when the platform doesn't support wake
    // locks, or when the tag was never activated — nothing to recover from.
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [isRunning]);

  const selectPreset = (seconds: number) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setPresetSeconds(seconds);
    setCustomInput('');
    setRemainingMs(seconds * 1000);
    setTimerRunning(false);
    timerEndRef.current = null;
  };

  const applyCustom = () => {
    const seconds = parseDurationInput(customInput);
    if (seconds == null) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
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
    setLaps([]);
  };

  const recordLap = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLaps((previous) => [...previous, stopwatchMs]);
  };

  const timerProgress =
    presetSeconds > 0 ? 1 - remainingMs / (presetSeconds * 1000) : 0;

  // Laps hold cumulative totals; splits are the gaps between them.
  const splits = laps.map((total, index) =>
    index === 0 ? total : total - laps[index - 1],
  );
  const fastestSplit = splits.length > 1 ? Math.min(...splits) : null;
  const slowestSplit = splits.length > 1 ? Math.max(...splits) : null;

  // Progress within the current minute — gives the stopwatch ring something
  // meaningful to sweep, since a count-up clock has no natural endpoint.
  const stopwatchProgress = (stopwatchMs % 60000) / 60000;

  const customIsActive =
    customInput.trim().length > 0 &&
    parseDurationInput(customInput) === presetSeconds;

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
              <ProgressRing
                progress={timerProgress}
                color={colors.primary}
                trackColor={colors.secondary}
              >
                <Text
                  style={[styles.dialText, { color: colors.foreground }]}
                  testID="timer-readout"
                >
                  {formatClock(remainingMs)}
                </Text>
              </ProgressRing>
            </View>

            <View style={styles.presetRow}>
              {PRESETS_SECONDS.map((seconds) => {
                const selected = presetSeconds === seconds && !customIsActive;
                return (
                  <Pressable
                    key={seconds}
                    onPress={() => selectPreset(seconds)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: selected ? colors.primary : colors.card,
                        borderRadius: colors.radius,
                      },
                    ]}
                    testID={`preset-${seconds}`}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        {
                          color: selected
                            ? colors.primaryForeground
                            : colors.foreground,
                        },
                      ]}
                    >
                      {formatPreset(seconds)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.customRow, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
              <TextInput
                value={customInput}
                onChangeText={setCustomInput}
                placeholder="Custom — minutes or m:ss"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numbers-and-punctuation"
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
              <ProgressRing
                progress={stopwatchProgress}
                color={colors.primary}
                trackColor={colors.secondary}
              >
                <Text
                  style={[styles.dialText, { color: colors.foreground }]}
                  testID="stopwatch-readout"
                >
                  {formatClockPrecise(stopwatchMs)}
                </Text>
              </ProgressRing>
            </View>

            <View style={styles.lapList}>
              {laps.length === 0 ? (
                <Text style={[styles.lapEmpty, { color: colors.mutedForeground }]}>
                  Tap the flag to record a lap
                </Text>
              ) : (
                <ScrollView
                  style={styles.lapScroll}
                  contentContainerStyle={styles.lapScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {laps
                    .map((total, index) => ({ total, split: splits[index], index }))
                    .reverse()
                    .map(({ total, split, index }) => {
                      const isFastest =
                        fastestSplit != null && split === fastestSplit;
                      const isSlowest =
                        slowestSplit != null &&
                        split === slowestSplit &&
                        !isFastest;
                      const splitColor = isFastest
                        ? colors.primary
                        : isSlowest
                          ? colors.destructive
                          : colors.foreground;
                      return (
                        <View
                          key={index}
                          style={[styles.lapRow, { borderBottomColor: colors.border }]}
                          testID={`lap-${index + 1}`}
                        >
                          <Text
                            style={[styles.lapLabel, { color: colors.mutedForeground }]}
                          >
                            Lap {index + 1}
                          </Text>
                          <Text style={[styles.lapSplit, { color: splitColor }]}>
                            {formatClockPrecise(split)}
                          </Text>
                          <Text
                            style={[styles.lapTotal, { color: colors.mutedForeground }]}
                          >
                            {formatClockPrecise(total)}
                          </Text>
                        </View>
                      );
                    })}
                </ScrollView>
              )}
            </View>

            <View style={styles.controlsRow}>
              <Pressable
                onPress={stopwatchRunning ? recordLap : resetStopwatch}
                style={[styles.secondaryButton, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}
                testID={stopwatchRunning ? 'stopwatch-lap' : 'stopwatch-reset'}
              >
                <Feather
                  name={stopwatchRunning ? 'flag' : 'rotate-ccw'}
                  size={20}
                  color={colors.foreground}
                />
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
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialText: {
    fontSize: 40,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetChip: {
    flexGrow: 1,
    flexBasis: '30%',
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
  lapList: {
    flex: 1,
  },
  lapEmpty: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginTop: 8,
  },
  lapScroll: {
    flex: 1,
  },
  lapScrollContent: {
    paddingBottom: 8,
  },
  lapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lapLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  lapSplit: {
    flex: 1,
    textAlign: 'right',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
  },
  lapTotal: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    fontVariant: ['tabular-nums'],
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

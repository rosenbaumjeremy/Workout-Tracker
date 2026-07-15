import { totalDistance, totalSets, totalVolume, type Workout } from './workoutMath';

/**
 * "Volt Log" gamification layer: XP, levels, and achievement badges computed
 * purely from workout history. Nothing here touches storage — it's derived
 * data, recomputed whenever the workout list changes.
 */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface AchievementContext {
  totalWorkouts: number;
  totalSets: number;
  lifetimeVolume: number;
  lifetimeDistance: number;
  currentStreakDays: number;
  hasIntervalWorkout: boolean;
}

interface AchievementDef extends Achievement {
  check: (ctx: AchievementContext) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-workout',
    title: 'First Rep',
    description: 'Log your first workout',
    icon: 'flag',
    check: (ctx) => ctx.totalWorkouts >= 1,
  },
  {
    id: 'five-workouts',
    title: 'On a Roll',
    description: 'Complete 5 workouts',
    icon: 'check-circle',
    check: (ctx) => ctx.totalWorkouts >= 5,
  },
  {
    id: 'twentyfive-workouts',
    title: 'Iron Habit',
    description: 'Complete 25 workouts',
    icon: 'award',
    check: (ctx) => ctx.totalWorkouts >= 25,
  },
  {
    id: 'hundred-workouts',
    title: 'Centurion',
    description: 'Complete 100 workouts',
    icon: 'shield',
    check: (ctx) => ctx.totalWorkouts >= 100,
  },
  {
    id: 'streak-3',
    title: 'Warming Up',
    description: 'Hit a 3-day streak',
    icon: 'zap',
    check: (ctx) => ctx.currentStreakDays >= 3,
  },
  {
    id: 'streak-7',
    title: 'On Fire',
    description: 'Hit a 7-day streak',
    icon: 'trending-up',
    check: (ctx) => ctx.currentStreakDays >= 7,
  },
  {
    id: 'streak-30',
    title: 'Unstoppable',
    description: 'Hit a 30-day streak',
    icon: 'star',
    check: (ctx) => ctx.currentStreakDays >= 30,
  },
  {
    id: 'volume-1000',
    title: 'Heavy Lifter',
    description: 'Lift 1,000 lb lifetime',
    icon: 'trending-up',
    check: (ctx) => ctx.lifetimeVolume >= 1000,
  },
  {
    id: 'volume-10000',
    title: 'Iron Titan',
    description: 'Lift 10,000 lb lifetime',
    icon: 'bar-chart-2',
    check: (ctx) => ctx.lifetimeVolume >= 10000,
  },
  {
    id: 'volume-100000',
    title: 'Legend Status',
    description: 'Lift 100,000 lb lifetime',
    icon: 'award',
    check: (ctx) => ctx.lifetimeVolume >= 100000,
  },
  {
    id: 'distance-1',
    title: 'First Mile',
    description: 'Run 1 mile lifetime',
    icon: 'wind',
    check: (ctx) => ctx.lifetimeDistance >= 1,
  },
  {
    id: 'distance-10',
    title: 'Road Warrior',
    description: 'Run 10 miles lifetime',
    icon: 'map',
    check: (ctx) => ctx.lifetimeDistance >= 10,
  },
  {
    id: 'distance-26',
    title: 'Marathoner',
    description: 'Run 26.2 miles lifetime',
    icon: 'flag',
    check: (ctx) => ctx.lifetimeDistance >= 26.2,
  },
  {
    id: 'sets-100',
    title: 'Set Machine',
    description: 'Log 100 sets lifetime',
    icon: 'layers',
    check: (ctx) => ctx.totalSets >= 100,
  },
  {
    id: 'interval-first',
    title: 'Speed Demon',
    description: 'Complete an interval run',
    icon: 'repeat',
    check: (ctx) => ctx.hasIntervalWorkout,
  },
];

function xpForWorkout(workout: Workout): number {
  const sets = totalSets(workout);
  const volume = totalVolume(workout);
  const distance = totalDistance(workout);
  return Math.round(25 + sets * 8 + volume / 40 + distance * 60);
}

export function computeLevel(totalXp: number): {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  levelProgress: number;
} {
  let level = 1;
  let xpRemaining = totalXp;
  let xpNeeded = 150;
  while (xpRemaining >= xpNeeded) {
    xpRemaining -= xpNeeded;
    level += 1;
    xpNeeded = 150 + (level - 1) * 75;
  }
  return {
    level,
    xpIntoLevel: xpRemaining,
    xpForNextLevel: xpNeeded,
    levelProgress: xpRemaining / xpNeeded,
  };
}

export interface GamificationStats {
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  levelProgress: number;
  unlockedAchievementIds: string[];
}

export function computeGamification(
  workouts: Workout[],
  currentStreakDays: number,
): GamificationStats {
  const totalXp = workouts.reduce((sum, w) => sum + xpForWorkout(w), 0);
  const { level, xpIntoLevel, xpForNextLevel, levelProgress } =
    computeLevel(totalXp);

  const ctx: AchievementContext = {
    totalWorkouts: workouts.length,
    totalSets: workouts.reduce((sum, w) => sum + totalSets(w), 0),
    lifetimeVolume: workouts.reduce((sum, w) => sum + totalVolume(w), 0),
    lifetimeDistance: workouts.reduce((sum, w) => sum + totalDistance(w), 0),
    currentStreakDays,
    hasIntervalWorkout: workouts.some((w) =>
      w.exercises.some((ex) => ex.runType === 'Interval'),
    ),
  };

  const unlockedAchievementIds = ACHIEVEMENTS.filter((a) => a.check(ctx)).map(
    (a) => a.id,
  );

  return {
    totalXp,
    level,
    xpIntoLevel,
    xpForNextLevel,
    levelProgress,
    unlockedAchievementIds,
  };
}

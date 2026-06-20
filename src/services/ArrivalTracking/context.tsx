import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { STORAGE_KEYS } from '@/constants/storageKeys';

// ─── 型定義 ────────────────────────────────────────────────────
export type ActiveMission = {
  targetName: string;
  latitude: number;
  longitude: number;
  deadlineHour: number;
  point: number;
  startedAt: string;
};

export type HistoryEntry = {
  id: string;
  targetName: string;
  result: 'success' | 'fail';
  earnedPoints: number;
  streak: number;
  completedAt: string;
};

export type FavoriteLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type MissionResult = {
  type: 'success' | 'fail';
  targetName: string;
  earnedPoints: number;
  bonusMultiplier: number;
  newStreak: number;
};

type ArrivalTrackingContextValue = {
  activeMission: ActiveMission | null;
  streakCount: number;
  lastResult: MissionResult | null;
  favorites: FavoriteLocation[];
  clearLastResult: () => void;
  startMission: (params: Omit<ActiveMission, 'startedAt'>) => Promise<void>;
  completeMission: () => Promise<void>;
  cancelMission: () => Promise<void>;
  addFavorite: (loc: Omit<FavoriteLocation, 'id'>) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
};

// ─── ユーティリティ ────────────────────────────────────────────
const toDateString = (d: Date) => d.toISOString().slice(0, 10);
const MILESTONE_DAYS = [3, 7, 30];

async function saveToHistory(entry: HistoryEntry) {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.MISSION_HISTORY);
  const history: HistoryEntry[] = raw ? JSON.parse(raw) : [];
  history.unshift(entry);
  if (history.length > 100) history.length = 100;
  await AsyncStorage.setItem(STORAGE_KEYS.MISSION_HISTORY, JSON.stringify(history));
}

async function scheduleDeadlineNotifications(mission: ActiveMission): Promise<string[]> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return [];

    const now = new Date();
    const deadline = new Date(now);
    deadline.setHours(mission.deadlineHour, 0, 0, 0);
    const secsToDeadline = (deadline.getTime() - now.getTime()) / 1000;

    const ids: string[] = [];

    if (secsToDeadline > 30 * 60) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ 締め切りまで30分！',
          body: `${mission.targetName} への移動を急ごう！`,
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secsToDeadline - 30 * 60, repeats: false },
      });
      ids.push(id);
    }

    if (secsToDeadline > 10 * 60) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 締め切りまで10分！',
          body: `${mission.targetName} にもうすぐ到着できる？`,
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secsToDeadline - 10 * 60, repeats: false },
      });
      ids.push(id);
    }

    return ids;
  } catch {
    return [];
  }
}

async function cancelNotifications(ids: string[]) {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

// ─── Context ──────────────────────────────────────────────────
const ArrivalTrackingContext = createContext<ArrivalTrackingContextValue | null>(null);

export const ArrivalTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMission, setActiveMission] = useState<ActiveMission | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [lastResult, setLastResult] = useState<MissionResult | null>(null);
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);

  // stale closure 回避用 ref
  const activeMissionRef = useRef<ActiveMission | null>(null);
  const notifIdsRef = useRef<string[]>([]);

  useEffect(() => { activeMissionRef.current = activeMission; }, [activeMission]);

  // ─── 起動時リストア ───────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [missionRaw, streak, favsRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_MISSION),
        AsyncStorage.getItem(STORAGE_KEYS.STREAK_COUNT),
        AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
      ]);
      const mission: ActiveMission | null = missionRaw ? JSON.parse(missionRaw) : null;
      if (mission) {
        // 起動時に期限切れチェック
        if (new Date().getHours() >= mission.deadlineHour) {
          await doFailMission(mission, parseInt(streak ?? '0', 10));
        } else {
          setActiveMission(mission);
        }
      }
      if (streak) setStreakCount(parseInt(streak, 10));
      if (favsRaw) setFavorites(JSON.parse(favsRaw));
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── 期限切れ定期チェック（60秒ごと） ────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      const mission = activeMissionRef.current;
      if (!mission) return;
      if (new Date().getHours() >= mission.deadlineHour) {
        const streakRaw = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_COUNT);
        await doFailMission(mission, parseInt(streakRaw ?? '0', 10));
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // ─── 失敗処理（内部ヘルパー） ─────────────────────────────
  const doFailMission = useCallback(async (mission: ActiveMission, currentStreak: number) => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_MISSION),
      cancelNotifications(notifIdsRef.current),
      saveToHistory({
        id: Date.now().toString(),
        targetName: mission.targetName,
        result: 'fail',
        earnedPoints: 0,
        streak: currentStreak,
        completedAt: new Date().toISOString(),
      }),
    ]);
    notifIdsRef.current = [];
    setActiveMission(null);
    setLastResult({ type: 'fail', targetName: mission.targetName, earnedPoints: 0, bonusMultiplier: 1, newStreak: currentStreak });
  }, []);

  // ─── ミッション開始 ──────────────────────────────────────
  const startMission = useCallback(async (params: Omit<ActiveMission, 'startedAt'>) => {
    const mission: ActiveMission = { ...params, startedAt: new Date().toISOString() };
    await cancelNotifications(notifIdsRef.current);
    const ids = await scheduleDeadlineNotifications(mission);
    notifIdsRef.current = ids;
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_MISSION, JSON.stringify(mission));
    setActiveMission(mission);
  }, []);

  // ─── ミッション成功 ──────────────────────────────────────
  const completeMission = useCallback(async () => {
    const mission = activeMissionRef.current;
    if (!mission) return;

    const today = toDateString(new Date());
    const yesterday = toDateString(new Date(Date.now() - 86_400_000));

    const [lastDateRaw, currentStreakRaw, currentPtsRaw, currentCountRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.STREAK_LAST_DATE),
      AsyncStorage.getItem(STORAGE_KEYS.STREAK_COUNT),
      AsyncStorage.getItem(STORAGE_KEYS.POINTS),
      AsyncStorage.getItem(STORAGE_KEYS.MISSIONS_COUNT),
    ]);

    const lastDate = lastDateRaw ?? '';
    const currentStreak = parseInt(currentStreakRaw ?? '0', 10);
    const currentPts = parseInt(currentPtsRaw ?? '0', 10);
    const currentCount = parseInt(currentCountRaw ?? '0', 10);

    let newStreak: number;
    if (lastDate === today) newStreak = currentStreak;
    else if (lastDate === yesterday) newStreak = currentStreak + 1;
    else newStreak = 1;

    const bonusMultiplier = MILESTONE_DAYS.includes(newStreak) ? 2 : 1;
    const earnedPoints = mission.point * bonusMultiplier;

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.POINTS, String(currentPts + earnedPoints)),
      AsyncStorage.setItem(STORAGE_KEYS.MISSIONS_COUNT, String(currentCount + 1)),
      AsyncStorage.setItem(STORAGE_KEYS.STREAK_COUNT, String(newStreak)),
      AsyncStorage.setItem(STORAGE_KEYS.STREAK_LAST_DATE, today),
      AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_MISSION),
      cancelNotifications(notifIdsRef.current),
      saveToHistory({
        id: Date.now().toString(),
        targetName: mission.targetName,
        result: 'success',
        earnedPoints,
        streak: newStreak,
        completedAt: new Date().toISOString(),
      }),
    ]);

    notifIdsRef.current = [];
    setActiveMission(null);
    setStreakCount(newStreak);
    setLastResult({ type: 'success', targetName: mission.targetName, earnedPoints, bonusMultiplier, newStreak });
  }, []);

  // ─── ミッションキャンセル ─────────────────────────────────
  const cancelMission = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_MISSION),
      cancelNotifications(notifIdsRef.current),
    ]);
    notifIdsRef.current = [];
    setActiveMission(null);
  }, []);

  // ─── お気に入り管理 ──────────────────────────────────────
  const addFavorite = useCallback(async (loc: Omit<FavoriteLocation, 'id'>) => {
    const next: FavoriteLocation[] = [...favorites, { ...loc, id: Date.now().toString() }];
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(next));
    setFavorites(next);
  }, [favorites]);

  const removeFavorite = useCallback(async (id: string) => {
    const next = favorites.filter((f) => f.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(next));
    setFavorites(next);
  }, [favorites]);

  const clearLastResult = useCallback(() => setLastResult(null), []);

  return (
    <ArrivalTrackingContext.Provider
      value={{ activeMission, streakCount, lastResult, favorites, clearLastResult, startMission, completeMission, cancelMission, addFavorite, removeFavorite }}
    >
      {children}
    </ArrivalTrackingContext.Provider>
  );
};

export const useArrivalTracking = () => {
  const ctx = useContext(ArrivalTrackingContext);
  if (!ctx) throw new Error('useArrivalTracking must be used within ArrivalTrackingProvider');
  return ctx;
};

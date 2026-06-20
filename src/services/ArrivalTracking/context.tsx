import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { STORAGE_KEYS } from '@/constants/storageKeys';

export type ActiveMission = {
  targetName: string;
  latitude: number;
  longitude: number;
  deadlineHour: number;
  point: number;
  startedAt: string;
};

type ArrivalTrackingContextValue = {
  activeMission: ActiveMission | null;
  streakCount: number;
  startMission: (params: Omit<ActiveMission, 'startedAt'>) => Promise<void>;
  completeMission: () => Promise<void>;
  cancelMission: () => Promise<void>;
};

const ArrivalTrackingContext = createContext<ArrivalTrackingContextValue | null>(null);

const toDateString = (d: Date) => d.toISOString().slice(0, 10);

export const ArrivalTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMission, setActiveMission] = useState<ActiveMission | null>(null);
  const [streakCount, setStreakCount] = useState(0);

  useEffect(() => {
    const restore = async () => {
      const [missionRaw, streak] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_MISSION),
        AsyncStorage.getItem(STORAGE_KEYS.STREAK_COUNT),
      ]);
      if (missionRaw) setActiveMission(JSON.parse(missionRaw));
      if (streak) setStreakCount(parseInt(streak, 10));
    };
    restore();
  }, []);

  const startMission = useCallback(async (params: Omit<ActiveMission, 'startedAt'>) => {
    const mission: ActiveMission = { ...params, startedAt: new Date().toISOString() };
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_MISSION, JSON.stringify(mission));
    setActiveMission(mission);
  }, []);

  const completeMission = useCallback(async () => {
    if (!activeMission) return;

    const today = toDateString(new Date());
    const yesterday = toDateString(new Date(Date.now() - 86400000));

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

    // 同日はそのまま、昨日から続いていれば+1、それ以外はリセット
    let newStreak: number;
    if (lastDate === today) {
      newStreak = currentStreak;
    } else if (lastDate === yesterday) {
      newStreak = currentStreak + 1;
    } else {
      newStreak = 1;
    }

    // 3・7・30日マイルストーンで2倍ボーナス
    const MILESTONE_DAYS = [3, 7, 30];
    const bonusMultiplier = MILESTONE_DAYS.includes(newStreak) ? 2 : 1;
    const earnedPoints = activeMission.point * bonusMultiplier;

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.POINTS, String(currentPts + earnedPoints)),
      AsyncStorage.setItem(STORAGE_KEYS.MISSIONS_COUNT, String(currentCount + 1)),
      AsyncStorage.setItem(STORAGE_KEYS.STREAK_COUNT, String(newStreak)),
      AsyncStorage.setItem(STORAGE_KEYS.STREAK_LAST_DATE, today),
      AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_MISSION),
    ]);

    setActiveMission(null);
    setStreakCount(newStreak);

    const bonusMessage = bonusMultiplier > 1
      ? `🎉 ${newStreak}日連続達成ボーナス！ ×2 = +${earnedPoints} pt`
      : `+${earnedPoints} ポイント獲得！`;
    const streakMessage = newStreak > 1 ? `\n🔥 ${newStreak}日連続達成中！` : '';

    Alert.alert(
      '🎉 ミッション達成！',
      `${activeMission.targetName} に時間内に到着しました！\n${bonusMessage}${streakMessage}`,
    );
  }, [activeMission]);

  const cancelMission = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_MISSION);
    setActiveMission(null);
  }, []);

  return (
    <ArrivalTrackingContext.Provider value={{ activeMission, streakCount, startMission, completeMission, cancelMission }}>
      {children}
    </ArrivalTrackingContext.Provider>
  );
};

export const useArrivalTracking = () => {
  const ctx = useContext(ArrivalTrackingContext);
  if (!ctx) throw new Error('useArrivalTracking must be used within ArrivalTrackingProvider');
  return ctx;
};

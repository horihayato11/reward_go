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
  startMission: (params: Omit<ActiveMission, 'startedAt'>) => Promise<void>;
  completeMission: () => Promise<void>;
  cancelMission: () => Promise<void>;
};

const ArrivalTrackingContext = createContext<ArrivalTrackingContextValue | null>(null);

export const ArrivalTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMission, setActiveMission] = useState<ActiveMission | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_MISSION);
        if (raw) setActiveMission(JSON.parse(raw));
      } catch {
        // 破損データはクリアして復旧
        await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_MISSION).catch(() => {});
      }
    })();
  }, []);

  const startMission = useCallback(async (params: Omit<ActiveMission, 'startedAt'>) => {
    const mission: ActiveMission = { ...params, startedAt: new Date().toISOString() };
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_MISSION, JSON.stringify(mission));
    setActiveMission(mission);
  }, []);

  const completeMission = useCallback(async () => {
    if (!activeMission) return;

    const currentPts = parseInt(await AsyncStorage.getItem(STORAGE_KEYS.POINTS) ?? '0', 10);
    await AsyncStorage.setItem(STORAGE_KEYS.POINTS, String(currentPts + activeMission.point));

    const currentCount = parseInt(await AsyncStorage.getItem(STORAGE_KEYS.MISSIONS_COUNT) ?? '0', 10);
    await AsyncStorage.setItem(STORAGE_KEYS.MISSIONS_COUNT, String(currentCount + 1));

    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_MISSION);
    setActiveMission(null);

    Alert.alert(
      '🎉 ミッション達成！',
      `${activeMission.targetName} に時間内に到着しました！\n+${activeMission.point} ポイント獲得！`,
    );
  }, [activeMission]);

  const cancelMission = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_MISSION);
    setActiveMission(null);
  }, []);

  return (
    <ArrivalTrackingContext.Provider value={{ activeMission, startMission, completeMission, cancelMission }}>
      {children}
    </ArrivalTrackingContext.Provider>
  );
};

export const useArrivalTracking = () => {
  const ctx = useContext(ArrivalTrackingContext);
  if (!ctx) throw new Error('useArrivalTracking must be used within ArrivalTrackingProvider');
  return ctx;
};

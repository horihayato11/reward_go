import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'rewardgo:mission';

type Mission = {
  name: string;
  latitude: number;
  longitude: number;
  deadline: string; // HH:MM (簡易)
};

export function useMission() {
  const [mission, setMissionState] = useState<Mission | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setMissionState(JSON.parse(raw));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const save = async (m: Mission) => {
    setMissionState(m);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(m));
    } catch (e) {
      // ignore
    }
  };

  const clear = async () => {
    setMissionState(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  function toRad(n: number) { return n * Math.PI / 180; }
  function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000; // m
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  const distanceToMission = (pos: { latitude: number; longitude: number }) => {
    if (!mission) return Infinity;
    return haversine(pos.latitude, pos.longitude, mission.latitude, mission.longitude);
  };

  const checkArrival = (pos: { latitude: number; longitude: number }) => {
    if (!mission) return false;
    const d = distanceToMission(pos);
    if (d <= 100) {
      // 簡易: 到着
      // ここでポイント付与などの処理を行う（将来的に拡張）
      return true;
    }
    return false;
  };

  return {
    mission,
    setMission: save,
    clearMission: clear,
    distanceToMission,
    checkArrival,
  } as const;
}

import { useArrivalTracking } from '@/services/ArrivalTracking/context';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, ChevronUp, Clock, MapPin, Navigation } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { LocationObject, LocationSubscription } from 'expo-location';

const BASE_POINT = 30;

export default function HomeScreen() {
  const { activeMission, startMission, completeMission, cancelMission } = useArrivalTracking();

  const [targetName, setTargetName] = useState('');
  const [deadlineHour, setDeadlineHour] = useState('18');
  const [isLoading, setIsLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [targetCoords, setTargetCoords] = useState({
    latitude: 35.0222,
    longitude: 135.9637,
  });

  const locationSub = useRef<LocationSubscription | null>(null);

  // 位置情報の監視開始（メモリリーク修正：クリーンアップで確実に停止）
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('エラー', '位置情報の許可が必要です');
        return;
      }
      if (cancelled) return;

      locationSub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => {
          setLocation(loc);
          // アクティブなミッションがある場合は到着判定
          checkArrival(loc);
        },
      );
    })();

    return () => {
      cancelled = true;
      locationSub.current?.remove();
      locationSub.current = null;
    };
  }, [activeMission]);

  // activeMission が変化するたびに最新の値で判定できるよう ref でも保持
  const activeMissionRef = useRef(activeMission);
  useEffect(() => {
    activeMissionRef.current = activeMission;
  }, [activeMission]);

  const checkArrival = useCallback((loc: LocationObject) => {
    const mission = activeMissionRef.current;
    if (!mission) return;

    const R = 6371000;
    const dLat = ((mission.latitude - loc.coords.latitude) * Math.PI) / 180;
    const dLon = ((mission.longitude - loc.coords.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((loc.coords.latitude * Math.PI) / 180) *
        Math.cos((mission.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const now = new Date();
    const isInTime = now.getHours() < mission.deadlineHour;

    if (distance <= 100 && isInTime) {
      completeMission();
    }
  }, [completeMission]);

  // フォーカス時にアクティブミッションを反映
  useFocusEffect(
    useCallback(() => {
      if (activeMission) {
        setTargetName(activeMission.targetName);
        setDeadlineHour(String(activeMission.deadlineHour));
        setTargetCoords({ latitude: activeMission.latitude, longitude: activeMission.longitude });
        setIsFormVisible(false);
      }
    }, [activeMission])
  );

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setTargetCoords({ latitude, longitude });

    setIsLoading(true);
    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode.length > 0) {
        const place = geocode[0];
        const newName =
          place.name ||
          `${place.region ?? ''}${place.city ?? ''}${place.street ?? ''}` ||
          '選択した場所';
        setTargetName(newName);
        if (!isFormVisible) setIsFormVisible(true);
      }
    } catch {
      // 逆ジオコーディング失敗は無視
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    const hour = parseInt(deadlineHour, 10);
    if (!targetName || isNaN(hour) || hour < 0 || hour > 23) {
      Alert.alert('エラー', '目的地と有効な締め切り時間（0〜23時）を入力してください');
      return;
    }

    await startMission({
      targetName,
      latitude: targetCoords.latitude,
      longitude: targetCoords.longitude,
      deadlineHour: hour,
      point: BASE_POINT,
    });
    setIsFormVisible(false);
    Alert.alert('ミッション開始！', `${targetName} への移動を開始しました。\n締め切り: ${hour}:00`);
  };

  const handleCancel = () => {
    Alert.alert('ミッションを中止しますか？', 'ポイントは加算されません。', [
      { text: 'やめない', style: 'cancel' },
      { text: '中止する', style: 'destructive', onPress: cancelMission },
    ]);
  };

  const isMissionActive = !!activeMission;

  return (
    <LinearGradient
      colors={['#FFF8E1', '#fdd961']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* アクティブミッションバナー */}
      {isMissionActive && (
        <View style={styles.missionBanner}>
          <View style={styles.missionBannerLeft}>
            <Navigation size={16} color="#FF8A80" />
            <Text style={styles.missionBannerText} numberOfLines={1}>
              {activeMission.targetName} まで移動中
            </Text>
          </View>
          <TouchableOpacity onPress={handleCancel} style={styles.missionCancelBtn}>
            <Text style={styles.missionCancelText}>中止</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 地図エリア */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          onPress={handleMapPress}
          region={{
            latitude: targetCoords.latitude,
            longitude: targetCoords.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
        >
          {location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="あなた"
              pinColor="blue"
            />
          )}

          <Marker coordinate={targetCoords} title={targetName || '目的地'} />

          <Circle
            center={targetCoords}
            radius={100}
            strokeColor="rgba(255, 107, 107, 0.5)"
            fillColor="rgba(255, 107, 107, 0.2)"
          />
        </MapView>

        {isFormVisible && !isMissionActive && (
          <View style={styles.mapHintBadge}>
            <Text style={styles.mapHintText}>👆 地図をタップして目的地を選択</Text>
          </View>
        )}
      </View>

      {/* 開閉トグル */}
      {!isMissionActive && (
        <TouchableOpacity
          style={styles.toggleBar}
          activeOpacity={0.7}
          onPress={() => setIsFormVisible(!isFormVisible)}
        >
          <Text style={styles.toggleText}>
            {isFormVisible ? '入力を隠して地図を広げる' : '目的地を入力する'}
          </Text>
          {isFormVisible ? (
            <ChevronDown color="#666" size={24} />
          ) : (
            <ChevronUp color="#666" size={24} />
          )}
        </TouchableOpacity>
      )}

      {/* フォームエリア */}
      {isFormVisible && !isMissionActive && (
        <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>📍 目的地の名前</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FF8A80" style={{ marginRight: 10 }} />
              ) : (
                <MapPin color="#666" size={20} style={{ marginRight: 10 }} />
              )}
              <TextInput
                style={styles.inputFlex}
                value={targetName}
                onChangeText={setTargetName}
                placeholder="地図をタップして選択"
              />
            </View>
          </View>

          <Text style={styles.label}>⏰ 締め切り時間（0〜23時）</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <Clock color="#666" size={20} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.inputFlex}
                value={deadlineHour}
                onChangeText={setDeadlineHour}
                keyboardType="numeric"
                placeholder="例: 9"
                maxLength={2}
              />
            </View>
          </View>

          <Text style={styles.pointHint}>達成で {BASE_POINT} pt 獲得（連続達成でボーナスあり！）</Text>

          <TouchableOpacity style={styles.saveButton} onPress={handleStart}>
            <Text style={styles.saveButtonText}>このミッションで決定！</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  missionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  missionBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  missionBannerText: { fontSize: 14, fontWeight: '600', color: '#333', flex: 1 },
  missionCancelBtn: {
    backgroundColor: '#FFE0E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  missionCancelText: { fontSize: 13, fontWeight: '700', color: '#D32F2F' },

  mapContainer: { flex: 1, width: '100%', position: 'relative' },
  map: { width: '100%', height: '100%' },
  mapHintBadge: {
    position: 'absolute',
    top: 15,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
  },
  mapHintText: { fontWeight: 'bold', color: '#4A4A4A', fontSize: 12 },

  toggleBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E8E4D0',
  },
  toggleText: { fontSize: 14, fontWeight: 'bold', color: '#666', marginRight: 8 },

  formContainer: { flex: 0.8, padding: 24 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, marginTop: 10, color: '#555' },
  inputContainer: { marginBottom: 15 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputFlex: { flex: 1, paddingVertical: 14, fontSize: 16 },
  pointHint: { fontSize: 13, color: '#FF8A00', fontWeight: '600', marginBottom: 4, textAlign: 'center' },
  saveButton: {
    backgroundColor: '#FF8A80',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    elevation: 3,
  },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});

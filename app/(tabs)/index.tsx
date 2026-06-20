import { useArrivalTracking, type FavoriteLocation } from '@/services/ArrivalTracking/context';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, ChevronUp, Clock, MapPin, Navigation, Star, X } from 'lucide-react-native';
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
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { LocationObject, LocationSubscription } from 'expo-location';

const BASE_POINT = 30;

// ─── 祝福オーバーレイ ─────────────────────────────────────────
function CelebrationOverlay({
  result,
  onDismiss,
}: {
  result: NonNullable<ReturnType<typeof useArrivalTracking>['lastResult']>;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const isSuccess = result.type === 'success';

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)} style={styles.overlayBg}>
      <Animated.View entering={ZoomIn.springify().damping(14)} exiting={ZoomOut.duration(200)} style={styles.overlayCard}>
        <Text style={styles.overlayEmoji}>{isSuccess ? '🎉' : '😢'}</Text>
        <Text style={styles.overlayTitle}>{isSuccess ? 'ミッション達成！' : 'ミッション失敗...'}</Text>
        <Text style={styles.overlayTarget}>{result.targetName}</Text>

        {isSuccess && (
          <>
            <Text style={styles.overlayPoints}>+{result.earnedPoints} pt</Text>
            {result.bonusMultiplier > 1 && (
              <View style={styles.bonusBadge}>
                <Text style={styles.bonusBadgeText}>🔥 {result.newStreak}日連続ボーナス ×{result.bonusMultiplier}</Text>
              </View>
            )}
            {result.newStreak > 1 && result.bonusMultiplier === 1 && (
              <Text style={styles.streakText}>🔥 {result.newStreak}日連続達成中！</Text>
            )}
          </>
        )}
        {!isSuccess && (
          <Text style={styles.overlayFailSub}>次はきっと間に合う！</Text>
        )}

        <TouchableOpacity style={styles.overlayDismiss} onPress={onDismiss}>
          <Text style={styles.overlayDismissText}>タップして閉じる</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ─── メイン画面 ───────────────────────────────────────────────
export default function HomeScreen() {
  const { activeMission, lastResult, favorites, clearLastResult, startMission, completeMission, cancelMission, addFavorite, removeFavorite } = useArrivalTracking();

  // スケジュール画面からのパラメータ受け取り
  const { missionName, missionHour } = useLocalSearchParams<{ missionName?: string; missionHour?: string }>();

  const [targetName, setTargetName] = useState('');
  const [deadlineHour, setDeadlineHour] = useState('18');
  const [isLoading, setIsLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [targetCoords, setTargetCoords] = useState({ latitude: 35.0222, longitude: 135.9637 });

  const mapRef = useRef<MapView>(null);
  const locationSub = useRef<LocationSubscription | null>(null);
  const activeMissionRef = useRef(activeMission);

  useEffect(() => { activeMissionRef.current = activeMission; }, [activeMission]);

  // スケジュール画面からのミッション情報を反映
  useEffect(() => {
    if (missionName) {
      setTargetName(decodeURIComponent(missionName));
      setIsFormVisible(true);
    }
    if (missionHour) setDeadlineHour(missionHour);
  }, [missionName, missionHour]);

  // アクティブミッション復元時にフォームを反映
  useEffect(() => {
    if (activeMission) {
      setTargetName(activeMission.targetName);
      setDeadlineHour(String(activeMission.deadlineHour));
      setTargetCoords({ latitude: activeMission.latitude, longitude: activeMission.longitude });
      setIsFormVisible(false);
    }
  }, [activeMission]);

  // 位置情報監視（到着判定 + 地図自動追従）
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
          checkArrival(loc);
          // ミッション中は地図を現在地に追従
          if (activeMissionRef.current) {
            mapRef.current?.animateToRegion({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.012,
              longitudeDelta: 0.012,
            }, 800);
          }
        },
      );
    })();

    return () => {
      cancelled = true;
      locationSub.current?.remove();
      locationSub.current = null;
    };
  // activeMission が切り替わったら監視を再起動して checkArrival を最新化
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMission]);

  const checkArrival = useCallback((loc: LocationObject) => {
    const mission = activeMissionRef.current;
    if (!mission) return;
    const R = 6_371_000;
    const dLat = ((mission.latitude - loc.coords.latitude) * Math.PI) / 180;
    const dLon = ((mission.longitude - loc.coords.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((loc.coords.latitude * Math.PI) / 180) *
        Math.cos((mission.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    if (distance <= 100 && new Date().getHours() < mission.deadlineHour) {
      completeMission();
    }
  }, [completeMission]);

  const handleMapPress = async (event: any) => {
    if (activeMission) return; // ミッション中は地図タップ無効
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setTargetCoords({ latitude, longitude });
    setIsLoading(true);
    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode.length > 0) {
        const place = geocode[0];
        setTargetName(place.name || `${place.city ?? ''}${place.street ?? ''}` || '選択した場所');
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
      Alert.alert('入力エラー', '目的地と有効な締め切り時間（0〜23時）を入力してください');
      return;
    }
    await startMission({ targetName, latitude: targetCoords.latitude, longitude: targetCoords.longitude, deadlineHour: hour, point: BASE_POINT });
    setIsFormVisible(false);
  };

  const handleCancel = () => {
    Alert.alert('ミッションを中止しますか？', 'ポイントは加算されません。', [
      { text: 'やめない', style: 'cancel' },
      { text: '中止する', style: 'destructive', onPress: cancelMission },
    ]);
  };

  // お気に入り判定
  const currentFav = favorites.find(
    (f) => Math.abs(f.latitude - targetCoords.latitude) < 0.0001 && Math.abs(f.longitude - targetCoords.longitude) < 0.0001
  );

  const handleToggleFavorite = async () => {
    if (!targetName) return;
    if (currentFav) {
      await removeFavorite(currentFav.id);
    } else {
      await addFavorite({ name: targetName, latitude: targetCoords.latitude, longitude: targetCoords.longitude });
    }
  };

  const applyFavorite = (fav: FavoriteLocation) => {
    setTargetName(fav.name);
    setTargetCoords({ latitude: fav.latitude, longitude: fav.longitude });
    setIsFormVisible(true);
    mapRef.current?.animateToRegion({ latitude: fav.latitude, longitude: fav.longitude, latitudeDelta: 0.015, longitudeDelta: 0.015 }, 600);
  };

  const isMissionActive = !!activeMission;

  return (
    <LinearGradient colors={['#FFF8E1', '#fdd961']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>

      {/* アクティブミッションバナー */}
      {isMissionActive && (
        <View style={styles.missionBanner}>
          <Navigation size={16} color="#FF8A80" />
          <Text style={styles.missionBannerText} numberOfLines={1}>
            {activeMission.targetName} まで移動中 — {activeMission.deadlineHour}:00 まで
          </Text>
          <TouchableOpacity onPress={handleCancel} style={styles.missionCancelBtn}>
            <Text style={styles.missionCancelText}>中止</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* お気に入りチップ（ミッション中は非表示） */}
      {!isMissionActive && favorites.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.favsScroll} contentContainerStyle={styles.favsContent}>
          {favorites.map((fav) => (
            <TouchableOpacity key={fav.id} style={styles.favChip} onPress={() => applyFavorite(fav)}>
              <Star size={12} color="#FF8A00" fill="#FF8A00" />
              <Text style={styles.favChipText} numberOfLines={1}>{fav.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* 地図エリア */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
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
            <Marker coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }} title="あなた" pinColor="blue" />
          )}
          <Marker coordinate={targetCoords} title={targetName || '目的地'} />
          <Circle center={targetCoords} radius={100} strokeColor="rgba(255,107,107,0.5)" fillColor="rgba(255,107,107,0.2)" />
        </MapView>

        {isFormVisible && !isMissionActive && (
          <View style={styles.mapHintBadge}>
            <Text style={styles.mapHintText}>👆 地図をタップして目的地を選択</Text>
          </View>
        )}
      </View>

      {/* 開閉トグル */}
      {!isMissionActive && (
        <TouchableOpacity style={styles.toggleBar} activeOpacity={0.7} onPress={() => setIsFormVisible(!isFormVisible)}>
          <Text style={styles.toggleText}>{isFormVisible ? '入力を隠して地図を広げる' : '目的地を入力する'}</Text>
          {isFormVisible ? <ChevronDown color="#666" size={24} /> : <ChevronUp color="#666" size={24} />}
        </TouchableOpacity>
      )}

      {/* フォームエリア */}
      {isFormVisible && !isMissionActive && (
        <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>📍 目的地の名前</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              {isLoading
                ? <ActivityIndicator size="small" color="#FF8A80" style={{ marginRight: 10 }} />
                : <MapPin color="#666" size={20} style={{ marginRight: 10 }} />
              }
              <TextInput style={styles.inputFlex} value={targetName} onChangeText={setTargetName} placeholder="地図をタップして選択" />
              {targetName.length > 0 && (
                <TouchableOpacity onPress={handleToggleFavorite} style={styles.starBtn}>
                  <Star size={20} color="#FF8A00" fill={currentFav ? '#FF8A00' : 'none'} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.label}>⏰ 締め切り時間（0〜23時）</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <Clock color="#666" size={20} style={{ marginRight: 10 }} />
              <TextInput style={styles.inputFlex} value={deadlineHour} onChangeText={setDeadlineHour} keyboardType="numeric" placeholder="例: 9" maxLength={2} />
            </View>
          </View>

          <Text style={styles.pointHint}>達成で {BASE_POINT} pt 獲得（連続達成でボーナスあり！）</Text>

          <TouchableOpacity style={styles.saveButton} onPress={handleStart}>
            <Text style={styles.saveButtonText}>このミッションで決定！</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* 祝福・失敗オーバーレイ */}
      {lastResult && (
        <CelebrationOverlay result={lastResult} onDismiss={clearLastResult} />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  missionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    gap: 8,
  },
  missionBannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#333' },
  missionCancelBtn: { backgroundColor: '#FFE0E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  missionCancelText: { fontSize: 13, fontWeight: '700', color: '#D32F2F' },

  favsScroll: { maxHeight: 48 },
  favsContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: 'center' },
  favChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  favChipText: { fontSize: 13, fontWeight: '600', color: '#333', maxWidth: 120 },

  mapContainer: { flex: 1, position: 'relative' },
  map: { width: '100%', height: '100%' },
  mapHintBadge: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
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
  starBtn: { paddingLeft: 8 },
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

  // ─── オーバーレイ ──
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  overlayCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  overlayEmoji: { fontSize: 56, marginBottom: 12 },
  overlayTitle: { fontSize: 22, fontWeight: '800', color: '#222', marginBottom: 4 },
  overlayTarget: { fontSize: 15, color: '#666', marginBottom: 16, textAlign: 'center' },
  overlayPoints: { fontSize: 36, fontWeight: '900', color: '#4CAF50', marginBottom: 8 },
  bonusBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  bonusBadgeText: { fontSize: 13, fontWeight: '700', color: '#E65100' },
  streakText: { fontSize: 14, color: '#FF8A00', fontWeight: '600', marginBottom: 8 },
  overlayFailSub: { fontSize: 14, color: '#999', marginBottom: 16 },
  overlayDismiss: { marginTop: 8 },
  overlayDismissText: { fontSize: 13, color: '#BBB' },
});

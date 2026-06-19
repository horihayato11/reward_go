import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, ChevronUp, Clock, MapPin, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { useArrivalTracking } from '@/services/ArrivalTracking/context';
import { calcDistance } from '@/utils/location';

const MISSION_POINT = 100;

export default function HomeScreen() {
  const { activeMission, startMission, cancelMission, completeMission } = useArrivalTracking();

  const [targetName, setTargetName] = useState('');
  const [deadlineHour, setDeadlineHour] = useState('18');
  const [isLoading, setIsLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [targetCoords, setTargetCoords] = useState({ latitude: 35.0222, longitude: 135.9637 });

  // 到着判定の二重発火を防ぐ
  const arrivedRef = useRef(false);

  // 現在地の取得・監視
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('エラー', '位置情報の許可が必要です');
        return;
      }
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => setLocation(loc),
      );
    })();
    return () => { subscription?.remove(); };
  }, []);

  // 到着判定：位置が更新されるたびにチェック
  useEffect(() => {
    if (!location || !activeMission || arrivedRef.current) return;

    const dist = calcDistance(
      location.coords.latitude,
      location.coords.longitude,
      activeMission.latitude,
      activeMission.longitude,
    );

    if (dist <= 100) {
      const now = new Date();
      const deadline = new Date();
      deadline.setHours(activeMission.deadlineHour, 0, 0, 0);

      if (now <= deadline) {
        arrivedRef.current = true;
        completeMission();
      } else {
        arrivedRef.current = true;
        Alert.alert('時間切れ...', '惜しい！次回は間に合わせましょう！');
        cancelMission();
      }
    }
  }, [location, activeMission, completeMission, cancelMission]);

  // ミッション切り替わり時にフラグをリセット
  useEffect(() => {
    arrivedRef.current = false;
  }, [activeMission?.startedAt]);

  // フォーカス時に保存設定を再読み込み
  const loadSavedSettings = useCallback(async () => {
    try {
      const [name, hour, lat, lon] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TARGET_NAME),
        AsyncStorage.getItem(STORAGE_KEYS.DEADLINE_HOUR),
        AsyncStorage.getItem(STORAGE_KEYS.TARGET_LAT),
        AsyncStorage.getItem(STORAGE_KEYS.TARGET_LON),
      ]);
      if (name) setTargetName(name);
      if (hour) setDeadlineHour(hour);
      if (lat && lon) setTargetCoords({ latitude: parseFloat(lat), longitude: parseFloat(lon) });
    } catch (e) {
      console.error('設定の読み込み失敗', e);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadSavedSettings(); }, [loadSavedSettings]));

  // 地図タップで目的地を選択
  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setTargetCoords({ latitude, longitude });
    setIsLoading(true);
    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode.length > 0) {
        const place = geocode[0];
        const name = place.name || `${place.region ?? ''}${place.city ?? ''}${place.street ?? ''}` || '選択した場所';
        setTargetName(name);
        if (!isFormVisible) setIsFormVisible(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // ミッション開始
  const handleStartMission = async () => {
    if (!targetName.trim() || !deadlineHour) {
      Alert.alert('エラー', '目的地と締め切り時間を入力してください');
      return;
    }
    const hour = parseInt(deadlineHour, 10);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      Alert.alert('エラー', '締め切り時間は0〜23の数値で入力してください');
      return;
    }

    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TARGET_NAME, targetName),
        AsyncStorage.setItem(STORAGE_KEYS.DEADLINE_HOUR, deadlineHour),
        AsyncStorage.setItem(STORAGE_KEYS.TARGET_LAT, targetCoords.latitude.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.TARGET_LON, targetCoords.longitude.toString()),
      ]);

      await startMission({
        targetName,
        latitude: targetCoords.latitude,
        longitude: targetCoords.longitude,
        deadlineHour: hour,
        point: MISSION_POINT,
      });

      setIsFormVisible(false);
      Alert.alert('🎯 ミッション開始！', `${targetName} へ${hour}時までに向かいましょう！`);
    } catch (e) {
      Alert.alert('エラー', '保存に失敗しました');
    }
  };

  // ミッションキャンセル
  const handleCancelMission = () => {
    Alert.alert('ミッションをキャンセルしますか？', 'ポイントは付与されません。', [
      { text: 'いいえ', style: 'cancel' },
      { text: 'キャンセルする', style: 'destructive', onPress: () => cancelMission() },
    ]);
  };

  return (
    <LinearGradient
      colors={['#FFF8E1', '#fdd961']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* アクティブミッションバナー */}
      {activeMission && (
        <View style={styles.missionBanner}>
          <View style={styles.missionBannerLeft}>
            <Text style={styles.missionBannerTitle}>🏃 ミッション進行中</Text>
            <Text style={styles.missionBannerText}>{activeMission.targetName} へ {activeMission.deadlineHour}時までに</Text>
          </View>
          <TouchableOpacity onPress={handleCancelMission} style={styles.cancelBtn}>
            <X size={18} color="#FF5252" />
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
              coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
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

        {isFormVisible && (
          <View style={styles.mapHintBadge}>
            <Text style={styles.mapHintText}>👆 地図をタップして目的地を選択</Text>
          </View>
        )}
      </View>

      {/* 開閉トグルボタン */}
      <TouchableOpacity
        style={styles.toggleBar}
        activeOpacity={0.7}
        onPress={() => setIsFormVisible(!isFormVisible)}
      >
        <Text style={styles.toggleText}>
          {isFormVisible ? '入力を隠して地図を広げる' : '目的地を入力する'}
        </Text>
        {isFormVisible ? <ChevronDown color="#666" size={24} /> : <ChevronUp color="#666" size={24} />}
      </TouchableOpacity>

      {/* フォームエリア */}
      {isFormVisible && (
        <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>📍 目的地の名前</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              {isLoading
                ? <ActivityIndicator size="small" color="#FF8A80" style={{ marginRight: 10 }} />
                : <MapPin color="#666" size={20} style={{ marginRight: 10 }} />
              }
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
                placeholder="例: 18"
                maxLength={2}
              />
            </View>
          </View>

          {activeMission ? (
            <View style={styles.activeMissionNote}>
              <Text style={styles.activeMissionNoteText}>
                ⚡ ミッション進行中です。新しいミッションを開始するには現在のミッションをキャンセルしてください。
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.saveButton} onPress={handleStartMission}>
              <Text style={styles.saveButtonText}>このミッションで決定！ +{MISSION_POINT}pt</Text>
            </TouchableOpacity>
          )}
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
    backgroundColor: '#FFF9E6',
    borderBottomWidth: 2,
    borderBottomColor: '#FFD54F',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  missionBannerLeft: { flex: 1 },
  missionBannerTitle: { fontSize: 13, fontWeight: '700', color: '#E65100' },
  missionBannerText: { fontSize: 12, color: '#555', marginTop: 2 },
  cancelBtn: { padding: 6 },

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

  activeMissionNote: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    marginBottom: 40,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  activeMissionNoteText: { color: '#E65100', fontSize: 13, lineHeight: 20 },
});

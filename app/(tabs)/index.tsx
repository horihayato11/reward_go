import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { Map as MapIcon, User } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function HomeScreen() {
  const router = useRouter();
  const [location, setLocation] = useState<any>(null);

  // --- 状態管理 (State) ---
  const [targetCoords, setTargetCoords] = useState({
    latitude: 35.0222,
    longitude: 135.9637,
  });
  const [targetName, setTargetName] = useState('目的地');
  const [deadlineHour, setDeadlineHour] = useState('18');

  // --- 設定画面から戻ってきたときにデータを最新にする ---
  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        try {
          const name = await AsyncStorage.getItem('targetName');
          const hour = await AsyncStorage.getItem('deadlineHour');
          const lat = await AsyncStorage.getItem('latitude');
          const lon = await AsyncStorage.getItem('longitude');

          if (name) setTargetName(name);
          if (hour) setDeadlineHour(hour);
          if (lat && lon) {
            setTargetCoords({
              latitude: parseFloat(lat),
              longitude: parseFloat(lon),
            });
          }
        } catch (e) {
          console.error('データの読み込みに失敗しました', e);
        }
      };
      loadSettings();
    }, [])
  );

  // --- 現在地のリアルタイム監視 ---
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => setLocation(loc)
      );
    })();
  }, []);

  return (
    <View style={styles.container}>
      {/* メイン地図 */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={{
          latitude: targetCoords.latitude,
          longitude: targetCoords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* 現在地の青いピン */}
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

        {/* 目的地の赤いピン */}
        <Marker 
          coordinate={targetCoords} 
          title={targetName} 
        />

        {/* 判定エリア（円） */}
        <Circle
          center={targetCoords}
          radius={100}
          strokeColor="rgba(255, 107, 107, 0.5)"
          fillColor="rgba(255, 107, 107, 0.2)"
        />
      </MapView>

      {/* 上部ヘッダー（左にプロフィール、右に目的地設定） */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/profile')}>
          <User color="#4A4A4A" size={24} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/destination')}>
          <MapIcon color="#FF8A80" size={24} />
        </TouchableOpacity>
      </View>

      {/* 下部のステータスカード */}
      <View style={styles.overlayCard}>
        <Text style={styles.cardTitle}>{targetName} まであと少し！</Text>
        <Text style={styles.cardSubtitle}>{deadlineHour}:00 までに到着しよう 🐾</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  header: {
    position: 'absolute',
    top: 55,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between', // ボタンを両端に配置
    zIndex: 10,
  },
  iconButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  overlayCard: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  cardSubtitle: { fontSize: 16, color: '#666', marginTop: 6 },
});
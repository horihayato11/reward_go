import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { useMission } from '../src/hooks/useMission';

export default function MapScreen() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [region, setRegion] = useState(null as any);
  const [inputLabel, setInputLabel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const { mission, setMission, clearMission, checkArrival, distanceToMission } = useMission();
  const mapRef = useRef(null as any);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('位置情報の許可が必要です');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const { latitude, longitude } = loc.coords;
      setRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    })();
  }, []);

  useEffect(() => {
    let sub: any;
    (async () => {
      try {
        sub = await Location.watchPositionAsync({
          accuracy: Location.Accuracy.Highest,
          timeInterval: 2000,
          distanceInterval: 5,
        }, (loc) => {
          const { latitude, longitude } = loc.coords;
          setRegion((r: any) => ({ ...r, latitude, longitude }));
          if (mission) checkArrival({ latitude, longitude });
        });
      } catch (e) {
        // ignore
      }
    })();
    return () => sub && sub.remove();
  }, [mission]);

  const onMapLongPress = (e: any) => {
    const { coordinate } = e.nativeEvent;
    setInputLabel('');
    // 非同期処理は内部で実行してハンドラは void を返す
    (async () => {
      try {
        const placemarks = await Location.reverseGeocodeAsync({ latitude: coordinate.latitude, longitude: coordinate.longitude });
        const p = placemarks && placemarks[0];
        const label = p ? [p.name, p.street, p.city, p.region].filter(Boolean).join(' ') : '地点';
        setMission({
          name: label,
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          deadline: '',
        });
      } catch (err) {
        setMission({
          name: '地点',
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          deadline: '',
        });
      }
    })();
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setSearching(true);
    try {
      const results = await Location.geocodeAsync(searchQuery);
      if (results && results.length > 0) {
        const r = results[0];
        const label = `${searchQuery}`;
        setMission({ name: label, latitude: r.latitude, longitude: r.longitude, deadline: '' });
        // カメラ移動
        mapRef.current?.animateToRegion({ latitude: r.latitude, longitude: r.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500);
      } else {
        setErrorMsg('検索結果が見つかりませんでした');
      }
    } catch (e) {
      setErrorMsg('ジオコーディングに失敗しました');
    } finally {
      setSearching(false);
    }
  };

  const saveFromInputs = () => {
    if (!region) return;
    const delta = 0.001;
    setMission({
      name: inputLabel || '目的地',
      latitude: region.latitude + delta,
      longitude: region.longitude + delta,
      deadline: '',
    });
  };

  return (
    <LinearGradient colors={['#FFF8E1', '#fdd961']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      {region ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          region={region}
          onLongPress={onMapLongPress}
        >
          <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} title="現在地" pinColor="blue" />
          {mission && (
            <>
              <Marker coordinate={{ latitude: mission.latitude, longitude: mission.longitude }} title={mission.name} />
              <Circle center={{ latitude: mission.latitude, longitude: mission.longitude }} radius={100} strokeColor="rgba(255,0,0,0.5)" fillColor="rgba(255,0,0,0.1)" />
            </>
          )}
        </MapView>
      ) : (
        <View style={styles.loading}><Text>位置情報を取得中...</Text></View>
      )}

      <View style={styles.panel}>
        <Text style={styles.title}>ミッション設定</Text>
        <Text>マップを長押しで目的地を設定</Text>
        <TextInput placeholder="ミッション名" value={inputLabel} onChangeText={setInputLabel} style={styles.input} />
        <View style={styles.row}>
          <Button title="現在地近くに保存" onPress={saveFromInputs} />
          <Button title="クリア" onPress={clearMission} />
        </View>
        <View style={styles.info}>
          <Text>距離: {mission ? `${Math.round(distanceToMission(region || { latitude: 0, longitude: 0 }))} m` : '—'}</Text>
          <Text>期限: {mission?.deadline || '未設定'}</Text>
        </View>
        {errorMsg ? <Text style={{ color: 'red' }}>{errorMsg}</Text> : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  panel: { position: 'absolute', left: 12, right: 12, bottom: 24, backgroundColor: 'white', padding: 12, borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, elevation: 4 },
  title: { fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, marginTop: 8, marginBottom: 8, borderRadius: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  info: { marginTop: 8 },
});

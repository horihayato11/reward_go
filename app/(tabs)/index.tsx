import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
// removed useRouter import — header navigation handled in _layout.tsx
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, ChevronUp, Clock, MapPin } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function HomeScreen() {
  
  
  // --- 状態管理 (State) ---
  const [targetName, setTargetName] = useState('');
  const [deadlineHour, setDeadlineHour] = useState('18');
  const [isLoading, setIsLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [location, setLocation] = useState<any>(null); // 現在地
  const [targetCoords, setTargetCoords] = useState({
    latitude: 35.0222,
    longitude: 135.9637,
  });

  // --- 初期データの読み込みと現在地の監視 ---
  useEffect(() => {
    (async () => {
      // 1. 位置情報の権限取得
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('エラー', '位置情報の許可が必要です');
        return;
      }

      // 2. 現在地をリアルタイムで取得
      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => setLocation(loc)
      );

      // 3. 保存された設定を読み込む
      // 保存設定の読み込みはフォーカス時にも行うのでここでは初期読み込みのみを行う
    })();
  }, []);

  const loadSavedSettings = async () => {
    try {
      const savedName = await AsyncStorage.getItem('targetName');
      const savedHour = await AsyncStorage.getItem('deadlineHour');
      const savedLat = await AsyncStorage.getItem('latitude');
      const savedLon = await AsyncStorage.getItem('longitude');

      if (savedName) setTargetName(savedName);
      if (savedHour) setDeadlineHour(savedHour);
      if (savedLat && savedLon) {
        setTargetCoords({
          latitude: parseFloat(savedLat),
          longitude: parseFloat(savedLon),
        });
      }
    } catch (e) {
      console.error('Failed to load saved settings on focus', e);
    }
  };

  // 画面がフォーカスされたときに保存設定を再読み込みする
  useFocusEffect(
    useCallback(() => {
      loadSavedSettings();
    }, [])
  );

  // --- 地図をタップして目的地を決定する関数 ---
  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setTargetCoords({ latitude, longitude });

    setIsLoading(true);
    try {
      // 座標から場所の名前を取得（逆ジオコーディング）
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode.length > 0) {
        const place = geocode[0];
        const newName = place.name || `${place.region || ''}${place.city || ''}${place.street || ''}` || '選択した場所';
        setTargetName(newName);
        // タップしたら自動でフォームを開く
        if (!isFormVisible) setIsFormVisible(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 保存処理 ---
  const saveSettings = async () => {
    if (!targetName || !deadlineHour) {
      Alert.alert('エラー', '入力内容を確認してください');
      return;
    }

    try {
      await AsyncStorage.setItem('targetName', targetName);
      await AsyncStorage.setItem('deadlineHour', deadlineHour);
      await AsyncStorage.setItem('latitude', targetCoords.latitude.toString());
      await AsyncStorage.setItem('longitude', targetCoords.longitude.toString());
      // 保存完了直後にフォームを自動的に閉じる
      setIsFormVisible(false);

      Alert.alert('完了', 'ミッションを保存しました！');
    } catch (e) {
      Alert.alert('エラー', '保存に失敗しました');
    }
  };

  return (
    
    <LinearGradient 
      colors={['#FFF8E1', '#fdd961']} 
      start={{ x: 0, y: 0 }} // 左上から
      end={{ x: 1, y: 1 }}   // 右下へ
      style={styles.container}
    >

      

      {/* 🗺️ 地図エリア */}
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
            title={targetName || '目的地'} 
          />

          {/* 到着判定エリアの視覚化 */}
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

      {/* 🔼 開閉トグルボタン */}
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

      {/* 📋 フォームエリア */}
      {isFormVisible && (
        <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>📍 目的地の名前 </Text>
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

          <Text style={styles.label}>⏰ 締め切り時間 (時)</Text>
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

          <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
            <Text style={styles.saveButtonText}>このミッションで決定！</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: { fontFamily: 'Fredoka_700Bold', fontSize: 28, color: '#FF8A80', letterSpacing: 1 },
  
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
    elevation: 3 
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
    paddingHorizontal: 14 
  },
  inputFlex: { flex: 1, paddingVertical: 14, fontSize: 16 },
  saveButton: { 
    backgroundColor: '#FF8A80', 
    padding: 18, 
    borderRadius: 30, 
    alignItems: 'center', 
    marginTop: 20, 
    marginBottom: 40,
    elevation: 3 
  },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
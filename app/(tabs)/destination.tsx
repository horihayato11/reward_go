// app/destination.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location'; // ジオコーディングに必要
import { useRouter } from 'expo-router';
import { ChevronLeft, Search } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function DestinationScreen() {
  const router = useRouter();
  
  const [targetName, setTargetName] = useState('');
  const [deadlineHour, setDeadlineHour] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isLoading, setIsLoading] = useState(false); // 検索中かどうか

  // --- 追加：場所の名前から座標を検索する関数 ---
  const searchLocation = async () => {
    if (!targetName) {
      Alert.alert('エラー', '場所の名前を入力してください');
      return;
    }

    setIsLoading(true);
    try {
      // 住所や建物名を座標に変換
      const results = await Location.geocodeAsync(targetName);

      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        setLatitude(latitude.toString());
        setLongitude(longitude.toString());
        Alert.alert('確認', `「${targetName}」が見つかりました！`);
      } else {
        Alert.alert('エラー', '場所が見つかりませんでした。より具体的な名前（例：草津駅、滋賀県立図書館）を試してください。');
      }
    } catch (e) {
      Alert.alert('エラー', '場所の検索に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!targetName || !deadlineHour || !latitude || !longitude) {
      Alert.alert('エラー', '場所を検索して座標を確定させてください');
      return;
    }
    try {
      await AsyncStorage.setItem('targetName', targetName);
      await AsyncStorage.setItem('deadlineHour', deadlineHour);
      await AsyncStorage.setItem('latitude', latitude);
      await AsyncStorage.setItem('longitude', longitude);
      router.back();
    } catch (e) {
      Alert.alert('保存に失敗しました');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft color="#333" size={28} /></TouchableOpacity>
        <Text style={styles.headerTitle}>ミッション設定</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        <Text style={styles.label}>📍 どこに行きますか？</Text>
        <View style={styles.searchRow}>
          <TextInput 
            style={[styles.input, { flex: 1 }]} 
            value={targetName} 
            onChangeText={setTargetName} 
            placeholder="例: 草津駅、東京タワー"
          />
          {/* 検索ボタン */}
          <TouchableOpacity style={styles.searchButton} onPress={searchLocation}>
            {isLoading ? <ActivityIndicator color="#FFF" /> : <Search color="#FFF" size={20} />}
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>⏰ 締め切り時間（時）</Text>
        <TextInput 
          style={styles.input} 
          value={deadlineHour} 
          onChangeText={setDeadlineHour} 
          keyboardType="numeric"
          placeholder="例: 18"
        />

        {/* 座標は自動入力されるので、確認用に表示するだけにする */}
        <View style={styles.coordInfo}>
          <Text style={styles.coordText}>現在の設定座標:</Text>
          <Text style={styles.coordValue}>{latitude || '---'}, {longitude || '---'}</Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Text style={styles.saveButtonText}>このミッションで決定！</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBE6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  formContainer: { padding: 24 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, marginTop: 16 },
  searchRow: { flexDirection: 'row', gap: 10 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 12, padding: 14, fontSize: 16 },
  searchButton: { backgroundColor: '#4A90E2', padding: 12, borderRadius: 12, justifyContent: 'center' },
  coordInfo: { marginTop: 20, padding: 15, backgroundColor: '#F0F0F0', borderRadius: 12 },
  coordText: { fontSize: 12, color: '#666' },
  coordValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  saveButton: { backgroundColor: '#FF8A80', padding: 18, borderRadius: 30, alignItems: 'center', marginTop: 40 },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
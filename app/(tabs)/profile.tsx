import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, Settings, Trash2, Trophy, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { STORAGE_KEYS } from '@/constants/storageKeys';

type MenuItem = {
  key: string;
  label: string;
  Icon: React.ComponentType<any>;
  onPress?: () => void;
  danger?: boolean;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [points, setPoints] = useState<number>(0);
  const [missions, setMissions] = useState<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const [p, m] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.POINTS),
          AsyncStorage.getItem(STORAGE_KEYS.MISSIONS_COUNT),
        ]);
        if (p != null) setPoints(Number(p));
        if (m != null) setMissions(Number(m));
      } catch (e) {
        // 読み込み失敗は無視（ダミー値を維持）
      }
    })();
  }, []);

  const handleReset = async () => {
    Alert.alert('データを初期化しますか？', 'この操作は元に戻せません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '初期化',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove([
              STORAGE_KEYS.POINTS,
              STORAGE_KEYS.MISSIONS_COUNT,
              STORAGE_KEYS.ACTIVE_MISSION,
              STORAGE_KEYS.TARGET_NAME,
              STORAGE_KEYS.TARGET_LAT,
              STORAGE_KEYS.TARGET_LON,
              STORAGE_KEYS.DEADLINE_HOUR,
            ]);
            setPoints(0);
            setMissions(0);
            Alert.alert('完了', 'データを初期化しました。');
          } catch (e) {
            Alert.alert('エラー', '初期化に失敗しました。');
          }
        },
      },
    ]);
  };

  const menu: MenuItem[] = [
    { key: 'history', label: 'ミッション履歴', Icon: Trophy, onPress: () => router.push('/history' as any) },
    { key: 'settings', label: 'アプリの設定', Icon: Settings, onPress: () => router.push('/settings' as any) },
    { key: 'notifications', label: '通知設定', Icon: Bell, onPress: () => router.push('/settings/notifications' as any) },
    { key: 'reset', label: 'データの初期化', Icon: Trash2, onPress: handleReset, danger: true },
  ];

  return (
    <LinearGradient
      colors={['#FFF8E1', '#fdd961']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>アカウント</Text>

      <View style={styles.profileArea}>
        <View style={styles.avatarCircle}>
          <User size={52} color="#fff" />
        </View>
        <Text style={styles.username}>ゲストユーザー</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>累計獲得ポイント</Text>
          <Text style={styles.statValue}>{points} pt</Text>
        </View>
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>達成したミッション数</Text>
          <Text style={styles.statValue}>{missions} 回</Text>
        </View>
      </View>

      <View style={styles.menuList}>
        {menu.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[styles.menuItem, item.danger ? styles.menuItemDanger : null]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <item.Icon size={20} color={item.danger ? '#FF5252' : '#333'} />
              <Text style={[styles.menuLabel, item.danger ? { color: '#FF5252' } : null]}>{item.label}</Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: 'transparent' },
  container: { padding: 20, paddingBottom: 40 },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 18 },
  profileArea: { alignItems: 'center', marginBottom: 18 },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FF8A80',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  username: { fontSize: 16, fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    marginBottom: 20,
  },
  statColumn: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#666', marginBottom: 6, textAlign: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#4CAF50' },
  menuList: { marginTop: 8 },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    elevation: 2,
  },
  menuItemDanger: { backgroundColor: '#fff' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { marginLeft: 12, fontSize: 16 },
});
